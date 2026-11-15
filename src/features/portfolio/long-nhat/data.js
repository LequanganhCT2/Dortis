/** ONLY values explicitly authorized by DORTIS-LNS-WEB-001.
 * Do not add invented biography, dates, booking contacts, photos or branding.
 */
export const LONG_NHAT_PORTFOLIO = Object.freeze({
  documentId: 'DORTIS-LNS-WEB-001',
  artistDisplayName: 'Long Nhật Singer',
  status: 'INPUT_PENDING',
  published: false,
  publicReleaseApproved: false,
  sourcePortfolio: null,
  sourceVersion: null,
  visualTokensApproved: false,
  biography: null,
  strengths: [],
  media: [],
  showreel: [],
  works: [],
  achievements: [],
  booking: {publicApproved: false, email: null, phone: null, zalo: null}
})

export const PORTFOLIO_REQUIREMENTS = Object.freeze([
  {id:'IN-01',title:'Portfolio hoàn chỉnh',state:'MISSING',detail:'PDF/PPTX hoặc bộ trang ảnh đúng version'},
  {id:'IN-02',title:'Ảnh và artwork gốc',state:'ASSET_PENDING',detail:'Ảnh chân dung, live, cover, crop desktop/mobile'},
  {id:'IN-03',title:'Kênh phát hành chính thức',state:'MISSING',detail:'Video, nhạc, mạng xã hội cần được xác thực'},
  {id:'IN-04',title:'Đầu mối booking công khai',state:'PUBLIC_APPROVAL_PENDING',detail:'Chỉ hiển thị khi được phép công bố'},
  {id:'IN-05',title:'Logo, font, file thiết kế',state:'MISSING',detail:'Dùng để phân tích DNA hình ảnh, chưa khóa thiết kế'},
  {id:'IN-06',title:'Xác nhận quyền sử dụng/phát hành',state:'APPROVAL_PENDING',detail:'Phải duyệt trước khi đưa lên Production'}
])

export function canPublishPortfolio(data=LONG_NHAT_PORTFOLIO) {
  return Boolean(data.published && data.publicReleaseApproved &&
    data.sourcePortfolio && data.visualTokensApproved &&
    data.booking?.publicApproved)
}
