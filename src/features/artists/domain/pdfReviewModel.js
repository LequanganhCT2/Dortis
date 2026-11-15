import {slugifyArtist} from '../../../artistPdf.js'
import {MAX_REVIEW_CHARACTERS} from './ocrReconciliation.js'

/** Generic PDF Portfolio ingest. Never assumes a singer, a specific career,
 * a particular page count, or hand-authored names of events. All titles are
 * suggestions and each source page must be explicitly confirmed by Admin.
 */
const plain=value=>String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim()
const pagePlaceholder=value=>/^(?:trang\s*(?:bìa|\d+)|page\s*\d+|cover)$/iu.test(plain(value))
export function uniqueSourceLines(body=''){
  const arr=String(body||'').split(/\n+/).map(plain).filter(Boolean)
  // Distinct visual positions may legitimately repeat the same sentence.
  // Deduplication belongs to coordinate-aware extractors, not plain text.
  return arr
}
/** Conservative suggestions, backed by matching words or simple text density. */
export function suggestPageLayout(page,title,body){
  const header=plain(title).toLocaleLowerCase('vi')
  const corpus=(header+' '+plain(body)).toLocaleLowerCase('vi')
  if(page===1 && (!header||/^(portfolio|hồ sơ|profile|artist|studio|giới thiệu)/u.test(header)))
    return 'cover'
  if(/(liên hệ|contact|booking|email|đặt lịch|số điện thoại)/u.test(corpus))return 'contact'
  if(/(thành tích|giải thưởng|award|achievement|chứng nhận|danh hiệu)/u.test(corpus))return 'awards'
  if(/(hình ảnh|gallery|photo|ảnh|media|video|video clip|bộ sưu tập)/u.test(header))return 'gallery'
  if(/(số liệu|thống kê|thành tựu|highlights|dấu ấn)/u.test(header) && /\d/u.test(body))return 'stats'
  if(/(tiểu sử|về tôi|về chúng tôi|about me|biography|giới thiệu)/u.test(header))return 'biography'
  if(/(danh sách|kỹ năng|skills|năng lực|chuyên môn|services|dịch vụ)/u.test(header))return 'list'
  if(page===1)return 'cover'
  if(body.length>280)return 'biography'
  return 'feature'
}
function candidateFromBody(lines){
  const first=lines[0]||''
  const next=lines[1]||''
  if(!first||first.length>70||first.length<4)return ''
  if(/[.!?;,]$/.test(first))return ''
  if(first===first.toUpperCase()&&/[\p{L}]/u.test(first))return first
  if(next.length>first.length+22 && !first.includes('.'))return first
  return ''
}
export function buildReviewFromExtraction(parsed={}){
  const name=plain(parsed?.name)||'Nghệ sĩ mới'
  const sections=Array.isArray(parsed?.sections)?parsed.sections:[]
  const pages=sections.map((source,index)=>{
    const page=Number(source.page)||index+1
    const sourceLines=uniqueSourceLines(source.rawText||source.body)
    const heading=plain(source.title)
    // Never treat 'Trang 4', 'Page 3' etc as real section titles.
    const knownHeading=heading&&!pagePlaceholder(heading)?heading:''
    const suggested=knownHeading||candidateFromBody(sourceLines)
    const title=suggested || (page===1?name:'')
    // Preserve every extracted line. It must remain visible in review, even if
    // it resembles a heading; automatic deletion risks losing artist facts.
    const body=sourceLines.join('\n')
    const textFound=body.length>0
    const warnings=[]
    if(!textFound)warnings.push('Trang không có lớp chữ đọc được. Nội dung có thể nằm trong ảnh; hãy nhìn bản PDF và nhập bằng tay.')
    else if(body.length<40)warnings.push('Ít chữ được trích xuất. Cần kiểm tra trực tiếp trên PDF.')
    if(!suggested&&page!==1)warnings.push('Chưa nhận diện được tiêu đề, cần nhập chính xác trước khi lưu.')
    if(suggested&&page>1)warnings.push('Tiêu đề là gợi ý, hãy đối chiếu với PDF.')
    return {
      page,layout:suggestPageLayout(page,title,body),title,eyebrow:'',body,
      pdfText:body,
      pdfBlocks:Array.isArray(source.pdfBlocks)?source.pdfBlocks:[],
      sourceBlocks:Array.isArray(source.pdfBlocks)?source.pdfBlocks.map(block=>({
        text:block.text,bbox:block.bbox,source:'pdf',confidence:null
      })):[],
      ocrText:'',ocrConfidence:null,ocrStatus:'not_run',
      highlights:[],metrics:[],links:[],media:[],photos:[],
      kind:textFound?'extracted_text_review_required':'pdf_image_text_review_required',
      textFound,sourceChars:body.length,reviewed:false,warnings
    }
  })
  return {name,role:plain(parsed?.role)||'Nghệ sĩ',slug:slugifyArtist(name),
    tagline:'',intro:'',pages,pageCount:pages.length,
    quality:{imageOnly:pages.filter(p=>!p.textFound).length,
      lowText:pages.filter(p=>p.textFound&&p.sourceChars<40).length,
      extracted:pages.filter(p=>p.textFound).length,
      ocrPages:0}}
}
export function normalizeReviewedPage(page){
  return {
    page:Number(page.page)||1,layout:page.layout||'feature',
    title:plain(page.title).slice(0,240),eyebrow:plain(page.eyebrow).slice(0,160),
    subtitle:'',body:String(page.body||''),
    kind:'reviewed_pdf_text',
    extraction:{source:page.ocrStatus==='done'?'text_layer_and_local_ocr':'text_layer_or_manual',
      ocrConfidence:page.ocrStatus==='done'?page.ocrConfidence:null,
      manualEdited:page.editedFields?.body===true,
      reviewed:true},
    // Preserve the structured source and provenance. Body remains the
    // human-approved source of truth after any manual corrections.
    text_blocks:(Array.isArray(page.sourceBlocks)?page.sourceBlocks:[])
      .map(block=>({
        text:String(block.text||''),
        source:block.source==='ocr'?'ocr':'pdf',
        bbox:block.bbox||null,
        confidence:block.confidence??null
      })).filter(block=>block.text),
    highlights:Array.isArray(page.highlights)?page.highlights.slice(0,24):[],
    metrics:Array.isArray(page.metrics)?page.metrics.slice(0,12):[],
    links:[],media:[],photos:[],
    image_url:null,image_storage_path:null,original_page_url:null,original_page_path:null
  }
}
export function validateReviewedImport(review){
  if(!review?.name?.trim()||review.name.trim().length<2)return 'Tên chủ thể Portfolio cần ít nhất 2 ký tự.'
  if(!review?.pages?.length)return 'PDF chưa có trang nào để nhập.'
  if(!review.pages.every(p=>plain(p.title).length>0))
    return 'Mỗi trang phải có tiêu đề. Hãy kiểm tra các trang không đọc được chữ.'
  const oversized=review.pages.find(p=>String(p.body||'').length>MAX_REVIEW_CHARACTERS)
  if(oversized)return 'Trang '+oversized.page+' vượt '+MAX_REVIEW_CHARACTERS+
    ' ký tự. Hãy chia nội dung thành nhiều hồ sơ hoặc rút gọn trước khi lưu; hệ thống sẽ không tự cắt chữ.'
  if(!review.pages.every(p=>p.reviewed))
    return 'Vui lòng kiểm tra và xác nhận từng trang trước khi lưu.'
  return null
}
