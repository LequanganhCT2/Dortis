import React,{useEffect,useRef,useState} from 'react'
import {resolveArtistPortfolio} from './resolvedPortfolio'
import {chooseSectionEffect,sectionHasRealImage} from './visualEffects'
import {getScene,sceneFont,resizeDimensions} from './sectionDesign'
import SectionArtboard from './SectionArtboard'
import SilkStageBackdrop from './SilkStageBackdrop'
import PortfolioGlowOverlay from './PortfolioGlowOverlay'
import RibbonLuxuryBackground from './RibbonLuxuryBackground'
import {LUXURY_RIBBON} from './model'
import './template-site.css'
import RibbonPortfolioSection from './RibbonPortfolioSection'
import {isTextFrame,storedTextWidth,measuredTextWidth,resizeTextWidth,textBoxWidthStyle} from './textFrameSizing'
import {isCutoutArtwork,cutoutStageStyle} from './imagePresentation'
import './portfolio-effects.css'
import './silk-stage-backdrop.css'
import './cutout-stage.css'

/** Preview and future renderer share exactly the same source-bound markup.
 * Visual effects never alter the stored profile text or the original images.
 */
function MotionSection({section,index,styleName,urls,artistRole,isPublic,continuousSilk=false,ribbonLayout='vertical',ribbonDirection='right',onEditText,onUploadImage,motionPaused,selectedLayer,positions,typography,onMoveElement,onSelectLayer,lockImageRatio}){
  const frame=useRef(0)
  const sectionRef=useRef(null)
  const drag=useRef(null),suppressClick=useRef(false),fileInput=useRef(null)
  const [imageMenu,setImageMenu]=useState(null)
  const realAssets=(section.images||[]).filter(asset=>asset?.path&&urls[asset.path])
  const hasImage=sectionHasRealImage(section,urls)
  const effect=chooseSectionEffect({effect:section.effect,layout:section.layout,
    index,style:styleName,imageCount:realAssets.length})
  const firstImage=realAssets[0]&&urls[realAssets[0].path]
  const tiles=section.images.map((asset,index)=>({asset,index}))
  if(effect==='spotlight'&&firstImage){
    const featured=tiles.findIndex(({asset})=>asset?.path&&urls[asset.path])
    if(featured>0)tiles.unshift(...tiles.splice(featured,1))
  }
  useEffect(()=>{
    if(motionPaused&&sectionRef.current)resetMotion(sectionRef.current)
    return ()=>{if(frame.current)cancelAnimationFrame(frame.current)}
  },[motionPaused])
  function handleMove(event){
    if(motionPaused||event.pointerType==='touch'||!hasImage||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return
    const element=event.currentTarget
    const bounds=element.getBoundingClientRect()
    if(!bounds.width||!bounds.height)return
    const x=(event.clientX-bounds.left)/bounds.width-.5
    const y=(event.clientY-bounds.top)/bounds.height-.5
    if(frame.current)cancelAnimationFrame(frame.current)
    frame.current=requestAnimationFrame(()=>{
      element.style.setProperty('--pt-rotate-x',(-y*5).toFixed(2)+'deg')
      element.style.setProperty('--pt-rotate-y',(x*7).toFixed(2)+'deg')
      element.style.setProperty('--pt-shift-x',(x*20).toFixed(1)+'px')
      element.style.setProperty('--pt-shift-y',(y*13).toFixed(1)+'px')
    })
  }
  function resetMotion(el){
    if(frame.current)cancelAnimationFrame(frame.current)
    frame.current=0
    for(const key of ['--pt-rotate-x','--pt-rotate-y','--pt-shift-x','--pt-shift-y'])el.style.removeProperty(key)
  }
  function imageDropSlot(target){
    const tile=target.closest('[data-image-slot]')
    return tile?Number(tile.dataset.imageSlot):section.images.findIndex(image=>!image?.path)
  }
  function allowImageDrop(event){
    if(!event.dataTransfer.types.includes('Files'))return
    event.preventDefault()
    event.dataTransfer.dropEffect=imageDropSlot(event.target)>=0?'copy':'none'
  }
  function dropImage(event){
    if(!event.dataTransfer.types.includes('Files'))return
    event.preventDefault()
    const slot=imageDropSlot(event.target)
    const file=event.dataTransfer.files[0]
    if(slot>=0&&file)onUploadImage(slot,file)
  }
  function positionProps(key){
    const initial=positions?.[key]||{x:0,y:0}
    const text=isTextFrame(key)
    const position={
      translate:initial.x||initial.y?initial.x+'% '+initial.y+'%':undefined,
      scale:!text&&initial.scaleX&&initial.scaleY?initial.scaleX+' '+initial.scaleY:undefined,
      ...(text?textBoxWidthStyle(initial):{}),
      '--pt-inverse-resize-x':!text&&initial.scaleX?1/initial.scaleX:undefined,
      '--pt-inverse-resize-y':!text&&initial.scaleY?1/initial.scaleY:undefined
    }
    if(!onMoveElement)return {style:position}
    return {
      style:position,
      'data-portfolio-movable':'',
      onPointerDown:event=>{
        if(event.button!==0||!event.isPrimary)return
        const {width,height}=event.currentTarget.getBoundingClientRect()
        if(!width||!height)return
        suppressClick.current=false
        onSelectLayer?.(key)
        drag.current={pointer:event.pointerId,startX:event.clientX,startY:event.clientY,
          initial,width,height,element:event.currentTarget}
        event.currentTarget.setPointerCapture(event.pointerId)
      },
      onPointerMove:event=>{
        const current=drag.current
        if(current?.pointer!==event.pointerId||current.element!==event.currentTarget)return
        const dx=event.clientX-current.startX,dy=event.clientY-current.startY
        if(!current.next&&Math.hypot(dx,dy)<5)return
        const clamp=value=>Math.max(-100,Math.min(100,Math.round(value*10)/10))
        current.next={...current.initial,x:clamp(current.initial.x+dx/current.width*100),
          y:clamp(current.initial.y+dy/current.height*100)}
        current.element.style.translate=current.next.x+'% '+current.next.y+'%'
      },
      onPointerUp:event=>{
        const current=drag.current
        if(current?.pointer!==event.pointerId||current.element!==event.currentTarget)return
        drag.current=null
        if(!current.next)return
        suppressClick.current=true
        onMoveElement(key,current.next)
      },
      onLostPointerCapture:event=>{
        const current=drag.current
        if(current?.pointer!==event.pointerId||current.element!==event.currentTarget)return
        drag.current=null
        current.element.style.translate=position.translate||''
      }
    }
  }
  function elementResizeProps(key,locked){
    const isText=isTextFrame(key)
    function setElementScale(element,x,y){
      element.style.scale=x+' '+y
      element.style.setProperty('--pt-inverse-resize-x',1/x)
      element.style.setProperty('--pt-inverse-resize-y',1/y)
    }
    function resize(current,dxPx,dyPx){
      if(current.isText){
        const widthPct=resizeTextWidth(current.startWidthPct,dxPx,current.parentWidth)
        current.next={...current.initial,widthPct}
        current.element.style.width=widthPct+'%'
        return
      }
      const {w,h}=resizeDimensions(current.scaleX,current.scaleY,
        dxPx*2/current.width,dyPx*2/current.height,{
          locked:current.locked,minWidth:.25,minHeight:.25,maxWidth:2,maxHeight:2
        })
      current.next={...current.initial,scaleX:w,scaleY:h}
      setElementScale(current.element,w,h)
    }
    function start(event){
      if(event.button!==0||!event.isPrimary)return
      event.stopPropagation()
      const element=event.currentTarget.parentElement
      const initial=positions?.[key]||{x:0,y:0}
      const parentWidth=element.parentElement?.getBoundingClientRect().width||element.offsetWidth
      drag.current={element,initial,pointer:event.pointerId,
        startX:event.clientX,startY:event.clientY,
        width:element.offsetWidth,height:element.offsetHeight,
        scaleX:initial.scaleX||1,scaleY:initial.scaleY||1,locked,isText,
        parentWidth,
        startWidthPct:storedTextWidth(initial)??measuredTextWidth(element.offsetWidth,parentWidth),
        originalStyleWidth:element.style.width}
      event.currentTarget.setPointerCapture(event.pointerId)
      event.preventDefault()
    }
    function move(event){
      const current=drag.current
      if(current?.pointer!==event.pointerId||!current.width||!current.height)return
      event.stopPropagation()
      resize(current,event.clientX-current.startX,event.clientY-current.startY)
    }
    function finish(event,save){
      const current=drag.current
      if(current?.pointer!==event.pointerId)return
      event.stopPropagation()
      drag.current=null
      if(save&&current.next)onMoveElement(key,current.next)
      else if(current.isText)current.element.style.width=current.originalStyleWidth
      else setElementScale(current.element,current.scaleX,current.scaleY)
    }
    return {
      onPointerDown:start,onPointerMove:move,onPointerUp:event=>finish(event,true),
      onPointerCancel:event=>finish(event,false),
      onLostPointerCapture:event=>finish(event,false),
      onKeyDown:event=>{
        const horizontal=event.key==='ArrowLeft'?-1:event.key==='ArrowRight'?1:0
        const vertical=event.key==='ArrowUp'?-1:event.key==='ArrowDown'?1:0
        if(!horizontal&&!vertical)return
        if(isText&&!horizontal)return
        event.preventDefault();event.stopPropagation()
        const initial=positions?.[key]||{x:0,y:0}
        const element=event.currentTarget.parentElement
        const parentWidth=element.parentElement?.getBoundingClientRect().width||element.offsetWidth
        if(isText){
          const start=storedTextWidth(initial)??measuredTextWidth(element.offsetWidth,parentWidth)
          onMoveElement(key,{...initial,widthPct:resizeTextWidth(start,
            parentWidth*horizontal*(event.shiftKey?10:2)/100,parentWidth)})
          return
        }
        const current={element,initial,width:element.offsetWidth,height:element.offsetHeight,
          scaleX:initial.scaleX||1,scaleY:initial.scaleY||1,locked,isText:false}
        resize(current,horizontal*.05*current.width/2,vertical*.05*current.height/2)
        onMoveElement(key,current.next)
      }
    }
  }
  function editTextProps(field){
    const placement=positionProps(field)
    placement['data-portfolio-text-frame']=field
    const type=typography?.[field]
    if(type)placement.style={
      ...placement.style,
      fontFamily:type.font?sceneFont(type.font):undefined,
      fontSize:Number.isFinite(type.size)?Math.max(8,Math.min(180,type.size)):undefined,
      lineHeight:Number.isFinite(type.lineHeight)?Math.max(.7,Math.min(3,type.lineHeight)):undefined
    }
    if(!onEditText)return placement
    return {
      ...placement,
      'data-portfolio-edit-field':field,
      'data-portfolio-edit-selected':selectedLayer===field?'true':undefined,
      tabIndex:0,
      onClick:()=>{
        if(!suppressClick.current)onEditText(field)
        suppressClick.current=false
      },
      onKeyDown:event=>{
        if(event.key==='Enter'||event.key===' '){
          event.preventDefault()
          onEditText(field)
        }
      }
    }
  }
  function textResizeHandle(field,label){
    if(!onMoveElement||selectedLayer!==field)return null
    return <button type="button" className="pt-artboard__handle pt-element-resize-handle"
      aria-label={'Điều chỉnh độ rộng khung '+label}
      title="Kéo ngang để đổi độ rộng khung, giữ nguyên cỡ chữ"
      onClick={event=>event.stopPropagation()}
      {...elementResizeProps(field,true)}>↔</button>
  }
  const textPresent=Boolean(section.title||section.body||section.eyebrow)
  const luxuryRibbon=section.backdrop===LUXURY_RIBBON
  return <section data-backdrop={section.backdrop} ref={sectionRef} id={'pt-'+section.id}
    className={'pt-site__section pt-layout--'+section.layout+
      ' pt-fx-section pt-fx--'+effect+
      (hasImage?' pt-fx--has-photo':' pt-fx--waiting-photo')+
      (effect==='ribbon'&&section.slots===1?' pt-ribbon--portrait':'')+
      (luxuryRibbon?' pt-section--luxury-ribbon':'')+
      (index===0?' is-first':'')}
    onPointerMove={handleMove} onPointerLeave={event=>resetMotion(event.currentTarget)}
    onDragOver={onUploadImage?allowImageDrop:undefined}
    onDrop={onUploadImage?dropImage:undefined}
    onContextMenu={onUploadImage&&section.slots?event=>{
      const slot=imageDropSlot(event.target)
      if(slot<0)return
      event.preventDefault()
      setImageMenu(slot)
    }:undefined}>
    {onUploadImage&&imageMenu!==null&&<div className="pt-site__image-menu">
      <button type="button" onClick={()=>fileInput.current?.click()}>
        {section.images[imageMenu]?.path?'Thay ảnh':'Thêm ảnh'} vào ô {imageMenu+1}
      </button>
      <button type="button" onClick={()=>setImageMenu(null)}>Đóng</button>
      <input ref={fileInput} type="file" hidden accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={event=>{
          const file=event.target.files?.[0]
          if(file)onUploadImage(imageMenu,file)
          setImageMenu(null)
        }}/>
    </div>}
    {luxuryRibbon&&!continuousSilk&&<RibbonLuxuryBackground layout={ribbonLayout} direction={ribbonDirection}/>}
    {firstImage&&!luxuryRibbon&&effect!=='ribbon'&&<div className="pt-fx__ambient" aria-hidden="true">
      <img src={firstImage} alt="" loading="lazy" decoding="async"/>
    </div>}

    {section.title&&<span className="pt-fx__type-echo" aria-hidden="true">{section.title}</span>}
    <div className="pt-site__copy" style={onEditText?{pointerEvents:'auto'}:undefined}>
      {(section.eyebrow||index===0||!isPublic)&&<small {...editTextProps('eyebrow')}>
        {section.eyebrow||(index===0&&artistRole?artistRole:section.label)}
        {textResizeHandle('eyebrow','nhãn phụ')}
      </small>}
      {section.title?<h2 {...editTextProps('title')}>{section.title}{textResizeHandle('title','tiêu đề')}</h2>:
        onEditText&&<button type="button" className="pt-copy-add" onClick={()=>onEditText('title')}>Thêm tiêu đề</button>}
      {section.body?<p {...editTextProps('body')}>{section.body}{textResizeHandle('body','nội dung')}</p>:
        onEditText?<button type="button" className="pt-copy-add" onClick={()=>onEditText('body')}>Thêm mô tả</button>:
        !isPublic&&<p className="pt-site__placeholder-text">
          {section.sourceStatus==='missing'
            ?'Mục liên kết không còn trong Hồ sơ nghệ sĩ. Hãy chọn lại nguồn.'
            :textPresent?'':section.sourceStatus==='linked'?'Mục đã chọn chưa có chữ.':'Chọn mục PDF nguồn hoặc nhập tiêu đề cho khu vực này.'}
        </p>}
      {section.sourceStatus==='linked'&&<span className="pt-fx__source-note">
        Hồ sơ nghệ sĩ · Trang {String(section.sourcePage).padStart(2,'0')}
      </span>}
    </div>
    {section.slots>0&&<div className="pt-site__media" aria-label={'Ảnh khu vực '+section.label}>
      {tiles.map(({asset,index:i})=>{
        const url=asset?.path?urls[asset.path]:null
        if(isPublic&&!url)return null
        return <div key={section.id+':'+i} data-image-slot={onUploadImage?i:undefined} {...positionProps('image:'+i)}
          className={'pt-site__media-tile pt-fx__tile'+(!url?' is-empty':'')+(isCutoutArtwork(asset)?' is-cutout pt-cutout-stage pt-cutout-stage--'+cutoutStageStyle(asset):'')}
          data-ribbon-slot={effect==='ribbon'?i:undefined}
          data-image-selected={onMoveElement&&url&&selectedLayer==='image:'+i?'true':undefined}>
          {url?<img src={url} draggable={onMoveElement?false:undefined} alt={asset?.alt||section.title||section.label}
            loading={index===0&&i===0?'eager':'lazy'} decoding="async"/>:
            <div className="pt-site__empty-image">
              <span aria-hidden="true">+</span>
              <small>ẢNH {String(i+1).padStart(2,'0')}</small>
              <em>{onUploadImage?'Thả ảnh từ máy vào đây':'Tải ảnh riêng trong Admin'}</em>
            </div>}
          {url&&onMoveElement&&selectedLayer==='image:'+i&&<button type="button"
            className="pt-artboard__handle pt-element-resize-handle"
            aria-label={'Đổi kích thước ảnh '+(i+1)}
            {...elementResizeProps('image:'+i,lockImageRatio)}>↘</button>}
        </div>
      })}
    </div>}
    <span className="pt-fx__detail" aria-hidden="true"/>
  </section>
}
export default function PortfolioTemplateSite({
  template,instance,profile,urls={},device='desktop',
  focusedSectionId='',editSectionId='',selectedLayer='',lockImageRatio=true,
  onSelectLayer,onPatchLayer,onUploadImage,onAddNote,onEditText,onMoveElement,onSelectSection,publishedView,motionPaused=false
}){
  const view=publishedView||resolveArtistPortfolio(template,instance,profile)
  const useClassic=(publishedView&&!view.visualTheme)||view.visualTheme==='classic'||instance?.content?.visualTheme==='classic'
  const visibleSections=focusedSectionId?
    view.sections.filter(s=>s.id===focusedSectionId):view.sections
  const hasSilk=useClassic&&view.sections.some(section=>section.effect==='ribbon'&&!section.backdrop)
  const hasArtboardSilk=view.sections.some(section=>{
    const design=getScene(instance?.content||{},section,device)
    return design?.background==='ribbon-luxury'
  })
  const continuousSilk=!useClassic||hasSilk||hasArtboardSilk||
    view.sections.some(section=>section.backdrop===LUXURY_RIBBON)
  const activeSections=view.sections.filter(s=>s.title||s.body||s.slots)
  return <div className={'pt-device pt-device--'+device+(focusedSectionId?' pt-device--focused':'')}>
    <main className={'pt-site pt-site--'+view.style+(useClassic?'':' pt-site--ribbon')+(continuousSilk?' pt-site--silk pt-site--continuous-silk':'')+(motionPaused?' pt-site--motion-paused':'')} aria-label={publishedView?view.artistName:'Xem trước '+view.templateName}
      onClickCapture={onSelectSection?event=>{
        const page=event.target.closest('section[id^="pt-"]')
        if(!page)return
        const id=page.id.slice(3)
        if(id!==editSectionId)onSelectSection(id)
      }:undefined}>
      {continuousSilk&&<SilkStageBackdrop layout={view.ribbonLayout||'diagonal'}
        direction={view.ribbonDirection||'down-right'} motionPaused={motionPaused}/>}
    {!focusedSectionId&&<header className="pt-site__nav">
        <strong>{view.artistName||'Chưa có tên trong hồ sơ'}<span>.</span></strong>
        <nav aria-label="Điều hướng Portfolio">
          {activeSections.slice(0,4).map(s=><a key={s.id}
            href={'#pt-'+s.id}>{s.title?s.title.slice(0,27):s.label}</a>)}
        </nav>
        <span className="pt-site__nav-meta">{view.artistRole||'PORTFOLIO'}</span>
      </header>}
      {visibleSections.map(section=>{
        const index=view.sections.findIndex(item=>item.id===section.id)
        const scene=getScene(instance?.content||{},section,device)
        return scene?<SectionArtboard key={section.id} index={index}
          continuousSilk={continuousSilk}
          ribbonLayout={view.ribbonLayout||'vertical'} ribbonDirection={view.ribbonDirection||'right'}
          section={section} scene={scene} device={device} urls={urls}
          editable={editSectionId===section.id}
          selectedLayer={selectedLayer} lockImageRatio={lockImageRatio}
          onSelectLayer={onSelectLayer} onPatchLayer={onPatchLayer}
          onUploadImage={onUploadImage} onAddNote={onAddNote}/>:
          useClassic?
          <MotionSection key={section.id} section={section} index={index}
            continuousSilk={continuousSilk}
            ribbonLayout={view.ribbonLayout||'vertical'} ribbonDirection={view.ribbonDirection||'right'}
            positions={instance?.content?.positions?.[section.id]?.[device]}
            typography={instance?.content?.typography?.[section.id]?.[device]}
            onMoveElement={editSectionId===section.id?onMoveElement:undefined}
            onSelectLayer={onSelectLayer} lockImageRatio={lockImageRatio}
            styleName={view.style} urls={urls} artistRole={view.artistRole} isPublic={Boolean(publishedView)}
            motionPaused={motionPaused} selectedLayer={selectedLayer} onEditText={editSectionId===section.id?onEditText:undefined}
            onUploadImage={editSectionId===section.id?onUploadImage:undefined}/>:
          <RibbonPortfolioSection key={section.id} section={section}
            index={index} urls={urls} artistRole={view.artistRole}
            isPublic={Boolean(publishedView)}
            positions={instance?.content?.positions?.[section.id]?.[device]}
            typography={instance?.content?.typography?.[section.id]?.[device]}
            selectedLayer={selectedLayer} lockImageRatio={lockImageRatio}
            onMoveElement={editSectionId===section.id?onMoveElement:undefined}
            onSelectLayer={editSectionId===section.id?onSelectLayer:undefined}
            onEditText={editSectionId===section.id?onEditText:undefined}
            onUploadImage={editSectionId===section.id?onUploadImage:undefined}/>
      })}
      {!focusedSectionId&&<footer className="pt-site__footer">
        <span>{view.artistName||'PORTFOLIO'}</span>
        {!publishedView&&<small>Bản xem trước nội bộ</small>}
      </footer>}
      {continuousSilk&&<PortfolioGlowOverlay opacity={view.glowOpacity??.28}/>}
    </main>
  </div>
}
