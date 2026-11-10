import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import LiquidRibbons from './LiquidRibbons'
import './style.css'

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || 'https://whkqdusoowrrhtvejrie.supabase.co').replace(/\/+$/, '')
const PUBLIC_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''
const IS_DEMO = !PUBLIC_KEY
const demoArtists = [
  { id: 'demo-one', slug: 'lumi-demo', stage_name: 'LUMI', genre: 'Pop / R&B', location: 'TP. Hồ Chí Minh', biography: 'Hồ sơ minh họa giao diện Dortis. Nghệ sĩ và thông tin trong hồ sơ này không phải người có thật.', is_published: true, featured: true },
  { id: 'demo-two', slug: 'noir-demo', stage_name: 'NOIR', genre: 'Indie / Alternative', location: 'Hà Nội', biography: 'Hồ sơ minh họa giao diện Dortis. Nghệ sĩ và thông tin trong hồ sơ này không phải người có thật.', is_published: true, featured: true },
  { id: 'demo-three', slug: 'mira-demo', stage_name: 'MIRA', genre: 'Soul / Acoustic', location: 'Đà Nẵng', biography: 'Hồ sơ minh họa giao diện Dortis. Nghệ sĩ và thông tin trong hồ sơ này không phải người có thật.', is_published: true, featured: false },
]

const navItems = [['top', 'Trang chủ'], ['dich-vu', 'Dịch vụ'], ['du-an', 'Dự án'], ['nghe-si', 'Nghệ sĩ'], ['ve-dortis', 'Về chúng tôi'], ['lien-he', 'Liên hệ']]
const services = [
  { number: '01', title: 'CV & Portfolio', english: 'ARTIST IDENTITY', description: 'Một hồ sơ chỉn chu, nơi giọng hát, cá tính và những cột mốc được kể theo cách riêng.', symbol: '01 — PORTFOLIO', style: 'cv' },
  { number: '02', title: 'Xây dựng thương hiệu', english: 'PERSONAL BRANDING', description: 'Định hình bản sắc riêng và tạo nên một hình ảnh nghệ sĩ nhất quán, có chiều sâu.', symbol: 'DORTIS / DT', style: 'brand' },
  { number: '03', title: 'Thiết kế truyền thông', english: 'VISUAL COMMUNICATION', description: 'Thiết kế hình ảnh, ấn phẩm và chất liệu truyền thông cho mỗi hành trình nghệ thuật.', symbol: 'CREATE / FEEL', style: 'visual' },
  { number: '04', title: 'Website nghệ sĩ', english: 'DIGITAL PRESENCE', description: 'Một điểm đến số đầy cảm xúc, nơi công chúng có thể khám phá thế giới nghệ sĩ.', symbol: 'WWW / DORTIS', style: 'web' },
]
const works = [
  { number: '01', group: 'ARTIST PORTFOLIO', title: 'Một câu chuyện, một bản sắc.', subtitle: 'Thiết kế hồ sơ nghệ sĩ', style: 'work-portrait' },
  { number: '02', group: 'VISUAL DIRECTION', title: 'Nhìn âm nhạc qua một lăng kính khác.', subtitle: 'Ngôn ngữ thị giác', style: 'work-visual' },
  { number: '03', group: 'DIGITAL EXPERIENCE', title: 'Cảm xúc trong từng điểm chạm.', subtitle: 'Website & trải nghiệm số', style: 'work-digital' },
]
const faqs = [
  ['Dortis là gì?', 'Dortis là dự án sáng tạo giúp xây dựng hình ảnh chuyên nghiệp, giới thiệu hành trình và quản lý hồ sơ công khai của ca sĩ, nghệ sĩ.'],
  ['Dortis có những dịch vụ nào?', 'Dortis định hướng phát triển dịch vụ CV & Portfolio, xây dựng nhận diện cá nhân, thiết kế truyền thông và website nghệ sĩ.'],
  ['Có cần đăng nhập để xem hồ sơ nghệ sĩ không?', 'Không. Giai đoạn hiện tại tập trung vào trang chủ và các hồ sơ nghệ sĩ đã được công bố. Chức năng đăng nhập sẽ được phát triển sau.'],
  ['Thông tin nghệ sĩ được hiển thị từ đâu?', 'Khi cấu hình Supabase, trang chỉ đọc hồ sơ công khai từ cơ sở dữ liệu Dortis. Khi chưa cấu hình, giao diện hiển thị dữ liệu minh họa có gắn nhãn.'],
]
function Brand({ dark = false }) {
  const gradId = React.useId().replace(/:/g, '')
  return <span className={'brand ' + (dark ? 'brand--dark' : '')} aria-label="Dortis">
    <svg className="brand-dt-symbol" viewBox="55 8 860 655" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gradId + '-a'} x1="5%" y1="0%" x2="90%" y2="90%">
          <stop offset="0" stopColor="#315BE8"/><stop offset=".45" stopColor="#233C78"/><stop offset=".72" stopColor="#182238"/><stop offset="1" stopColor="#008F91"/>
        </linearGradient>
        <linearGradient id={gradId + '-b'} x1="0%" y1="90%" x2="95%" y2="5%">
          <stop offset="0" stopColor="#182238"/><stop offset=".28" stopColor="#14364C"/><stop offset=".63" stopColor="#008F91"/><stop offset="1" stopColor="#182238"/>
        </linearGradient>
        <linearGradient id={gradId + '-c'} x1="15%" y1="80%" x2="90%" y2="10%">
          <stop offset="0" stopColor="#315BE8"/><stop offset=".4" stopColor="#0D8592"/><stop offset=".75" stopColor="#182238"/><stop offset="1" stopColor="#008F91"/>
        </linearGradient>
        <linearGradient id={gradId + '-d'} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0" stopColor="#315BE8"/><stop offset=".43" stopColor="#0C8090"/><stop offset=".75" stopColor="#192941"/><stop offset="1" stopColor="#008F91"/>
        </linearGradient>
      </defs>
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M480 166 C438 95 324 43 217 51 C131 58 99 94 116 170 C129 219 180 284 214 350 C244 408 253 451 245 471" stroke={'url(#' + gradId + '-a)'} strokeWidth="27"/>
        <path d="M222 354 C156 421 101 479 99 543 C95 615 177 633 286 608 C424 574 544 451 520 260" stroke={'url(#' + gradId + '-b)'} strokeWidth="25"/>
        <path d="M219 356 C341 257 481 208 607 172 C676 153 729 148 762 136 C839 108 881 80 871 46 C864 18 830 25 802 48 C763 79 742 109 717 148" stroke={'url(#' + gradId + '-c)'} strokeWidth="23"/>
        <path d="M717 148 C683 223 650 326 626 431 C602 531 593 602 634 623 C685 648 699 545 688 453" stroke={'url(#' + gradId + '-d)'} strokeWidth="26"/>
      </g>
      <g fill="none" stroke="#fff" strokeWidth="5" opacity=".23" strokeLinecap="round">
        <path d="M133 121 C144 68 237 48 316 72"/><path d="M146 597 C250 635 406 568 475 456"/>
        <path d="M332 273 C467 198 596 163 701 150"/><path d="M844 39 C864 39 872 55 854 74"/>
        <path d="M641 466 C622 540 610 599 634 610"/>
      </g>
      <circle cx="239" cy="493" r="19" fill="#F17B48"/>
      <circle cx="684" cy="397" r="19" fill="#F17B48"/>
      <circle cx="838" cy="67" r="15" fill="#F17B48" stroke="#fff" strokeWidth="5" opacity=".94"/>
    </svg>
    <span className="brand-wordmark" aria-hidden="true">
      <span>D</span><span>O</span><span className="brand-r-letter">R<svg className="brand-r-tail" viewBox="0 0 115 42" preserveAspectRatio="none" focusable="false" aria-hidden="true"><path d="M4 4 C17 27 43 34 73 23 C91 17 106 7 112 3" fill="none" stroke="#182238" strokeWidth="3.8" strokeLinecap="round"/></svg></span><span>T</span><span>I</span><span>S</span>
    </span>
  </span>
}
function Arrow({ down = false }) { return <span aria-hidden="true" className="arrow">{down ? '↓' : '↗'}</span> }
function SectionMark({ number, label }) { return <p className="eyebrow"><span className="eyebrow-index">{number}</span><span className="eyebrow-line"/>{label}</p> }
function useReveals(dep) {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('[data-reveal]'))
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      nodes.forEach(node => node.classList.add('is-visible'))
      return
    }
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('is-visible')
        else if (entry.boundingClientRect.bottom < 0 || entry.boundingClientRect.top > window.innerHeight) entry.target.classList.remove('is-visible')
      })
    }, { threshold: .08, rootMargin: '0px 0px -8% 0px' })
    nodes.forEach(n => obs.observe(n))
    return () => obs.disconnect()
  }, [dep])
}
function ArtistCard({ artist, index, onSelect }) {
  return <button type="button" className={'artist-card artist-tone-' + (index % 4)} onClick={() => onSelect(artist)} data-reveal style={{ '--reveal-delay': (index % 3) * 95 + 'ms' }} aria-label={'Xem hồ sơ ' + artist.stage_name}>
    <span className="artist-media">
      {artist.avatar_url || artist.cover_url ? <img src={artist.avatar_url || artist.cover_url} alt={'Ảnh nghệ sĩ ' + artist.stage_name} loading="lazy" onError={e => { e.currentTarget.style.display = 'none' }} /> : <span className="artist-monogram" aria-hidden="true">{artist.stage_name.slice(0, 1)}</span>}
      <span className="artist-topline">{String(index + 1).padStart(2, '0')} / DORTIS</span>
      <span className="artist-toparrow"><Arrow /></span>
    </span>
    <span className="artist-info"><span><small>{artist.genre || 'ARTIST PROFILE'}</small><strong>{artist.stage_name}</strong><em>{artist.location || 'Việt Nam'}</em></span><span className="artist-view">XEM HỒ SƠ <Arrow /></span></span>
  </button>
}
function ArtistDialog({ artist, onClose }) {
  useEffect(() => {
    if (!artist) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const key = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', key)
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', key) }
  }, [artist, onClose])
  if (!artist) return null
  return <div className="dialog-backdrop" onPointerDown={e => { if (e.target === e.currentTarget) onClose() }}>
    <section className="dialog" role="dialog" aria-modal="true" aria-label={'Hồ sơ nghệ sĩ ' + artist.stage_name}>
      <button className="dialog-close" type="button" onClick={onClose} aria-label="Đóng hồ sơ">✕</button>
      <SectionMark number="D / 01" label="ARTIST PROFILE" />
      <h2>{artist.stage_name}</h2><p className="dialog-style">{artist.genre || 'Ca sĩ / Nghệ sĩ'} · {artist.location || 'Việt Nam'}</p>
      {IS_DEMO && <p className="demo-pill">HỒ SƠ MINH HỌA — KHÔNG PHẢI NGHỆ SĨ THỰC</p>}
      <div className="dialog-separator"/><p className="dialog-bio">{artist.biography || 'Nghệ sĩ chưa cập nhật phần giới thiệu.'}</p>
      <p className="dialog-availability">Dortis / Nghệ sĩ & hành trình sáng tạo.</p>
    </section>
  </div>
}
function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [active, setActive] = useState('top')
  const [scrollRatio, setScrollRatio] = useState(0)
  const [artists, setArtists] = useState(IS_DEMO ? demoArtists : [])
  const [loading, setLoading] = useState(!IS_DEMO)
  const [error, setError] = useState('')
  const [keyword, setKeyword] = useState('')
  const [genre, setGenre] = useState('Tất cả')
  const [selected, setSelected] = useState(null)
  const [reload, setReload] = useState(0)
  const closeDialog = useCallback(() => setSelected(null), [])

  useEffect(() => {
    if (IS_DEMO) return
    const ac = new AbortController()
    setLoading(true); setError('')
    fetch(SUPABASE_URL + '/rest/v1/artists?select=*&is_published=eq.true&order=sort_order.asc,created_at.desc&limit=60', {
      headers: { apikey: PUBLIC_KEY, Accept: 'application/json' }, signal: ac.signal,
    }).then(async response => {
      if (!response.ok) {
        const details = await response.json().catch(() => ({}))
        throw new Error(details.message || 'Không thể tải hồ sơ (' + response.status + '). Kiểm tra cấu hình Supabase và RLS.')
      }
      return response.json()
    }).then(data => { if (!ac.signal.aborted) setArtists(data) })
      .catch(err => { if (!ac.signal.aborted) setError(err.message || 'Không thể tải dữ liệu.') })
      .finally(() => { if (!ac.signal.aborted) setLoading(false) })
    return () => ac.abort()
  }, [reload])

  const genres = useMemo(() => ['Tất cả', ...new Set(artists.map(a => a.genre).filter(Boolean))], [artists])
  const shownArtists = useMemo(() => artists.filter(a =>
    (genre === 'Tất cả' || a.genre === genre) &&
    (a.stage_name + ' ' + (a.genre || '') + ' ' + (a.location || '')).toLocaleLowerCase('vi').includes(keyword.trim().toLocaleLowerCase('vi'))
  ), [artists, genre, keyword])

  useReveals([artists.length, loading, error, keyword, genre].join(':'))

  useEffect(() => {
    let frame = 0
    const sync = () => {
      frame = 0
      const root = document.documentElement
      setScrollRatio(Math.min(1, window.scrollY / Math.max(root.scrollHeight - window.innerHeight, 1)))
      let current = 'top'
      for (const [id] of navItems) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top < window.innerHeight * .4) current = id
      }
      setActive(current)
    }
    const handle = () => { if (!frame) frame = window.requestAnimationFrame(sync) }
    window.addEventListener('scroll', handle, { passive: true })
    window.addEventListener('resize', handle)
    sync()
    return () => { window.removeEventListener('scroll', handle); window.removeEventListener('resize', handle); cancelAnimationFrame(frame) }
  }, [])

  return <div className="dortis-site">
    <div className="scroll-progress" style={{ transform: 'scaleX(' + scrollRatio + ')' }} aria-hidden="true" />
    <header className="site-header">
      <a href="#top" className="brand-link" onClick={() => setMenuOpen(false)}><Brand /></a>
      <nav aria-label="Điều hướng chính" className={'main-nav ' + (menuOpen ? 'menu-open' : '')}>
        {navItems.map(([id, text]) => <a href={'#' + id} key={id} className={active === id ? 'active' : ''} onClick={() => setMenuOpen(false)}>{text}</a>)}
      </nav>
      <a className="header-contact" href="#lien-he" onClick={() => setMenuOpen(false)}>HỢP TÁC <Arrow /></a>
      <button className="menu-toggle" aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? '✕' : '☰'}</button>
    </header>

    <main>
      <section id="top" className="hero scene-section">
        <div className="hero-rainbow" aria-hidden="true"/>
        <LiquidRibbons className="hero-liquid" />
        <div className="hero-dust hero-dust-one" aria-hidden="true"/><div className="hero-dust hero-dust-two" aria-hidden="true"/>
        <div className="hero-inner">
          <div className="hero-copy">
            <p className="hero-overline entrance entrance-one"><span className="overline-star">✳</span> DORTIS — CREATIVE ARTIST STUDIO <span>EST. 2026</span></p>
            <h1 className="entrance entrance-two">Chúng tôi giúp <span className="cobalt">nghệ sĩ</span> xây dựng hình ảnh <span className="teal">chuyên nghiệp</span> và lan tỏa <span className="ember">dấu ấn riêng.</span></h1>
            <p className="hero-lead entrance entrance-three">Nơi bản sắc được định hình, câu chuyện được kể bằng cảm xúc và mỗi nghệ sĩ có một không gian riêng để tỏa sáng.</p>
            <div className="hero-actions entrance entrance-four"><a href="#dich-vu" className="button-dark">KHÁM PHÁ DỊCH VỤ <Arrow /></a><a href="#du-an" className="button-outline">XEM DỰ ÁN <Arrow /></a></div>
            <div className="hero-bottomnote entrance entrance-five"><span>01 / 06</span><span className="small-rule"/><span>ART. IDENTITY. EMOTION.</span></div>
          </div>
          <aside className="hero-floating-label entrance entrance-four" aria-hidden="true"><span>DT / 2026</span><strong>Every artist<br/>has a story.</strong><span>BEYOND THE ORDINARY ↗</span></aside>
        </div>
        <a href="#dich-vu" className="hero-scroll">CUỘN ĐỂ KHÁM PHÁ <span>↓</span></a>
        <p className="hero-side-label">EXPRESS YOUR TRUE COLORS / DORTIS</p>
      </section>

      <div className="ticker" aria-label="Giá trị sáng tạo của Dortis"><div className="ticker-track" aria-hidden="true">
        {Array.from({ length: 2 }, (_, n) => <span key={n}>ARTIST IDENTITY <i>✦</i> VISUAL STORYTELLING <i>✦</i> CREATIVE DIRECTION <i>✦</i> DIGITAL EXPERIENCE <i>✦</i></span>)}
      </div></div>

      <section id="dich-vu" className="services-section section-shell scene-section">
        <div className="section-intro" data-reveal><SectionMark number="02" label="CHÚNG TÔI LÀM GÌ?" /><div className="section-intro-row"><h2>Mỗi câu chuyện.<br/><em>Một ngôn ngữ riêng.</em></h2><p>Từ bước định hình bản sắc đến những điểm chạm truyền thông. Dortis biến ý tưởng thành trải nghiệm nghệ thuật tinh tế và có chiều sâu.</p></div></div>
        <div className="services-grid">{services.map((service, index) => <article className={'service-card service-' + service.style} key={service.number} data-reveal style={{ '--reveal-delay': index * 85 + 'ms' }}>
          <div className="service-card-top"><span>{service.number} / SERVICE</span><span><Arrow /></span></div>
          <div className="service-art" aria-hidden="true"><span className="service-art-back"/><div className="service-art-frame"><span className="service-art-label">{service.symbol}</span><span className="service-art-glyph">{service.style === 'cv' ? 'A' : service.style === 'brand' ? 'Dt' : service.style === 'visual' ? '✳' : 'D.'}</span><span className="service-art-mini">DORTIS — EST. 2026</span></div></div>
          <div className="service-card-copy"><p>{service.english}</p><h3>{service.title}</h3><span>{service.description}</span></div>
        </article>)}</div>
      </section>

      <section id="du-an" className="works-section scene-section">
        <div className="works-header section-shell" data-reveal><SectionMark number="03" label="SELECTED CREATIVE WORK" /><div className="section-intro-row"><h2>Cảm hứng <em>thành hình.</em></h2><p>Những hướng thể hiện thị giác tiêu biểu cho tinh thần Dortis. Các hình bên dưới là concept minh họa, chưa phải dự án khách hàng thực tế.</p></div></div>
        <div className="works-grid section-shell">{works.map((work, index) => <article className={'work-card ' + work.style} key={work.number} data-reveal style={{ '--reveal-delay': index * 100 + 'ms' }}>
          <div className="work-media"><div className="work-media-glow"/><span className="work-watermark">{index === 0 ? 'D' : index === 1 ? '✧' : 'DT'}</span><div className="work-caption"><span>DORTIS CREATIVE</span><strong>{index === 0 ? 'The Artist' : index === 1 ? 'A New Vision' : 'Your Stage'}</strong><small>STUDY / 0{index + 1}</small></div><span className="work-tag">CONCEPT / MINH HỌA</span></div>
          <div className="work-info"><span>{work.number} / {work.group}</span><h3>{work.title}</h3><p>{work.subtitle}</p></div>
        </article>)}</div>
      </section>

      <section id="nghe-si" className="artists-section section-shell scene-section">
        <div className="section-intro" data-reveal><SectionMark number="04" label="ARTISTS / THE PEOPLE BEHIND THE SOUND" /><div className="section-intro-row"><h2>Những gương mặt.<br/><em>Những dấu ấn.</em></h2><p>Mỗi nghệ sĩ mang theo một màu sắc riêng. Khám phá những câu chuyện âm nhạc và hành trình sáng tạo tại Dortis.</p></div></div>
        {IS_DEMO && <div className="demo-banner" role="status">BẢN XEM TRƯỚC — Nghệ sĩ phía dưới là dữ liệu hư cấu để minh họa giao diện. Chưa có kết nối Supabase thực tế.</div>}
        <div className="artist-controls"><label className="artist-search"><span>⌕</span><input type="search" placeholder="Tìm nghệ sĩ, thể loại, khu vực..." value={keyword} onChange={e => setKeyword(e.target.value)}/></label><label className="artist-filter"><span>THỂ LOẠI</span><select value={genre} onChange={e => setGenre(e.target.value)}>{genres.map(g => <option key={g} value={g}>{g}</option>)}</select></label></div>
        {loading ? <p className="catalog-message" role="status">Đang tải dữ liệu nghệ sĩ...</p> : error ? <div className="catalog-message" role="alert">{error} <button type="button" onClick={() => setReload(v => v + 1)}>Thử lại ↗</button></div> : shownArtists.length === 0 ? <p className="catalog-message">{artists.length ? 'Không tìm thấy nghệ sĩ phù hợp.' : 'Chưa có nghệ sĩ công khai nào được công bố.'}</p> : <div className="artist-grid">{shownArtists.map((artist, index) => <ArtistCard artist={artist} index={index} key={artist.id} onSelect={setSelected} />)}</div>}
      </section>

      <section id="ve-dortis" className="manifesto-section scene-section">
        <div className="manifesto-halo" aria-hidden="true"/><div className="manifesto-glass" aria-hidden="true"/>
        <div className="manifesto-content section-shell" data-reveal><SectionMark number="05" label="THE DORTIS PHILOSOPHY"/><p className="manifesto-kicker">ĐẰNG SAU MỌI ÁNH ĐÈN SÂN KHẤU</p><h2>Một nghệ sĩ không chỉ có <em>âm nhạc.</em><br/>Họ có một <strong>câu chuyện</strong> xứng đáng được nhìn thấy.</h2><div className="manifesto-bottom"><p>Chúng tôi tin rằng một hình ảnh đẹp bắt đầu bằng sự thấu hiểu. Dortis giúp biến tinh thần và câu chuyện riêng của mỗi nghệ sĩ thành dấu ấn bền vững.</p><span>CREATIVITY WITH PURPOSE / DORTIS</span></div></div>
      </section>

      <section className="process-section section-shell scene-section"><div className="section-intro" data-reveal><SectionMark number="06" label="HOW WE CREATE"/><div className="section-intro-row"><h2>Từ cảm hứng<br/>đến <em>dấu ấn.</em></h2><p>Một hành trình tinh gọn, kết nối bản sắc cá nhân với trải nghiệm thị giác và không gian số.</p></div></div><div className="process-steps">{[['01', 'Lắng nghe', 'Bắt đầu từ câu chuyện, cá tính, âm nhạc và mục tiêu của nghệ sĩ.'], ['02', 'Định hình', 'Chọn ngôn ngữ hình ảnh, sắc độ và cảm xúc tạo nên nhận diện riêng.'], ['03', 'Sáng tạo', 'Chuyển hóa ý tưởng thành portfolio, truyền thông và trải nghiệm số.'], ['04', 'Lan tỏa', 'Đưa dấu ấn nghệ sĩ đến gần hơn với khán giả và các cơ hội mới.']].map(([n, title, description], index) => <article className="process-step" key={n} data-reveal style={{ '--reveal-delay': index * 90 + 'ms' }}><span className="process-num">{n}</span><div><h3>{title}</h3><p>{description}</p></div><span className="process-arrow">↗</span></article>)}</div></section>

      <section className="faq-section section-shell scene-section"><div data-reveal className="faq-heading"><SectionMark number="07" label="FREQUENTLY ASKED QUESTIONS" /><h2>Một vài điều<br/><em>bạn muốn biết.</em></h2></div><div className="faq-list">{faqs.map(([q, a], index) => <details data-reveal key={q} style={{ '--reveal-delay': index * 65 + 'ms' }}><summary><span>{String(index + 1).padStart(2, '0')}</span>{q}<span className="faq-plus">+</span></summary><p>{a}</p></details>)}</div></section>

      <section id="lien-he" className="contact-section scene-section"><div className="contact-aurora" aria-hidden="true"/><div className="contact-inner section-shell" data-reveal><SectionMark number="08" label="LET'S MAKE SOMETHING MEANINGFUL"/><h2>Cùng tạo nên<br/><em>dấu ấn của bạn.</em></h2><p>Từ một ý tưởng nhỏ đến hình ảnh nghệ sĩ trọn vẹn — Dortis sẵn sàng cho những kết nối sáng tạo. Thông tin liên hệ chính thức sẽ được cập nhật.</p><a href="#nghe-si" className="button-dark">KHÁM PHÁ HỒ SƠ NGHỆ SĨ <Arrow /></a><span className="contact-orb">✳</span></div></section>
    </main>
    <footer className="footer section-shell"><div className="footer-top"><a href="#top"><Brand /></a><p>Chúng tôi giúp nghệ sĩ xây dựng hình ảnh chuyên nghiệp và lan tỏa dấu ấn riêng.</p><a href="#top" className="back-to-top">VỀ ĐẦU TRANG ↑</a></div><div className="footer-bottom"><span>© 2026 DORTIS. MADE FOR ARTISTS.</span><span>ART · IDENTITY · EMOTION</span></div></footer>
    <ArtistDialog artist={selected} onClose={closeDialog}/>
  </div>
}
createRoot(document.getElementById('root')).render(<App />)
