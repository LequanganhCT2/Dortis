export const MEDIA_GROUPS = [
  { id:'hero', title:'Trang đầu / Hero', note:'Tối đa 6 thẻ, mỗi thẻ có 6 ảnh riêng và chỉnh chữ trong một lần', slots:[]},
  { id:'services', title:'Dịch vụ', note:'10 vị trí thẻ, mỗi vị trí có thư viện ảnh riêng', slots:[
    {id:'service-cv',title:'CV & Portfolio'}, {id:'service-brand',title:'Thương hiệu nghệ sĩ'},
    {id:'service-visual',title:'Thiết kế truyền thông'}, {id:'service-web',title:'Website nghệ sĩ'},
    ...Array.from({length:6},(_,i)=>({id:'service-gallery-'+String(i+5).padStart(2,'0'),title:'Thẻ dịch vụ mở rộng '+String(i+5).padStart(2,'0') }))
  ]},
  {id:'projects',title:'Dự án công khai',note:'Chỉ thêm hình ảnh khách hàng đã đồng ý công bố; không tải PDF riêng tư',slots:[
    {id:'project-approved-01',title:'Dự án công khai 01'},
    {id:'project-approved-02',title:'Dự án công khai 02'},
    {id:'project-approved-03',title:'Dự án công khai 03'},
  ]},
  {id:'artist',title:'Trải nghiệm nghệ sĩ',note:'Ảnh nền Quick EPK và Explore; dữ liệu minh họa vẫn giữ nguyên',slots:[
    {id:'artist-experience',title:'Ảnh nền trải nghiệm nghệ sĩ'}]},
  {id:'about',title:'Triết lý Dortis',note:'Ảnh lớp nền thẻ kể chuyện',slots:[{id:'about',title:'The Dortis Philosophy'}]},
  {id:'values',title:'Giá trị DORTIS',note:'Ảnh nền mờ giúp khối 3D vẫn dễ đọc',slots:[{id:'values',title:'Sáu giá trị D/O/R/T/I/S'}]},
  {id:'faq',title:'Câu hỏi thường gặp',note:'Ảnh nền trang trí nhẹ cho phần FAQ',slots:[{id:'faq',title:'Frequently Asked Questions'}]},
  {id:'contact',title:'Liên hệ / CTA',note:'Ảnh trong bộ thẻ ở cuối trang',slots:[{id:'contact',title:'Bộ thẻ kết nối'}]},
]
