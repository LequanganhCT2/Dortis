import {applyOcrToReview} from './ocrReconciliation.js'
import {suggestPageLayout} from './pdfReviewModel.js'

/**
 * Cloud OCR returns the complete Mistral reading-order narrative per page.
 * Use that narrative rather than splicing low-quality PDF.js pieces into it.
 * Preserve originals separately, and never erase manual field overrides.
 */
export function applyCloudOcrToReview(review,response){
  const results=Array.isArray(response?.pages)?response.pages:[]
  const cloudPages=new Map(results.map(p=>[Number(p.page),p]))
  const suggestions=new Map((response?.suggestions||[]).map(s=>[Number(s.page),s]))
  const interim=applyOcrToReview(review,results.map(p=>({
    ...p,sourcePass:'cloud',
    paragraphs:Array.isArray(p.paragraphs)?p.paragraphs:[],
    passes:[{kind:'cloud',text:String(p.text||''),confidence:p.confidence??null}]
  })))
  return {...interim,pages:interim.pages.map(page=>{
    const found=cloudPages.get(Number(page.page))
    if(!found||page.reviewed)return page
    const cloudText=String(found.text||'').trim()
    if(!cloudText){
      return {...page,ocrStatus:'empty',ocrProvider:'mistral',
        warnings:[...(page.warnings||[]),'Mistral chưa nhận diện chữ ở trang này.']}
    }
    const edited=page.editedFields||{}
    const hint=suggestions.get(Number(page.page))
    const heading=String(hint?.title||found.suggestedTitle||'').trim()
    const title=edited.title? page.title : (heading||page.title)
    const body=edited.body?page.body:cloudText
    const layout=edited.layout?page.layout:(hint?.layout||suggestPageLayout(page.page,title,body))
    const confidence=found.confidence==null?null:Number(found.confidence)
    const warning='Mistral OCR là bản gợi ý. Kiểm tra lại tên, dấu, số liệu và thứ tự đoạn trên PDF.'
    return {...page,title,body,layout,textFound:Boolean(body.trim()),
      sourceChars:body.length,ocrText:cloudText,ocrMainSource:edited.body?'manual':'cloud',
      ocrProvider:'mistral',ocrStatus:'done',
      ocrConfidence:confidence!=null&&Number.isFinite(confidence)?confidence:null,
      // Mistral returns blocks in reading order with coordinates and labels.
      sourceBlocks:(Array.isArray(found.paragraphs)?found.paragraphs:[])
        .map(b=>({text:String(b.text||''),source:'mistral',
          type:b.type||'text',bbox:b.bbox||null,
          confidence:b.confidence??null})).filter(b=>b.text),
      ocrBlocks:(Array.isArray(found.paragraphs)?found.paragraphs:[])
        .map(b=>({text:String(b.text||''),type:b.type||'text',
          bbox:b.bbox||null,confidence:b.confidence??null})),
      warnings:[...(page.warnings||[]).filter(s=>!/OCR là nội dung|OCR có thể|Đã bổ sung .*khối|OCR độ tin cậy/i.test(s)),
        warning],
      reviewed:false
    }
  }),quality:{
    ...interim.quality,
    ocrProvider:'mistral',
    ocrPages:interim.pages.filter(p=>cloudPages.has(Number(p.page))&&
      cloudPages.get(Number(p.page))?.text).length,
    ocrPending:interim.pages.filter(p=>!cloudPages.has(Number(p.page))&&p.ocrStatus==='not_run').length
  }}
}
