import React,{useEffect,useRef,useState} from 'react'
import {supabase} from '../../../infrastructure/supabase/client'
import {canManageContent} from '../../../core/auth/roles'
import {clientNavigate} from '../../../app/navigation'
import PortfolioTemplateSite from './PortfolioTemplateSite'
import {withPublishedTitlePosition} from './publicTitlePosition'
import {lookupPublishedLayer,patchPublishedElement} from './publicElementStyle'
import InlinePortfolioInspector from './InlinePortfolioInspector'
import './template-admin.css'

const BUCKET='dortis-artist-web-drafts'

function measurePublicElement(element){
  const rect=element.getBoundingClientRect()
  const surface=element.querySelector('.pt-artboard__photo')||element
  const textNode=element.querySelector('.pt-artboard__text')||element
  const actual=window.getComputedStyle(textNode)
  const frame=window.getComputedStyle(element)
  const surfaceStyle=window.getComputedStyle(surface)
  const img=element.querySelector('img')
  const parentWidth=element.parentElement?.getBoundingClientRect().width||rect.width||1
  const fontSize=Number.parseFloat(actual.fontSize)||16
  const lineHeightPx=Number.parseFloat(actual.lineHeight)
  const borderWidth=Number.parseFloat(frame.borderTopWidth)||0
  const radius=Number.parseFloat(surfaceStyle.borderTopLeftRadius)||
    Number.parseFloat(frame.borderTopLeftRadius)||0
  return {
    rect:{top:rect.top,left:rect.left},
    metrics:{
      fontSize,fontFamily:actual.fontFamily,
      lineHeight:Number.isFinite(lineHeightPx)?lineHeightPx/fontSize:1.3,
      align:actual.textAlign||'left',
      weight:Number.parseFloat(actual.fontWeight)||500,
      spacing:Number.parseFloat(actual.letterSpacing)||0,
      color:actual.color,
      widthPct:Math.max(15,Math.min(100,rect.width/parentWidth*100)),
      widthPx:rect.width,heightPx:rect.height,
      radius,opacity:(Number.parseFloat(frame.opacity)||1)*100,
      borderWidth,borderColor:frame.borderTopColor,
      fit:img?window.getComputedStyle(img).objectFit:'cover'
    }
  }
}

/**
 * Public website always mounts the same renderer as Admin. A publication
 * update must re-hydrate it when returning to this tab, not keep an old
 * snapshot loaded once at mount time.
 */
export default function PublishedPortfolio(){
  const id=window.location.pathname.split('/')[2]
  const [publication,setPublication]=useState(null)
  const [saveState,setSaveState]=useState('')
  const [saveNotice,setSaveNotice]=useState('')
  const savingRef=useRef(false)
  const queuedEditsRef=useRef([])
  const flushingEditsRef=useRef(false)
  const [selection,setSelection]=useState(null)
  const [publishedAt,setPublishedAt]=useState('')
  const [replayKey,setReplayKey]=useState(0)
  const [reducedMotion,setReducedMotion]=useState(()=>
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false)
  const [urls,setUrls]=useState({})
  const [admin,setAdmin]=useState(null)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [mobile,setMobile]=useState(()=>window.matchMedia('(max-width: 680px)').matches)

  useEffect(()=>{
    const preference=window.matchMedia('(prefers-reduced-motion: reduce)')
    const update=event=>setReducedMotion(event.matches)
    preference.addEventListener?.('change',update)
    return ()=>preference.removeEventListener?.('change',update)
  },[])

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
      if(document.visibilityState==='hidden'||savingRef.current)return
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

  async function movePublishedTitle(sectionId,position){
    // Admin role is verified again inside publish_artist_portfolio (JWT + RLS).
    // Never allow ordinary visitors to write a public page.
    if(!admin||!publication||!supabase||savingRef.current)return
    if(!publication.view?.sections?.some(section=>section.id===sectionId))return
    const device=mobile?'mobile':'desktop'
    const previous=publication
    savingRef.current=true
    setSaveState('saving')
    setSaveNotice('Đang lưu vị trí tiêu đề…')
    // Immediate local feedback: title stays where the user dropped it.
    setPublication(current=>withPublishedTitlePosition(current,sectionId,device,position))
    try{
      // Read the latest draft/revision and published snapshot so only the
      // title moves. Do not overwrite other Admin changes or artist data.
      const [draftResult,publicResult]=await Promise.all([
        supabase.from('artist_website_instances')
          .select('id,revision,content').eq('id',id).single(),
        supabase.from('artist_portfolio_publications')
          .select('snapshot,image_paths').eq('instance_id',id).single()
      ])
      if(draftResult.error)throw draftResult.error
      if(publicResult.error)throw publicResult.error
      const draft=draftResult.data
      const live=publicResult.data
      if(!draft||!live?.snapshot)throw new Error('Không tìm thấy nội dung đã xuất bản.')
      const nextDraft=withPublishedTitlePosition(draft.content||{},sectionId,device,position)
      const nextSnapshot=withPublishedTitlePosition(live.snapshot,sectionId,device,position)
      const {error:publishError}=await supabase.rpc('publish_artist_portfolio',{
        p_instance_id:id,
        p_revision:draft.revision,
        p_content:nextDraft,
        p_snapshot:nextSnapshot,
        p_image_paths:Array.isArray(live.image_paths)?live.image_paths:[]
      }).single()
      if(publishError)throw publishError
      setPublication(nextSnapshot)
      setSaveState('saved')
      setSaveNotice('Đã tự động lưu và cập nhật website.')
    }catch(e){
      // Restore the last visible state instead of pretending the change was saved.
      setPublication(previous)
      setSaveState('error')
      setSaveNotice('Không lưu được vị trí: '+(e.message||String(e))+
        ' · Tải lại trang nếu có bản chỉnh sửa khác.')
    }finally{
      savingRef.current=false
    }
  }

  function selectPublicElement(sectionId,layerId,element){
    if(!admin||!element||!publication)return
    setSelection({sectionId,layerId,...measurePublicElement(element)})
  }

  useEffect(()=>{
    if(!admin||!selection)return
    const frame=window.requestAnimationFrame(()=>{
      const element=document.querySelector('.pt-published [data-pt-public-selected="true"]')
      if(!element)return
      const measured=measurePublicElement(element)
      setSelection(current=>current&&current.sectionId===selection.sectionId&&
        current.layerId===selection.layerId?{...current,...measured}:current)
    })
    return ()=>window.cancelAnimationFrame(frame)
  },[admin,publication,selection?.sectionId,selection?.layerId])

  useEffect(()=>{
    if(!selection)return
    const close=event=>{if(event.key==='Escape')setSelection(null)}
    document.addEventListener('keydown',close)
    return ()=>document.removeEventListener('keydown',close)
  },[selection?.sectionId,selection?.layerId])

  function applyPublicEdit(sectionId,layerId,group,patch){
    if(!admin||!publication||!supabase)return
    const section=publication.view?.sections?.find(item=>item.id===sectionId)
    if(!section)return
    const device=mobile?'mobile':'desktop'
    const change={sectionId,layerId,device,group,patch,section}
    setPublication(current=>patchPublishedElement(current,
      sectionId,device,layerId,group,patch,section))
    queuedEditsRef.current.push(change)
    void flushPublicEdits()
  }

  async function flushPublicEdits(){
    if(flushingEditsRef.current)return
    flushingEditsRef.current=true
    savingRef.current=true
    setSaveState('saving')
    setSaveNotice('Đang lưu thay đổi trực tiếp…')
    try{
      while(queuedEditsRef.current.length){
        const pending=queuedEditsRef.current.splice(0)
        const [draftResult,publicResult]=await Promise.all([
          supabase.from('artist_website_instances')
            .select('id,revision,content').eq('id',id).single(),
          supabase.from('artist_portfolio_publications')
            .select('snapshot,image_paths').eq('instance_id',id).single()
        ])
        if(draftResult.error)throw draftResult.error
        if(publicResult.error)throw publicResult.error
        const draft=draftResult.data,live=publicResult.data
        if(!draft||!live?.snapshot)throw new Error('Không tìm thấy bản xuất bản.')
        const apply=(data,change)=>patchPublishedElement(data,change.sectionId,
          change.device,change.layerId,change.group,change.patch,change.section)
        const nextDraft=pending.reduce(apply,draft.content||{})
        const nextSnapshot=pending.reduce(apply,live.snapshot)
        const {error:publishError}=await supabase.rpc('publish_artist_portfolio',{
          p_instance_id:id,p_revision:draft.revision,
          p_content:nextDraft,p_snapshot:nextSnapshot,
          p_image_paths:Array.isArray(live.image_paths)?live.image_paths:[]
        }).single()
        if(publishError)throw publishError
        // Keep optimistic state if the user already queued newer adjustments.
        if(queuedEditsRef.current.length===0)setPublication(nextSnapshot)
      }
      setSaveState('saved')
      setSaveNotice('Đã tự động lưu và cập nhật website.')
    }catch(e){
      queuedEditsRef.current=[]
      setSaveState('error')
      setSaveNotice('Không lưu được: '+(e?.message||String(e))+
        ' · Vui lòng tải lại nếu trang có bản sửa mới từ nơi khác.')
      // The displayed layout must never claim an unsaved edit succeeded.
      const {data}=await supabase.from('artist_portfolio_publications')
        .select('snapshot').eq('instance_id',id).maybeSingle()
      if(data?.snapshot)setPublication(data.snapshot)
    }finally{
      savingRef.current=false
      flushingEditsRef.current=false
    }
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
  return <div className={'pt-published'+(admin?' pt-published--admin-edit':'')}>
    {admin&&publication&&<div className="pt-published__toolbar">
      {reducedMotion&&<span className="pt-published__motion-note">
        Thiết bị đang bật Giảm chuyển động. Bấm Phát hiệu ứng để xem thử.
      </span>}
      <button type="button" className="pt-btn pt-btn--light"
        onClick={()=>setReplayKey(value=>value+1)}
        title="Phát lại chữ và ảnh tại khu vực đang xem">
        ↻ Phát hiệu ứng
      </button>
      <button type="button" className="pt-btn" onClick={editWebsite}>
        Chỉnh sửa website
      </button>
    </div>}
    {saveNotice&&admin&&<div className={'pt-published__inline-save pt-published__inline-save--'+saveState}
      role={saveState==='error'?'alert':'status'} aria-live="polite">
      {saveNotice}
    </div>}
    {error&&<p className="pt-alert" role="alert">{error}</p>}
    {loading&&<p role="status">Đang tải portfolio…</p>}
    {!loading&&publication&&<PortfolioTemplateSite
      key={id+':'+publishedAt}
      publishedView={view} template={publishedTemplate} publicPage
      revealReplayKey={replayKey} forceMotion={replayKey>0}
      instance={{content}} urls={urls}
      onDirectMoveTitle={admin?movePublishedTitle:undefined}
      onDirectMoveElement={admin?(section,key,position)=>
        applyPublicEdit(section,key,'position',position):undefined}
      onDirectPatchLayer={admin?(section,key,patch)=>
        applyPublicEdit(section,key,'position',patch):undefined}
      onPublicSelect={admin?selectPublicElement:undefined}
      publicSelection={admin?selection:undefined}
      device={mobile?'mobile':'desktop'}/>}
    {admin&&selection&&publication&&<InlinePortfolioInspector
      selection={selection}
      layer={lookupPublishedLayer(publication,selection.sectionId,
        mobile?'mobile':'desktop',selection.layerId)}
      device={mobile?'mobile':'desktop'}
      onApply={applyPublicEdit}
      onClearNotice={()=>setSaveNotice('')}
      onClose={()=>setSelection(null)}/>}
  </div>
}
