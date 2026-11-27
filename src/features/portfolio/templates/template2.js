export const TEMPLATE_2_PARTS=[
  ['Bìa nghệ sĩ','','cover',3,'Tên nghệ sĩ và ảnh bìa.'],
  ['Tiểu sử & điểm nổi bật','TIỂU SỬ & ĐIỂM NỔI BẬT','split',1,'Tiểu sử, vai trò và danh sách thành tích.'],
  ['Thông tin biểu diễn','THÔNG TIN BIỂU DIỄN','split',1,'Thể loại, địa điểm từng biểu diễn và phong cách sân khấu.'],
  ['Dấu ấn hoạt động','DẤU ẤN HOẠT ĐỘNG','mosaic',5,'Số năm, số đối tác và số show diễn.'],
  ['Gala Dinner','GALA DINNER','mosaic',5,'Ảnh Gala Dinner; nhập chú thích nếu có.'],
  ['Year End Party','YEAR END PARTY','mosaic',5,'Ảnh Year End Party; nhập chú thích nếu có.'],
  ['Music Show','MUSIC SHOW','mosaic',5,'Ảnh Music Show; nhập chú thích nếu có.'],
  ['Hình ảnh & video','HÌNH ẢNH & VIDEO','split-reverse',4,'Mô tả thư viện và đường dẫn hình ảnh/video.']
]
export const TEMPLATE_2={slug:'template-2',name:'Template 2',version:1,status:'active',
  description:'8 phần theo PDF Long Nhật: bìa, tiểu sử, thông tin biểu diễn, số liệu, Gala Dinner, Year End Party, Music Show và thư viện media.',
  blueprint:{style:'editorial',visualTheme:'ribbon-luxury',colorPalette:'black-white',
    ribbonLayout:'diagonal',ribbonDirection:'down-right',glowOpacity:0.28,
    sections:TEMPLATE_2_PARTS.map(([name,,layout,slots],i)=>({id:'page-'+(i+1),
      label:String(i+1).padStart(2,'0')+' · '+name,layout,slots,effect:'auto'}))}}
export function createTemplate2Profile(){
  return {id:null,name:'',slug:'',role:'',tagline:'',intro:'',render_mode:'editorial',status:'draft',cover_image_url:null,
    sections:TEMPLATE_2_PARTS.map(([name,title,,slots,hint],i)=>({page:i+1,name,title,eyebrow:'',body:'',
      contentVersion:2,layout:i===0?'cover':slots>1?'gallery':'feature',input_hint:hint,links:[],photos:[],media:[]}))}
}
