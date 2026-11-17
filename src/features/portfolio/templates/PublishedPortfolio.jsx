import React,{useEffect,useState} from 'react'
import {supabase} from '../../../infrastructure/supabase/client'
import {canManageContent} from '../../../core/auth/roles'
import {clientNavigate} from '../../../app/navigation'
import PortfolioTemplateSite from './PortfolioTemplateSite'
import './template-admin.css'

const BUCKET='dortis-artist-web-drafts'

/**
 * Public website always mounts the same renderer as Admin. A publication
 * update must re-hydrate it when returning to this tab, not keep an old
 * snapshot loaded once at mount time.
 */
export default function PublishedPortfolio(){
  const id=window.location.pathname.split('/')[2]
  const [publication,setPublication]=useState(null)
  const [publishedAt,setPublishedAt]=useState('')
  const [urls,setUrls]=useState({})
  const [admin,setAdmin]=useState(null)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [mobile,setMobile]=useState(()=>window.matchMedia('(max-width: 680px)').matches)

  useEffect(()=>{
    const media=window.matchMedia('(max-width: 680px)')
    const change=event=>setMobile(event.matches)
    media.addEventListener('change',change)
    return ()=>media.removeEventListener('change',change)
  },[])

  useEffect(()=>{
    if(!supabase)return
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>{
      const user=session?.user
      setAdmin(canManageContent(user)?user:null)
    })
    return ()=>subscription.unsubscribe()
  },[])

  useEffect(()=>{
    let active=true
    let requestSequence=0
    let lastRefresh=0
    async function load(initial=false){
      const sequence=++requestSequence
      if(initial){setLoading(true);setError('')}
      try{
        if(!supabase)throw new Error('Chưa cấu hình Supabase.')
        const {data,error:readError}=await supabase.from('artist_portfolio_publications')
          .select('snapshot,image_paths,published_at').eq('instance_id',id).maybeSingle()
        if(readError)throw readError
        if(!data)throw new Error('Website chưa được xuất bản hoặc đã được gỡ.')
        let images={}
        const imagePaths=Array.isArray(data.image_paths)?data.image_paths:[]
        if(imagePaths.length){
          const {data:signed,error:signError}=await supabase.storage.from(BUCKET)
            .createSignedUrls(imagePaths,3600)
          if(signError)throw signError
          images=Object.fromEntries((signed||[]).filter(image=>image.signedUrl)
            .map(image=>[image.path,image.signedUrl]))
        }
        if(active&&sequence===requestSequence){
          setPublication(data.snapshot)
          setPublishedAt(data.published_at||'')
          setUrls(images)
          setError(Object.keys(images).length!==imagePaths.length?
            'Một số ảnh chưa tải được. Hãy tải lại trang.':'')
        }
      }catch(e){
        if(active&&sequence===requestSequence){
          if(initial){setPublication(null);setUrls({})}
          setError(e.message)
        }
      }
      finally{if(active&&sequence===requestSequence)setLoading(false)}
    }
    function refreshOnReturn(){
      if(document.visibilityState==='hidden')return
      const now=Date.now()
      if(now-lastRefresh<1200)return
      lastRefresh=now
      void load(false)
    }
    void load(true)
    // The live website can remain open in a second tab while Admin publishes.
    // Refetch the published snapshot when that tab comes back into view.
    window.addEventListener('focus',refreshOnReturn)
    window.addEventListener('pageshow',refreshOnReturn)
    document.addEventListener('visibilitychange',refreshOnReturn)
    return ()=>{
      active=false
      requestSequence++
      window.removeEventListener('focus',refreshOnReturn)
      window.removeEventListener('pageshow',refreshOnReturn)
      document.removeEventListener('visibilitychange',refreshOnReturn)
    }
  },[id])

  function editWebsite(){
    if(!admin)return
    clientNavigate('/admin/templates?edit='+encodeURIComponent(id))
  }

  // The published snapshot is authoritative: preserve its theme, speed,
  // positions and photo paths without needing private draft access.
  const view=publication?.view
  const templateSlug=publication?.templateSlug||
    (view?.visualTheme==='silk-flow'?'silk-flow':undefined)
  const publishedTemplate=templateSlug?{slug:templateSlug}:undefined
  const content=publication?{
    scenes:publication.scenes||{},
    positions:publication.positions||{},
    typography:publication.typography||{},
    revealSpeed:view?.revealSpeed
  }:null
  return <div className="pt-published">
    {admin&&publication&&<div className="pt-published__toolbar">
      <button type="button" className="pt-btn" onClick={editWebsite}>
        Chỉnh sửa website
      </button>
    </div>}
    {error&&<p className="pt-alert" role="alert">{error}</p>}
    {loading&&<p role="status">Đang tải portfolio…</p>}
    {!loading&&publication&&<PortfolioTemplateSite
      key={id+':'+publishedAt}
      publishedView={view} template={publishedTemplate}
      instance={{content}} urls={urls}
      device={mobile?'mobile':'desktop'}/>}
  </div>
}
