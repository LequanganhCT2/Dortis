import React,{lazy,Suspense,useEffect,useRef,useState,useTransition} from 'react'
import DortisHome from '../pages/DortisHome'
import {resolveRoute} from './routes'
import {clientNavigate,internalUrl,isPlainInternalLink,NAVIGATION_EVENT,navigationPath} from './navigation'
import './route-transition.css'

// Home is bundled synchronously so a first visit never waits on a route chunk.
// Private and artist routes are loaded only when needed.
const loadAdmin=()=>import('../AdminPage')
const loadArtists=()=>import('../ArtistPages')
const AdminPage=lazy(loadAdmin)
const ArtistPages=lazy(loadArtists)
const PortfolioUnpublished=lazy(()=>import('../features/portfolio/long-nhat/LongNhatPortfolio')
  .then(mod=>({default:mod.PortfolioUnpublished})))

const currentLocation=()=>navigationPath(new URL(window.location.href))

class RouteErrorBoundary extends React.Component{
  constructor(props){super(props);this.state={error:null}}
  static getDerivedStateFromError(error){return {error}}
  componentDidUpdate(previous){
    if(previous.routeKey!==this.props.routeKey&&this.state.error)this.setState({error:null})
  }
  render(){
    if(this.state.error)return <main className="dortis-route-message" role="alert">
      <p>DORTIS / CONNECTION</p><h1>Không thể mở trang này.</h1>
      <p>Trình duyệt chưa tải được phần giao diện cần thiết. Hãy thử tải lại.</p>
      <button type="button" onClick={()=>window.location.reload()}>TẢI LẠI TRANG ↗</button>
    </main>
    return this.props.children
  }
}

function NotFound(){
  return <main className="dortis-route-message">
    <p>DORTIS / 404</p><h1>Trang không tồn tại.</h1>
    <a href="/">Trở về DORTIS</a>
  </main>
}
function RouteFallback(){
  // Direct navigation to a private route can need its bundle; no full-screen
  // white placeholder is shown for the public Homepage.
  return <main className="dortis-route-message" role="status" aria-live="polite">
    <p>DORTIS / WORKSPACE</p><h1>Đang mở trang...</h1>
  </main>
}

export default function AppRouter(){
  const [locationValue,setLocationValue]=useState(currentLocation)
  const [,startTransition]=useTransition()
  const restoreScroll=useRef(false)

  useEffect(()=>{
    const sync=event=>{
      restoreScroll.current=event?.type==='popstate'
      startTransition(()=>setLocationValue(currentLocation()))
    }
    const click=event=>{
      const anchor=event.target instanceof Element ? event.target.closest('a[href]') : null
      if(!isPlainInternalLink(event,anchor))return
      const next=internalUrl(anchor.getAttribute('href'),window.location.href)
      if(!next)return
      event.preventDefault()
      clientNavigate(next.href)
    }
    // Warming the destination chunk on pointer/focus makes transitions feel
    // immediate without downloading private-editor code for every guest.
    const prefetch=event=>{
      const anchor=event.target instanceof Element?event.target.closest('a[href]'):null
      const destination=anchor&&internalUrl(anchor.getAttribute('href'),window.location.href)
      if(!destination)return
      if(destination.pathname.startsWith('/admin'))loadAdmin().catch(()=>{})
      else if(destination.pathname.startsWith('/artists'))loadArtists().catch(()=>{})
    }
    window.addEventListener(NAVIGATION_EVENT,sync)
    window.addEventListener('popstate',sync)
    document.addEventListener('click',click)
    document.addEventListener('pointerover',prefetch,{passive:true})
    document.addEventListener('focusin',prefetch)
    return ()=>{
      window.removeEventListener(NAVIGATION_EVENT,sync)
      window.removeEventListener('popstate',sync)
      document.removeEventListener('click',click)
      document.removeEventListener('pointerover',prefetch)
      document.removeEventListener('focusin',prefetch)
    }
  },[])

  useEffect(()=>{
    if(restoreScroll.current){restoreScroll.current=false;return}
    let next
    try{next=new URL(locationValue,window.location.origin)}catch{return}
    const frame=window.requestAnimationFrame(()=>{
      const fragment=next.hash.slice(1)
      let target=null
      try{target=fragment?document.getElementById(decodeURIComponent(fragment)):null}catch{}
      if(target)target.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'})
      else if(!fragment)window.scrollTo({top:0,behavior:'instant'})
    })
    return ()=>window.cancelAnimationFrame(frame)
  },[locationValue])

  const url=new URL(locationValue,window.location.origin)
  const route=resolveRoute(url.pathname)
  const routeKey=route==='artists'?url.pathname:route
  let Screen=NotFound
  if(route==='home')Screen=DortisHome
  else if(route==='admin')Screen=AdminPage
  else if(route==='artists')Screen=ArtistPages
  else if(route==='portfolio-unpublished')Screen=PortfolioUnpublished

  return <RouteErrorBoundary routeKey={routeKey}>
    <Suspense fallback={<RouteFallback/>}>
      <div className="dortis-route-stage" key={routeKey}><Screen/></div>
    </Suspense>
  </RouteErrorBoundary>
}
