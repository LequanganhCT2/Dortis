import React,{useEffect,useState} from 'react'
import AdminMediaEditor from '../../AdminMediaEditor'
import AdminArtistProfiles from '../../AdminArtistProfiles'
import PortfolioTemplateManager from '../portfolio/templates/PortfolioTemplateManager'
import {Brand} from '../../SiteHeader'
import {MEDIA_GROUPS} from '../media/config/mediaGroups'
import {portfolioCounts} from '../artists/domain/portfolioFilters'
import {ROUTES,resolveAdminView} from '../../app/routes'
import {clientNavigate,NAVIGATION_EVENT} from '../../app/navigation'
import {UiButton,UiPanel,UiStatus} from '../../shared/ui'
import './admin-workspace.css'

const MAIN_NAV=[
  {href:ROUTES.admin,title:'Dashboard',icon:'dashboard',view:'overview'},
  {href:ROUTES.media+'?section=hero',title:'Website DORTIS',icon:'website',view:'media'},
  {href:ROUTES.artists,title:'Hồ sơ nghệ sĩ',icon:'artist',view:'artists'}
]
const ICONS={
  dashboard:<><rect x="2.5" y="2.5" width="7" height="7" rx="1.5"/><rect x="12.5" y="2.5" width="7" height="7" rx="1.5"/><rect x="2.5" y="12.5" width="7" height="7" rx="1.5"/><rect x="12.5" y="12.5" width="7" height="7" rx="1.5"/></>,
  website:<><rect x="2" y="3" width="20" height="18" rx="2"/><path d="M2 9h20M9 9v12"/></>,
  artist:<><rect x="3" y="2.5" width="18" height="19" rx="2"/><circle cx="12" cy="9" r="3"/><path d="M6.5 18c.7-4.1 10.3-4.1 11 0"/></>,
  outside:<><path d="M13 5h6v6M19 5l-9 9"/><path d="M19 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"/></>,
  logout:<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></>,
  menu:<><path d="M3 6h18M3 12h18M3 18h18"/></>,
  close:<><path d="M5 5l14 14M19 5L5 19"/></>,
  chevron:<><path d="m9 18 6-6-6-6"/></>
}
function Icon({name,size=18}){
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{ICONS[name]||ICONS.chevron}</svg>
}
function sectionFromQuery(search){
  const value=new URLSearchParams(search).get('section')||'hero'
  return MEDIA_GROUPS.some(item=>item.id===value)?value:'hero'
}
function usePortfolioOverview(supabase){
  const [data,setData]=useState({loading:true,rows:[]})
  useEffect(()=>{
    let active=true
    supabase.from('artist_profiles').select('id,name,role,slug,status,updated_at')
      .order('updated_at',{ascending:false}).then(({data,error})=>{
        if(active)setData({loading:false,rows:error?[]:data||[],error:error?.message||''})
      })
    return ()=>{active=false}
  },[supabase])
  return data
}
function Dashboard({supabase,navigate}){
  const {rows,loading,error}=usePortfolioOverview(supabase)
  const {total,published}=portfolioCounts(rows)
  return <main className="ui-admin-dashboard ui-admin-dashboard--v4">
    <header className="ui-admin-dashboard__intro">
      <span className="ui-workspace-eyebrow">DORTIS STUDIO / CONTROL CENTER</span>
      <h1>Xin chào, Admin<span>.</span></h1>
      <p>Quản lý website và toàn bộ Portfolio nghệ sĩ trong một không gian làm việc.</p>
    </header>
    <div className="ui-admin-v4-switch" aria-label="Chọn khu vực quản lý">
      <button type="button" className="ui-admin-v4-destination ui-admin-v4-destination--web"
        onClick={()=>navigate(ROUTES.media+'?section=hero')}>
        <span className="ui-admin-v4-destination__icon"><Icon name="website" size={25}/></span>
        <span className="ui-admin-v4-destination__kind">01 / WEBSITE</span>
        <strong>Quản lý Website</strong>
        <span>Hero, dịch vụ, dự án và nội dung trang chủ DORTIS.</span>
        <span className="ui-admin-v4-destination__action">Mở trình chỉnh sửa <Icon name="chevron" size={16}/></span>
      </button>
      <button type="button" className="ui-admin-v4-destination ui-admin-v4-destination--artists"
        onClick={()=>navigate(ROUTES.artists)}>
        <span className="ui-admin-v4-destination__icon"><Icon name="artist" size={25}/></span>
        <span className="ui-admin-v4-destination__kind">02 / PORTFOLIO</span>
        <strong>Hồ sơ nghệ sĩ</strong>
        <span>Xem, nhập PDF, chỉnh sửa và quản lý xuất bản.</span>
        <span className="ui-admin-v4-destination__action">Xem tất cả Portfolio <Icon name="chevron" size={16}/></span>
      </button>
    </div>
    <div className="ui-admin-v4-dashboard-grid">
      <UiPanel title="Chỉnh sửa website nhanh" subtitle="Truy cập thẳng đến khu vực cần thay đổi.">
        <div className="ui-admin-v4-shortcuts">{MEDIA_GROUPS.slice(0,6).map(group=><button
          key={group.id} type="button" onClick={()=>navigate(ROUTES.media+'?section='+group.id)}>
          <span>{group.title}</span><Icon name="chevron" size={16}/></button>)}</div>
      </UiPanel>
      <UiPanel title="Portfolio trong hệ thống"
        subtitle={loading?'Đang cập nhật dữ liệu...':error?'Không tải được dữ liệu Portfolio':total+' Portfolio · '+published+' đã xuất bản'}
        action={<UiButton variant="secondary" onClick={()=>navigate(ROUTES.artists)}>Tất cả</UiButton>}>
        {rows.some(row=>row.slug==='long-nhat')&&<div className="ui-admin-v4-template-link">
          <span>Thiết kế Portfolio dùng chung cho nhiều nghệ sĩ</span>
          <button type="button" onClick={()=>navigate(ROUTES.templates+'?artist=long-nhat')}>
            Chọn form cho Long Nhật ↗
          </button>
        </div>}
        {rows.length?<div className="ui-admin-v4-recent">{rows.slice(0,4).map(row=>
          <button type="button" key={row.id} onClick={()=>navigate(ROUTES.artists)}>
            <span className="ui-admin-v4-recent__avatar">{(row.name||'D').slice(0,1).toUpperCase()}</span>
            <span><strong>{row.name}</strong><small>{row.role||'Nghệ sĩ'}</small></span>
            <UiStatus tone={row.status==='published'?'success':'neutral'}>{row.status==='published'?'Công khai':'Bản nháp'}</UiStatus>
          </button>)}</div>:
          <p className="ui-admin-v4-empty">{loading?'Đang tải danh sách...':'Chưa có Portfolio để hiển thị.'}</p>}
      </UiPanel>
      <button type="button" className="ui-admin-v4-destination ui-admin-v4-destination--artists"
        onClick={()=>navigate(ROUTES.templates)}>
        <span className="ui-admin-v4-destination__kind">03 / REUSABLE PORTFOLIO</span>
        <strong>Thư viện mẫu Portfolio</strong>
        <span>3 form nền · Nhiều nghệ sĩ dùng chung bố cục, ảnh và chữ riêng biệt.</span>
        <span className="ui-admin-v4-destination__action">Quản lý mẫu ↗</span>
      </button>
    </div>
  </main>
}
function SidebarLink({href,active,onClick,icon,children}){
  return <a href={href} className={'ui-admin-v4-navlink'+(active?' is-active':'')}
    aria-current={active?'page':undefined} onClick={event=>onClick(event,href)}>
    {icon&&<Icon name={icon}/>}<span>{children}</span>{active&&<Icon name="chevron" size={14}/>}
  </a>
}
export default function AdminWorkspace({user,supabase,onSignOut}){
  const [routeValue,setRouteValue]=useState(()=>window.location.pathname+window.location.search)
  const [mobileNav,setMobileNav]=useState(false)
  useEffect(()=>{
    const onRoute=()=>{setRouteValue(window.location.pathname+window.location.search);setMobileNav(false)}
    window.addEventListener(NAVIGATION_EVENT,onRoute)
    window.addEventListener('popstate',onRoute)
    return ()=>{
      window.removeEventListener(NAVIGATION_EVENT,onRoute)
      window.removeEventListener('popstate',onRoute)
    }
  },[])
  const url=new URL(routeValue,window.location.origin)
  const view=resolveAdminView(url.pathname)
  const section=sectionFromQuery(url.search)
  const navigate=href=>{
    if(href===routeValue){setMobileNav(false);return}
    clientNavigate(href)
    setRouteValue(window.location.pathname+window.location.search)
    setMobileNav(false)
    window.scrollTo({top:0,behavior:'instant'})
  }
  const navigateLink=(event,href)=>{
    if(event.defaultPrevented||event.button!==0||event.metaKey||
      event.ctrlKey||event.shiftKey||event.altKey)return
    event.preventDefault()
    navigate(href)
  }
  const pageTitle=view==='overview'?'Dashboard':view==='artists'?'Hồ sơ nghệ sĩ':
    view==='templates'?'Thư viện mẫu Portfolio':
    MEDIA_GROUPS.find(item=>item.id===section)?.title||'Chỉnh sửa Website'
  return <div className="ui-admin-workspace dortis-admin-v4">
    {mobileNav&&<button type="button" className="ui-admin-v4-backdrop"
      aria-label="Đóng menu quản trị" onClick={()=>setMobileNav(false)}/>}
    <aside className={'ui-admin-v4-sidebar'+(mobileNav?' is-open':'')} aria-label="Thanh điều hướng quản trị">
      <a href={ROUTES.admin} className="ui-admin-v4-brand" onClick={event=>navigateLink(event,ROUTES.admin)}>
        <Brand/><span>ADMIN WORKSPACE</span>
      </a>
      <div className="ui-admin-v4-sidebar__scroll">
        <p className="ui-admin-v4-navlabel">TỔNG QUAN</p>
        <SidebarLink href={ROUTES.admin} icon="dashboard" active={view==='overview'} onClick={navigateLink}>Dashboard</SidebarLink>
        <p className="ui-admin-v4-navlabel">KHÔNG GIAN QUẢN LÝ</p>
        <SidebarLink href={ROUTES.media+'?section=hero'} icon="website" active={view==='media'} onClick={navigateLink}>Website DORTIS</SidebarLink>
        <SidebarLink href={ROUTES.artists} icon="artist"
          active={view==='artists'} onClick={navigateLink}>Hồ sơ nghệ sĩ</SidebarLink>
        <SidebarLink href={ROUTES.templates} icon="website"
          active={view==='templates'} onClick={navigateLink}>Mẫu Portfolio</SidebarLink>
        {view==='media'&&<div className="ui-admin-v4-subnav" aria-label="Chỉnh sửa nhanh website">
          <p className="ui-admin-v4-navlabel">CHỈNH SỬA NHANH</p>
          {MEDIA_GROUPS.map(group=>{
            const href=ROUTES.media+'?section='+encodeURIComponent(group.id)
            return <SidebarLink key={group.id} href={href} active={section===group.id}
              onClick={navigateLink}>{group.title}</SidebarLink>
          })}
        </div>}
        {(view==='artists'||view==='templates')&&<div className="ui-admin-v4-subnav"
          aria-label="Thiết kế dùng chung">
          <p className="ui-admin-v4-navlabel">FORM PORTFOLIO</p>
          <SidebarLink href={ROUTES.templates} active={view==='templates'}
            onClick={navigateLink}>Thư viện mẫu & kế thừa</SidebarLink>
        </div>}
      </div>
      <div className="ui-admin-v4-sidebar__footer">
        <a href="/" target="_blank" rel="noreferrer"><Icon name="outside"/> Xem website</a>
        <button type="button" onClick={onSignOut}><Icon name="logout"/> Đăng xuất</button>
        <span className="ui-admin-v4-admininfo">DORTIS · QUẢN TRỊ VIÊN</span>
      </div>
    </aside>
    <div className="ui-admin-v4-main">
      <header className="ui-admin-v4-topbar">
        <button type="button" className="ui-admin-v4-menu" onClick={()=>setMobileNav(v=>!v)}
          aria-label={mobileNav?'Đóng menu':'Mở menu quản trị'} aria-expanded={mobileNav}>
          <Icon name={mobileNav?'close':'menu'}/>
        </button>
        <div className="ui-admin-v4-breadcrumb"><span>DORTIS</span><Icon name="chevron" size={13}/>
          <strong>{pageTitle}</strong></div>
        <div className="ui-admin-v4-topbar__actions">
          <span className="ui-admin-v4-account"><span className="ui-admin-v4-account__avatar">A</span> Admin</span>
          <a href="/" target="_blank" rel="noreferrer" aria-label="Xem website công khai"><Icon name="outside" size={17}/></a>
        </div>
      </header>
      <div className="ui-admin-workspace__content" key={view}>
        {view==='overview'?<Dashboard supabase={supabase} navigate={navigate}/>:
          view==='media'?<AdminMediaEditor user={user} supabase={supabase}
            initialSection={section} onSectionChange={()=>setRouteValue(window.location.pathname+window.location.search)}/>:
          view==='templates'?<PortfolioTemplateManager supabase={supabase} user={user}
            initialArtistSlug={new URLSearchParams(url.search).get('artist')||''}
            initialInstanceId={new URLSearchParams(url.search).get('edit')||''}
            onArtistList={()=>navigate(ROUTES.artists)}/>:
          <AdminArtistProfiles user={user} supabase={supabase}
            initialSlug={new URLSearchParams(url.search).get('select')||''}/>}
      </div>
    </div>
  </div>
}
