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
export function extractTextBlocks(content,pageWidth=1000,pageHeight=1000){
  const spans=(content?.items||[]).filter(item=>
    typeof item.str==='string'&&item.str.trim()).map(item=>({
      str:printable(item.str),
      x:Number(item.transform?.[4])||0,y:Number(item.transform?.[5])||0,
      height:Math.max(7,Math.hypot(Number(item.transform?.[2])||0,
        Number(item.transform?.[3])||0)),
      width:Math.max(0,Number(item.width)||0)
    })).filter(item=>item.str)
  spans.sort((a,b)=>(Math.abs(b.y-a.y)>4?b.y-a.y:a.x-b.x))
  const rows=[]
  for(const span of spans){
    let row=rows.find(row=>Math.abs(row.y-span.y)<
      Math.max(3,Math.min(7,span.height*.28)))
    if(!row){row={y:span.y,parts:[],height:span.height};rows.push(row)}
    row.parts.push(span)
    row.height=Math.max(row.height,span.height)
  }
  const segments=[]
  for(const row of rows){
    const ordered=row.parts.sort((a,b)=>a.x-b.x)
    const groups=[]
    let group=[],previous=null
    for(const item of ordered){
      const gap=previous?item.x-(previous.x+previous.width):0
      if(group.length && gap>Math.max(33,pageWidth*.055)){
        groups.push(group);group=[]
      }
      group.push(item);previous=item
    }
    if(group.length)groups.push(group)
    for(const parts of groups){
      let prior=null
      const words=[]
      for(const item of parts){
        // PDF design exports sometimes repeat the exact text at the same
        // coordinate for shadow/stroke. Do not delete genuine repeated lines.
        if(prior && item.str===prior.str&&Math.abs(item.x-prior.x)<5)continue
        if(prior&&item.x>prior.x+prior.width+Math.max(4,item.height*.2))
          words.push(' ')
        words.push(item.str);prior=item
      }
      const text=printable(words.join(''))
      if(!text)continue
      const x0=Math.min(...parts.map(p=>p.x))
      const x1=Math.max(...parts.map(p=>p.x+p.width))
      const height=Math.max(...parts.map(p=>p.height))
      const y0=Math.max(0,pageHeight-row.y-height)
      const y1=Math.min(pageHeight,pageHeight-row.y+height*.15)
      segments.push({text,x:x0,x1,y:row.y,bbox:{
        x0:Math.max(0,x0/pageWidth),y0:y0/pageHeight,
        x1:Math.min(1,x1/pageWidth),y1:y1/pageHeight
      }})
    }
  }
  const left=segments.filter(t=>t.x1<pageWidth*.50)
  const right=segments.filter(t=>t.x>pageWidth*.50)
  const dual=left.length>=2&&right.length>=2&&
    left.length+right.length>=segments.length*.72
  const ySort=(a,b)=>b.y-a.y||a.x-b.x
  const fullWidth=t=>t.x<pageWidth*.18&&t.x1>pageWidth*.82
  const wide=t=>fullWidth(t)&&(pageHeight-t.y)<pageHeight*.27
  const footer=t=>fullWidth(t)&&(pageHeight-t.y)>pageHeight*.69
  const sorted=dual?[
    ...segments.filter(wide).sort(ySort),
    ...segments.filter(t=>!wide(t)&&!footer(t)&&t.x<pageWidth*.5).sort(ySort),
    ...segments.filter(t=>!wide(t)&&!footer(t)&&t.x>=pageWidth*.5).sort(ySort),
    ...segments.filter(footer).sort(ySort)
  ]:segments.sort(ySort)
  const seen=[]
  return sorted.filter(block=>{
    const duplicate=seen.some(prev=>prev.text===block.text &&
      Math.abs(prev.x-block.x)<4&&Math.abs(prev.y-block.y)<4)
    if(!duplicate)seen.push(block)
    return !duplicate
  }).map(({text,bbox})=>({text,bbox}))
}
export function extractLines(content,pageWidth=1000){
  return extractTextBlocks(content,pageWidth).map(block=>block.text)
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
      const viewport=page.getViewport({scale:1})
      const pdfBlocks=extractTextBlocks(content,viewport.width,viewport.height)
      const lines=pdfBlocks.map(block=>block.text)
      const inferred=inferTitle(lines,index)
      const body=inferred.rest.join('\n')
      // Keep raw text independent of the title guess. A heuristic headline
      // may be wrong; reviewers need the unmodified evidence to compare.
      const rawText=lines.join('\n')
      total+=body.length
      sections.push({
        page:index,
        title:inferred.title,
        body,rawText,pdfBlocks,
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
