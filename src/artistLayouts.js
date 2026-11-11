/**
 * Source-grounded Dortis layout mappings for the three supplied portfolios.
 * Every entry corresponds to one actual PDF page; each becomes one responsive
 * HTML/CSS section. Photo crops contain only selected photographic regions,
 * NEVER a flattened full PDF slide.
 *
 * The mapped text is editorial transcription of the supplied portfolios.
 * Review all draft text/media in Admin before publishing.
 */
const crop=(x,y,w,h)=>({x,y,w,h})
const section=(layout,title,body='',photos=[],extra={})=>({
  layout,title,body,photos,eyebrow:extra.eyebrow||'',
  subtitle:extra.subtitle||'',highlights:extra.highlights||[],
  metrics:extra.metrics||[],links:extra.links||[],tone:extra.tone||'',
})

const longNhat={
  name:'Long Nhật',role:'Ca sĩ',tagline:'Singer · Live performance · Đà Nẵng',
  theme:'stage',intro:'',
  sections:[
    section('cover','LONG NHẬT','Ca sĩ', [crop(.33,.04,.36,.90)],{eyebrow:'ARTIST PORTFOLIO / SINGER',subtitle:'LONG NHẬT'}),
    section('biography','Long Nhật',
      'Long Nhật là nam ca sĩ tự do đầy triển vọng tại Đà Nẵng, với hơn 4 năm kinh nghiệm đứng trên các sân khấu chuyên nghiệp và các tụ điểm âm nhạc sôi động. Sở hữu ngoại hình sáng cùng chất giọng truyền cảm và nội lực, anh từng bước ghi những dấu ấn đậm nét trên hành trình âm nhạc, bằng sự chỉn chu và hình ảnh chuyên nghiệp.',
      [crop(.62,.04,.36,.94)],{eyebrow:'TIỂU SỬ NGẮN',highlights:['TOP 10 FUDA Showtime 2021','TOP 15 FUDA Got Talent 2023','TOP 15 ON THE RADIO Shine New Star 2024']}),
    section('feature','Thông tin biểu diễn',
      'Biểu diễn đa dạng các thể loại: Pop, Rock, Ballad, Nhạc Ngoại, Nhạc trữ tình.\nĐịa điểm từng biểu diễn: On The Radio, Ariyana Resort, Memory Loudge, Marriots Resort, Vinpern Nam Hội An... Cùng nhiều điểm địa nổi tiếng tại thành phố Đà Nẵng.\nPhong cách biểu diễn: chuyên nghiệp, chỉn chu, nhiệt tình và tương tác tốt với khán giả.',
      [crop(.63,.05,.34,.91)],{eyebrow:'PHONG CÁCH SÂN KHẤU',highlights:['Pop · Rock · Ballad','Nhạc ngoại · Nhạc trữ tình','Sự kiện · Sân khấu âm nhạc']}),
    section('stats','Dấu ấn biểu diễn','',[
      crop(.02,.04,.27,.38),crop(.38,.10,.27,.35),crop(.75,.05,.24,.43)
    ],{eyebrow:'LIVE PERFORMANCE',metrics:[['4+','Năm kinh nghiệm'],['30+','Đối tác'],['500+','Show diễn']]}),
    section('gallery','Gala Dinner','',[
      crop(.13,.26,.22,.58),crop(.36,.24,.26,.63),crop(.67,.24,.23,.67)
    ],{eyebrow:'SELECTED PERFORMANCES / 01',subtitle:'Biểu diễn tại các chương trình Gala Dinner'}),
    section('gallery','Year End Party','',[
      crop(.14,.29,.22,.57),crop(.39,.25,.25,.64),crop(.68,.24,.23,.66)
    ],{eyebrow:'SELECTED PERFORMANCES / 02',subtitle:'Không gian sân khấu cuối năm'}),
    section('gallery','Music Show','',[
      crop(.11,.24,.23,.63),crop(.37,.26,.26,.64),crop(.67,.24,.24,.67)
    ],{eyebrow:'SELECTED PERFORMANCES / 03',subtitle:'Những khoảnh khắc trình diễn trực tiếp'}),
    section('media','Hình ảnh & Video',
      'Live Performances · Events · Thư viện hình ảnh và video',
      [crop(.05,.01,.53,.96),crop(.66,.64,.16,.24),crop(.83,.64,.14,.24)],
      {eyebrow:'ARTIST MEDIA',subtitle:'Tư liệu biểu diễn trên sân khấu'})
  ]
}
const ludance={
  name:'Ngọc Trâm',role:'Biên đạo múa',tagline:'LuDance · 12+ năm hoạt động nghệ thuật',theme:'pearl',intro:'',
  sections:[
    section('cover','NGỌC TRÂM','Biên đạo', [crop(.30,.02,.42,.82)],{eyebrow:'LUDANCE / NGHỆ SĨ BIÊN ĐẠO',subtitle:'LuDance'}),
    section('biography','Tiểu sử',
      'Nghệ danh: LuDance\nHọ và tên: Nguyễn Ngọc Trâm\nNgày sinh: 14/08\nBiên đạo Ngọc Trâm, với hơn 12 năm kinh nghiệm hoạt động nghệ thuật, đã góp mặt trong nhiều chương trình lớn nhỏ trên khắp các sân khấu chuyên nghiệp. Bằng tư duy sáng tạo độc đáo và dấu ấn cá nhân riêng biệt, cô không chỉ mang đến những tác phẩm nghệ thuật ấn tượng mà còn khẳng định vị thế của mình trong lĩnh vực biên đạo múa.',
      [crop(.63,.23,.32,.75)],{eyebrow:'ARTIST BIOGRAPHY',metrics:[['12+','Năm hoạt động nghệ thuật']]}),
    section('feature','Hành trình từ diễn viên múa đến biên đạo',
      'Xuất thân từ một diễn viên múa, hơn ai hết cô thấu hiểu sâu sắc vai trò cũng như những khó khăn, áp lực mà người nghệ sĩ biểu diễn phải đối mặt. Chính hành trình ấy đã trở thành nền tảng để cô bước vào vai trò biên đạo một cách tự nhiên, bằng sự thấu cảm, trải nghiệm và tình yêu trọn vẹn dành cho nghệ thuật.',
      [crop(.05,.01,.38,.96)],{eyebrow:'HÀNH TRÌNH NGHỆ THUẬT'}),
    section('awards','Giấy khen & danh hiệu tiêu biểu','',
      [],{eyebrow:'AWARDS / MILESTONES',highlights:['2015','2018','2020','2021','2022','2023']}),
    section('awards','Cột mốc 2024 – 2025','',
      [],{eyebrow:'SELECTED RECOGNITION',highlights:['2024 · Bằng khen Hội Nghệ sĩ Múa Hà Nội','2025 · Chiến sĩ thi đua cơ sở · Sở Văn hóa, Thể thao và Du lịch TP. Đà Nẵng']}),
    section('stats','Thành tích nổi bật',
      'Dòng nhớ dòng thương · Hội diễn nghệ thuật quần chúng Quảng Bình · 2014',
      [crop(.29,.08,.39,.86)],{eyebrow:'THÀNH TÍCH',metrics:[['03','Huy chương Vàng toàn quốc']]}),
    section('list','Các hình thức biểu diễn','',
      [crop(.03,.03,.43,.92)],{eyebrow:'BIÊN ĐẠO / MÚA',highlights:['Múa đơn','Múa đôi','Múa tập thể','Đồng diễn','Múa phụ họa','Múa độc lập','Tương tác LED','Hoạt cảnh','Múa dân gian','Múa dân gian đương đại','Múa đương đại']}),
    section('feature','Giá trị nghề nghiệp',
      'Đơn vị công tác: Trung tâm Văn hóa – Điện ảnh TP. Đà Nẵng.',
      [crop(.07,.04,.37,.93)],{eyebrow:'WORKING PHILOSOPHY',highlights:['Trách nhiệm','Sáng tạo','Đam mê']}),
    section('media','Video biểu diễn',
      'Nhấn vào biểu tượng để truy cập đường liên kết và xem các video biểu diễn và các dự án nghệ thuật.',
      [],{eyebrow:'PERFORMANCE FILMS',links:['YouTube','TikTok']}),
    section('quote','Điều mình tin',
      '“Thanh xuân chẳng sợ năm tháng dài rộng, cứ hết mình thôi. Cuộc đời vẫn yêu thương mình theo một cách nào đó 💗”',
      [crop(.56,.03,.38,.94)],{eyebrow:'LUDANCE / WORDS TO LIVE BY'}),
    section('contact','Xin cảm ơn',
      'Cảm ơn Quý đối tác và Quý khách hàng đã dành thời gian theo dõi Portfolio.\nMỗi sân khấu là một hành trình của cảm xúc. Mỗi chuyển động là một câu chuyện được kể bằng nghệ thuật.\nHy vọng sẽ có cơ hội đồng hành cùng Quý vị để tạo nên những tác phẩm giàu cảm xúc, sáng tạo và mang đậm dấu ấn nghệ thuật.',
      [crop(.07,.02,.37,.92)],{eyebrow:'CẢM ƠN & HỢP TÁC',highlights:['Facebook: Nguyễn Ngọc Trâm','SĐT: 0934.991.408']})
  ]
}
const laTrinh={
  name:'La Trinh',role:'Ca sĩ',tagline:'Ca sĩ · Âm nhạc & nghệ thuật biểu diễn',theme:'rose',intro:'',
  sections:[
    section('cover','LA TRINH','Ca sĩ', [crop(.52,.02,.41,.96)],{eyebrow:'LA TRINH / ARTIST PORTFOLIO'}),
    section('feature','Hành trình âm nhạc',
      'Với La Trinh, âm nhạc không chỉ là những giai điệu, mà là tiếng lòng, là nơi cô gửi gắm trọn vẹn những thăng trầm của cảm xúc. Khởi đầu từ niềm đam mê cháy bỏng, mỗi bước đi trên con đường nghệ thuật đều là một dấu ấn của sự nỗ lực, rèn luyện không ngừng nghỉ để hoàn thiện bản thân. Cô luôn tin rằng, mỗi ca khúc là một câu chuyện, và người nghệ sĩ là người kể chuyện bằng cả trái tim.\nÂm nhạc là hành trình kết nối những cảm xúc.',
      [crop(.04,.03,.36,.94)],{eyebrow:'CHÂN DUNG NGHỆ SĨ'}),
    section('stats','Dấu ấn nghệ thuật',
      'Một hành trình bền bỉ với âm nhạc, từ các chương trình văn hóa nghệ thuật đến những sân khấu và sự kiện đa dạng.',
      [crop(.60,.08,.35,.86)],{eyebrow:'ARTIST EXPERIENCE',metrics:[['10','Năm hoạt động nghệ thuật'],['1000+','Chương trình biểu diễn lớn nhỏ']]}),
    section('list','Thể loại âm nhạc',
      'Linh hoạt lựa chọn tiết mục phù hợp với tính chất chương trình và đối tượng khán giả.',
      [crop(.04,.06,.42,.92)],{eyebrow:'CHUYÊN MÔN',highlights:['Quê hương – đất nước','Trữ tình – dân ca','Nhạc trẻ']}),
    section('list','Chương trình & sự kiện','',
      [crop(.53,.04,.43,.94)],{eyebrow:'KINH NGHIỆM THỰC TẾ',highlights:['Chương trình văn hóa, nghệ thuật tại Đà Nẵng','Hoạt động nghệ thuật của các đơn vị tại Quảng Nam','Chương trình do các đơn vị văn hóa và lực lượng Công an tổ chức','Các sự kiện và chương trình biểu diễn phục vụ nhiều quy mô khán giả']}),
    section('gallery','Hình ảnh biểu diễn','',
      [crop(.31,.03,.37,.91),crop(.04,.11,.25,.58),crop(.71,.18,.25,.64)],{eyebrow:'TƯ LIỆU NGHỆ SĨ'}),
    section('feature','Chương trình văn hóa','',
      [crop(.65,.03,.32,.96),crop(.05,.60,.42,.31)],{eyebrow:'HOẠT ĐỘNG NGHỆ THUẬT'}),
    section('gallery','Song ca & biểu diễn phối hợp','',
      [crop(.02,.08,.53,.57),crop(.60,.51,.35,.41)],{eyebrow:'TƯ LIỆU SÂN KHẤU'}),
    section('gallery','Biểu diễn đơn ca','',
      [crop(.31,.02,.40,.91),crop(.03,.06,.25,.53),crop(.72,.17,.22,.51)],{eyebrow:'LIVE PERFORMANCE'}),
    section('media','Thư viện tư liệu hình ảnh & video','',
      [crop(.56,.12,.20,.73)],{eyebrow:'MEDIA LIBRARY',subtitle:'Xem thư viện tư liệu đầy đủ'}),
    section('contact','Liên hệ & Booking','',
      [],{eyebrow:'HỢP TÁC NGHỆ SĨ',highlights:['Điện thoại / Zalo: 0788-699-241','Email: latrinh111@gmail.com','Mạng xã hội: Facebook']}),
    section('quote','Trân trọng cảm ơn',
      'Cảm ơn Quý đối tác đã dành thời gian theo dõi.',
      [crop(.19,.05,.39,.91)],{eyebrow:'LA TRINH / THANK YOU'})
  ]
}

export function identifyArtistLayout(filename='') {
  const safe=String(filename).normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase()
  if(safe.includes('long') && safe.includes('nhat'))return {key:'long-nhat',template:longNhat}
  if(safe.includes('ludance')||safe.includes('ngoc tram'))return {key:'ludance',template:ludance}
  if(safe.includes('la trinh'))return {key:'la-trinh',template:laTrinh}
  return null
}

const normalizeCrop=photo=>({
 x:Math.max(0,Math.min(1,Number(photo.x)||0)),
 y:Math.max(0,Math.min(1,Number(photo.y)||0)),
 w:Math.max(.05,Math.min(1,Number(photo.w)||.4)),
 h:Math.max(.05,Math.min(1,Number(photo.h)||.7))
})

export function normalizeArtistSection(row={}) {
  const layouts=['cover','biography','feature','stats','gallery','awards','list','media','quote','contact']
  return {
    page:Math.max(1,Number(row.page)||1),
    layout:layouts.includes(row.layout)?row.layout:'feature',
    title:String(row.title||'').slice(0,240),
    eyebrow:String(row.eyebrow||'').slice(0,160),
    subtitle:String(row.subtitle||'').slice(0,280),
    body:String(row.body||'').slice(0,14000),
    kind:row.kind||'editorial',
    highlights:Array.isArray(row.highlights)?row.highlights.map(s=>String(s).slice(0,240)).slice(0,24):[],
    metrics:Array.isArray(row.metrics)?row.metrics.filter(x=>Array.isArray(x)).map(x=>[String(x[0]||'').slice(0,40),String(x[1]||'').slice(0,100)]).slice(0,12):[],
    links:Array.isArray(row.links)?row.links.slice(0,6):[],
    photos:Array.isArray(row.photos)?row.photos.map(normalizeCrop).slice(0,8):[],
    media:Array.isArray(row.media)?row.media.filter(x=>x&&typeof x.url==='string').slice(0,8):[],
    image_url:row.image_url||null,
    image_storage_path:row.image_storage_path||null
  }
}

export function designArtistPdf(parsed,filename){
  const found=identifyArtistLayout(filename)
  if(!found)return {
    ...parsed,theme:'pearl',
    sections:(parsed.sections||[]).map((s,i)=>normalizeArtistSection({
      ...s,layout:i===0?'cover':s.body?.trim()?'feature':'gallery',photos:[],
      eyebrow:'TRANG '+String(i+1).padStart(2,'0')
    }))
  }
  const {key,template}=found
  if(template.sections.length!==parsed.page_count) {
    // Don't guess which original pages were inserted or removed.
    return designArtistPdf(parsed,'unknown-portfolio.pdf')
  }
  return {
    ...parsed,name:template.name,role:template.role,
    tagline:template.tagline,theme:template.theme,designKey:key,
    intro:template.intro,
    sections:template.sections.map((section,i)=>normalizeArtistSection({
      ...section,page:i+1,
      // Curated text is used when the PDF contains flattened text; otherwise
      // retain selectable source text only if no curated transcription exists.
      body:section.body||parsed.sections[i]?.body||'',
      kind:parsed.sections[i]?.kind||'editorial'
    }))
  }
}

export const ARTIST_LAYOUT_OPTIONS=[
 ['cover','Ảnh bìa / Hero'],['biography','Tiểu sử / Biography'],
 ['feature','Giới thiệu / Ảnh + chữ'],['stats','Thống kê nổi bật'],
 ['gallery','Bộ sưu tập ảnh'],['awards','Giải thưởng / Timeline'],
 ['list','Danh sách / Chuyên môn'],['media','Video / Media'],
 ['quote','Trích dẫn / Cảm ơn'],['contact','Liên hệ / Booking'],
]
