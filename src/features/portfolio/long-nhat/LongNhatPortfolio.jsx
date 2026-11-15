import React,{useEffect,useMemo,useState} from 'react'
import {UiButton,UiPanel,UiStatus} from '../../../shared/ui'
import {PORTFOLIO_REQUIREMENTS} from './data'
import {websiteFromArtist,ARTIST_WEBSITE_SECTIONS,LONG_NHAT_SLUG,
  LONG_NHAT_TEMPLATE_STATUS} from './websiteModel'
import './long-nhat-site.css'

/** Public URL intentionally stays unpublished until the approval gate is met. */
export function PortfolioUnpublished(){
  return <main className="ui-public-notice">
    <p>DORTIS / ARTIST WEBSITE</p>
    <h1>Website nghệ sĩ đang được chuẩn bị.</h1>
    <p>Phiên bản giới thiệu riêng chưa được phê duyệt để phát hành.
      Hồ sơ công khai hiện có vẫn được giữ tại khu vực nghệ sĩ của DORTIS.</p>
    <a href="/artists">Xem các hồ sơ nghệ sĩ đã công khai</a>
  </main>
}

function useLongNhatSource(supabase){
  const [data,setData]=useState({loading:true,profile:null,source:null,error:''})
  const [refresh,setRefresh]=useState(0)
  useEffect(()=>{
    if(!supabase){setData({loading:false,profile:null,source:null,error:'Chưa kết nối Supabase.'});return}
    let active=true
    async function read(){
      const {data:profile,error}=await supabase.from('artist_profiles')
        .select('id,slug,name,role,tagline,intro,sections,cover_image_url,status,updated_at')
        .eq('slug',LONG_NHAT_SLUG).maybeSingle()
      if(!active)return
      if(error){setData({loading:false,profile:null,source:null,error:error.message});return}
      if(!profile){setData({loading:false,profile:null,source:null,error:''});return}
      // Only source metadata. Original private PDF never enters public or preview DOM.
      const result=await supabase.from('artist_profile_sources')
        .select('original_filename,page_count')
        .eq('profile_id',profile.id).maybeSingle()
      if(!active)return
      setData({loading:false,profile,source:result.data||null,
        error:result.error?'Không đọc được thông tin PDF nguồn: '+result.error.message:''})
    }
    read()
    return ()=>{active=false}
  },[supabase,refresh])
  return {...data,reload:()=>{setData(prev=>({...prev,loading:true}));setRefresh(x=>x+1)}}
}

function GalleryLightbox({images,index,onClose,onSelect}){
  useEffect(()=>{
    const onKey=event=>{
      if(event.key==='Escape')onClose()
      if(event.key==='ArrowLeft')onSelect((index-1+images.length)%images.length)
      if(event.key==='ArrowRight')onSelect((index+1)%images.length)
    }
    document.addEventListener('keydown',onKey)
    return ()=>document.removeEventListener('keydown',onKey)
  },[images.length,index,onClose,onSelect])
  const photo=images[index]
  if(!photo)return null
  return <div className="ln-lightbox" role="presentation" onClick={onClose}>
    <section className="ln-lightbox__dialog" role="dialog" aria-modal="true"
      aria-label="Xem ảnh nghệ sĩ" onClick={event=>event.stopPropagation()}>
      <header><span>{index+1} / {images.length} · {photo.caption}</span>
        <button type="button" onClick={onClose} aria-label="Đóng ảnh">×</button></header>
      <img src={photo.src} alt={photo.alt||photo.caption||'Ảnh trong Portfolio'} />
      <footer>
        <button type="button" onClick={()=>onSelect((index-1+images.length)%images.length)}>← Trước</button>
        <button type="button" onClick={()=>onSelect((index+1)%images.length)}>Tiếp →</button>
      </footer>
    </section>
  </div>
}
function SectionHeading({number,eyebrow,title,detail}){
  return <div className="ln-section-heading">
    <span>{number} / {eyebrow}</span>
    <h2>{title}</h2>
    {detail&&<p>{detail}</p>}
  </div>
}
function RealArtistWebsite({view,mode,device}){
  const [openPhoto,setOpenPhoto]=useState(-1)
  const title=view.name||'Long Nhật'
  const hero=view.heroPhoto
  const hasMedia=view.photos.length>0
  const hasMoments=view.performances.length>0
  return <div className={'ln-preview-frame ln-preview-frame--'+device}>
    <div className={'ln-site ln-site--'+mode} id="long-nhat-website-preview">
      <header className="ln-site-nav">
        <a href="#ln-home" className="ln-site-nav__brand">{title}<span>.</span></a>
        <nav aria-label="Điều hướng website nghệ sĩ">
          {view.bio&&<a href="#ln-about">Giới thiệu</a>}
          {hasMoments&&<a href="#ln-moments">Biểu diễn</a>}
          {hasMedia&&<a href="#ln-gallery">Hình ảnh</a>}
        </nav>
        <a className="ln-site-nav__epk" href="#ln-about">PROFILE ↗</a>
      </header>
      <section id="ln-home" className={'ln-hero'+(!hero?' ln-hero--no-photo':'')}>
        <div className="ln-hero__copy">
          <span className="ln-kicker">ARTIST / PERSONAL WEBSITE</span>
          <p className="ln-hero__role">{view.role||'Nghệ sĩ'}</p>
          <h1>{title}</h1>
          {view.tagline&&<p className="ln-hero__tagline">{view.tagline}</p>}
          <a className="ln-site-cta" href={hasMedia?'#ln-gallery':'#ln-about'}>
            {hasMedia?'Khám phá hình ảnh':'Khám phá hồ sơ'} <span>↗</span>
          </a>
          <span className="ln-hero__index">01 / ARTIST WEBSITE</span>
        </div>
        <div className="ln-hero__visual">
          {hero?<img src={hero} alt={view.heroAlt||'Ảnh chân dung trong Portfolio nghệ sĩ'}
            loading="eager" decoding="async"/>:
            <div className="ln-hero__asset-pending">ẢNH CHÂN DUNG ĐANG CHỜ BỔ SUNG</div>}
          <span className="ln-hero__visual-label">PORTFOLIO / 01</span>
        </div>
      </section>
      {view.bio&&<section id="ln-about" className="ln-section ln-about">
        <SectionHeading number="02" eyebrow="THE ARTIST" title="Câu chuyện nghệ sĩ."
          detail="Nội dung lấy từ Portfolio đang quản lý."/>
        <div className="ln-about__body">
          <p>{view.bio}</p>
          {view.photos[1]&&<img src={view.photos[1].src}
            alt={view.photos[1].alt||'Tư liệu hình ảnh trong Portfolio'} loading="lazy"/>}
        </div>
      </section>}
      {view.performance&&<section id="ln-performance" className="ln-section ln-performance">
        <SectionHeading number="03" eyebrow="PERFORMANCE" title="Không gian biểu diễn."/>
        <div className="ln-performance__grid">
          <span className="ln-performance__number">03<span>/ 08</span></span>
          <p>{view.performance}</p>
        </div>
      </section>}
      {hasMoments&&<section id="ln-moments" className="ln-section ln-moments">
        <SectionHeading number="04" eyebrow="SELECTED MOMENTS" title="Những khung hình trên sân khấu."/>
        <div className="ln-moments__grid">{view.performances.map(moment=>
          <article className="ln-moment" key={moment.id}>
            {moment.photos[0]?<img src={moment.photos[0].src}
              alt={moment.photos[0].alt||moment.title} loading="lazy"/>:
              <div className="ln-moment__placeholder">MEDIA PENDING</div>}
            <div><span>PORTFOLIO / {String(moment.id).padStart(2,'0')}</span>
              <h3>{moment.title}</h3>{moment.subtitle&&<p>{moment.subtitle}</p>}</div>
          </article>)}</div>
      </section>}
      {view.videos.length>0&&<section className="ln-section" id="ln-video">
        <SectionHeading number="05" eyebrow="VIDEO & MUSIC" title="Xem và nghe."/>
        <div className="ln-video-links">{view.videos.map((video,i)=>
          <a key={video.url} href={video.url} rel="noopener noreferrer" target="_blank">
            <span>{String(i+1).padStart(2,'0')}</span>{video.title||'Video chính thức'} ↗</a>)}</div>
      </section>}
      {hasMedia&&<section id="ln-gallery" className="ln-section ln-gallery">
        <SectionHeading number="06" eyebrow="GALLERY" title="Những khoảnh khắc."
          detail="Nhấn vào ảnh để xem toàn màn hình."/>
        <div className="ln-gallery__grid">
          {view.photos.slice(0,12).map((photo,index)=><button key={photo.src} type="button"
            className={'ln-gallery__item ln-gallery__item--'+(index%5)}
            onClick={()=>setOpenPhoto(index)}
            aria-label={'Xem ảnh '+(index+1)+': '+(photo.caption||'Portfolio')}>
            <img src={photo.src} alt={photo.alt||photo.caption||'Hình ảnh nghệ sĩ'} loading="lazy"/>
            <span>{String(index+1).padStart(2,'0')} / VIEW ↗</span>
          </button>)}
        </div>
      </section>}
      <footer className="ln-site-footer">
        <span>ARTIST WEBSITE / INTERNAL DESIGN PREVIEW</span>
        <strong>{title}<span>.</span></strong>
        <small>Website riêng chưa được duyệt xuất bản. Kênh booking và tài liệu EPK chỉ
          xuất hiện sau khi có xác nhận cho phép công khai.</small>
      </footer>
      {openPhoto>=0&&<GalleryLightbox images={view.photos.slice(0,12)} index={openPhoto}
        onClose={()=>setOpenPhoto(-1)} onSelect={setOpenPhoto}/>}
    </div>
  </div>
}

function ApprovalChecklist({source,view}){
  const items=[
    {title:'PDF Portfolio 8 trang',status:source?'Đã nhận trong Supabase':'Chưa thấy PDF nguồn',
      note:source?source.original_filename+' · '+(source.page_count||'?')+' trang; chưa audit trực quan từng trang.':
        'Cần PDF/PPTX nguồn đầy đủ'},
    {title:'Nội dung và thành tích',status:'Cần xác minh',note:'Các đoạn chữ từ hồ sơ hiện có chưa đối chiếu chứng cứ cho từng claim.'},
    {title:'Ảnh & quyền sử dụng',status:'Cần duyệt',note:view.photoCount+' ảnh đã nhập; cần đối chiếu file gốc, quyền công khai và mô tả.'},
    {title:'Visual DNA riêng',status:'Chưa duyệt',note:'Chưa trích HEX, font và nguyên lý bố cục từ PDF bằng phân tích từng trang.'},
    {title:'Video / kênh chính thức',status:view.videos.length?'Cần kiểm tra link':'Chưa cấu hình',
      note:'Không tự hiển thị ảnh như một video hoặc tạo link phát giả.'},
    {title:'Booking công khai',status:'Chưa cấu hình',note:'Chưa có email/Zalo/điện thoại được xác nhận công khai.'},
    {title:'Phê duyệt phát hành web',status:'Chưa phê duyệt',
      note:'Hồ sơ artist_profiles có thể đã public; website nghệ sĩ mới vẫn chưa được phê duyệt.'}
  ]
  return <UiPanel title="Đối chiếu brief & điều kiện phát hành"
    subtitle="DORTIS-LNS-WEB-001 · trạng thái bản dựng thử · không đồng nghĩa đã duyệt nội dung">
    <div className="ln-audit-grid">{items.map((item,i)=><div className="ln-audit-item" key={i}>
      <span className="ln-audit-item__number">{String(i+1).padStart(2,'0')}</span>
      <div><strong>{item.title}</strong><p>{item.note}</p></div>
      <UiStatus>{item.status}</UiStatus>
    </div>)}</div>
    <p className="ln-audit-footer">Vẫn cần phân tích đủ 8 trang PDF nguyên bản và xin xác nhận
      nhận diện, asset, claim và kênh booking trước khi phát hành website này.</p>
  </UiPanel>
}

export default function LongNhatPortfolio({supabase,onBack,onEdit}){
  const [mode,setMode]=useState('quick')
  const [device,setDevice]=useState('desktop')
  const [panel,setPanel]=useState('preview')
  const {loading,profile,source,error,reload}=useLongNhatSource(supabase)
  const view=useMemo(()=>websiteFromArtist(profile),[profile])
  return <main className="ln-studio">
    <header className="ln-studio__header">
      <div>
        <button type="button" className="ln-studio__back" onClick={onBack}>
          ← Trở về Hồ sơ nghệ sĩ</button>
        <div className="ln-studio__eyebrow">DORTIS / ARTIST WEBSITE / DORTIS-LNS-WEB-001</div>
        <h1>Website Long Nhật Singer<span>.</span></h1>
        <p>Bản dựng riêng từ dữ liệu Portfolio đang lưu. Đây là môi trường
          xem trước của Admin, không phải thiết kế đã phê duyệt.</p>
      </div>
      <div className="ln-studio__header-actions">
        <UiStatus>CHƯA PHÊ DUYỆT WEB</UiStatus>
        <UiButton variant="secondary" onClick={reload}>Cập nhật dữ liệu</UiButton>
        <UiButton variant="primary" onClick={onEdit}>Chỉnh sửa hồ sơ nguồn</UiButton>
      </div>
    </header>
    <div className="ln-studio__controls">
      <div className="ln-studio__tabs" role="group" aria-label="Chế độ website">
        <button type="button" className={mode==='quick'?'is-active':''}
          aria-pressed={mode==='quick'} onClick={()=>setMode('quick')}>Quick Portfolio / EPK</button>
        <button type="button" className={mode==='journey'?'is-active':''}
          aria-pressed={mode==='journey'} onClick={()=>setMode('journey')}>Immersive Journey</button>
      </div>
      <div className="ln-studio__tabs" role="group" aria-label="Kích thước xem trước">
        <button type="button" className={device==='desktop'?'is-active':''}
          aria-pressed={device==='desktop'} onClick={()=>setDevice('desktop')}>Desktop</button>
        <button type="button" className={device==='mobile'?'is-active':''}
          aria-pressed={device==='mobile'} onClick={()=>setDevice('mobile')}>Mobile</button>
      </div>
      <div className="ln-studio__tabs" role="group" aria-label="Xem trước hoặc kiểm tra">
        <button type="button" className={panel==='preview'?'is-active':''}
          onClick={()=>setPanel('preview')}>Xem website</button>
        <button type="button" className={panel==='audit'?'is-active':''}
          onClick={()=>setPanel('audit')}>Dữ liệu cần duyệt</button>
      </div>
    </div>
    {error&&<p role="alert" className="ln-studio__error">{error}</p>}
    {loading?<div className="ln-studio__loading" role="status">Đang lấy Portfolio từ Supabase...</div>:
    !view?<UiPanel title="Chưa có hồ sơ Long Nhật trong hệ thống"
      subtitle="Tạo hoặc nhập hồ sơ nghệ sĩ trước khi xem trước website từ dữ liệu nguồn.">
      <UiButton onClick={onBack}>Quay về thư viện Portfolio</UiButton>
    </UiPanel>:
    panel==='audit'?<ApprovalChecklist source={source} view={view}/>:
      <div className="ln-studio__canvas">
        <div className="ln-studio__canvas-header">
          <div><span className="ln-studio__canvas-dot"/><strong>LIVE COMPONENT PREVIEW</strong>
            <span>Desktop / Mobile · {view.pageCount} trang · {view.photoCount} ảnh</span></div>
          <span>PROVISIONAL / ADMIN ONLY</span>
        </div>
        <RealArtistWebsite key={mode+'-'+device} view={view} mode={mode} device={device}/>
      </div>}
    <footer className="ln-studio__bottom">
      <span>Brief DORTIS-LNS-WEB-001 · 15/11/2026 · Bản nội bộ</span>
      <span>Không có link booking giả, không xuất bản tự động, không đổi hồ sơ công khai hiện tại.</span>
    </footer>
  </main>
}
