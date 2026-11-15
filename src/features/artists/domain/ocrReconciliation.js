/** Pure text reconciliation for PDF text layers + local OCR.
 * Never labels a guess as verified. Keep both source streams for Admin review.
 */
const normalized=s=>String(s||'')
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/đ/gi,'d')
  .toLocaleLowerCase('vi')
  .replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim()
const lines=s=>String(s||'').split(/\r?\n/)
  .map(x=>x.replace(/\s+/g,' ').trim()).filter(Boolean)
export const AUTO_OCR_MAX_PAGES=18
export const OCR_SPARSE_CHARS=120
export function needsOcrPage(page,limit=OCR_SPARSE_CHARS){
  // OCR a sparse text layer, not only pages with zero selectable characters.
  // Pages with partial PDF text are common in portfolios exported from Canva.
  return lines(page?.rawText||page?.body).join(' ').length<limit
}
export function selectAutomaticOcrPages(pages=[],max=AUTO_OCR_MAX_PAGES){
  return pages.filter(p=>needsOcrPage(p)).slice(0,max).map(p=>Number(p.page))
}
/** Keep non-overlapping lines; do not replace reliable embedded PDF text with OCR.
 * Duplicated or contained lines are skipped. All raw strings remain available.
 */
export function combinePdfOcrText(pdfText='',ocrText=''){
  const original=lines(pdfText)
  const additions=[]
  const known=original.map(normalized)
  for(const line of lines(ocrText)){
    const key=normalized(line)
    if(!key||key.length<2)continue
    const same=known.some(other=>other===key||
      (key.length>=8&&other.includes(key))||
      (other.length>=8&&key.includes(other)&&other.length/key.length>.72))
    if(same)continue
    additions.push(line)
    known.push(key)
  }
  return [...original,...additions].join('\n').slice(0,14000)
}
export function applyOcrToReview(review,results=[]){
  const ocrByPage=new Map(results.map(r=>[Number(r.page),r]))
  const pages=review.pages.map(page=>{
    const result=ocrByPage.get(Number(page.page))
    if(!result)return page
    const ocrText=lines(result.text).join('\n')
    const body=page.editedFields?.body===true?page.body:
      combinePdfOcrText(page.pdfText??page.body,ocrText)
    const confidence=Number.isFinite(Number(result.confidence))?Math.round(Number(result.confidence)):null
    const warnings=[...(page.warnings||[]).filter(s=>!/không có lớp chữ|ít chữ|chưa nhận diện được tiêu đề/i.test(s))]
    if(!ocrText)warnings.push('OCR không tìm thấy chữ ở trang này. Hãy đọc và nhập thủ công.')
    else if(confidence!==null&&confidence<65)warnings.push('Độ tin cậy OCR thấp. Cần kiểm tra kỹ dấu tiếng Việt, chữ và số.')
    else warnings.push('OCR là nội dung gợi ý, cần đối chiếu lại từng câu với PDF.')
    const candidate=lines(ocrText)[0]||''
    const title=page.editedFields?.title===true?page.title:
      (page.title||(candidate.length>=4&&candidate.length<=75?candidate:''))
    return {...page,title,body,pdfText:page.pdfText??page.body,ocrText,ocrConfidence:confidence,
      ocrStatus:ocrText?'done':'empty',textFound:body.trim().length>0,
      reviewed:false,warnings,sourceChars:body.length}
  })
  return {...review,pages,pageCount:pages.length,
    quality:{
      ...review.quality,
      extracted:pages.filter(p=>p.textFound).length,
      imageOnly:pages.filter(p=>!p.textFound).length,
      lowText:pages.filter(p=>p.textFound&&p.body.length<40).length,
      ocrPages:pages.filter(p=>p.ocrStatus==='done').length
    }}
}
