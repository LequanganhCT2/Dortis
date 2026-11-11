import { useEffect, useState } from 'react'

/** Defaults reproduce the currently published Dortis copy. */
const field=(key,label,value,multiline=false,max=800)=>({key,label,value,multiline,max})
const section=(title,fields)=>({title,fields})
const serviceDefaults=[
  ['service-cv','CV & Portfolio','ARTIST IDENTITY','Một hồ sơ chỉn chu, nơi giọng hát, cá tính và những cột mốc được kể theo cách riêng.','HỒ SƠ NGHỆ SĨ','Hồ sơ biểu diễn · Media kit · Portfolio','CV &','Portfolio'],
  ['service-brand','Xây dựng thương hiệu','PERSONAL BRANDING','Định hình bản sắc riêng và tạo nên một hình ảnh nghệ sĩ nhất quán, có chiều sâu.','THƯƠNG HIỆU NGHỆ SĨ','Visual identity · Bộ nhận diện · Ứng dụng','Artist','Branding'],
  ['service-visual','Thiết kế truyền thông','VISUAL COMMUNICATION','Thiết kế hình ảnh, ấn phẩm và chất liệu truyền thông cho mỗi hành trình nghệ thuật.','THỊ GIÁC TRUYỀN THÔNG','Key visual · Poster · Campaign','Visual','Campaign'],
  ['service-web','Website nghệ sĩ','DIGITAL PRESENCE','Một điểm đến số đầy cảm xúc, nơi công chúng có thể khám phá thế giới nghệ sĩ.','KHÔNG GIAN SỐ','Creative website · Mobile EPK · Story','Artist','Website'],
]
const values=[
  ['Design','Thiết kế: Chuyển hóa ý tưởng thành sản phẩm thiết kế nghệ thuật chuyên nghiệp.','Thiết kế luôn có mục đích, không chỉ có hình thức.'],
  ['Originality','Tính nguyên bản: Tôn trọng cá tính khác biệt, tránh rập khuôn.','Tôn trọng tiếng nói và thế giới riêng của nghệ sĩ.'],
  ['Reach','Sự lan tỏa: Giúp hình ảnh nghệ sĩ kết nối tốt hơn với khán giả.','Kết nối tài năng với cộng đồng và những cơ hội mới.'],
  ['Talent','Tài năng: Lấy năng lực biểu diễn làm trọng tâm.','Sáng tạo hình ảnh nhưng không che khuất năng lực thật.'],
  ['Identity','Bản sắc: Hình ảnh cá nhân rõ ràng, nhất quán và dễ nhận diện.','Nhất quán từ hồ sơ đến mọi điểm chạm công chúng.'],
  ['Storytelling','Nghệ thuật kể chuyện: Truyền tải câu chuyện của nghệ sĩ qua thiết kế và hình ảnh.','Kể hành trình bằng những chương có cảm xúc.'],
]
const faqs=[
  ['Dortis là gì?','Dortis là studio sáng tạo giúp nghệ sĩ định hình hình ảnh chuyên nghiệp, bản sắc và không gian số riêng.'],
  ['Dortis có những dịch vụ nào?','Dortis cung cấp CV & Portfolio, Artist Branding, thiết kế truyền thông và website nghệ sĩ.'],
  ['Quick EPK khác Explore Mode thế nào?','Quick EPK cho phép xem ngay thông tin cần thiết; Explore Mode kể hành trình theo các chương. Trải nghiệm hiện tại là mô phỏng ý tưởng.'],
  ['Có thể xem PDF khách hàng công khai không?','Dortis chỉ công bố case study và tài liệu khi có quyền sử dụng công khai rõ ràng. Portfolio gốc của khách hàng không được mở mặc định.'],
]
const philosophyChapters=[
  ['Tài năng','Giọng hát, kỹ thuật và cá tính biểu diễn là điểm khởi đầu của mọi hình ảnh nghệ sĩ.'],
  ['Câu chuyện','Dortis lắng nghe những dấu mốc, cảm xúc và hành trình riêng trước khi bắt đầu thiết kế.'],
  ['Dấu ấn','Tài năng và câu chuyện được kết nối thành một hình ảnh nhất quán, dễ nhận ra và bền vững.'],
]
const exploreChapters=[
  ['STORY','Đằng sau ánh đèn.','Câu chuyện, cá tính và cảm hứng tạo nên hành trình nghệ thuật.'],
  ['WORKS','Từng tác phẩm. Một dấu ấn.','Showreel, tác phẩm và cột mốc được tổ chức thành các chương dễ khám phá.'],
  ['BOOKING','Câu chuyện còn tiếp.','Thông tin hợp tác không bị che bởi hoạt ảnh hay lớp giao diện phức tạp.'],
]
const serviceField=(title,subtitle,description,category,details,line1,line2)=>[
  field('title','Tên hiển thị',title),
  field('subtitle','Dòng phụ trên thẻ',subtitle),
  field('description','Mô tả dịch vụ',description,true,1300),
  field('category','Danh mục',category),
  field('details','Dòng mô tả bên dưới',details),
  field('line1','Chữ lớn trên hình – dòng 1',line1),
  field('line2','Chữ lớn trên hình – dòng 2',line2),
]
const schemas={
  hero:[section('Nội dung Hero bên trái',[
    field('kicker','Dòng giới thiệu nhỏ','DORTIS — CREATIVE ARTIST STUDIO / EST. 2026'),
    field('before','Đầu tiêu đề','Chúng tôi giúp'),
    field('artist','Cụm chữ xanh cobalt','nghệ sĩ'),
    field('action','Dòng tiếp theo','xây dựng hình ảnh'),
    field('quality','Cụm chữ xanh teal','chuyên nghiệp'),
    field('tail','Phần kết','và lan tỏa'),
    field('impact','Cụm chữ màu cam','dấu ấn riêng.'),
    field('description','Đoạn mô tả','Nơi bản sắc được định hình, câu chuyện được kể bằng cảm xúc và mỗi nghệ sĩ có một không gian riêng để tỏa sáng.',true,1400),
    field('primaryButton','Nút dịch vụ','KHÁM PHÁ DỊCH VỤ'),
    field('secondaryButton','Nút trải nghiệm','TRẢI NGHIỆM THỬ'),
    field('signature','Dòng chữ cuối','ART. IDENTITY. EMOTION. — EVERY ARTIST HAS A STORY.'),
  ]),section('Chữ trong bộ bốn thẻ 3D',[
    ...['CV & Portfolio','Artist Branding','Thiết kế truyền thông','Website nghệ sĩ'].flatMap((title,i)=>[
      field('card'+(i+1)+'Title','Thẻ '+(i+1)+' · Tên',title),
      field('card'+(i+1)+'Line1','Thẻ '+(i+1)+' · Chữ lớn dòng 1',['CV &','Artist','Visual','Artist'][i]),
      field('card'+(i+1)+'Line2','Thẻ '+(i+1)+' · Chữ lớn dòng 2',['Portfolio','Branding','Campaign','Website'][i]),
      field('card'+(i+1)+'Eyebrow','Thẻ '+(i+1)+' · Dòng nhỏ trên ảnh','DORTIS STUDIO / '+String(i+1).padStart(2,'0')),
      field('card'+(i+1)+'Footer','Thẻ '+(i+1)+' · Dòng dưới ảnh',['HỒ SƠ NGHỆ SĨ','THƯƠNG HIỆU NGHỆ SĨ','THỊ GIÁC TRUYỀN THÔNG','KHÔNG GIAN SỐ'][i]),
    ])
  ]),...Array.from({length:4},(_,cardIndex)=>section('Chữ riêng trên từng ảnh · Thẻ '+(cardIndex+1),
    Array.from({length:6},(_,photoIndex)=>[
      field('card'+(cardIndex+1)+'Image'+(photoIndex+1)+'Eyebrow','Ảnh '+(photoIndex+1)+' · Dòng nhỏ',''),
      field('card'+(cardIndex+1)+'Image'+(photoIndex+1)+'Line1','Ảnh '+(photoIndex+1)+' · Chữ lớn dòng 1',''),
      field('card'+(cardIndex+1)+'Image'+(photoIndex+1)+'Line2','Ảnh '+(photoIndex+1)+' · Chữ lớn dòng 2',''),
      field('card'+(cardIndex+1)+'Image'+(photoIndex+1)+'Footer','Ảnh '+(photoIndex+1)+' · Dòng dưới','')
    ]).flat()))],
  services:[section('Tiêu đề khu vực dịch vụ',[
    field('kicker','Dòng đánh dấu','02 / OUR EXPERTISE'),
    field('heading','Tiêu đề dòng 1','Mỗi câu chuyện.'),
    field('accent','Tiêu đề màu nhấn','Một ngôn ngữ riêng.'),
    field('description','Đoạn mô tả','Từ bước định hình bản sắc đến những điểm chạm truyền thông, Dortis biến ý tưởng thành trải nghiệm sáng tạo có chiều sâu.',true),
    field('hint','Hướng dẫn bên dưới','Kéo trái/phải để xoay vòng liên tục. Tối đa 5 thẻ hiển thị trên desktop và 10 ảnh có thể được quản lý trong Admin. Thẻ không có ảnh sử dụng bản mô phỏng giao diện.',true)
  ])],
  projects:[section('Tiêu đề khu vực dự án',[
    field('kicker','Dòng đánh dấu','03 / SELECTED CREATIVE WORK'),
    field('heading','Tiêu đề dòng 1','Cảm hứng'),
    field('accent','Tiêu đề màu nhấn','thành hình.'),
    field('description','Mô tả','Những dự án sáng tạo được chọn lọc và cho phép công bố sẽ xuất hiện tại đây.',true),
    field('emptyTitle','Tiêu đề khi chưa có dự án','Những câu chuyện đang được chọn lọc.'),
    field('emptyDescription','Mô tả khi chưa có dự án','Các hồ sơ và PDF gốc của khách hàng không được công khai khi chưa có quyền sử dụng rõ ràng. Dự án sẽ được giới thiệu bằng ảnh bìa và nội dung đã duyệt.',true),
  ])],
  'artist-experience':[section('Tiêu đề khu vực trải nghiệm',[
    field('kicker','Dòng đánh dấu','04 / CREATIVE ARTIST EXPERIENCE'),
    field('heading','Tiêu đề dòng 1','Một nghệ sĩ.'),
    field('accent','Tiêu đề màu nhấn','Hai cách khám phá.'),
    field('description','Mô tả khu vực','Quick EPK để xem thông tin ngay. Explore Mode để bước vào một câu chuyện theo chương.',true),
    field('demoName','Tên nghệ sĩ bản demo','Hạ Lam'),
    field('demoStageName','Tên chữ lớn trên ảnh','HẠ LAM.'),
    field('demoRole','Thể loại trên ảnh','CONTEMPORARY POP'),
    field('demoSubtitle','Dòng phụ nghệ sĩ','— nghệ sĩ giả lập'),
    field('demoDescription','Đoạn giới thiệu Quick EPK','Giới thiệu, video nổi bật, cột mốc và thông tin hợp tác luôn dễ tìm, không cần chờ 3D hay chuyển cảnh.',true),
  ]),section('Ba chương Explore',exploreChapters.flatMap(([label,title,description],i)=>[
    field('chapter'+(i+1)+'Label','Chương '+(i+1)+' · Nhãn',label),
    field('chapter'+(i+1)+'Title','Chương '+(i+1)+' · Tiêu đề',title),
    field('chapter'+(i+1)+'Description','Chương '+(i+1)+' · Mô tả',description,true),
  ]))],
  about:[section('Triết lý Dortis',[
    field('kicker','Dòng mở đầu','ĐẰNG SAU MỌI ÁNH ĐÈN SÂN KHẤU'),
    field('heading1','Tiêu đề – phần đầu','Một nghệ sĩ không chỉ có'),
    field('accent1','Chữ nhấn thứ nhất','âm nhạc.'),
    field('heading2','Tiêu đề – phần tiếp','Họ có một'),
    field('accent2','Chữ nhấn thứ hai','câu chuyện'),
    field('heading3','Tiêu đề – phần kết','xứng đáng được nhìn thấy.'),
    field('description','Đoạn mô tả','Chúng tôi tin rằng một hình ảnh đẹp bắt đầu bằng sự thấu hiểu. Dortis giúp biến tinh thần và câu chuyện riêng của mỗi nghệ sĩ thành dấu ấn bền vững.',true),
    field('button','Nút dẫn tới giá trị','KHÁM PHÁ GIÁ TRỊ DORTIS'),
    field('storyHeading','Tiêu đề thẻ tương tác','Một dấu ấn được tạo nên như thế nào?'),
  ]),section('Ba lớp câu chuyện',philosophyChapters.flatMap(([title,description],i)=>[
    field('story'+(i+1)+'Title','Mục '+(i+1)+' · Tiêu đề',title),
    field('story'+(i+1)+'Description','Mục '+(i+1)+' · Nội dung',description,true),
  ]))],
  values:[section('Tiêu đề giá trị',[
    field('heading','Tiêu đề dòng 1','Điều tạo nên'),
    field('accent','Chữ màu nhấn','DORTIS.'),
    field('description','Đoạn mô tả','Sáu chữ cái. Sáu giá trị tạo nên bản sắc và cách Dortis sáng tạo.',true),
    field('instruction1','Hướng dẫn dòng 1','Rê chuột để cảm nhận chiều sâu.'),
    field('instruction2','Hướng dẫn dòng 2','Chạm vào từng khối để khám phá giá trị.'),
  ]),section('Sáu thẻ chữ D/O/R/T/I/S',values.flatMap(([name,meaning,extra],i)=>[
    field('value'+(i+1)+'Name','Thẻ '+(i+1)+' · Tên',name),
    field('value'+(i+1)+'Meaning','Thẻ '+(i+1)+' · Ý nghĩa',meaning,true),
    field('value'+(i+1)+'Extra','Thẻ '+(i+1)+' · Mặt sau',extra,true)
  ]))],
  faq:[section('Tiêu đề FAQ',[
    field('heading','Tiêu đề dòng 1','Một vài điều'),
    field('accent','Tiêu đề nhấn','bạn muốn biết.'),
    field('description','Đoạn mô tả','Mỗi câu hỏi là điểm khởi đầu cho một câu chuyện sáng tạo. Khám phá cách Dortis đồng hành cùng nghệ sĩ.',true),
    field('button','Nút khám phá','KHÁM PHÁ DỊCH VỤ'),
  ]),section('Câu hỏi và câu trả lời',faqs.flatMap(([q,a],i)=>[
    field('question'+(i+1),'Câu hỏi '+(i+1),q),
    field('answer'+(i+1),'Câu trả lời '+(i+1),a,true,1500)
  ]))],
  contact:[section('Liên hệ và kêu gọi hợp tác',[
    field('kicker','Dòng đánh dấu','08 / THE NEXT CREATIVE CHAPTER'),
    field('heading','Tiêu đề dòng 1','Cùng tạo nên'),
    field('accent','Tiêu đề màu nhấn','dấu ấn của bạn.'),
    field('description','Đoạn mô tả','Từ một ý tưởng nhỏ đến hình ảnh nghệ sĩ trọn vẹn — Dortis sẵn sàng cho những kết nối sáng tạo. Khám phá những dịch vụ hiện đang được giới thiệu.',true),
    field('button','Nút hành động','KHÁM PHÁ DỊCH VỤ'),
  ]),section('Nội dung ba thẻ kết',[
    ...[['PORTFOLIO','CREATIVE IDENTITY.'],['ARTIST BRAND','YOUR STORY.'],['DIGITAL','BEYOND THE STAGE.']].flatMap(([tag,title],i)=>[
      field('card'+(i+1)+'Label','Thẻ '+(i+1)+' · Nhãn',tag),
      field('card'+(i+1)+'Title','Thẻ '+(i+1)+' · Chữ lớn',title),
    ]),
    field('footerDescription','Mô tả ở chân trang','Chúng tôi giúp nghệ sĩ xây dựng hình ảnh chuyên nghiệp và lan tỏa dấu ấn riêng.',true),
  ])]
}
for(const row of serviceDefaults)schemas[row[0]]=[section('Nội dung thẻ dịch vụ',serviceField(...row.slice(1)))]
for(let i=5;i<=10;i++){
  const key='service-gallery-'+String(i).padStart(2,'0')
  schemas[key]=[section('Thẻ dịch vụ mở rộng '+String(i).padStart(2,'0'),serviceField(
    'Thư viện thiết kế '+String(i).padStart(2,'0'),'DORTIS CREATIVE SHOWCASE',
    'Hình ảnh thiết kế được chọn và đăng bởi quản trị viên Dortis.','CREATIVE GALLERY',
    'Tài sản hình ảnh đã được cho phép giới thiệu công khai','Creative','Showcase'
  ))]
}
for(let i=1;i<=3;i++){
  const id='project-approved-'+String(i).padStart(2,'0')
  schemas[id]=[section('Nội dung dự án '+i,[
    field('title','Tên dự án','Dự án công khai '+String(i).padStart(2,'0')),
    field('description','Mô tả dự án','Bộ hình ảnh được duyệt để giới thiệu trên Dortis.',true),
  ])]
}
export const SITE_CONTENT_SCHEMAS=schemas
export const SITE_CONTENT_DEFAULTS=Object.fromEntries(Object.entries(schemas).map(([key,groups])=>[
  key,Object.fromEntries(groups.flatMap(group=>group.fields.map(f=>[f.key,f.value])))
]))
export function copyFor(siteContent,key){
  return {...(SITE_CONTENT_DEFAULTS[key]||{}),...(siteContent?.[key]||{})}
}

/** Public text changes are read via RLS and streamed without a full-page reload. */
export function useSiteContent(supabase){
  const [content,setContent]=useState({})
  useEffect(()=>{
    if(!supabase)return
    let active=true
    const refresh=async()=>{
      const {data,error}=await supabase.from('site_content').select('key,content')
      if(!active)return
      if(!error)setContent(Object.fromEntries((data||[]).map(x=>[x.key,x.content])))
      else console.warn('Dortis content could not be loaded:',error.message)
    }
    refresh()
    const sub=supabase.channel('dortis-public-section-content')
      .on('postgres_changes',{event:'*',schema:'public',table:'site_content'},refresh).subscribe()
    return ()=>{active=false;supabase.removeChannel(sub)}
  },[supabase])
  return content
}
