/**
 * PDF.js display-layer render preserving the original composition of a page.
 *
 * Only the PDF is private; publishing creates a separate high-resolution
 * WebP/JPEG image of each approved page. Aspect ratio, artwork, text and the
 * positioning in the PDF remain intact. No PDF file is publicly exposed.
 */
const encodeCanvas = (canvas,type,quality)=>new Promise(resolve=>canvas.toBlob(resolve,type,quality))

export async function renderPdfPageOriginal(page,{targetWidth=1850,maxBytes=4.7*1024*1024}={}){
  if(!page)throw new Error('Không tìm thấy trang PDF cần xuất bản.')
  const base=page.getViewport({scale:1})
  const safeWidth=Math.min(2200,Math.max(900,targetWidth))
  const viewport=page.getViewport({scale:Math.min(2.75,safeWidth/base.width)})
  const original=document.createElement('canvas')
  original.width=Math.max(1,Math.round(viewport.width))
  original.height=Math.max(1,Math.round(viewport.height))
  let work=original
  try {
    const context=original.getContext('2d',{alpha:false})
    if(!context)throw new Error('Trình duyệt không hỗ trợ Canvas 2D.')
    context.fillStyle='#ffffff'
    context.fillRect(0,0,original.width,original.height)
    await page.render({canvasContext:context,viewport}).promise

    for(let attempt=0;attempt<7;attempt++){
      const quality=Math.max(.7,.94-attempt*.055)
      let blob=await encodeCanvas(work,'image/webp',quality)
      let extension='webp'
      if(!blob||blob.type!=='image/webp'){
        blob=await encodeCanvas(work,'image/jpeg',quality)
        extension='jpg'
      }
      if(blob && blob.size<=maxBytes){
        return {blob,extension,type:blob.type,width:work.width,height:work.height}
      }
      if(attempt>=6)break
      const factor=attempt<2?.9:.83
      const reduced=document.createElement('canvas')
      reduced.width=Math.max(600,Math.floor(work.width*factor))
      reduced.height=Math.max(1,Math.round(work.height*(reduced.width/work.width)))
      const reducedContext=reduced.getContext('2d',{alpha:false})
      if(!reducedContext)throw new Error('Không thể tối ưu ảnh PDF.')
      reducedContext.fillStyle='#ffffff'
      reducedContext.fillRect(0,0,reduced.width,reduced.height)
      reducedContext.drawImage(work,0,0,reduced.width,reduced.height)
      if(work!==original){work.width=0;work.height=0}
      work=reduced
    }
    throw new Error('Trang PDF quá lớn để tạo ảnh trong giới hạn 5MB. Hãy tối ưu PDF hoặc giảm độ phân giải.')
  }finally{
    original.width=0;original.height=0
    if(work!==original){work.width=0;work.height=0}
  }
}
