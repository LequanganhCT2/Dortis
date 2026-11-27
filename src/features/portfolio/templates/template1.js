/** Reusable 12-part structure. Artist content belongs only to profile records. */
export const TEMPLATE_1_PARTS=Object.freeze([
  {name:'Bìa nghệ sĩ',title:'',eyebrow:'',layout:'cover',slots:1,hint:'Tên nghệ sĩ và vai trò.'},
  {name:'Hành trình âm nhạc',title:'HÀNH TRÌNH ÂM NHẠC',layout:'split-reverse',slots:1,hint:'Tiểu sử, hành trình và câu nói riêng.'},
  {name:'Dấu ấn nghệ thuật',title:'DẤU ẤN NGHỆ THUẬT',layout:'split',slots:3,hint:'Số năm, số chương trình, mô tả và tên ký cuối trang.'},
  {name:'Thể loại âm nhạc',title:'THỂ LOẠI ÂM NHẠC',eyebrow:'CHUYÊN MÔN',layout:'split-reverse',slots:1,hint:'Danh sách thể loại và lời mô tả.'},
  {name:'Chương trình & sự kiện',title:'CHƯƠNG TRÌNH & SỰ KIỆN',eyebrow:'KINH NGHIỆM THỰC TẾ',layout:'split',slots:2,hint:'Mỗi chương trình hoặc nhóm sự kiện một dòng.'},
  {name:'Hình ảnh biểu diễn',title:'HÌNH ẢNH BIỂU DIỄN',eyebrow:'TƯ LIỆU NGHỆ SĨ',layout:'mosaic',slots:3,hint:'Ảnh biểu diễn riêng; chỉ thêm chú thích có thật.'},
  {name:'Chương trình văn hóa',title:'CHƯƠNG TRÌNH VĂN HÓA',eyebrow:'HOẠT ĐỘNG NGHỆ THUẬT',layout:'grid',slots:2,hint:'Ảnh hoạt động văn hóa, chú thích nếu có.'},
  {name:'Song ca & biểu diễn phối hợp',title:'SONG CA & BIỂU DIỄN PHỐI HỢP',eyebrow:'TƯ LIỆU SÂN KHẤU',layout:'mosaic',slots:6,hint:'Ảnh song ca, phối hợp và thông tin đã xác minh.'},
  {name:'Biểu diễn đơn ca',title:'BIỂU DIỄN ĐƠN CA',layout:'mosaic',slots:3,hint:'Ảnh đơn ca và chú thích nếu có.'},
  {name:'Hình ảnh & video',title:'HÌNH ẢNH & VIDEO',eyebrow:'THƯ VIỆN TƯ LIỆU',layout:'grid',slots:4,hint:'Lời mời xem thư viện, đường dẫn và mã QR nếu có.'},
  {name:'Liên hệ & booking',title:'LIÊN HỆ & BOOKING',eyebrow:'HỢP TÁC NGHỆ SĨ',layout:'text',slots:0,hint:'Tên nghệ sĩ, điện thoại/Zalo, email và mạng xã hội.'},
  {name:'Cảm ơn',title:'TRÂN TRỌNG CẢM ƠN',layout:'split-reverse',slots:1,hint:'Lời cảm ơn và tên ký cuối trang.'}
])

export const TEMPLATE_1={
  slug:'template-1',name:'Template 1',version:1,status:'active',
  description:'12 phần theo cấu trúc portfolio La Trinh: nhập thông tin từng phần, thêm ảnh riêng và xem trước trước khi xuất bản.',
  blueprint:{style:'editorial',visualTheme:'ribbon-luxury',colorPalette:'red-gold',
    ribbonLayout:'diagonal',ribbonDirection:'down-right',glowOpacity:0.28,
    sections:TEMPLATE_1_PARTS.map((part,index)=>({id:'page-'+(index+1),
      label:String(index+1).padStart(2,'0')+' · '+part.name,layout:part.layout,slots:part.slots,effect:'auto'}))}
}

export function createTemplate1Profile(){
  return {id:null,name:'',slug:'',role:'',tagline:'',intro:'',render_mode:'editorial',
    status:'draft',cover_image_url:null,
    sections:TEMPLATE_1_PARTS.map((part,index)=>({page:index+1,name:part.name,
      title:part.title,eyebrow:part.eyebrow||'',body:'',contentVersion:2,
      layout:index===0?'cover':part.slots>1?'gallery':'feature',
      input_hint:part.hint,links:[],photos:[],media:[]}))}
}
