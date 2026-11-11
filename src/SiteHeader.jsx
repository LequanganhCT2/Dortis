import React, { useEffect, useState } from 'react'
import './site-header.css'

export const DORTIS_NAV_ITEMS = [
  ['top','Trang chủ'],['dich-vu','Dịch vụ'],['du-an','Dự án'],
  ['trai-nghiem','Trải nghiệm'],['ve-dortis','Về DORTIS'],['lien-he','Liên hệ']
]

export function Brand({ dark = false }) {
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

export default function SiteHeader({ onAdminSignOut = null }) {
  const isAdmin = window.location.pathname.startsWith('/admin')
  const isHome=window.location.pathname==='/' || window.location.pathname==='/index.html'
  const [menuOpen,setMenuOpen]=useState(false)
  const [active,setActive]=useState(isHome?'top':window.location.pathname.startsWith('/artists')?'artists':'admin')
  useEffect(()=>{
    if(!isHome)return
    let frame=0
    const sync=()=>{
      frame=0
      let selected='top'
      for(const [id] of DORTIS_NAV_ITEMS){
        const el=document.getElementById(id)
        if(el&&el.getBoundingClientRect().top<window.innerHeight*.4) selected=id
      }
      setActive(selected)
    }
    const scroll=()=>{if(!frame)frame=window.requestAnimationFrame(sync)}
    window.addEventListener('scroll',scroll,{passive:true})
    window.addEventListener('resize',scroll)
    sync()
    return ()=>{
      window.removeEventListener('scroll',scroll)
      window.removeEventListener('resize',scroll)
      if(frame)window.cancelAnimationFrame(frame)
    }
  },[isHome])
  useEffect(()=>{
    const onEscape=event=>{if(event.key==='Escape')setMenuOpen(false)}
    window.addEventListener('keydown',onEscape)
    return ()=>window.removeEventListener('keydown',onEscape)
  },[])
  const href=id=>isHome?'#'+id:'/#'+id
  const close=()=>setMenuOpen(false)
  // Admin has only one visible header action. No brand, account label or navigation.
  if (isAdmin) return onAdminSignOut ? <header className="site-header dortis-shared-header dortis-admin-header" aria-label="Thanh công cụ quản trị">
    <button type="button" className="dortis-admin-logout" onClick={onAdminSignOut}>
      ĐĂNG XUẤT <span aria-hidden="true">↗</span>
    </button>
  </header> : null
  return <header className={'site-header dortis-shared-header'+(isHome?' dortis-home-header':'')}>
    <a href={href('top')} className="brand-link" onClick={close} aria-label="Dortis – về trang chủ">
      <Brand/>
    </a>
    <nav id="dortis-primary-navigation" aria-label="Điều hướng chính"
      className={'main-nav'+(menuOpen?' menu-open':'')}>
      {DORTIS_NAV_ITEMS.map(([id,title])=><a key={id} href={href(id)}
        className={active===id?'active':''} aria-current={active===id?'page':undefined}
        onClick={close}>{title}</a>)}
      <a href="/artists" className={active==='artists'?'active':''} onClick={close}
        aria-current={active==='artists'?'page':undefined}>Nghệ sĩ</a>
    </nav>
    <a className="header-contact" href="/admin" onClick={close}>
      ĐĂNG NHẬP <span className="arrow" aria-hidden="true">↗</span>
    </a>
    <button className="menu-toggle" type="button" aria-label={menuOpen?'Đóng menu':'Mở menu'}
      aria-controls="dortis-primary-navigation" aria-expanded={menuOpen}
      onClick={()=>setMenuOpen(v=>!v)}>{menuOpen?'✕':'☰'}</button>
  </header>
}
