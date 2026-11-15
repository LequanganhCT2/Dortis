import {loadPdfBytes,destroyArtistPdf} from '../../../artistPdf.js'
import {buildOcrPasses,renderScale} from '../domain/ocrPassPlan.js'
import {paragraphsFromBlocks,selectPrimaryOcr,guessOcrHeading} from '../domain/ocrLayout.js'

/** Client-only Tesseract OCR for mixed raster/text Portfolio pages.
 * - The same worker is reused for every page/pass.
 * - Each finished page is surfaced immediately through onResult, so aborting
 *   a long scan does not discard work already completed.
 * - PDF bytes, page pixels, and recognizer output never leave this browser.
 */
export async function ocrPdfPages(file,pageNumbers,{
  onProgress=()=>{},onResult=()=>{},signal,quality='standard',layerText={}
}={}){
  const targets=[...new Set(pageNumbers.map(Number)
    .filter(n=>Number.isInteger(n)&&n>0))].slice(0,60)
  if(!targets.length)return []
  let pdf=null,worker=null
  let activePage=0,activePass='',activeDone=0
  const output=[]
  try{
    if(signal?.aborted)return output
    onProgress({phase:'loading',done:0,total:targets.length})
    const [{createWorker,PSM},loadedPdf]=await Promise.all([
      import('tesseract.js'),loadPdfBytes(file)
    ])
    pdf=loadedPdf
    worker=await createWorker(['vie','eng'],1,{
      logger:data=>{
        if(data?.status==='recognizing text'&&!signal?.aborted)
          onProgress({phase:'recognizing',page:activePage,pass:activePass,
            done:activeDone,total:targets.length,
            percent:Math.round((data.progress||0)*100)})
      }
    })
    for(let i=0;i<targets.length;i++){
      if(signal?.aborted)break
      activeDone=i
      activePage=targets[i]
      const pageNumber=activePage
      if(pageNumber>pdf.numPages)continue
      let page=null
      let canvas=null
      try{
        page=await pdf.getPage(pageNumber)
        const unscaled=page.getViewport({scale:1})
        const scale=renderScale(unscaled.width,unscaled.height,{quality})
        const viewport=page.getViewport({scale})
        canvas=document.createElement('canvas')
        canvas.width=Math.max(1,Math.round(viewport.width))
        canvas.height=Math.max(1,Math.round(viewport.height))
        const ctx=canvas.getContext('2d',{alpha:false,willReadFrequently:true})
        if(!ctx)throw new Error('Không thể khởi tạo canvas OCR.')
        ctx.fillStyle='#fff'
        ctx.fillRect(0,0,canvas.width,canvas.height)
        onProgress({phase:'rendering',page:pageNumber,done:i,total:targets.length})
        await page.render({canvasContext:ctx,canvas,viewport}).promise

        const sourceChars=String(layerText[pageNumber]||'').length
        const planned=buildOcrPasses(canvas.width,canvas.height,
          {quality,layerChars:sourceChars})
        const passes=[]
        for(let step=0;step<planned.length;step++){
          if(signal?.aborted)break
          const pass=planned[step]
          activePass=pass.kind
          onProgress({phase:'pass',page:pageNumber,pass:pass.kind,
            passNumber:step+1,passCount:planned.length,
            done:i,total:targets.length})
          try{
            await worker.setParameters({
              tessedit_pageseg_mode:PSM[pass.mode]||PSM.AUTO,
              preserve_interword_spaces:'1'
            })
            // Full-page OCR returns positioned paragraphs. Cropped rescans are
            // kept as separate alternatives, never appended line-by-line.
            const {data}=await worker.recognize(canvas,
              pass.rectangle?{rectangle:pass.rectangle}:{},
              pass.kind==='full'?{text:true,blocks:true}:{text:true})
            const paragraphs=pass.kind==='full'?
              paragraphsFromBlocks(data?.blocks||[],canvas.width):[]
            passes.push({kind:pass.kind,text:String(data?.text||'').trim(),
              confidence:Number.isFinite(data?.confidence)?data.confidence:null,
              paragraphs})
          }catch(e){
            if(signal?.aborted)break
            passes.push({kind:pass.kind,text:'',confidence:null,
              error:String(e?.message||e)})
          }
        }
        if(signal?.aborted)break
        const usable=passes.filter(p=>p.text)
        const primary=selectPrimaryOcr(passes)
        // Page boxes are stored in normalized top-left coordinates to
        // align OCR paragraphs with PDF text layer regardless of render scale.
        const paragraphs=(primary.paragraphs||[]).map(p=>({
          ...p,bbox:p.bbox?{
            x0:p.bbox.x0/canvas.width,y0:p.bbox.y0/canvas.height,
            x1:p.bbox.x1/canvas.width,y1:p.bbox.y1/canvas.height
          }:null
        }))
        const result={
          page:pageNumber,text:primary.text,confidence:primary.confidence,
          sourcePass:primary.kind,paragraphs,
          suggestedTitle:guessOcrHeading(primary.paragraphs,canvas.height),
          passes,quality,
          ...(usable.length?{}:{error:'Không nhận diện được chữ ở trang này. Hãy thử quét sâu hoặc nhập thủ công.'})
        }
        output.push(result)
        onResult(result)
      }catch(e){
        if(signal?.aborted)break
        const result={page:pageNumber,error:String(e?.message||e),passes:[]}
        output.push(result)
        onResult(result)
      }finally{
        if(canvas){canvas.width=0;canvas.height=0}
        if(page)page.cleanup()
      }
      onProgress({phase:'done',page:pageNumber,done:i+1,total:targets.length})
    }
    return output
  }finally{
    if(worker)await worker.terminate().catch(()=>{})
    if(pdf)await destroyArtistPdf(pdf)
  }
}
