/**
 * Build readable OCR proposals from Tesseract's positioned paragraphs.
 * Multi-region passes are evidence for Admin, NOT automatically concatenated.
 * Output stays independent of the artist's genre or PDF page design.
 */
const clean=s=>String(s??'').replace(/\s+/gu,' ').trim()
const normalized=s=>clean(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/[đĐ]/g,'d').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()
const bbox=b=>b&&Number.isFinite(b.x0)&&Number.isFinite(b.y0)&&
  Number.isFinite(b.x1)&&Number.isFinite(b.y1)?
  {x0:b.x0,y0:b.y0,x1:b.x1,y1:b.y1}:null
const centerX=p=>(p.bbox.x0+p.bbox.x1)/2
function paragraphLines(p){
  const fromLines=(p?.lines||[]).map(line=>
    clean(line?.text||line?.words?.map(w=>w.text).join(' '))).filter(Boolean)
  if(fromLines.length)return fromLines
  return clean(p?.text).split(/\n/u).map(clean).filter(Boolean)
}
function orderSpatially(paragraphs,pageWidth){
  const valid=paragraphs.filter(p=>p.bbox)
  const unlocated=paragraphs.filter(p=>!p.bbox)
  if(valid.length<2)return [...valid,...unlocated]
  const width=Number(pageWidth)||Math.max(...valid.map(p=>p.bbox.x1),1)
  const left=valid.filter(p=>p.bbox.x1<width*.54)
  const right=valid.filter(p=>p.bbox.x0>width*.46)
  const twoCols=left.length>=2&&right.length>=2&&
    left.length+right.length>=valid.length*.70
  // In two-column editorial PDFs read a column before moving right; for
  // single-column and poster layouts use vertical reading order.
  const sorter=(a,b)=>a.bbox.y0-b.bbox.y0||a.bbox.x0-b.bbox.x0
  if(!twoCols)return [...valid.sort(sorter),...unlocated]
  const maxY=Math.max(...valid.map(p=>p.bbox.y1),1)
  const across=valid.filter(p=>p.bbox.x0<width*.18&&p.bbox.x1>width*.82)
  const topAcross=across.filter(p=>p.bbox.y0<maxY*.27)
  const bottomAcross=across.filter(p=>p.bbox.y0>maxY*.69)
  const rest=valid.filter(p=>!topAcross.includes(p)&&!bottomAcross.includes(p))
  const l=rest.filter(p=>centerX(p)<width*.5).sort(sorter)
  const r=rest.filter(p=>centerX(p)>=width*.5).sort(sorter)
  return [...topAcross.sort(sorter),...l,...r,...bottomAcross.sort(sorter),...unlocated]
}
export function paragraphsFromBlocks(blocks=[],pageWidth=0){
  if(!Array.isArray(blocks))return []
  const entries=[]
  for(const block of blocks){
    const paragraphs=Array.isArray(block?.paragraphs)?block.paragraphs:[]
    for(const p of paragraphs){
      const lineTexts=paragraphLines(p)
      const text=clean(lineTexts.join(' '))
      if(!text)continue
      const coordinates=bbox(p.bbox)||bbox(block.bbox)||
        bbox(p.lines?.find(line=>bbox(line.bbox))?.bbox)
      const confidence=Number.isFinite(p.confidence)?p.confidence:
        Number.isFinite(block.confidence)?block.confidence:null
      entries.push({text,bbox:coordinates,confidence})
    }
    if(!paragraphs.length&&clean(block?.text)){
      entries.push({text:clean(block.text),bbox:bbox(block.bbox),
        confidence:Number.isFinite(block.confidence)?block.confidence:null})
    }
  }
  const seen=[]
  return orderSpatially(entries,pageWidth).filter(p=>{
    const key=normalized(p.text)
    if(!key)return false
    // The same words can legitimately appear in multiple different places.
    // Only remove exact duplicate text at nearly identical coordinates.
    const duplicate=seen.some(prev=>prev.key===key &&
      (!prev.bbox&&!p.bbox || prev.bbox&&p.bbox &&
        Math.abs(prev.bbox.x0-p.bbox.x0)<7 &&
        Math.abs(prev.bbox.y0-p.bbox.y0)<7))
    if(!duplicate)seen.push({key,bbox:p.bbox})
    return !duplicate
  })
}
export function readableParagraphText(paragraphs=[]){
  return paragraphs.map(p=>clean(p.text)).filter(Boolean).join('\n\n')
}
const tokens=s=>clean(s).split(/\s+/).filter(Boolean)
export function guessOcrHeading(paragraphs=[],pageHeight=0){
  const candidates=paragraphs.filter(p=>{
    const s=clean(p.text),words=tokens(s)
    if(words.length<2||words.length>10||s.length<8||s.length>75)return false
    if(/@|https?:|\+?\d{8,}/.test(s))return false
    const letters=[...s].filter(c=>/\p{L}/u.test(c))
    const upper=letters.filter(c=>c===c.toUpperCase()).length
    if(letters.length<6||upper/letters.length<.70)return false
    if(p.confidence!=null&&p.confidence<55)return false
    if(p.bbox&&pageHeight&&p.bbox.y0>pageHeight*.75)return false
    return true
  })
  // Suggest ONLY recognizable section headings, not short OCR fragments.
  return candidates.sort((a,b)=>(a.bbox?.y0??9999)-(b.bbox?.y0??9999))[0]?.text||''
}
export function selectPrimaryOcr(passes=[]){
  const full=passes.find(p=>p.kind==='full'&&clean(p.text))
  const chosen=full||passes.filter(p=>clean(p.text))
    .sort((a,b)=>(b.confidence||0)-(a.confidence||0))[0]
  if(!chosen)return {kind:null,text:'',confidence:null,paragraphs:[]}
  const paragraphs=Array.isArray(chosen.paragraphs)?chosen.paragraphs:[]
  const text=paragraphs.length?readableParagraphText(paragraphs):String(chosen.text).trim()
  return {kind:chosen.kind,text,confidence:chosen.confidence??null,paragraphs}
}
/** Keep candidate alternatives separate; a half-page OCR pass with broken
 * syllables must never be spliced automatically into the approved main text.
 */
export function validRegionProposal(pass){
  if(!pass||pass.kind==='full')return false
  const content=clean(pass.text)
  if(content.length<12)return false
  const chars=[...content].filter(c=>/\p{L}/u.test(c)).length
  return chars>=6&&chars/content.length>.40
}

/** Manual-only operation. Whole paragraphs remain together and in source order. */
export function appendReviewedParagraph(existing='',candidate=''){
  const base=String(existing||'').trim()
  const next=String(candidate||'').trim()
  if(!next)return base
  if(!base)return next
  const a=normalized(base),b=normalized(next)
  if(a===b||a.includes(b))return base
  return base+'\n\n'+next
}
