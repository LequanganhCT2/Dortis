/**
 * Combine selectable PDF text with OCR-only paragraphs by page position.
 * Coordinates are normalized [0,1] in top-left reading space.
 * Prefer exact selectable text wherever both engines see the same words.
 * This is a suggestion for human review, never a claim of OCR correctness.
 */
const clean = value => String(value ?? '').replace(/\s+/gu, ' ').trim()
const fold = value => clean(value).normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd')
  .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const tokens = value => fold(value).split(' ').filter(Boolean)
const validBox = box => box && ['x0','y0','x1','y1'].every(k => Number.isFinite(box[k]))
const bounded = box => validBox(box) ? {
  x0:Math.max(0,Math.min(1,box.x0)),y0:Math.max(0,Math.min(1,box.y0)),
  x1:Math.max(0,Math.min(1,box.x1)),y1:Math.max(0,Math.min(1,box.y1))
} : null
const middle = block => (block.bbox.x0 + block.bbox.x1) / 2
function overlap(a,b) {
  if (!validBox(a) || !validBox(b)) return false
  const padX=.025,padY=.018
  return a.x0<=b.x1+padX && a.x1>=b.x0-padX &&
    a.y0<=b.y1+padY && a.y1>=b.y0-padY
}
function similarity(a,b) {
  const aa=new Set(tokens(a)),bb=new Set(tokens(b))
  if (!aa.size || !bb.size) return 0
  let shared=0
  for (const word of aa) if (bb.has(word)) shared++
  return shared/aa.size
}
function readingOrder(blocks) {
  const located=blocks.filter(block=>block.bbox)
  const unlocated=blocks.filter(block=>!block.bbox)
  const byY=(a,b)=>a.bbox.y0-b.bbox.y0||a.bbox.x0-b.bbox.x0
  const wide=located.filter(b=>b.bbox.x0<.18 && b.bbox.x1>.82)
  const headings=wide.filter(b=>b.bbox.y0<.27)
  const footers=wide.filter(b=>b.bbox.y0>.69)
  const narrow=located.filter(b=>!headings.includes(b)&&!footers.includes(b))
  const left=narrow.filter(b=>b.bbox.x1<=.54)
  const right=narrow.filter(b=>b.bbox.x0>=.46)
  const twoColumns=left.length>=2 && right.length>=2 &&
    left.length+right.length>=narrow.length*.72
  if (!twoColumns) return [...located.sort(byY),...unlocated]
  return [
    ...headings.sort(byY),
    ...narrow.filter(b=>middle(b)<.5).sort(byY),
    ...narrow.filter(b=>middle(b)>=.5).sort(byY),
    ...footers.sort(byY),
    ...unlocated
  ]
}
function plausibleOcr(block) {
  const t=clean(block.text)
  const letters=[...t].filter(ch=>/\p{L}/u.test(ch)).length
  // Short headings are legitimate, but single-character OCR debris is not.
  if (letters<3 || (letters<6 && t.length>14)) return false
  if (block.confidence!=null && block.confidence<56) return false
  return true
}
export function combinePositionedText(pdfBlocks=[],ocrParagraphs=[]) {
  if (!Array.isArray(pdfBlocks) || !Array.isArray(ocrParagraphs) ||
      !ocrParagraphs.length) return null
  const pdf=pdfBlocks.map(b=>({
    text:clean(b?.text),bbox:bounded(b?.bbox),source:'pdf',confidence:null
  })).filter(b=>b.text)
  const ocr=ocrParagraphs.map(b=>({
    text:clean(b?.text),bbox:bounded(b?.bbox),source:'ocr',
    confidence:Number.isFinite(b?.confidence)?b.confidence:null
  })).filter(b=>b.text)
  // An OCR run with no positioned blocks must be handled by the ordinary
  // source selector; never assume the words were placed correctly.
  if (!ocr.some(b=>b.bbox)) return null
  const selected=[...pdf],skipped=[],unverified=[]
  let added=0
  for (const block of ocr) {
    if (!plausibleOcr(block)) {unverified.push(block);continue}
    const identical=selected.some(b=>fold(b.text)===fold(block.text) &&
      (!b.bbox || !block.bbox || overlap(b.bbox,block.bbox)))
    if (identical) {skipped.push(block);continue}
    const near=pdf.filter(b=>overlap(b.bbox,block.bbox))
    const existing=near.map(b=>b.text).join(' ')
    const covered=similarity(block.text,existing)
    // The OCR may have less readable text or worse diacritics than text layer.
    // Keep it as an alternative, not a duplicate in the final paragraph.
    if (near.length && (covered>=.76 ||
        (covered>=.55 && fold(block.text).length<=fold(existing).length*1.2))) {
      skipped.push(block);continue
    }
    // If OCR sees additional words on a mixed page, preserve them and their
    // position, while asking the reviewer to resolve any overlaps.
    selected.push({...block,needsReview:near.length>0})
    added++
  }
  const ordered=readingOrder(selected)
  return {
    text:ordered.map(b=>b.text).join('\n\n'),
    blocks:ordered,added,skipped:skipped.length,unverified,
    requiresReview:ordered.some(b=>b.needsReview)
  }
}
