import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import LiquidRibbons from './LiquidRibbons'
import AdminPage, { useSiteImages } from './AdminPage'
import './style.css'
import './cax.css'
import { CaxHeroDeck, CaxArtistExperience, CaxBrandValues, CaxFinalFan } from './CaxExperience'
import CircularServiceCarousel from './CircularServiceCarousel'

const navItems = [['top', 'Trang chủ'], ['dich-vu', 'Dịch vụ'], ['du-an', 'Dự án'], ['trai-nghiem', 'Trải nghiệm'], ['ve-dortis', 'Về DORTIS'], ['lien-he', 'Liên hệ']]
const services = [
  { number: '01', title: 'CV & Portfolio', english: 'ARTIST IDENTITY', description: 'Một hồ sơ chỉn chu, nơi giọng hát, cá tính và những cột mốc được kể theo cách riêng.', symbol: '01 — PORTFOLIO', style: 'cv' },
  { number: '02', title: 'Xây dựng thương hiệu', english: 'PERSONAL BRANDING', description: 'Định hình bản sắc riêng và tạo nên một hình ảnh nghệ sĩ nhất quán, có chiều sâu.', symbol: 'DORTIS / DT', style: 'brand' },
  { number: '03', title: 'Thiết kế truyền thông', english: 'VISUAL COMMUNICATION', description: 'Thiết kế hình ảnh, ấn phẩm và chất liệu truyền thông cho mỗi hành trình nghệ thuật.', symbol: 'CREATE / FEEL', style: 'visual' },
  { number: '04', title: 'Website nghệ sĩ', english: 'DIGITAL PRESENCE', description: 'Một điểm đến số đầy cảm xúc, nơi công chúng có thể khám phá thế giới nghệ sĩ.', symbol: 'WWW / DORTIS', style: 'web' },
]
const faqs = [
  ['Dortis là gì?', 'Dortis là studio sáng tạo giúp nghệ sĩ định hình hình ảnh chuyên nghiệp, bản sắc và không gian số riêng.'],
  ['Dortis có những dịch vụ nào?', 'Dortis cung cấp CV & Portfolio, Artist Branding, thiết kế truyền thông và website nghệ sĩ.'],
  ['Quick EPK khác Explore Mode thế nào?', 'Quick EPK cho phép xem ngay thông tin cần thiết; Explore Mode kể hành trình theo các chương. Trải nghiệm hiện tại là mô phỏng ý tưởng.'],
  ['Có thể xem PDF khách hàng công khai không?', 'Dortis chỉ công bố case study và tài liệu khi có quyền sử dụng công khai rõ ràng. Portfolio gốc của khách hàng không được mở mặc định.'],
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
    <svg className="brand-wordmark brand-wordmark-svg" viewBox="0 0 261 76" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">
      <path fill="#315be8" fillRule="evenodd" d="M15 10 H35 C47 10 55 19 55 33 C55 49 46 57 35 57 H15 Z M21 13 V54 H29 C42 54 48 45 48 33 C48 20 41 13 29 13 Z"/>
      <path fill="#182238" fillRule="evenodd" d="M85 9 C71 9 62 19 62 33 C62 49 71 59 85 59 C100 59 108 48 108 33 C108 19 100 9 85 9 Z M85 12 C74 12 69 21 69 33 C69 45 75 55 85 55 C95 55 101 46 101 33 C101 21 95 12 85 12 Z"/>
      <path fill="#182238" fillRule="evenodd" d="M116 10 V57 H123 V36 H126 C134 36 138 44 146 55 C153 66 162 70 171 70 C175 70 181 68 184 64 C177 67 171 67 166 65 C160 63 155 58 149 48 C143 40 140 36 136 34 C143 30 146 25 146 21 C146 14 142 10 134 10 Z M123 13 H132 C137 13 140 16 140 22 C140 29 135 33 130 33 H123 Z"/>
      <path fill="#008f91" d="M152 10 H186 V13 H172 V57 H165 V13 H152 Z"/>
      <path fill="#182238" d="M194 10 H201 V57 H194 Z"/>
      <path fill="#f17b48" d="M229 9 C217 8 210 13 210 22 C210 30 217 32 229 38 C236 42 238 46 234 51 C231 55 224 56 219 54 C214 52 212 48 210 46 V53 C214 57 221 59 229 58 C238 57 242 51 242 43 C242 34 234 31 222 25 C215 21 216 16 221 13 C227 10 233 14 237 19 V12 C235 11 232 10 229 9 Z"/>
    </svg>
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
        /* one-shot reveal: do not hide already viewed content */
      })
    }, { threshold: .08, rootMargin: '0px 0px -8% 0px' })
    nodes.forEach(n => obs.observe(n))
    return () => obs.disconnect()
  }, [dep])
}
function App() {
  const { siteImages } = useSiteImages()
  const [menuOpen, setMenuOpen] = useState(false)
  const [active, setActive] = useState('top')
  const [scrollRatio, setScrollRatio] = useState(0)
  useReveals('dortis-cax-v14')
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
      <a className="header-contact" href="/admin" onClick={() => setMenuOpen(false)} aria-label="Đăng nhập quản trị Dortis">ĐĂNG NHẬP <Arrow /></a>
      <button className="menu-toggle" aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? '✕' : '☰'}</button>
    </header>

    <main>
      <section id="top" className="cax-hero scene-section">
        <div className="hero-rainbow" aria-hidden="true"/>
        <LiquidRibbons className="hero-liquid"/>
        <div className="cax-hero-grid">
          <div className="cax-hero-copy">
            <p className="cax-kicker">✳ DORTIS — CREATIVE ARTIST STUDIO / EST. 2026</p>
            <h1>Chúng tôi giúp <span className="cobalt">nghệ sĩ</span> xây dựng hình ảnh <span className="teal">chuyên nghiệp</span> và lan tỏa <span className="ember">dấu ấn riêng.</span></h1>
            <p className="cax-lead">Nơi bản sắc được định hình, câu chuyện được kể bằng cảm xúc và mỗi nghệ sĩ có một không gian riêng để tỏa sáng.</p>
            <div className="cax-hero-actions"><a href="#dich-vu" className="button-dark">KHÁM PHÁ DỊCH VỤ <Arrow /></a><a href="#trai-nghiem" className="button-outline">TRẢI NGHIỆM THỬ <Arrow /></a></div>
            <p className="cax-hero-bottomline">ART. IDENTITY. EMOTION. &nbsp; — &nbsp; EVERY ARTIST HAS A STORY.</p>
          </div><CaxHeroDeck images={siteImages}/>
        </div>
      </section>

      <section id="dich-vu" className="cax-services-section section-shell scene-section">
        <header className="cax-section-head"><div><p className="cax-kicker">02 / OUR EXPERTISE</p><h2>Mỗi câu chuyện.<br/><em>Một ngôn ngữ riêng.</em></h2></div><p>Từ bước định hình bản sắc đến những điểm chạm truyền thông, Dortis biến ý tưởng thành trải nghiệm sáng tạo có chiều sâu.</p></header>
        <CircularServiceCarousel services={services} images={siteImages} />
        <p className="cax-service-hint">Kéo trái/phải để xoay vòng liên tục. Tối đa 5 thẻ hiển thị trên desktop và 10 ảnh có thể được quản lý trong Admin. Thẻ không có ảnh sử dụng bản mô phỏng giao diện.</p>
      </section>

      <section id="du-an" className="cax-selected-work scene-section">
        <div className="section-shell">
          <header className="cax-section-head"><div><p className="cax-kicker">03 / SELECTED CREATIVE WORK</p><h2>Cảm hứng <em>thành hình.</em></h2></div><p>Những dự án sáng tạo được chọn lọc và cho phép công bố sẽ xuất hiện tại đây.</p></header>
          <div className="cax-project-placeholder"><div><strong>Những câu chuyện<br/>đang được chọn lọc.</strong><p>Các hồ sơ và PDF gốc của khách hàng không được công khai khi chưa có quyền sử dụng rõ ràng. Dự án sẽ được giới thiệu bằng ảnh bìa và nội dung đã duyệt.</p></div><span>PUBLIC GALLERY / COMING SOON</span></div>
        </div>
      </section>

      <CaxArtistExperience />

      <section id="ve-dortis" className="manifesto-section scene-section">
        <div className="manifesto-halo" aria-hidden="true"/>{siteImages.about ? <img className="about-custom-image" src={siteImages.about} alt="" loading="lazy"/> : <div className="manifesto-glass" aria-hidden="true"/>}
        <div className="manifesto-content section-shell" data-reveal><SectionMark number="05" label="THE DORTIS PHILOSOPHY"/><p className="manifesto-kicker">ĐẰNG SAU MỌI ÁNH ĐÈN SÂN KHẤU</p><h2>Một nghệ sĩ không chỉ có <em>âm nhạc.</em><br/>Họ có một <strong>câu chuyện</strong> xứng đáng được nhìn thấy.</h2><div className="manifesto-bottom"><p>Chúng tôi tin rằng một hình ảnh đẹp bắt đầu bằng sự thấu hiểu. Dortis giúp biến tinh thần và câu chuyện riêng của mỗi nghệ sĩ thành dấu ấn bền vững.</p><span>CREATIVITY WITH PURPOSE / DORTIS</span></div></div>
      </section>

      <CaxBrandValues />

      <section className="faq-section section-shell scene-section"><div data-reveal className="faq-heading"><SectionMark number="07" label="FREQUENTLY ASKED QUESTIONS" /><h2>Một vài điều<br/><em>bạn muốn biết.</em></h2></div><div className="faq-list">{faqs.map(([q, a], index) => <details data-reveal key={q} style={{ '--reveal-delay': index * 65 + 'ms' }}><summary><span>{String(index + 1).padStart(2, '0')}</span>{q}<span className="faq-plus">+</span></summary><p>{a}</p></details>)}</div></section>

      <section id="lien-he" className="cax-contact scene-section">
        <div className="cax-contact-layout section-shell">
          <div className="cax-contact-copy"><p className="cax-kicker">08 / THE NEXT CREATIVE CHAPTER</p><h2>Cùng tạo nên<br/><em>dấu ấn của bạn.</em></h2><p>Từ một ý tưởng nhỏ đến hình ảnh nghệ sĩ trọn vẹn — Dortis sẵn sàng cho những kết nối sáng tạo. Khám phá những dịch vụ hiện đang được giới thiệu.</p><a href="#dich-vu" className="button-dark">KHÁM PHÁ DỊCH VỤ <Arrow /></a></div>
          <CaxFinalFan imageUrl={siteImages.contact}/>
        </div>
      </section>

          </main>
    <footer className="footer section-shell"><div className="footer-top"><a href="#top"><Brand /></a><p>Chúng tôi giúp nghệ sĩ xây dựng hình ảnh chuyên nghiệp và lan tỏa dấu ấn riêng.</p><a href="#top" className="back-to-top">VỀ ĐẦU TRANG ↑</a></div><div className="footer-bottom"><span>© 2026 DORTIS. MADE FOR ARTISTS.</span><span>ART · IDENTITY · EMOTION</span><a href="/admin" aria-label="Đăng nhập quản trị Dortis">QUẢN TRỊ</a></div></footer>

  </div>
}
createRoot(document.getElementById('root')).render(location.pathname.startsWith('/admin') ? <AdminPage /> : <App />)
