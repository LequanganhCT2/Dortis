import React,{useEffect,useRef,useState} from 'react'
import {supabase} from '../../../infrastructure/supabase/client'
import {newStyledImage} from './newImageAppearance.js'
import {canManageContent} from '../../../core/auth/roles'
import {clientNavigate} from '../../../app/navigation'
import PortfolioTemplateSite from './PortfolioTemplateSite'
import {withPublishedTitlePosition} from './publicTitlePosition'
import {lookupPublishedLayer,patchPublishedElement} from './publicElementStyle'
import {getPublishedText,isEditablePortfolioText} from './publicTextContent'
import {removeSceneNote} from './sectionDesign.js'
import InlinePortfolioInspector from './InlinePortfolioInspector'
import {setSlotImage} from './model.js'
import {manageContentBlock,addStudioSection,newStudioElement,patchStudioElement,replaceStudioElements,studioElements,resolveStudioLayout,isStudioText} from './studioModel.js'
import StudioPanel from './StudioPanel'
import {quickTextPreset} from './textQuickLayouts.js'
import {studioTextMotion} from './studioTextPresentation.js'
import {photoMotionMode,photoMotionIntensity,photoMotionPointer} from './photoMotionConfig.js'
import useStudioSession from './useStudioSession.js'
import usePortfolioEntrance from './usePortfolioEntrance.js'
import './portfolio-clean-page.css'
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
  const [customSelection,setCustomSelection]=useState(null)
  const [deviceOverride,setDeviceOverride]=useState(null)
  const [selection,setSelection]=useState(null)
  const [editMode,setEditMode]=useState(false)
  const [editingText,setEditingText]=useState(null)
  const [publishedAt,setPublishedAt]=useState('')
  const [replayKey,setReplayKey]=useState(0)
  const [reducedMotion,setReducedMotion]=useState(()=>
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false)
  const [urls,setUrls]=useState({})
  const [admin,setAdmin]=useState(null)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [mobile,setMobile]=useState(()=>window.matchMedia('(max-width: 680px)').matches)

  const studioSession=useStudioSession({supabase,id,admin,publication,publishedAt,urls,setPublication,setPublishedAt,setUrls,setSaveState,setSaveNotice})
  const device=studioSession.active&&deviceOverride?deviceOverride:mobile?'mobile':'desktop'
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
      const canEdit=canManageContent(user)
      setAdmin(canEdit?user:null)
      if(!canEdit){setSelection(null);setCustomSelection(null);setEditingText(null);setEditMode(false);setDeviceOverride(null)}
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
        if(active&&sequence===requestSequence&&!studioSession.session.current&&!studioSession.busyRef.current){
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
      if(document.visibilityState==='hidden'||studioSession.session.current||studioSession.busyRef.current)return
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
    if(studioSession.active)return
    clientNavigate('/admin/templates?edit='+encodeURIComponent(id))
  }

  function movePublishedTitle(sectionId,position){
    if(!admin||!editMode)return
    studioSession.commit(pair=>({
      content:withPublishedTitlePosition(pair.content,sectionId,device,position),
      snapshot:withPublishedTitlePosition(pair.snapshot,sectionId,device,position)
    }))
  }

  function selectPublicElement(sectionId,layerId,element){
    if(!admin||!editMode||!element||!publication)return
    setCustomSelection(null)
    setEditingText(current=>current&&
      (current.sectionId!==sectionId||current.layerId!==layerId)?null:current)
    setSelection({sectionId,layerId,...measurePublicElement(element)})
  }
  function beginInlineTextEdit(sectionId,layerId,element){
    if(!admin||!editMode||!publication||!isEditablePortfolioText(layerId))return
    if(!publication.view?.sections?.some(item=>item.id===sectionId))return
    if(element)selectPublicElement(sectionId,layerId,element)
    else {setCustomSelection(null);setSelection({sectionId,layerId,rect:{top:120,left:0},metrics:{}})}
    setEditingText({sectionId,layerId})
  }
  function finishInlineTextEdit(){
    setEditingText(null)
    finishPendingPublicEdits()
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

  function finishPendingPublicEdits(){void studioSession.flush()}
  function applyPublicEdit(sectionId,layerId,group,patch){
    if(!admin||!editMode||!publication||!supabase)return
    if(group==='content'&&(!isEditablePortfolioText(layerId)||typeof patch?.value!=='string'))return
    const section=publication.view?.sections?.find(item=>item.id===sectionId)
    if(!section)return
    const apply=doc=>patchPublishedElement(doc,sectionId,device,layerId,group,patch,section)
    studioSession.commit(pair=>({content:apply(pair.content),snapshot:apply(pair.snapshot)}))
  }
  function deletePublicText(sectionId,layerId){
    if(!admin||!editMode||!publication||!isEditablePortfolioText(layerId))return
    const section=publication.view?.sections?.find(s=>s.id===sectionId)
    if(!section)return
    const remove=doc=>layerId.startsWith('note:')?
      removeSceneNote(doc,section,layerId.slice(5)):
      patchPublishedElement(doc,sectionId,device,layerId,'content',{value:''},section)
    if(studioSession.commit(pair=>({content:remove(pair.content),snapshot:remove(pair.snapshot)})))clearSelection()
  }
  function clearSelection(){setSelection(null);setEditingText(null);setCustomSelection(null)}
  function selectCustom(sectionId,id){setSelection(null);setEditingText(null);setCustomSelection({sectionId,id})}
  function selectBase(sectionId,layerId){
    setCustomSelection(null);setEditingText(null)
    setSelection({sectionId,layerId,rect:{top:120,left:0},metrics:{}})
  }
  function both(pair,fn){return {content:fn(pair.content),snapshot:fn(pair.snapshot)}}
  function addItem(sectionId,kind,path='',alt='',appearance,imageInfo){
    const id=crypto.randomUUID()
    const item=kind==='image'&&appearance?newStyledImage(id,path,alt,appearance,imageInfo):
      newStudioElement(kind,id,{path,alt})
    if(studioSession.commit(pair=>both(pair,doc=>replaceStudioElements(doc,sectionId,[...studioElements(doc,sectionId),item])),Boolean(path))){
      selectCustom(sectionId,item.id)
      document.getElementById('pt-'+sectionId)?.scrollIntoView({block:'start',behavior:'smooth'})
    }
  }
  function addPresetLayer(sectionId,preset){
    const [label,title,body]=preset
    const kind=label==='Nghệ danh & Vai trò'?'title':'body'
    const item=newStudioElement(kind,crypto.randomUUID(),{text:kind==='title'?title:title+'\n'+body})
    if(studioSession.commit(pair=>both(pair,doc=>replaceStudioElements(doc,sectionId,[...studioElements(doc,sectionId),item]))))selectCustom(sectionId,item.id)
  }
  function cloneBaseLayer(sectionId,key){
    const section=publication.view?.sections?.find(s=>s.id===sectionId)
    if(!section)return
    const image=key.startsWith('image:')?section.images?.[Number(key.slice(6))]:null
    if(key.startsWith('image:')&&!image?.path)return
    const kind=image?'image':key==='title'?'title':key==='body'?'body':'text'
    const item=newStudioElement(kind,crypto.randomUUID(),image?{path:image.path,alt:image.alt||''}:{text:getPublishedText(publication,sectionId,device,key)||section[key]||''})
    if(studioSession.commit(pair=>both(pair,doc=>replaceStudioElements(doc,sectionId,[...studioElements(doc,sectionId),item]))))selectCustom(sectionId,item.id)
  }
  function patchItem(sectionId,id,patch,internal=false){
    studioSession.commit(pair=>both(pair,doc=>patchStudioElement(doc,sectionId,id,device,patch)),internal)
  }
  function duplicateItem(sectionId,id){
    const source=studioElements(publication,sectionId).find(e=>e.id===id)
    if(!source)return
    const copy={...source,id:crypto.randomUUID(),[device]:{...source[device],x:Number(source[device]?.x||0)+3,y:Number(source[device]?.y||0)+3}}
    if(studioSession.commit(pair=>both(pair,doc=>replaceStudioElements(doc,sectionId,[...studioElements(doc,sectionId),copy]))))selectCustom(sectionId,copy.id)
  }
  function removeItem(sectionId,id){
    if(studioSession.commit(pair=>both(pair,doc=>replaceStudioElements(doc,sectionId,studioElements(doc,sectionId).filter(e=>e.id!==id)))))clearSelection()
  }
  function moveItem(sectionId,id,target){
    if(target===sectionId)return
    if(studioSession.commit(pair=>both(pair,doc=>{
      const item=studioElements(doc,sectionId).find(e=>e.id===id)
      if(!item)return doc
      return replaceStudioElements(replaceStudioElements(doc,sectionId,studioElements(doc,sectionId).filter(e=>e.id!==id)),target,[...studioElements(doc,target),item])
    })))selectCustom(target,id)
  }
  function addSection(label,title='',body=''){
    const extra=studioSession.session.current?.working.content.extraSections||[]
    if(extra.length>=24){setSaveNotice('Đã đạt giới hạn 24 khu vực bổ sung của Form.');return}
    const id='studio-'+crypto.randomUUID().replaceAll('-','').slice(0,24)
    if(studioSession.commit(pair=>{const next=addStudioSection(pair,id,label);return {content:{...next.content,sections:{...next.content.sections,[id]:{...next.content.sections[id],title,body}}},snapshot:{...next.snapshot,view:{...next.snapshot.view,sections:next.snapshot.view.sections.map(s=>s.id===id?{...s,title,body}:s)}}}})){
      clearSelection();requestAnimationFrame(()=>document.getElementById('pt-'+id)?.scrollIntoView({block:'start'}));return id
    }
  }
  function blockAction(id,action,target){
    if(action==='clone'){
      if((studioSession.session.current?.working.content.extraSections||[]).length>=24){setSaveNotice('Đã đạt giới hạn 24 khu vực bổ sung.');return}
      target='studio-'+crypto.randomUUID().replaceAll('-','').slice(0,24)
    }
    if(studioSession.commit(pair=>manageContentBlock(pair,id,action,target)))clearSelection()
  }
  function uploadItems(sectionId,files,replaceId,appearance,entries=[]){
    return studioSession.upload(sectionId,files,(path,name,file)=>{
      if(replaceId)patchItem(sectionId,replaceId,{path,alt:name},true)
      else addItem(sectionId,'image',path,name,appearance,entries.find(entry=>entry.file===file)?.info)
    })
  }
  function replaceBaseImage(sectionId,layerId,file){
    const index=Number(layerId.slice(6))
    if(!layerId.startsWith('image:')||!Number.isInteger(index)||index<0)return
    return studioSession.upload(sectionId,[file],(path,name)=>studioSession.commit(pair=>{
      const slot=sectionId+':'+index
      const asset={...(pair.content.images?.[slot]||{}),path,alt:name}
      return {content:setSlotImage(pair.content,slot,asset),snapshot:{...pair.snapshot,view:{
        ...pair.snapshot.view,sections:pair.snapshot.view.sections.map(s=>s.id===sectionId?{...s,images:s.images.map((old,i)=>i===index?{...old,path,alt:name}:old)}:s)
      }}}
    },true))
  }
  function patchBaseImage(sectionId,layerId,patch){
    const index=Number(layerId.slice(6))
    if(!layerId.startsWith('image:')||!Number.isInteger(index)||index<0)return
    studioSession.commit(pair=>{
      const slot=sectionId+':'+index
      const current=pair.content.images?.[slot]
      if(!current?.path)return pair
      const raw={...current,...patch}
      const next={...raw,motion:photoMotionMode(raw),motionIntensity:photoMotionIntensity(raw),motionPointer:photoMotionPointer(raw)}
      return {content:setSlotImage(pair.content,slot,next),snapshot:{...pair.snapshot,view:{...pair.snapshot.view,
        sections:pair.snapshot.view.sections.map(s=>s.id===sectionId?{...s,images:s.images.map((old,i)=>i===index?{...old,...patch,motion:next.motion,motionIntensity:next.motionIntensity,motionPointer:next.motionPointer}:old)}:s)}}}
    })
  }
  const studio={selection:customSelection,select:selectCustom,clear:clearSelection,patch:patchItem,duplicate:duplicateItem,remove:removeItem,move:moveItem}
  async function enterStudio(){if(await studioSession.open())setEditMode(true)}
  function previewStudio(){clearSelection();setEditMode(false);finishPendingPublicEdits();setReplayKey(v=>v+1)}
  async function publishStudio(){if(await studioSession.publish()){clearSelection();setEditMode(false);setDeviceOverride(null);setReplayKey(v=>v+1)}}
  async function discardStudio(){if(await studioSession.discard()){clearSelection();setEditMode(false);setDeviceOverride(null)}}
  useEffect(()=>{
    if(!studioSession.active||!editMode)return
    const key=e=>{
      if(e.target.closest?.('input,textarea,select,[contenteditable=true]'))return
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();clearSelection();studioSession.history(e.shiftKey?'redo':'undo')}
      else if(e.key==='Escape')clearSelection()
    }
    window.addEventListener('keydown',key);return ()=>window.removeEventListener('keydown',key)
  },[studioSession.active,editMode])
 
  // The published snapshot is authoritative: preserve its theme, speed,
  // positions and photo paths without needing private draft access.
  const view=publication?.view
  const templateSlug=publication?.templateSlug||
    (view?.visualTheme==='silk-flow'?'silk-flow':undefined)
  const publishedTemplate=templateSlug?{slug:templateSlug}:undefined
  const content=publication?{
    scenes:publication.scenes||{},
    positions:publication.positions||{},
    typography:publication.typography||{},studioElements:publication.studioElements||{},
    contentBlockHidden:publication.contentBlockHidden||{},contentBlockOrder:publication.contentBlockOrder||[],
    revealSpeed:view?.revealSpeed
  }:null
  const customSection=view?.sections?.find(s=>s.id===customSelection?.sectionId)
  const customItem=customSection&&studioElements(publication,customSection.id).find(e=>e.id===customSelection.id)
  const customText=customItem&&isStudioText(customItem.kind)
  const customValues=customText?resolveStudioLayout(customItem[device],customItem.kind,device):null
  const [customMetrics,setCustomMetrics]=useState({})
  useEffect(()=>{
    if(!customText)return
    const frame=requestAnimationFrame(()=>{
      const node=Array.from(document.querySelectorAll('[data-studio-text-id]')).find(n=>n.dataset.studioTextId===customItem.id)
      if(node)setCustomMetrics({...measurePublicElement(node),id:customItem.id})
    })
    return ()=>cancelAnimationFrame(frame)
  },[customItem,device,publication])
  function applyCustomText(sectionId,id,group,patch){
    if(group==='content')return patchItem(sectionId,id,{text:patch.value})
    if(group==='layout')return patchItem(sectionId,id,quickTextPreset(patch.id))
    if(group==='motion')return patchItem(sectionId,id,{effect:patch.effect||customValues.effect,motion:{...studioTextMotion(customValues),...patch},...(patch.duration!=null?{duration:patch.duration/1000}:{}),...(patch.delay!=null?{delay:patch.delay/1000}:{})})
    const {borderWidth,...rest}=patch
    patchItem(sectionId,id,{...rest,...(borderWidth!=null?{border:borderWidth}:{})})
  }
  const editorActive=Boolean(admin&&editMode&&studioSession.active)
  const cleanPage=id==='9ff93d63-8db9-4ca9-8d3c-89ddd63b4f4e'
  const entrance=usePortfolioEntrance(urls,cleanPage&&!loading&&!!publication)
  const waiting=cleanPage&&!editorActive&&(!entrance.ready||loading||Boolean(error))
  useEffect(()=>{
    if(!waiting)return
    const previous=document.body.style.overflow
    document.body.style.overflow='hidden'
    return()=>{document.body.style.overflow=previous}
  },[waiting])
  return <div data-pt-entry-ready={cleanPage?entrance.ready:undefined}
    data-pt-loaded-images={cleanPage?entrance.done:undefined}
    data-pt-total-images={cleanPage?entrance.total:undefined}
    className={'pt-published'+(cleanPage?' pt-clean-portfolio':'')+(editorActive?' pt-published--admin-edit':'')+(studioSession.active&&deviceOverride==='mobile'?' pt-studio-mobile-preview':'')}>
    {waiting&&<div className="pt-welcome" role="status" aria-live="polite"><h1>Xin chào.</h1><p>{error||'Một chút nữa, sân khấu sẽ sẵn sàng.'}</p>
      <p>{entrance.done}/{entrance.total} ảnh đã tải</p>
      {error&&<button type="button" onClick={()=>window.location.reload()}>Tải lại trang</button>}
      {entrance.failed>0&&<><p>{entrance.failed} ảnh chưa tải được.</p><button type="button" onClick={entrance.retry}>Thử tải lại</button></>}
    </div>}
    {admin&&publication&&<div className="pt-published__toolbar"
      role="group" aria-label="Chọn chế độ xem hoặc chỉnh sửa portfolio">
      <div className="pt-published__mode-switch" role="group" aria-label="Chế độ trang">
        <button type="button" aria-pressed={!editMode}
          className={!editMode?'is-active':''}
          onClick={previewStudio}><span aria-hidden="true">◉</span> {studioSession.active?'Xem trước':'Xem'}</button>
        <button type="button" aria-pressed={editMode}
          className={editMode?'is-active':''}
          disabled={studioSession.busy} onClick={enterStudio}><span aria-hidden="true">✎</span> Sửa</button>
      </div>
      <button type="button" className="pt-published__replay"
        onClick={()=>setReplayKey(value=>value+1)}
        title={reducedMotion?'Phát hiệu ứng, bỏ qua cài đặt giảm chuyển động':
          'Phát lại hiệu ứng chữ và ảnh'} aria-label="Phát lại hiệu ứng">↻</button>
      {studioSession.active&&!editorActive&&<button type="button" className="pt-studio-publish" disabled={studioSession.busy} onClick={publishStudio}>Xuất bản</button>}
      <button type="button" className="pt-published__open-editor"
        onClick={editWebsite} disabled={studioSession.active} title="Mở trình biên tập nội dung portfolio"
        aria-label="Mở trình biên tập nội dung">⋯</button>
    </div>}
    {saveNotice&&admin&&<div className={'pt-published__inline-save pt-published__inline-save--'+saveState}
      role={saveState==='error'?'alert':'status'} aria-live="polite">
      {saveNotice}
    </div>}
    {error&&<p className="pt-alert" role="alert">{error}</p>}
    {loading&&<p role="status">Đang tải portfolio…</p>}
    {!loading&&publication&&<div className={'pt-entrance-shell'+(waiting?' is-waiting':'')} inert={waiting?true:undefined} aria-hidden={waiting?true:undefined}><PortfolioTemplateSite
      key={id+':'+publishedAt}
      publishedView={view} template={publishedTemplate} publicPage
      motionPaused={waiting||editorActive||Boolean(editingText)} studio={editorActive?studio:undefined}
      revealReplayKey={replayKey} forceMotion={replayKey>0}
      instance={{content}} urls={urls}
      onDirectMoveTitle={editorActive?movePublishedTitle:undefined}
      onDirectMoveElement={editorActive?(section,key,position)=>
        applyPublicEdit(section,key,'position',position):undefined}
      onDirectPatchLayer={editorActive?(section,key,patch)=>
        applyPublicEdit(section,key,'position',patch):undefined}
      onPublicSelect={editorActive?selectPublicElement:undefined}
      publicSelection={editorActive?selection:undefined}
      editingText={editorActive?editingText:null}
      onDirectStartTextEdit={editorActive?beginInlineTextEdit:undefined}
      onDirectTextChange={editorActive?(section,key,value)=>
        applyPublicEdit(section,key,'content',{value}):undefined}
      onDirectTextFinish={finishInlineTextEdit}
      device={device}/></div>}
    {editorActive&&<StudioPanel publication={publication} device={device} studio={studio} baseSelection={selection} busy={studioSession.busy}
      onAdd={addItem} onAddPresetLayer={addPresetLayer} onCloneBaseLayer={cloneBaseLayer} onAddSection={addSection} onBlockAction={blockAction} onUpload={uploadItems} onReplaceBase={replaceBaseImage} onPatchBaseImage={patchBaseImage} onSelectBase={selectBase}
      onUndo={()=>{clearSelection();studioSession.history('undo')}} onRedo={()=>{clearSelection();studioSession.history('redo')}}
      canUndo={studioSession.canUndo} canRedo={studioSession.canRedo} onDevice={value=>{clearSelection();setDeviceOverride(value)}}
      onPreview={previewStudio} onPublish={publishStudio} onDiscard={discardStudio} notice={saveNotice} inspector={customText?(<InlinePortfolioInspector embedded
      selection={{sectionId:customSection.id,layerId:customItem.id,...(customMetrics.id===customItem.id?customMetrics:{})}}
      layer={{section:customSection,scene:true,custom:true,kind:customItem.kind,values:{...customValues,borderWidth:customValues.border,motion:studioTextMotion(customValues)}}}
      device={device} onApply={applyCustomText} textValue={customItem.text||''}
      onDelete={()=>removeItem(customSection.id,customItem.id)}
      onToggleHidden={()=>patchItem(customSection.id,customItem.id,{hidden:!customValues.hidden})}
      onResetTypography={()=>patchItem(customSection.id,customItem.id,{inheritTypography:true})}
      onCustomPatch={patch=>patchItem(customSection.id,customItem.id,patch)}
      onReplayMotion={()=>setReplayKey(v=>v+1)} onClose={()=>{clearSelection();finishPendingPublicEdits()}}/>):selection&&publication?(<InlinePortfolioInspector embedded
      selection={selection}
      layer={lookupPublishedLayer(publication,selection.sectionId,
        device,selection.layerId)}
      device={device}
      onApply={applyPublicEdit}
      onDelete={isEditablePortfolioText(selection.layerId)?()=>deletePublicText(selection.sectionId,selection.layerId):undefined}
      textValue={getPublishedText(publication,selection.sectionId,
        device,selection.layerId)}
      onStartInlineEdit={()=>beginInlineTextEdit(selection.sectionId,
        selection.layerId)}
      onReplayMotion={()=>setReplayKey(v=>v+1)}
      onClose={()=>{setEditingText(null);setSelection(null);finishPendingPublicEdits()}}/>):null}/>}
  </div>
}
