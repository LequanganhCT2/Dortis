/**
 * Pure helpers for the cloud OCR boundary. No vendor credentials or user PDFs.
 * Mistral OCR 4.1 returns blocks in reading order with page-relative positions.
 */
export const OCR_TEMP_BUCKET = 'dortis-ocr-temp'
export const MAX_CLOUD_PDF_BYTES = 50 * 1024 * 1024
export const MAX_CLOUD_PAGES = 60
export const PAGE_TEXT_LIMIT = 200000
export const PORTFOLIO_LAYOUTS = Object.freeze([
  'cover','biography','feature','stats','gallery','media','awards','list','contact'
])
const plain = value => String(value ?? '').trim()
const clamp = value => Math.max(0,Math.min(1,value))
const ascii = value => plain(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/[đĐ]/g,'d').toLowerCase().replace(/\s+/g,' ')
export function isOwnedTempPdfPath(path,userId) {
  const user = plain(userId)
  return /^[0-9a-f]{8}-[0-9a-f-]{27,}$/.test(user) &&
    path.startsWith(user + '/') &&
    new RegExp('^'+user.replace(/-/g,'\\-')+'/[a-f0-9-]{36}\\.pdf$').test(path)
}
export function cleanOcrMarkdown(markdown) {
  return String(markdown??'')
    .replace(/!\[[^\]]*\]\((?:[^)\n]+)\)/g,'')
    .replace(/<br\s*\/?>/gi,'\n')
    .replace(/<\/?(?:p|div|span|strong|em|b|i|h[1-6])(?:\s+[^>]*?)?>/gi,' ')
    .replace(/^\s{0,3}#{1,6}\s+/gm,'')
    .replace(/\[([^\]]+)\]\(([^)\n]+)\)/g,'$1 ($2)')
    .replace(/\n{3,}/g,'\n\n').trim()
}
function scaledConfidence(value) {
  if(value==null)return null
  const n=Number(value)
  if(!Number.isFinite(n) || n<0)return null
  return Math.round(Math.max(0,Math.min(100,n<=1?n*100:n)))
}
function confidenceFrom(block){
  return scaledConfidence(block?.confidence_scores?.average_content_confidence_score ??
    block?.confidence_scores?.average_page_confidence_score ??
    block?.confidence)
}
export function normalizeMistralPages(response,expectedPages) {
  if(!response || !Array.isArray(response.pages) || !response.pages.length)
    throw new Error('Mistral chưa trả về nội dung trang PDF.')
  const count=Number(expectedPages)
  if(!Number.isInteger(count)||count<1||count>MAX_CLOUD_PAGES)
    throw new Error('Số trang PDF không hợp lệ.')
  const output=[]
  const seen=new Set()
  for(let i=0;i<response.pages.length;i++){
    const page=response.pages[i]
    const index=Number(page?.index)
    const number=Number.isInteger(index)&&index>=0?index+1:i+1
    if(number<1||number>count||seen.has(number))
      throw new Error('Thứ tự trang do OCR trả về không hợp lệ.')
    seen.add(number)
    const width=Number(page?.dimensions?.width)||1
    const height=Number(page?.dimensions?.height)||1
    const blocks=Array.isArray(page?.blocks)?page.blocks:[]
    const normalized=blocks.map(block=>{
      const x0=Number(block?.top_left_x),y0=Number(block?.top_left_y)
      const x1=Number(block?.bottom_right_x),y1=Number(block?.bottom_right_y)
      const bbox=[x0,y0,x1,y1].every(Number.isFinite)&&width>1&&height>1?
        {x0:clamp(x0/width),y0:clamp(y0/height),
          x1:clamp(x1/width),y1:clamp(y1/height)}:null
      return {
        text:cleanOcrMarkdown(block?.content),
        type:plain(block?.type||'text').slice(0,32),
        bbox,confidence:confidenceFrom(block)
      }
    }).filter(block=>block.text)
    const raw=cleanOcrMarkdown(page?.markdown)
    const text=raw || normalized.map(block=>block.text).join('\n\n')
    if(text.length>PAGE_TEXT_LIMIT)
      throw new Error('OCR trả về hơn giới hạn ký tự của một trang; cần chia nhỏ PDF.')
    const heading=normalized.find(b=>b.type==='title' && b.text.length<240)?.text || ''
    output.push({page:number,text,
      paragraphs:normalized,
      suggestedTitle:heading,
      confidence:scaledConfidence(page?.confidence_scores?.average_page_confidence_score),
      sourcePass:'cloud',provider:'mistral'})
  }
  return output.sort((a,b)=>a.page-b.page)
}
/** AI may suggest a section type, never rewrite source paragraphs or facts. */
export function verifiedClassification(raw,pages) {
  const items=Array.isArray(raw?.pages)?raw.pages:[]
  const source=new Map(pages.map(p=>[p.page,p]))
  const result=[]
  for(const item of items) {
    const page=Number(item?.page),match=source.get(page)
    if(!match || !PORTFOLIO_LAYOUTS.includes(item?.layout) ||
       result.some(x=>x.page===page)) continue
    const title=plain(item.title).slice(0,240)
    const approvedTitle=title && ascii(match.text).includes(ascii(title))?title:''
    result.push({page,layout:item.layout,title:approvedTitle})
  }
  return result
}
