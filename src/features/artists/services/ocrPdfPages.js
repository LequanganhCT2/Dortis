import {loadPdfBytes,destroyArtistPdf} from '../../../artistPdf.js'

/** Runs Tesseract OCR locally on rendered PDF pages.
 * PDF bytes / page canvas data are not uploaded to the application server.
 * The runtime downloads its WebAssembly and vie+eng recognition data when needed.
 * Invoke only from a user-selected admin import flow (lazy dependency).
 */
const MAX_PIXELS=3_500_000
function renderScale(page){
  const natural=page.getViewport({scale:1})
  return Math.min(2.4,2400/natural.width,2400/natural.height,
    Math.sqrt(MAX_PIXELS/(natural.width*natural.height)))
}
export async function ocrPdfPages(file,pageNumbers,{onProgress=()=>{},signal}={}){
  const targets=[...new Set(pageNumbers.map(Number).filter(n=>Number.isInteger(n)&&n>0))]
  if(!targets.length)return []
  let pdf=null,worker=null
  try{
    if(signal?.aborted)throw new DOMException('OCR đã hủy.','AbortError')
    onProgress({phase:'loading',done:0,total:targets.length})
    const [{createWorker},documentProxy]=await Promise.all([
      import('tesseract.js'),loadPdfBytes(file)
    ])
    pdf=documentProxy
    worker=await createWorker(['vie','eng'],1,{
      logger:data=>{
        if(data?.status==='recognizing text')
          onProgress({phase:'recognizing',done:0,total:targets.length,
            percent:Math.round((data.progress||0)*100)})
      }
    })
    const output=[]
    for(let i=0;i<targets.length;i++){
      if(signal?.aborted)throw new DOMException('OCR đã hủy.','AbortError')
      const pageNumber=targets[i]
      if(pageNumber>pdf.numPages)continue
      const page=await pdf.getPage(pageNumber)
      const viewport=page.getViewport({scale:renderScale(page)})
      const canvas=document.createElement('canvas')
      canvas.width=Math.max(1,Math.round(viewport.width))
      canvas.height=Math.max(1,Math.round(viewport.height))
      const ctx=canvas.getContext('2d',{alpha:false,willReadFrequently:true})
      if(!ctx)throw new Error('Trình duyệt không hỗ trợ canvas cho OCR.')
      ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height)
      onProgress({phase:'rendering',page:pageNumber,done:i,total:targets.length})
      try{
        await page.render({canvasContext:ctx,canvas,viewport}).promise
        const {data}=await worker.recognize(canvas)
        output.push({
          page:pageNumber,
          text:String(data?.text||'').trim(),
          confidence:Number.isFinite(data?.confidence)?data.confidence:null
        })
      }finally{
        canvas.width=0;canvas.height=0
        page.cleanup()
      }
      onProgress({phase:'done',page:pageNumber,done:i+1,total:targets.length})
    }
    return output
  }finally{
    if(worker)await worker.terminate().catch(()=>{})
    if(pdf)await destroyArtistPdf(pdf)
  }
}
