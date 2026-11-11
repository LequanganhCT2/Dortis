/**
 * In-browser PDF import for Dortis artist portfolios.
 * Extracts selectable text, page boundaries and rough headings; does not use OCR.
 * Page snapshots are created only when an admin chooses Publish.
 */
let cachedPdfJs
async function pdfEngine() {
  if (!cachedPdfJs) {
    cachedPdfJs = Promise.all([
      import('pdfjs-dist/build/pdf.mjs'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    ]).then(([pdfjs,worker]) => {
      pdfjs.GlobalWorkerOptions.workerSrc=worker.default
      return pdfjs
    })
  }
  return cachedPdfJs
}

export function slugifyArtist(value) {
  return String(value || 'nghe-si').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase()
    .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,96)||'nghe-si'
}
export function artistNameFromFilename(name) {
  return String(name||'').replace(/\.pdf$/i,'')
    .replace(/\b(porfolio|portfolio|profile|singer|ca si|ca sĩ|ho so|hồ sơ)\b/gi,'')
    .replace(/[-_]+/g,' ').replace(/\s+/g,' ').trim() || 'Nghệ sĩ mới'
}
function printable(str){return String(str||'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim()}
function extractLines(content){
  const spans=content.items.filter(i=>typeof i.str==='string'&&i.str.trim()).map(item=>({
    str:printable(item.str), x:item.transform?.[4]||0, y:item.transform?.[5]||0,
    height:Math.max(7,Math.abs(item.transform?.[3]||11)), width:item.width||0
  })).filter(t=>t.str)
  spans.sort((a,b)=>(Math.abs(b.y-a.y)>4?b.y-a.y:a.x-b.x))
  const lines=[]
  for(const span of spans){
    let line=lines.find(line=>Math.abs(line.y-span.y)<Math.max(3,Math.min(7,span.height*.28)))
    if(!line){line={y:span.y,parts:[],height:span.height};lines.push(line)}
    line.parts.push(span)
  }
  return lines.sort((a,b)=>b.y-a.y).map(line=>{
    let previous=null,parts=[]
    for(const item of line.parts.sort((a,b)=>a.x-b.x)){
      if(previous&&item.str===previous.str&&Math.abs(item.x-previous.x)<5)continue
      if(previous&&item.x>previous.x+previous.width+Math.max(4,item.height*.2))parts.push(' ')
      parts.push(item.str)
      previous=item
    }
    return printable(parts.join(''))
  }).filter(Boolean).filter((line,index,array)=>index===0||line!==array[index-1])
}
function inferTitle(lines,pageNumber){
  if(pageNumber===1) return {title:'Trang bìa',rest:lines}
  const first=lines.find(line=>line.length<80)
  if(!first) return {title:'Trang '+pageNumber,rest:lines}
  const idx=lines.indexOf(first)
  return {title:first,rest:lines.filter((_,i)=>i!==idx)}
}
export async function loadPdfBytes(file){
  if(!file||!/\.pdf$/i.test(file.name))throw new Error('Vui lòng chọn tệp PDF.')
  if(file.size>100*1024*1024)throw new Error('PDF vượt quá giới hạn 100 MB.')
  const bytes=new Uint8Array(await file.arrayBuffer())
  if(bytes[0]!==37||bytes[1]!==80||bytes[2]!==68||bytes[3]!==70)throw new Error('Tệp không đúng định dạng PDF.')
  const engine=await pdfEngine()
  const task=engine.getDocument({data:bytes,verbosity:0})
  return task.promise
}
export async function extractArtistPdf(file,onProgress=()=>{}){
  const pdf=await loadPdfBytes(file)
  try{
    if(pdf.numPages>60)throw new Error('PDF có hơn 60 trang. Vui lòng chia thành nhiều hồ sơ nhỏ hơn.')
    const sections=[]
    let total=0
    for(let index=1;index<=pdf.numPages;index++){
      const page=await pdf.getPage(index)
      const content=await page.getTextContent({includeMarkedContent:false})
      const lines=extractLines(content)
      const inferred=inferTitle(lines,index)
      const body=inferred.rest.join('\n').slice(0,14000)
      total+=body.length
      sections.push({
        page:index,
        title:inferred.title,
        body,
        kind:index===1?'cover':lines.length>2?'editorial':'visual',
        image_url:null,
        image_storage_path:null
      })
      page.cleanup()
      onProgress(index,pdf.numPages)
    }
    return {
      name:artistNameFromFilename(file.name),
      role:/biên đạo|dance/i.test(file.name)?'Biên đạo múa':'Ca sĩ',
      slug:slugifyArtist(artistNameFromFilename(file.name)),
      page_count:pdf.numPages,
      sections,
      extractedChars:total
    }
  }finally{pdf.destroy()}
}
export async function renderPdfPage(page,{maxWidth=1180,quality=.8}={}){
  const viewportBase=page.getViewport({scale:1})
  const scale=Math.min(1.5,maxWidth/viewportBase.width)
  const viewport=page.getViewport({scale})
  const canvas=document.createElement('canvas')
  canvas.width=Math.round(viewport.width)
  canvas.height=Math.round(viewport.height)
  const ctx=canvas.getContext('2d',{alpha:false})
  ctx.fillStyle='#ffffff'
  ctx.fillRect(0,0,canvas.width,canvas.height)
  await page.render({canvasContext:ctx,canvas,viewport}).promise
  const toBlob=(type,q)=>new Promise(resolve=>canvas.toBlob(resolve,type,q))
  let blob=await toBlob('image/webp',quality)
  let extension='webp'
  if(!blob||blob.type!=='image/webp'){
    blob=await toBlob('image/jpeg',quality)
    extension='jpg'
  }
  canvas.width=0
  canvas.height=0
  if(!blob)throw new Error('Không thể kết xuất ảnh trang PDF.')
  return {blob,extension,type:blob.type}
}
export async function renderPagesFromPdf(pdfBlob,onProgress=()=>{}){
  const source=pdfBlob instanceof File?pdfBlob:new File([pdfBlob],'portfolio.pdf',{type:'application/pdf'})
  return loadPdfBytes(source)
}
