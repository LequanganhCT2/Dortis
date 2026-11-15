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
/** Read PDF text by physical blocks instead of joining unrelated columns
 * that happen to share the same Y coordinate. This is independent of OCR.
 */
export function extractLines(content,pageWidth=1000){
  const spans=(content?.items||[]).filter(i=>typeof i.str==='string'&&i.str.trim()).map(item=>({
    str:printable(item.str),x:item.transform?.[4]||0,y:item.transform?.[5]||0,
    height:Math.max(7,Math.abs(item.transform?.[3]||11)),width:item.width||0
  })).filter(t=>t.str)
  spans.sort((a,b)=>(Math.abs(b.y-a.y)>4?b.y-a.y:a.x-b.x))
  const rows=[]
  for(const span of spans){
    let row=rows.find(row=>Math.abs(row.y-span.y)<Math.max(3,Math.min(7,span.height*.28)))
    if(!row){row={y:span.y,parts:[],height:span.height};rows.push(row)}
    row.parts.push(span)
  }
  const segments=[]
  for(const row of rows){
    const ordered=row.parts.sort((a,b)=>a.x-b.x)
    let groups=[],group=[],previous=null
    for(const item of ordered){
      const gap=previous?item.x-(previous.x+previous.width):0
      if(group.length&&gap>Math.max(33,pageWidth*.055)){
        groups.push(group);group=[]
      }
      group.push(item);previous=item
    }
    if(group.length)groups.push(group)
    for(const parts of groups){
      let previous=null,words=[]
      for(const item of parts){
        if(previous&&item.str===previous.str&&Math.abs(item.x-previous.x)<5)continue
        if(previous&&item.x>previous.x+previous.width+Math.max(4,item.height*.2))words.push(' ')
        words.push(item.str);previous=item
      }
      const text=printable(words.join(''))
      if(text)segments.push({text,x:parts[0].x,y:row.y,
        x1:Math.max(...parts.map(part=>part.x+part.width))})
    }
  }
  const left=segments.filter(t=>t.x1<pageWidth*.50)
  const right=segments.filter(t=>t.x>pageWidth*.50)
  const dual=left.length>=2&&right.length>=2&&left.length+right.length>=segments.length*.72
  const ySort=(a,b)=>b.y-a.y||a.x-b.x
  const sorted=dual?[
    ...segments.filter(t=>t.x<pageWidth*.18&&t.x1>pageWidth*.82).sort(ySort),
    ...segments.filter(t=>!(t.x<pageWidth*.18&&t.x1>pageWidth*.82)&&t.x<pageWidth*.5).sort(ySort),
    ...segments.filter(t=>!(t.x<pageWidth*.18&&t.x1>pageWidth*.82)&&t.x>=pageWidth*.5).sort(ySort)
  ]:segments.sort(ySort)
  return sorted.map(t=>t.text).filter((text,index,all)=>index===0||text!==all[index-1])
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
      const lines=extractLines(content,page.getViewport({scale:1}).width)
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
