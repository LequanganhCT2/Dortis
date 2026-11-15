/**
 * In-browser PDF import for Dortis artist portfolios.
 * Extracts selectable text, page boundaries and rough headings; does not use OCR.
 * Full-page PDF snapshots are never published. Individual photo crops
 * are rendered by artistPhotoCrops.js and page layouts use HTML/CSS.
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
    .replace(/[-_]+/g,' ')
    .replace(/(porfolio|portfolio|profile|singer|ca\s*sĩ|ca\s*si|hồ\s*sơ|ho\s*so)/giu,'')
    .replace(/\s+/g,' ').trim() || 'Nghệ sĩ mới'
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
export function inferTitle(lines,pageNumber){
  if(pageNumber===1)return {title:'Trang bìa',rest:lines}
  const first=lines[0]
  // Only the FIRST text line can be a heading. Older behavior selected any
  // short line anywhere in the paragraph and silently removed real bio text.
  // Very short tokens ("NĂM", "+4") are not safely identifiable as headings.
  const isHeading=typeof first==='string'&&first.length>5&&first.length<=65&&
    !/[.!?;,]$/.test(first)&&
    (lines.length<=3||first===first.toUpperCase()||lines[1]?.length>first.length+15)
  return isHeading?{title:first,rest:lines.slice(1)}:
    {title:'Trang '+pageNumber,rest:lines}
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
/**
 * PDF.js v6: destroy() was removed from PDFDocumentProxy. The loading task
 * owns worker teardown. Await it before releasing the document reference.
 */
export async function destroyArtistPdf(pdf) {
  if (!pdf) return
  const loadingTask = pdf.loadingTask
  if (loadingTask && typeof loadingTask.destroy === 'function') {
    await loadingTask.destroy()
  }
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
      // Keep raw text independent of the title guess. A heuristic headline
      // may be wrong; reviewers need the unmodified evidence to compare.
      const rawText=lines.join('\n').slice(0,14000)
      total+=body.length
      sections.push({
        page:index,
        title:inferred.title,
        body,rawText,
        kind:index===1?'cover':lines.length>2?'editorial':'visual',
        image_url:null,
        image_storage_path:null
      })
      page.cleanup()
      onProgress(index,pdf.numPages)
    }
    return {
      name:artistNameFromFilename(file.name),
      // Never assume all Portfolio owners are singers; Admin selects the role.
      role:'Nghệ sĩ',
      slug:slugifyArtist(artistNameFromFilename(file.name)),
      page_count:pdf.numPages,
      sections,
      extractedChars:total
    }
  }finally{await destroyArtistPdf(pdf)}
}
export async function renderPagesFromPdf(pdfBlob,onProgress=()=>{}){
  const source=pdfBlob instanceof File?pdfBlob:new File([pdfBlob],'portfolio.pdf',{type:'application/pdf'})
  return loadPdfBytes(source)
}
