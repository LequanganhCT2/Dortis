import React, { useEffect, useRef, useState } from 'react'
import AdminMediaEditor from '../../AdminMediaEditor'
import AdminArtistProfiles from '../../AdminArtistProfiles'
import LongNhatPortfolio from '../portfolio/long-nhat/LongNhatPortfolio'
import { Brand } from '../../SiteHeader'
import { MEDIA_GROUPS } from '../media/config/mediaGroups'
import { ROUTES, resolveAdminView } from '../../app/routes'
import { UiButton, UiNavLink, UiPanel, UiStatus } from '../../shared/ui'

const MAIN_NAV = [
  {href: ROUTES.admin, title:'Tổng quan',view:'overview'},
  {href: ROUTES.media+'?section=hero', title:'Chỉnh sửa website',view:'media'},
  {href: ROUTES.artists,title:'Hồ sơ nghệ sĩ',view:'artists'},
  {href: ROUTES.portfolio,title:'Portfolio Long Nhật',view:'portfolio'}
]

function normalizeSection(search) {
  const value=new URLSearchParams(search).get('section') || 'hero'
  return MEDIA_GROUPS.some(item=>item.id===value)?value:'hero'
}

function AdminDashboard({navigate}) {
  return <main className="ui-admin-dashboard">
    <header className="ui-admin-dashboard__intro">
      <p>DORTIS / ADMIN WORKSPACE</p>
      <h1>Quản trị nội dung.</h1>
      <p>Chọn khu vực để chỉnh nhanh, dùng lại những component đang phục vụ website công khai.
        Mọi nội dung nghệ sĩ chưa được duyệt đều được giữ trong không gian nội bộ.</p>
    </header>
    <div className="ui-admin-card-grid">
      <UiPanel title="Trang chủ DORTIS" subtitle="Nội dung, Hero, Media, dịch vụ và liên hệ."
        action={<UiStatus tone="success">Đang hoạt động</UiStatus>}>
        <UiButton onClick={()=>navigate(ROUTES.media+'?section=hero')}>Mở trình chỉnh sửa</UiButton>
      </UiPanel>
      <UiPanel title="Thư viện hồ sơ nghệ sĩ" subtitle="Quản lý tư liệu và chế độ xuất bản của các hồ sơ đang có.">
        <UiButton variant="secondary" onClick={()=>navigate(ROUTES.artists)}>Quản lý hồ sơ</UiButton>
      </UiPanel>
      <UiPanel title="Long Nhật Singer" subtitle="Khung Portfolio riêng, chờ Portfolio gốc và dữ liệu được duyệt."
        action={<UiStatus>CHƯA PHÁT HÀNH</UiStatus>}>
        <UiButton variant="secondary" onClick={()=>navigate(ROUTES.portfolio)}>Mở bản nháp</UiButton>
      </UiPanel>
    </div>
    <UiPanel title="Chỉnh sửa nhanh từng khu vực" subtitle="Không tải lại website khi chuyển khu vực.">
      <div className="ui-admin-quick-grid">{MEDIA_GROUPS.map(group=>
        <button key={group.id} type="button" className="ui-quick-action"
          onClick={()=>navigate(ROUTES.media+'?section='+encodeURIComponent(group.id))}>
          <strong>{group.title}</strong><span>Chỉnh sửa →</span>
        </button>)}</div>
    </UiPanel>
  </main>
}

export default function AdminWorkspace({user,supabase,onSignOut}) {
  const [routeValue,setRouteValue]=useState(()=>window.location.pathname+window.location.search)
  const [navbarHeight,setNavbarHeight]=useState(100)
  const navbarRef=useRef(null)
  useEffect(()=>{
    const handlePop=()=>setRouteValue(window.location.pathname+window.location.search)
    window.addEventListener('popstate',handlePop)
    return ()=>window.removeEventListener('popstate',handlePop)
  },[])
  useEffect(()=>{
    const node=navbarRef.current
    if(!node)return
    const measure=()=>setNavbarHeight(Math.ceil(node.getBoundingClientRect().height))
    measure()
    if(typeof ResizeObserver!=='undefined'){
      const observer=new ResizeObserver(measure);observer.observe(node)
      return ()=>observer.disconnect()
    }
    window.addEventListener('resize',measure)
    return ()=>window.removeEventListener('resize',measure)
  },[])
  const url=new URL(routeValue,window.location.origin)
  const view=resolveAdminView(url.pathname)
  const section=normalizeSection(url.search)
  const navigate=href=>{
    if(href===routeValue)return
    window.history.pushState({},'',href)
    setRouteValue(href)
    window.scrollTo({top:0,behavior:'instant'})
  }
  const onLink=(event,href)=>{
    if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey)return
    event.preventDefault()
    navigate(href)
  }
  return <div className="ui-admin-workspace"
    style={{'--admin-navbar-height':navbarHeight+'px'}}>
    <header className="ui-admin-navbar" ref={navbarRef}>
      <div className="ui-admin-navbar__main">
        <a className="ui-admin-navbar__brand" href={ROUTES.admin}
          onClick={event=>onLink(event,ROUTES.admin)} aria-label="DORTIS quản trị">
          <Brand/><span className="ui-admin-navbar__label">WORKSPACE <UiStatus>ADMIN</UiStatus></span>
        </a>
        <nav aria-label="Điều hướng quản trị" className="ui-admin-navbar__links">
          {MAIN_NAV.map(item=><UiNavLink key={item.href} href={item.href}
            active={item.view===view}
            onClick={event=>onLink(event,item.href)}>{item.title}</UiNavLink>)}
        </nav>
        <div className="ui-admin-navbar__actions">
          <a href="/" target="_blank" rel="noreferrer">Xem website ↗</a>
          <UiButton variant="ghost" onClick={onSignOut}>Đăng xuất</UiButton>
        </div>
      </div>
      {(view==='overview'||view==='media')&&<nav className="ui-admin-navbar__quick" aria-label="Chỉnh sửa nhanh">
        {MEDIA_GROUPS.map(item=>{
          const href=ROUTES.media+'?section='+encodeURIComponent(item.id)
          return <UiNavLink key={item.id} href={href}
            active={view==='media'&&section===item.id}
            onClick={event=>onLink(event,href)}>{item.title}</UiNavLink>
        })}
      </nav>}
    </header>
    <div className="ui-admin-workspace__content">
      {view==='overview'?<AdminDashboard navigate={navigate}/>:
        view==='media'?<AdminMediaEditor user={user} supabase={supabase} initialSection={section}
          onSectionChange={()=>setRouteValue(window.location.pathname+window.location.search)}/>:
        view==='artists'?<AdminArtistProfiles user={user} supabase={supabase}/>:
        <LongNhatPortfolio/>}
    </div>
  </div>
}
