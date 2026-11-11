/**
 * Extract individual photo regions from the PRIVATE original PDF.
 * A full-page canvas exists only in memory during processing. We DO NOT
 * store or publish whole-page snapshots. The public artist website is HTML/CSS.
 */
const asBlob=(canvas,type,quality)=>new Promise(resolve=>canvas.toBlob(resolve,type,quality))
const clamp=(x,min,max)=>Math.max(min,Math.min(max,x))

export async function renderArtistPhotoCrops(page,regions=[]){
  if(!Array.isArray(regions)||!regions.length)return []
  const base=page.getViewport({scale:1})
  const scale=Math.min(1.5,2000/base.width)
  const viewport=page.getViewport({scale})
  const source=document.createElement('canvas')
  source.width=Math.round(viewport.width)
  source.height=Math.round(viewport.height)
  const ctx=source.getContext('2d',{alpha:false})
  if(!ctx)throw new Error('Không thể tạo canvas xử lý ảnh.')
  ctx.fillStyle='#ffffff'
  ctx.fillRect(0,0,source.width,source.height)
  await page.render({canvasContext:ctx,canvas:source,viewport}).promise
  const results=[]
  try {
    for(let i=0;i<Math.min(regions.length,8);i++){
      const r=regions[i]
      const x=clamp(Number(r.x)||0,0,.95)
      const y=clamp(Number(r.y)||0,0,.95)
      const w=clamp(Number(r.w)||.4,.05,1-x)
      const h=clamp(Number(r.h)||.6,.05,1-y)
      const sx=Math.floor(x*source.width),sy=Math.floor(y*source.height)
      const sw=Math.min(source.width-sx,Math.max(1,Math.round(w*source.width)))
      const sh=Math.min(source.height-sy,Math.max(1,Math.round(h*source.height)))
      // Produce image media only; never return the complete page.
      const factor=Math.min(1,1200/Math.max(sw,sh))
      const dest=document.createElement('canvas')
      dest.width=Math.max(1,Math.round(sw*factor))
      dest.height=Math.max(1,Math.round(sh*factor))
      const target=dest.getContext('2d',{alpha:false})
      target.drawImage(source,sx,sy,sw,sh,0,0,dest.width,dest.height)
      let blob=await asBlob(dest,'image/webp',.83)
      let ext='webp'
      if(!blob||blob.type!=='image/webp'){
        blob=await asBlob(dest,'image/jpeg',.84)
        ext='jpg'
      }
      dest.width=dest.height=0
      if(!blob)throw new Error('Không thể tạo ảnh cắt từ PDF.')
      if(blob.size>5*1024*1024)throw new Error('Ảnh cắt vượt quá 5MB. Vui lòng thu nhỏ vùng ảnh.')
      results.push({blob,extension:ext,type:blob.type,region:{x,y,w,h}})
    }
    return results
  }finally{
    source.width=0
    source.height=0
  }
}
