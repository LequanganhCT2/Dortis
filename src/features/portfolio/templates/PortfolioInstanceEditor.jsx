import React,{useEffect,useMemo,useRef,useState} from 'react'
import PortfolioTemplateSite from './PortfolioTemplateSite'
import PortfolioPalettePicker from './PortfolioPalettePicker'
import {paletteOptionsForTheme} from './portfolioPalette'
import {normalizeBlueprint,normalizeTemplateBlueprint,portfolioSections,setSectionField,setSlotImage,LUXURY_RIBBON} from './model'
import {artistSourcePages,copySourceSection,suggestSourceForLayout} from './sourceBinding'
import {sourceBoundField,restoreLinkedFields,resolveArtistPortfolio} from './resolvedPortfolio'
import SceneLayerInspector from './SceneLayerInspector'
import PortraitCutout from './PortraitCutout'
import {TEXT_QUICK_LAYOUTS,quickSceneTextPlacement,quickRibbonTextPlacement} from './textQuickLayouts'
import {isCutoutArtwork,cutoutStageStyle,CUTOUT_STAGE_STYLES} from './imagePresentation'
import {PHOTO_MOTION_OPTIONS,photoMotionMode,photoMotionIntensity,photoMotionPointer,supportsPhotoPointer} from './photoMotionConfig'
import {
  getScene,enableSectionScene,resetSectionScene,disableSectionScene,
  SCENE_FONTS,sceneLayerDefault,sceneLayerIds,sceneLayerTitle,sceneLayerType,
  patchSceneLayer,patchSceneBackground,addSceneNote,patchSceneNote,removeSceneNote,
  arrangeSceneImages
} from './sectionDesign'

const BUCKET='dortis-artist-web-drafts'
const ALLOWED=new Set(['image/jpeg','image/png','image/webp','image/avif'])
const MAX_SIZE=4*1024*1024
const EXT={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif'}
const getSlot=(section,index)=>section.id+':'+index

export default function PortfolioInstanceEditor({
  supabase,user,template,instance,profile,onBack,onSaved,onPublished,
  onPreviewOther,otherTemplateName='',backLabel='← Quay về chọn mẫu Portfolio'
}){
  const [content,setContent]=useState(()=>instance.content||{})
  const [active,setActive]=useState(()=>normalizeBlueprint(template.blueprint).sections[0]?.id||'')
  const [sourcePage,setSourcePage]=useState('')
  const [sourceProfile,setSourceProfile]=useState(profile)
  const [refreshingProfile,setRefreshingProfile]=useState(false)
  const previewRef=useRef(null)
  const pendingSectionScroll=useRef(null)
  const [device,setDevice]=useState('desktop')
  const [visualEditing,setVisualEditing]=useState(false)
  const [selectedLayer,setSelectedLayer]=useState('title')
  const [lockImageRatio,setLockImageRatio]=useState(true)
  const [urls,setUrls]=useState({})
  const [dirty,setDirty]=useState(false)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [notice,setNotice]=useState('')
  const [published,setPublished]=useState(Boolean(onPublished))
  const websitePath='/portfolio/'+instance.id
  const sections=useMemo(()=>portfolioSections(template,content),[template,content.extraSections])
  const current=sections.find(s=>s.id===active)||sections[0]
  const sourcePages=useMemo(()=>artistSourcePages(sourceProfile),[sourceProfile])
  useEffect(()=>{
    let alive=true
    const entries=Object.values(content.images||{}).filter(x=>x&&x.path)
    const paths=[...new Set(entries.map(x=>x.path))]
    if(!paths.length){setUrls({});return}
    Promise.all(paths.map(async path=>{
      const {data,error}=await supabase.storage.from(BUCKET).createSignedUrl(path,3600)
      return [path,error?null:data?.signedUrl||null]
    })).then(rows=>{
      if(alive)setUrls(Object.fromEntries(rows.filter(([,url])=>url)))
    }).catch(e=>{if(alive)setError('Không tải được ảnh xem trước: '+e.message)})
    return ()=>{alive=false}
  },[instance.id,supabase,content.images])
  useEffect(()=>{
    if(onPublished)return
    let active=true
    supabase.from('artist_portfolio_publications').select('instance_id')
      .eq('instance_id',instance.id).maybeSingle().then(({data})=>{
        if(active&&data)setPublished(true)
      })
    return ()=>{active=false}
  },[supabase,instance.id,onPublished])
  useEffect(()=>{
    if(!dirty)return
    const guard=event=>{event.preventDefault();event.returnValue=''}
    window.addEventListener('beforeunload',guard)
    return ()=>window.removeEventListener('beforeunload',guard)
  },[dirty])
  useEffect(()=>{
    if(pendingSectionScroll.current!==active)return
    pendingSectionScroll.current=null
    scrollToSection(active)
  },[active])
  function confirmLeave(){
    return !dirty||window.confirm('Bạn có thay đổi chưa lưu. Rời trình chỉnh sửa?')
  }
  function acceptSaved(data,message){
    setContent(data.content||{})
    setDirty(false)
    onSaved(data)
    setNotice(message)
  }
  async function persist(next,message='Đã lưu nội dung riêng của nghệ sĩ.'){
    const {data,error:dbError}=await supabase.from('artist_website_instances')
      .update({content:next,updated_by:user.id,updated_at:new Date().toISOString(),
        revision:(instance.revision||1)+1})
      .eq('id',instance.id).eq('revision',instance.revision||1)
      .select().maybeSingle()
    if(dbError)throw dbError
    if(!data)throw new Error('Nội dung đã thay đổi ở phiên khác. Hãy mở lại Portfolio để tránh ghi đè.')
    acceptSaved(data,message)
  }
  function changeText(field,value){
    setContent(prev=>setSectionField(prev,current.id,field,value))
    setDirty(true);setNotice('')
  }
  async function refreshSource(){
    if(refreshingProfile||busy)return
    setRefreshingProfile(true);setError('')
    try{
      const {data,error:dbError}=await supabase.from('artist_profiles')
        .select('id,name,role,sections').eq('id',profile.id).single()
      if(dbError)throw dbError
      setSourceProfile(data)
      setNotice('Đã đọc bản Hồ sơ nghệ sĩ mới nhất. Các trường đang liên kết tự cập nhật; thay đổi riêng được giữ nguyên.')
    }catch(e){setError('Không đọc lại được Hồ sơ nghệ sĩ: '+e.message)}
    finally{setRefreshingProfile(false)}
  }
  function restoreSourceText(){
    if(!currentOwn.sourcePage)return
    setContent(prev=>restoreLinkedFields(prev,current.id))
    setDirty(true);setNotice('Đã liên kết lại tiêu đề và mô tả với mục nguồn. Lưu để áp dụng.')
  }
  function importCurrentSource(pageNumber=sourcePage){
    if(!current||!pageNumber)return
    const chosen=sourcePages.find(p=>p.page===Number(pageNumber))
    if(!chosen)return
    setContent(prev=>copySourceSection(prev,current.id,chosen))
    setDirty(true);setNotice('Đã nạp mục từ hồ sơ PDF. Nhấn Lưu thay đổi để ghi nhận.')
  }
  async function save(){
    if(busy)return
    setBusy(true);setError('')
    try{await persist(content)}
    catch(e){setError('Không lưu được: '+e.message)}
    finally{setBusy(false)}
  }
  async function publishWebsite(){
    if(busy||!window.confirm('Xuất bản nội dung và ảnh hiện tại lên website công khai?'))return
    setBusy(true);setError('');setNotice('')
    try{
      const view=resolveArtistPortfolio(template,{...instance,content},sourceProfile)
      const visible=view.sections.filter(section=>section.title||section.body||
        section.eyebrow||section.images.some(image=>image?.path)||content.scenes?.[section.id])
      const publicSections=visible.map(section=>{
        const {sourcePage,sourceStatus,fieldOverrides,...publishedSection}=section
        return publishedSection
      })
      const imagePaths=[...new Set(publicSections.flatMap(section=>
        section.images.map(image=>image?.path).filter(Boolean)))]
      const snapshot={view:{...view,visualTheme:content.visualTheme==='classic'?'classic':view.visualTheme,sections:publicSections},scenes:content.scenes||{},positions:content.positions||{},typography:content.typography||{}}
      const {data,error:publishError}=await supabase.rpc('publish_artist_portfolio',{
        p_instance_id:instance.id,p_revision:instance.revision||1,
        p_content:content,p_snapshot:snapshot,p_image_paths:imagePaths
      }).single()
      if(publishError)throw publishError
      setPublished(true)
      acceptSaved(data,'Đã cập nhật website công khai.')
      onPublished?.()
    }catch(e){setError('Không xuất bản được website: '+e.message)}
    finally{setBusy(false)}
  }
  async function upload(section,index,file,cutout=false){
    if(!file||busy)return
    if(!ALLOWED.has(file.type)){setError('Chỉ hỗ trợ JPG, PNG, WebP hoặc AVIF.');return}
    if(file.size>MAX_SIZE){setError('Ảnh cần nhỏ hơn hoặc bằng 4 MB.');return}
    if(file.size===0){setError('Ảnh bị trống.');return}
    const slot=getSlot(section,index),previous=content.images?.[slot]
    const path=profile.id+'/'+template.id+'/'+section.id+'/'+index+'-'+crypto.randomUUID()+'.'+EXT[file.type]
    setBusy(true);setError('');setNotice('Đang tải ảnh...')
    try{
      const {error:uploadError}=await supabase.storage.from(BUCKET).upload(path,file,{
        contentType:file.type,cacheControl:'3600',upsert:false
      })
      if(uploadError)throw uploadError
      const next=setSlotImage(content,slot,{path,alt:previous?.alt||'',
        ...(previous?.motion?{motion:previous.motion}:{}),
        ...(previous?.motionIntensity!=null?{motionIntensity:previous.motionIntensity}:{}),
        ...(previous?.motionPointer!=null?{motionPointer:previous.motionPointer}:{}),
        ...(cutout?{cutout:true}:{})
      })
      try{
        await persist(next,'Đã tải ảnh vào '+section.label+' · vị trí '+(index+1)+'.')
      }catch(e){
        await supabase.storage.from(BUCKET).remove([path]).catch(()=>{})
        throw e
      }
      if(previous?.path&&previous.path!==path){
        await supabase.storage.from(BUCKET).remove([previous.path]).catch(()=>{})
      }
      return true
    }catch(e){setError('Tải ảnh thất bại: '+e.message)}
    finally{setBusy(false)}
  }
  async function removeImage(section,index){
    if(busy)return
    const slot=getSlot(section,index),before=content.images?.[slot]
    if(!before?.path)return
    setBusy(true);setError('')
    try{
      await persist(setSlotImage(content,slot,null),'Đã xóa ảnh khỏi vị trí này.')
      await supabase.storage.from(BUCKET).remove([before.path]).catch(()=>{})
    }catch(e){setError('Không xóa được: '+e.message)}
    finally{setBusy(false)}
  }
  function changeAlt(section,index,text){
    const slot=getSlot(section,index),previous=content.images?.[slot]
    if(!previous?.path)return
    setContent(v=>setSlotImage(v,slot,{...previous,alt:text.slice(0,240)}))
    setDirty(true)
  }
  function changeCutout(section,index,value){
    const slot=getSlot(section,index)
    if(!content.images?.[slot]?.path)return
    setContent(prev=>{
      const image=prev.images?.[slot]
      return image?.path?setSlotImage(prev,slot,{...image,cutout:value}):prev
    })
    setDirty(true)
  }
  function changeCutoutStyle(section,index,style){
    if(!CUTOUT_STAGE_STYLES.some(option=>option.id===style))return
    const slot=getSlot(section,index)
    setContent(prev=>{
      const image=prev.images?.[slot]
      return image?.path?setSlotImage(prev,slot,{...image,cutoutStyle:style}):prev
    })
    setDirty(true)
  }
  function changePhotoMotion(section,index,patch){
    if(patch.motion&&!PHOTO_MOTION_OPTIONS.some(mode=>mode.id===patch.motion))return
    const slot=getSlot(section,index)
    setContent(prev=>{
      const image=prev.images?.[slot]
      return image?.path?setSlotImage(prev,slot,{...image,...patch}):prev
    })
    setDirty(true)
  }
  const currentOwn=content.sections?.[current?.id]||{}
  const suggestedSource=current&&!currentOwn.sourcePage
    ?suggestSourceForLayout(current,sourcePages):null
  const sectionEffect=content.effects?.[current?.id]||current?.effect
  function changeSectionEffect(effect){
    setContent(previous=>{
      const effects={...previous.effects}
      if(effect)effects[current.id]=effect
      else delete effects[current.id]
      return {...previous,effects}
    })
    setDirty(true)
  }
  const scene=current?getScene(content,current,device):null
  function scrollToSection(sectionId){
    const preview=previewRef.current?.querySelector('.pt-device')
    const target=preview?.querySelector('#'+CSS.escape('pt-'+sectionId))
    if(target){
      const top=preview.scrollTop+target.getBoundingClientRect().top-preview.getBoundingClientRect().top
      const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches
      preview.scrollTo({top,behavior:reducedMotion?'auto':'smooth'})
    }
  }
  function selectSection(section){
    scrollToSection(section.id)
    if(current?.id===section.id)return
    setActive(section.id);setSourcePage('');setSelectedLayer('title')
  }
  function addSection(){
    if(busy||sections.length>=12)return
    const section={id:'extra_'+crypto.randomUUID().replaceAll('-',''),label:'Khu vực '+(sections.length+1),
      layout:'split',effect:'auto',slots:1}
    setContent(previous=>({...previous,extraSections:[...(previous.extraSections||[]),section]}))
    pendingSectionScroll.current=section.id
    setActive(section.id);setSourcePage('');setSelectedLayer('title')
    setDirty(true);setNotice('Đã thêm khu vực. Chọn trang PDF hoặc nhập nội dung, rồi lưu thay đổi.')
  }
  const textLayers=current?sceneLayerIds(current,scene)
    .filter(id=>sceneLayerType(id)==='text'):[]
  const textLayer=textLayers.includes(selectedLayer)?selectedLayer:'title'
  const textStyle=scene?.layers[textLayer]||content.typography?.[current?.id]?.[device]?.[textLayer]||{}
  function patchTypography(patch){
    if(!current||busy)return
    if(scene){patchLayer(textLayer,patch);return}
    setContent(previous=>{
      const typography=previous.typography||{}
      const section=typography[current.id]||{}
      const layers=section[device]||{}
      return {...previous,typography:{...typography,[current.id]:{
        ...section,[device]:{...layers,[textLayer]:{...layers[textLayer],...patch}}
      }}}
    })
    setDirty(true)
  }
  function resetTypography(){
    const defaults=scene?sceneLayerDefault(textLayer,current,device):{}
    patchTypography({font:defaults.font??null,size:defaults.size??null,lineHeight:defaults.lineHeight??null})
  }
  function updateTypographyNumber(event,field){
    const input=event.currentTarget
    if(!input.validity.valid){
      input.value=textStyle[field]??''
      return
    }
    const value=Number.isFinite(input.valueAsNumber)?input.valueAsNumber:
      scene?sceneLayerDefault(textLayer,current,device)[field]:null
    if(value!==(textStyle[field]??null))patchTypography({[field]:value})
    input.value=value??''
  }
  function beginVisualEdit(){
    if(!current)return
    // The Form is already rendered in preview. Do not switch its layout or
    // scroll to an unmounted page when entering direct edit mode.
    setSelectedLayer('title')
    setVisualEditing(true);setNotice('')
  }
  function createLayerLayout(){
    if(!current||scene)return
    setContent(prev=>enableSectionScene(prev,current))
    setDirty(true)
    beginVisualEdit()
  }
  function moveElement(key,position){
    setContent(previous=>{
      const positions=previous.positions||{}
      const section=positions[current.id]||{}
      return {...previous,positions:{...positions,[current.id]:{
        ...section,[device]:{...section[device],[key]:position}
      }}}
    })
    setDirty(true)
  }
  function quickPlaceText(layoutId){
    if(!current||busy||!textLayers.includes(textLayer))return
    if(scene){
      patchLayer(textLayer,quickSceneTextPlacement(layoutId,scene.layers[textLayer],device))
    }else{
      const original=content.positions?.[current.id]?.[device]?.[textLayer]||{}
      const next=quickRibbonTextPlacement(layoutId,original)
      moveElement(textLayer,next.position)
      patchTypography(next.typography)
    }
    setNotice('Đã áp dụng bố cục chữ. Cỡ font được giữ nguyên; nhấn Lưu để ghi nhận.')
  }
  function resetTextPlacement(){
    if(!current||busy)return
    if(scene){
      const defaults=sceneLayerDefault(textLayer,current,device)
      patchLayer(textLayer,{x:defaults.x,align:defaults.align,rotation:0})
    }else{
      const original=content.positions?.[current.id]?.[device]?.[textLayer]||{}
      moveElement(textLayer,{...original,x:0,y:0,widthPct:null,rotation:0})
      patchTypography({align:null})
    }
    setNotice('Đã khôi phục căn chữ mặc định của Form.')
  }
  function patchLayer(layerId,patch){
    if(!current)return
    setContent(prev=>patchSceneLayer(prev,current,device,layerId,patch))
    setDirty(true);setNotice('')
  }
  function changeBackground(background){
    if(!current)return
    setContent(prev=>patchSceneBackground(prev,current,device,background))
    setDirty(true)
  }
  function autoArrangeImages(){
    if(!current||!current.slots)return
    setContent(prev=>arrangeSceneImages(prev,current,device))
    setDirty(true);setNotice('Ảnh đã được xếp vào từng ô an toàn trên '+
      (device==='mobile'?'mobile':'desktop')+'. Nhấn Lưu để giữ vị trí.')
  }
  function addNote(){
    if(!current)return
    const id=crypto.randomUUID()
    setContent(prev=>addSceneNote(prev,current,'Dòng chữ nghệ thuật',id))
    setSelectedLayer('note:'+id);setDirty(true);setNotice('')
  }
  function editNote(id,text){
    if(!current)return
    setContent(prev=>patchSceneNote(prev,current,device,id,text))
    setDirty(true)
  }
  function deleteNote(id){
    if(!current)return
    setContent(prev=>removeSceneNote(prev,current,id))
    setSelectedLayer('title');setDirty(true)
  }
  function resetPage(){
    if(!current)return
    setContent(prev=>resetSectionScene(prev,current,device))
    setDirty(true);setSelectedLayer('title')
    setNotice('Đã đặt lại vị trí lớp ở '+(device==='mobile'?'mobile':'desktop')+'. Lưu để ghi nhận.')
  }
  function disablePageDesign(){
    if(!current)return
    setContent(prev=>disableSectionScene(prev,current.id))
    setDirty(true)
    setNotice('Đã trở về bố cục Form chung của khu vực này. Lưu để ghi nhận.')
  }
  return <div className="pt-editor">
    <header className="pt-editor__head">
      <div>
        <p className="pt-overline">DORTIS / PORTFOLIO INSTANCE</p>
        <h1>{sourceProfile.name}</h1>
        <p>Đang kế thừa <strong>{template.name}</strong> · phiên bản {template.version}.
          Form lấy chữ theo {sourcePages.length} mục trong Hồ sơ nghệ sĩ đã nhập PDF.
          Ảnh bạn tải vào đây sẽ được giữ riêng, không dùng ảnh cắt từ PDF.</p></div>
      <div className="pt-editor__actions">
        <button type="button" className="pt-btn pt-btn--light" disabled={busy}
          onClick={()=>{if(confirmLeave())onBack()}}>{backLabel}</button>
        <button type="button" className="pt-btn pt-btn--light"
          disabled={busy||refreshingProfile} onClick={refreshSource}>
          {refreshingProfile?'Đang cập nhật...':'↻ Đọc lại Hồ sơ nghệ sĩ'}
        </button>
        {published&&<a className="pt-btn pt-btn--light" href={websitePath} target="_blank" rel="noopener">Xem website</a>}
        <button type="button" className="pt-btn" disabled={busy} onClick={publishWebsite}>
          {published?'Cập nhật website':'Tạo website'}
        </button>
        <button type="button" className="pt-btn" disabled={!dirty||busy}
          onClick={save}>{busy?'Đang xử lý...':dirty?'Lưu thay đổi':'Đã lưu'}</button>
      </div>
    </header>
    {error&&<p className="pt-alert" role="alert">{error}</p>}
    {notice&&<p className="pt-note" role="status">{notice}</p>}
    <PortfolioPalettePicker
      heading="Bảng màu Portfolio" value={
        normalizeTemplateBlueprint(template).visualTheme==='silk-flow'&&
        !paletteOptionsForTheme('silk-flow').some(p=>p.id===content.colorPalette)?
          normalizeTemplateBlueprint(template).colorPalette:
          content.colorPalette||normalizeTemplateBlueprint(template).colorPalette}
      options={paletteOptionsForTheme(normalizeTemplateBlueprint(template).visualTheme)}
      hint="Chọn màu để đổi ngay trên bản xem trước. Lưu thay đổi và cập nhật website để xuất bản."
      disabled={busy}
      onChange={palette=>{
        setContent(previous=>({...previous,colorPalette:palette}))
        setDirty(true);setNotice('')
      }}
      onReset={content.colorPalette?()=>{
        setContent(previous=>{
          const {colorPalette,...rest}=previous
          return rest
        })
        setDirty(true);setNotice('')
      }:null}/>
    <div className="pt-editor__layout">
      <aside className="pt-editor__sidebar" inert={busy}>
        <h2>01 / Các khu vực</h2>
        <div className="pt-editor__sections">
          {sections.map((section,i)=><button key={section.id} type="button"
            className={current?.id===section.id?'is-selected':''}
            onClick={()=>selectSection(section)}>
            <span>{String(i+1).padStart(2,'0')}</span>{section.label}
            <small>{section.slots} ảnh</small>
          </button>)}
        </div>
        <button type="button" className="pt-btn pt-btn--light"
          disabled={busy||sections.length>=12} onClick={addSection}>
          + Thêm khu vực ({sections.length}/12)
        </button>
        {current&&<div className="pt-editor__form" key={current.id}>
          <h2>02 / Nội dung: {current.label}</h2>
          <label>Nền mặc định của Portfolio
            <select value={content.defaultBackdrop||''} onChange={event=>{
              const defaultBackdrop=event.target.value
              setContent(previous=>({...previous,defaultBackdrop}))
            }}>
              <option value="">Theo thiết kế hiện tại</option>
              <option value={LUXURY_RIBBON}>Lụa đỏ ánh kim</option>
            </select>
          </label>
          <label>Nền khu vực
            <select value={content.sectionBackdrops?.[current.id]||''} onChange={event=>{
              const backdrop=event.target.value
              setContent(previous=>({...previous,
                sectionBackdrops:{...previous.sectionBackdrops,[current.id]:backdrop}}))
            }}>
              <option value="">Theo Portfolio</option>
              <option value={LUXURY_RIBBON}>Lụa đỏ ánh kim</option>
              <option value="none">Tắt nền lụa</option>
            </select>
          </label>
          <div className="pt-editor__source">
            <span className="pt-overline">KẾ THỪA CÁC MỤC TỪ HỒ SƠ PDF</span>
            <p>{sourcePages.length?sourcePages.length+' mục đang có trong Hồ sơ nghệ sĩ. Khi sửa hồ sơ, bạn bấm Đọc lại để đồng bộ chữ đã liên kết.':
              'Hồ sơ nghệ sĩ chưa có mục chữ. Tải PDF từ trang Hồ sơ nghệ sĩ.'}</p>
            <label>Chọn mục nguồn để điền vào phần này
              <select value={sourcePage||String(currentOwn.sourcePage||'')} disabled={busy||!sourcePages.length}
                onChange={e=>setSourcePage(e.target.value)}>
                <option value="">Chọn trang PDF / mục nội dung</option>
                {sourcePages.map(p=><option key={p.page} value={p.page}>
                  Trang {String(p.page).padStart(2,'0')} · {p.title||'Chưa có tiêu đề'}
                </option>)}
              </select>
            </label>
            <button type="button" className="pt-btn pt-btn--light"
              disabled={busy||!sourcePage} onClick={()=>importCurrentSource()}>
              Lấy chữ của mục đã chọn ↓
            </button>
            {suggestedSource&&!sourcePage&&<button type="button" className="pt-btn pt-btn--light"
              disabled={busy} onClick={()=>importCurrentSource(suggestedSource.page)}>
              Dùng mục gợi ý · Trang {suggestedSource.page} · {suggestedSource.title||'Chưa đặt tiêu đề'}
            </button>}
            {currentOwn.sourcePage&&<small>
              <strong>Đang liên kết trang {currentOwn.sourcePage}.</strong> Chữ mặc định lấy từ Hồ sơ nghệ sĩ;
              chỉ phần bạn trực tiếp thay trong Form mới là bản tùy chỉnh.
            </small>}
            {currentOwn.sourcePage&&Object.values(currentOwn.fieldOverrides||{}).some(Boolean)&&
              <button type="button" className="pt-btn pt-btn--light"
                onClick={restoreSourceText} disabled={busy}>Khôi phục chữ từ Hồ sơ nghệ sĩ ↺</button>}
          </div>
          <label>Nhãn phụ
            <input id="pt-edit-eyebrow" type="text" value={sourceBoundField(sourceProfile,content,current.id,'eyebrow')}
              onChange={e=>changeText('eyebrow',e.target.value)} placeholder="Nhãn phụ lấy từ mục PDF"/>
          </label>
          <label>Tiêu đề
            <input id="pt-edit-title" type="text" value={sourceBoundField(sourceProfile,content,current.id,'title')||
              (current.id==='hero'?sourceProfile.name:'')}
              onChange={e=>changeText('title',e.target.value)} placeholder="Tiêu đề trong Hồ sơ nghệ sĩ"/>
          </label>
          <label>Mô tả
            <textarea id="pt-edit-body" rows={4} value={sourceBoundField(sourceProfile,content,current.id,'body')}
              onChange={e=>changeText('body',e.target.value)} placeholder="Nội dung từ mục PDF đã duyệt..."/>
          </label>
          <div className="pt-editor__design-toggle">
            <div><strong>03 / THIẾT KẾ LAYER RIÊNG</strong>
              <small>{scene?'Kéo thả các lớp đã thiết kế trong bản xem trước.':
                'Tạo bố cục layer riêng sẽ đổi cách dàn trang của khu vực này.'}</small></div>
            <button type="button" onClick={scene?beginVisualEdit:createLayerLayout} className="pt-btn"
              disabled={busy}>{scene?'✥ Chỉnh layer trực tiếp':'✦ Tạo bố cục layer riêng'}</button>
          </div>
          {scene&&<SceneLayerInspector
            scene={scene} section={current}
            selectedLayer={selectedLayer} onSelectLayer={setSelectedLayer}
            onPatchLayer={patchLayer} onMoveElement={moveElement} onPatchBackground={changeBackground}
            onAddNote={addNote} onPatchNote={editNote}
            onRemoveNote={deleteNote} onReset={resetPage}
            onDisable={disablePageDesign} onArrangeImages={autoArrangeImages}
            onChangeText={changeText}
            textForField={field=>sourceBoundField(sourceProfile,content,current.id,field)||
              (field==='title'&&current.id==='hero'?sourceProfile.name:'')}/>}
          {current.slots>0&&<label>Bố cục ảnh
            <select value={content.effects?.[current.id]||''}
              disabled={busy||Boolean(scene)} onChange={event=>changeSectionEffect(event.target.value)}>
              <option value="">Theo mẫu ({current.effect==='ribbon'?'Sân khấu dải lụa':current.label})</option>
              <option value="ribbon">Sân khấu dải lụa</option>
            </select>
          </label>}
          {sectionEffect==='ribbon'&&current.slots>0&&!scene&&<>
            <p>Ô 1 là chân dung chính. Dùng ô 2 và 3 cho ảnh biểu diễn hai bên.</p>
            <PortraitCutout key={current.id} disabled={busy}
              onApply={file=>upload(current,0,file,true)}/>
          </>}
          <h3>04 / Ảnh riêng của khu vực ({current.slots})</h3>
          <p>Chọn ảnh gốc từ máy, tối đa 4 MB/ảnh. Không cắt hoặc nhập ảnh từ PDF.</p>
          {current.slots===0&&<p className="pt-editor__hint">Khu vực chỉ có chữ. Có thể thêm vị trí ảnh khi chỉnh bố cục form gốc.</p>}
          <div className="pt-editor__uploads">
            {Array.from({length:current.slots},(_,index)=>{
              const slot=getSlot(current,index),image=content.images?.[slot],url=image?.path&&urls[image.path]
              return <div className="pt-upload" key={slot}>
                <div className="pt-upload__head"><strong>Ảnh {index+1}</strong>
                  {image?.path&&<button type="button" disabled={busy} onClick={()=>removeImage(current,index)}>Xóa ảnh</button>}
                </div>
                <label className="pt-upload__area">
                  {url?<img src={url} alt={image?.alt||''}/>:
                    <span>+ <small>Chọn ảnh để tải lên</small></span>}
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/avif"
                    disabled={busy} onChange={e=>{
                      const file=e.target.files?.[0]
                      if(file)upload(current,index,file)
                      e.target.value=''
                    }}/>
                </label>
                {image?.path&&<>
                  <input type="text" value={image.alt||''}
                    placeholder="Mô tả ảnh (alt text)" onChange={e=>changeAlt(current,index,e.target.value)}/>
                  <label className="pt-upload__cutout-option">
                    <input type="checkbox" checked={isCutoutArtwork(image)}
                      disabled={busy} onChange={e=>changeCutout(current,index,e.target.checked)}/>
                    <span>Ảnh tách nền / PNG trong suốt</span>
                  </label>
                  {isCutoutArtwork(image)&&<label className="pt-upload__stage-option">
                    <span>Hiệu ứng trang trí phía sau PNG</span>
                    <select value={cutoutStageStyle(image)||'aura'} disabled={busy}
                      onChange={e=>changeCutoutStyle(current,index,e.target.value)}>
                      {CUTOUT_STAGE_STYLES.map(style=>
                        <option key={style.id} value={style.id}>{style.label}</option>)}
                    </select>
                    <small>Bóng đi theo chủ thể, không tạo bóng hình chữ nhật.</small>
                  </label>}
                  <div className="pt-upload__motion">
                    <strong>Chuyển động ảnh · CSS 3D</strong>
                    <label>Kiểu chuyển động
                      <select value={photoMotionMode(image)} disabled={busy}
                        onChange={event=>changePhotoMotion(current,index,{motion:event.target.value})}>
                        <optgroup label="Theo chuột · 3 kiểu">
                          {PHOTO_MOTION_OPTIONS.filter(option=>supportsPhotoPointer(option.id))
                            .map(option=><option key={option.id} value={option.id}>{option.label}</option>)}
                        </optgroup>
                        <optgroup label="Tự chuyển động · không theo chuột">
                          {PHOTO_MOTION_OPTIONS.filter(option=>!supportsPhotoPointer(option.id))
                            .map(option=><option key={option.id} value={option.id}>{option.label}</option>)}
                        </optgroup>
                      </select>
                    </label>
                    <label className="pt-upload__motion-intensity">
                      <span>Cường độ · {photoMotionIntensity(image)}%</span>
                      <input type="range" min="0" max="100" step="5"
                        value={photoMotionIntensity(image)} disabled={busy}
                        onChange={event=>changePhotoMotion(current,index,{
                          motionIntensity:Number(event.target.value)
                        })}/>
                    </label>
                    {supportsPhotoPointer(photoMotionMode(image))&&
                      <label className="pt-upload__motion-pointer">
                        <input type="checkbox" checked={photoMotionPointer(image)}
                          disabled={busy}
                          onChange={event=>changePhotoMotion(current,index,{
                            motionPointer:event.target.checked
                          })}/>
                        <span>Phản ứng theo vị trí chuột</span>
                      </label>}
                    <small>Chỉ Chiều sâu 3D, Nghiêng 3D và Hút theo chuột phản ứng với con trỏ.
                      Các kiểu còn lại tự chuyển động; Sóng nước làm méo ảnh nhẹ theo mặt nước.
                      Khi chỉnh trực tiếp hoặc bật giảm chuyển động, ảnh sẽ đứng yên.</small>
                  </div>
                </>}
              </div>
            })}
          </div>
        </div>}
      </aside>
      <section className="pt-editor__preview" ref={previewRef}>
        <div className="pt-editor__preview-head"><div>
          <strong>{visualEditing?'CHỈNH TRỰC TIẾP · '+template.name:
            'ĐANG CHỈNH SỬA · '+template.name}</strong>
          <span> {visualEditing?(scene?'Kéo thả layer của '+current.label:'Bấm để sửa chữ, kéo để di chuyển · '+current.label):
            'Đây là mẫu đang gán cho nghệ sĩ. Xem mẫu khác không thay đổi bản lưu.'}</span>
        </div><div className="pt-editor__preview-controls">
          {onPreviewOther&&<button type="button"
            className="pt-editor__compare-template"
            disabled={busy}
            onClick={()=>{if(confirmLeave())onPreviewOther()}}>
            Xem trước {otherTemplateName||'mẫu còn lại'} ↗
          </button>}
          <button type="button" className={'pt-editor__view-button'+(visualEditing?' is-active':'')}
            disabled={busy} onClick={()=>visualEditing?setVisualEditing(false):beginVisualEdit()}>
            {visualEditing?'◧ Xem toàn bộ bản hiện tại':'✥ Chỉnh trực tiếp trang này'}
          </button>
          {visualEditing&&current.slots>0&&<button type="button"
            className={'pt-editor__view-button'+(lockImageRatio?' is-active':'')}
            aria-pressed={lockImageRatio} onClick={()=>setLockImageRatio(value=>!value)}>
            Khóa tỷ lệ ảnh · {lockImageRatio?'Bật':'Tắt'}
          </button>}
          <div className="pt-segment">
          <button type="button" className={device==='desktop'?'is-active':''}
            onClick={()=>setDevice('desktop')}>Desktop · 16:9</button>
          <button type="button" className={device==='mobile'?'is-active':''}
            onClick={()=>{setDevice('mobile');setSelectedLayer('title')}}>Mobile</button>
        </div></div></div>
        {visualEditing&&current&&<fieldset className="pt-type-tools" disabled={busy}>
          <legend>Kiểu chữ · {device==='desktop'?'Desktop':'Mobile'}</legend>
          <label>Phần chữ
            <select value={textLayer} onChange={event=>setSelectedLayer(event.target.value)}>
              {textLayers.map(id=><option key={id} value={id}>{sceneLayerTitle(id)}</option>)}
            </select>
          </label>
          <label>Font
            <select value={textStyle.font??''} onChange={event=>patchTypography({font:event.target.value||null})}>
              {!scene&&<option value="">Theo mẫu</option>}
              {SCENE_FONTS.map(font=><option key={font.id} value={font.id}>{font.label}</option>)}
            </select>
          </label>
          <label>Cỡ chữ (px)
            <input key={current.id+device+textLayer+'size'+textStyle.size} type="number" min="8" max="180" step="1"
              defaultValue={textStyle.size??''} placeholder="Theo mẫu"
              onBlur={event=>updateTypographyNumber(event,'size')} onKeyDown={event=>{if(event.key==='Enter')event.currentTarget.blur()}}/>
          </label>
          <label>Giãn dòng
            <input key={current.id+device+textLayer+'lineHeight'+textStyle.lineHeight} type="number" min=".7" max="3" step=".05"
              defaultValue={textStyle.lineHeight??''} placeholder="Theo mẫu"
              onBlur={event=>updateTypographyNumber(event,'lineHeight')} onKeyDown={event=>{if(event.key==='Enter')event.currentTarget.blur()}}/>
          </label>
          <button type="button" className="pt-btn pt-btn--light" onClick={resetTypography}>
            Đặt lại kiểu chữ
          </button>
          <div className="pt-type-tools__quick">
            <strong>Bố cục nhanh · {sceneLayerTitle(textLayer)}</strong>
            <div className="pt-type-tools__quick-buttons" role="group"
              aria-label={'Căn nhanh '+sceneLayerTitle(textLayer)}>
              {TEXT_QUICK_LAYOUTS.map(option=><button key={option.id}
                type="button" className="pt-type-tools__quick-button"
                title={option.label+' · giữ nguyên cỡ chữ'}
                onClick={()=>quickPlaceText(option.id)}>
                  <span aria-hidden="true">{option.symbol}</span>
                  {option.label}
                </button>)}
              <button type="button" className="pt-type-tools__quick-button is-reset"
                onClick={resetTextPlacement}>Mặc định</button>
            </div>
            <small>Chỉ thay đổi phần chữ đang chọn trên {device==='desktop'?'Desktop':'Mobile'}.
              Căn trái, giữa, phải hoặc nghiêng chéo; không phóng to hay thu nhỏ chữ.</small>
          </div>
        </fieldset>}
        <PortfolioTemplateSite template={template} instance={{...instance,content}} profile={sourceProfile}
          urls={urls} device={device}
          editSectionId={visualEditing&&!busy?current.id:''} motionPaused={visualEditing}
          selectedLayer={selectedLayer} lockImageRatio={lockImageRatio}
          onSelectLayer={setSelectedLayer}
          onSelectSection={visualEditing&&!busy?id=>{
            const section=sections.find(item=>item.id===id)
            if(section)selectSection(section)
          }:undefined}
          onPatchLayer={patchLayer} onMoveElement={moveElement}
          onUploadImage={(index,file)=>upload(current,index,file)} onAddNote={addNote}
          onEditText={field=>{
            setSelectedLayer(field)
            document.getElementById('pt-edit-'+field)?.focus()
          }}/>
      </section>
    </div>
  </div>
}
