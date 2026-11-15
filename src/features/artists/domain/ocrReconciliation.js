import {combinePositionedText} from './spatialMerge.js'
/** PDF/OCR reconciliation used by all Portfolio types.
 * OCR is evidence to review, never a replacement for a human-approved claim.
 * The PDF text layer and every OCR pass remain inspectable separately.
 */
const norm = value => String(value??'').normalize('NFD')
 .replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d')
 .toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim()
const split = value => String(value??'').split(/\r?\n/)
 .map(s=>s.replace(/\s+/g,' ').trim()).filter(Boolean)
const tokens = value => new Set(norm(value).split(' ').filter(Boolean))
function isRepeated(value,existing){
  const key=norm(value)
  if(key.length<2)return true
  const words=tokens(value)
  for(const raw of existing){
    const compare=norm(raw)
    if(key===compare || (key.length>=9 && compare.includes(key)))return true
    if(compare.length>=9 && key.includes(compare) && compare.length/key.length>.78)return true
    const other=tokens(raw)
    if(words.size<3 || other.size<3)continue
    let intersection=0
    for(const word of words)if(other.has(word))intersection++
    const similarity=intersection/Math.max(words.size,other.size)
    if(similarity>.87 && Math.min(key.length,compare.length)/Math.max(key.length,compare.length)>.70)return true
  }
  return false
}
export const AUTO_OCR_MAX_PAGES=60
export const OCR_SPARSE_CHARS=140
export const MAX_REVIEW_CHARACTERS=200000
export function needsOcrPage(page,limit=OCR_SPARSE_CHARS){
  return split(page?.rawText||page?.pdfText||page?.body).join(' ').length<limit
}
export function selectAutomaticOcrPages(pages=[],max=AUTO_OCR_MAX_PAGES){
  // PDFs frequently contain embedded text PLUS large image-only paragraphs.
  // Never skip pages just because they already contain >120 characters.
  return pages.filter(p=>!p.reviewed && p.ocrStatus!=='done')
    .slice(0,max).map(p=>Number(p.page))
}
export function combinePdfOcrText(pdfText='',ocrText=''){
  const lines=split(pdfText)
  for(const value of split(ocrText)){
    if(!isRepeated(value,lines))lines.push(value)
  }
  return lines.join('\n')
}
export function mergeOcrPasses(passes=[]){
  // Each pass may see a different part of a poster; preserve the union.
  // Slight OCR differences may remain: the reviewer can compare pass outputs.
  const usable=passes.filter(p=>typeof p?.text==='string' && p.text.trim())
  const primary=usable[0]
  let output=primary?.text?.trim()||''
  for(const pass of usable.slice(1))output=combinePdfOcrText(output,pass.text)
  return output
}
/** Choose ONE coherent narrative for the editable field. Adding text from
 * extra zones must be an explicit Admin action, not automatic concatenation.
 */
export function selectMainReviewText(pdfText='',ocrText=''){
  const pdf=String(pdfText||'').trim()
  const ocr=String(ocrText||'').trim()
  if(!ocr)return {text:pdf,source:'pdf'}
  if(!pdf)return {text:ocr,source:'ocr'}
  // PDFs commonly contain only a heading as actual text, the biography is
  // rasterized: a substantially longer OCR paragraph is the better draft.
  if(pdf.length<200 && ocr.length>pdf.length*1.65)
    return {text:ocr,source:'ocr'}
  return {text:pdf,source:'pdf'}
}
export function applyOcrToReview(review,results=[]){
  const byPage=new Map(results.map(result=>[Number(result.page),result]))
  const pages=review.pages.map(page=>{
    const result=byPage.get(Number(page.page))
    if(!result || page.reviewed)return page
    if(result.error)return {...page,ocrStatus:'failed',ocrError:String(result.error),
      warnings:[...(page.warnings||[]),'OCR gặp lỗi ở trang này: '+String(result.error)]}
    // OCR replaces previous OCR on a rescan. Never accumulate approximate
    // words from old passes into new output.
    const recognized=String(result.text||'').trim()
    const ocrText=recognized
    const pdfText=page.pdfText??page.body
    // Match by physical location first; preserve selectable text and add
    // only distinct OCR paragraphs for rasterized sections of mixed pages.
    const spatial=combinePositionedText(page.pdfBlocks,result.paragraphs)
    const selected=spatial?.text?{
      text:spatial.text,
      source:spatial.added?'combined':(page.pdfBlocks?.length?'pdf':'ocr')
    }:selectMainReviewText(pdfText,ocrText)
    const body=page.editedFields?.body===true?page.body:selected.text
    const c=Number(result.confidence)
    const confidence=result.confidence==null||!Number.isFinite(c)?null:Math.round(c)
    const warnings=(page.warnings||[])
      .filter(s=>!/OCR không tìm|Độ tin cậy OCR|OCR là nội dung|không có lớp chữ|Ít chữ/i.test(s))
    if(spatial?.added)
      warnings.push('Đã bổ sung '+spatial.added+' khối chữ OCR theo vị trí. Cần đối chiếu các đoạn giao nhau với PDF.')
    if(spatial?.unverified?.length)
      warnings.push(spatial.unverified.length+' khối OCR thiếu độ tin cậy; có thể xem nguồn OCR để bổ sung thủ công.')
    if(!ocrText)warnings.push('OCR chưa lấy được chữ từ trang này. Cần đọc lại trực tiếp hoặc nhập thủ công.')
    else if(confidence!==null && confidence<70)
      warnings.push('OCR độ tin cậy thấp: kiểm tra kỹ dấu, tên riêng và các con số.')
    else warnings.push('OCR có thể thiếu hoặc sai: đối chiếu từng đoạn với trang PDF trước khi xác nhận.')
    // Only use a heading suggested from positioned OCR blocks. Blindly taking
    // the first line previously produced fragments such as "ca a" and "7/41".
    const heading=String(result.suggestedTitle||'').trim()
    const title=page.editedFields?.title===true?page.title:
      (page.title||heading)
    return {...page,title,body,pdfText,ocrText,ocrConfidence:confidence,
      ocrStatus:ocrText?'done':'empty',ocrError:null,
      ocrMainSource:page.editedFields?.body===true?'manual':selected.source,
      ocrProvider:result.provider==='mistral'?'mistral':'local',
      sourceBlocks:spatial?.blocks||page.sourceBlocks||[],
      ocrBlocks:Array.isArray(result.paragraphs)?result.paragraphs.map(p=>({
        text:p.text,bbox:p.bbox,confidence:p.confidence??null
      })):[],
      ocrSourcePass:result.sourcePass||'full',
      ocrPasses:Array.isArray(result.passes)?result.passes.map(p=>({
        kind:String(p.kind||'full'),text:String(p.text||''),confidence:p.confidence??null
      })):page.ocrPasses||[],
      textFound:Boolean(body.trim()),reviewed:false,warnings,sourceChars:body.length}
  })
  return {...review,pages,pageCount:pages.length,quality:{
    ...review.quality,
    extracted:pages.filter(p=>p.textFound).length,
    imageOnly:pages.filter(p=>!p.textFound).length,
    lowText:pages.filter(p=>p.textFound && p.body.length<40).length,
    ocrPages:pages.filter(p=>p.ocrStatus==='done').length,
    ocrFailed:pages.filter(p=>p.ocrStatus==='failed').length,
    ocrPending:pages.filter(p=>p.ocrStatus==='not_run').length
  }}
}
