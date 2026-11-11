import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import LiquidRibbons from './LiquidRibbons'
import AdminPage, { useSiteImages, supabase } from './AdminPage'
import SiteHeader, { Brand } from './SiteHeader'
import {useSiteContent,copyFor} from './siteContent'
import './style.css'
import './cax.css'
import './philosophy.css'
import './values-3d.css'
import { CaxHeroDeck, CaxArtistExperience, CaxBrandValues, CaxFinalFan } from './CaxExperience'
import CircularServiceCarousel from './CircularServiceCarousel'
import PhilosophyStoryCard from './PhilosophyStoryCard'
import DortisFAQ from './DortisFAQ'
import { getMediaUrls, RotatingImage, MediaOpacityProvider } from './SiteMedia'
import CaxHeroCopy from './CaxHeroCopy'
import ArtistPages from './ArtistPages'

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
  const { siteImages, siteGalleries, siteOpacities } = useSiteImages()
  const siteContent=useSiteContent(supabase)
  const heroCopy=copyFor(siteContent,'hero')
  const servicesCopy=copyFor(siteContent,'services')
  const projectsCopy=copyFor(siteContent,'projects')
  const aboutCopy=copyFor(siteContent,'about')
  const contactCopy=copyFor(siteContent,'contact')
  const shownServices=services.map(service=>{
    const copy=copyFor(siteContent,'service-'+service.style)
    return {...service,title:copy.title,english:copy.subtitle,description:copy.description,archived:copy.archived===true}
  }).filter(service=>!service.archived)
  const visibleProjects=['project-approved-01','project-approved-02','project-approved-03']
    .filter(slot=>copyFor(siteContent,slot).archived!==true)
  const shownFaqs=faqs.map(([q,a],i)=>{
    const copy=copyFor(siteContent,'faq')
    return [copy['question'+(i+1)]??q,copy['answer'+(i+1)]??a]
  })
  const [scrollRatio, setScrollRatio] = useState(0)
  useReveals('dortis-cax-v14')
  useEffect(() => {
    let frame = 0
    const sync = () => {
      frame = 0
      const root = document.documentElement
      setScrollRatio(Math.min(1, window.scrollY / Math.max(root.scrollHeight - window.innerHeight, 1)))
    }
    const handle = () => { if (!frame) frame = window.requestAnimationFrame(sync) }
    window.addEventListener('scroll', handle, { passive: true })
    window.addEventListener('resize', handle)
    sync()
    return () => { window.removeEventListener('scroll', handle); window.removeEventListener('resize', handle); cancelAnimationFrame(frame) }
  }, [])

  return <MediaOpacityProvider opacities={siteOpacities}><div className="dortis-site">
    <div className="scroll-progress" style={{ transform: 'scaleX(' + scrollRatio + ')' }} aria-hidden="true" />
    <SiteHeader />

    <main>
      <section id="top" className="cax-hero scene-section">
        <div className="hero-rainbow" aria-hidden="true"/>
        <LiquidRibbons className="hero-liquid"/>
        <div className="cax-hero-grid">
          <CaxHeroCopy content={siteContent}/><CaxHeroDeck images={siteImages} galleries={siteGalleries} content={siteContent}/>
        </div>
      </section>

      <section id="dich-vu" className="cax-services-section section-shell scene-section">
        <header className="cax-section-head"><div><p className="cax-kicker">{servicesCopy.kicker}</p><h2>{servicesCopy.heading}<br/><em>{servicesCopy.accent}</em></h2></div><p>{servicesCopy.description}</p></header>
        <CircularServiceCarousel services={shownServices} images={siteImages} galleries={siteGalleries} content={siteContent}/>
        <p className="cax-service-hint">{servicesCopy.hint}</p>
      </section>

      <section id="du-an" className="cax-selected-work scene-section">
        <div className="section-shell">
          <header className="cax-section-head"><div><p className="cax-kicker">{projectsCopy.kicker}</p><h2>{projectsCopy.heading} <em>{projectsCopy.accent}</em></h2></div><p>{projectsCopy.description}</p></header>
          {visibleProjects.some(slot=>getMediaUrls(siteImages,siteGalleries,slot).length) ?
            <div className="dortis-public-projects">
              {visibleProjects.map((slot,i)=>{
                const sources=getMediaUrls(siteImages,siteGalleries,slot)
                return sources.length ? <article className="dortis-public-project" key={slot}>
                  <div className="dortis-public-project-preview"><RotatingImage urls={sources}/></div>
                  <div className="dortis-public-project-body"><strong>{copyFor(siteContent,slot).title}</strong>
                    <p>{copyFor(siteContent,slot).description}</p></div>
                </article> : null
              })}
            </div> :
            <div className="cax-project-placeholder"><div><strong>{projectsCopy.emptyTitle}</strong><p>{projectsCopy.emptyDescription}</p></div><span>PUBLIC GALLERY / COMING SOON</span></div>}
        </div>
      </section>

      <CaxArtistExperience images={siteImages} galleries={siteGalleries} content={siteContent}/>

      <section id="ve-dortis" className="dortis-philosophy scene-section" aria-labelledby="dortis-philosophy-heading">
        <div className="dortis-philosophy-inner section-shell">
          <div className="dortis-philosophy-intro">
            <div className="dortis-philosophy-index"><span>05</span><span className="dortis-philosophy-index-line" aria-hidden="true" /><span>THE DORTIS PHILOSOPHY</span></div>
            <p className="dortis-philosophy-eyebrow">{aboutCopy.kicker}</p>
          </div>
          <div className="dortis-philosophy-main">
            <div className="dortis-philosophy-quote">
              <h2 id="dortis-philosophy-heading">
                {aboutCopy.heading1} <em>{aboutCopy.accent1}</em>
                <span className="dortis-philosophy-break" aria-hidden="true" />
                {aboutCopy.heading2} <strong>{aboutCopy.accent2}</strong> {aboutCopy.heading3}
              </h2>
              <p className="dortis-philosophy-lead">{aboutCopy.description}</p>
              <a className="dortis-philosophy-cta" href="#gia-tri">{aboutCopy.button} <span aria-hidden="true">↗</span></a>
            </div>
            <PhilosophyStoryCard imageUrls={getMediaUrls(siteImages,siteGalleries,'about')} content={siteContent}/>
          </div>
          <div className="dortis-philosophy-footer"><span>CREATIVITY WITH PURPOSE</span><span>EVERY ARTIST HAS A STORY.</span><span>DORTIS © 2026</span></div>
        </div>
      </section>

      <CaxBrandValues images={siteImages} galleries={siteGalleries} content={siteContent}/>

      <DortisFAQ items={shownFaqs} media={getMediaUrls(siteImages,siteGalleries,'faq')} content={siteContent}/>

      <section id="lien-he" className="cax-contact scene-section">
        <div className="cax-contact-layout section-shell">
          <div className="cax-contact-copy"><p className="cax-kicker">{contactCopy.kicker}</p><h2>{contactCopy.heading}<br/><em>{contactCopy.accent}</em></h2><p>{contactCopy.description}</p><a href="#dich-vu" className="button-dark">{contactCopy.button} <Arrow /></a></div>
          <CaxFinalFan imageUrls={getMediaUrls(siteImages,siteGalleries,'contact')} content={siteContent}/>
        </div>
      </section>

          </main>
    <footer className="footer section-shell"><div className="footer-top"><a href="#top"><Brand /></a><p>{contactCopy.footerDescription}</p><a href="#top" className="back-to-top">VỀ ĐẦU TRANG ↑</a></div><div className="footer-bottom"><span>© 2026 DORTIS. MADE FOR ARTISTS.</span><span>ART · IDENTITY · EMOTION</span><a href="/admin" aria-label="Đăng nhập quản trị Dortis">QUẢN TRỊ</a></div></footer>

  </div></MediaOpacityProvider>
}
createRoot(document.getElementById('root')).render(location.pathname.startsWith('/admin') ? <AdminPage/> : location.pathname.startsWith('/artists') ? <ArtistPages /> : <App />)
