import React,{useRef,useState} from 'react'
import {
  sceneGradient,sceneFont,sceneLayerIds,sceneLayerTitle,sceneLayerType,resizeDimensions
} from './sectionDesign.js'
import RibbonLuxuryBackground from './RibbonLuxuryBackground'
import {LUXURY_RIBBON} from './model'
import {isCutoutArtwork,cutoutStageStyle} from './imagePresentation'
import PhotoMotion from './PhotoMotion'
import CharacterBurst from './CharacterBurst'
import PortfolioRibbonBackdrop from './PortfolioRibbonBackdrop'
import './section-artboard.css'

const clamp=(v,min,max)=>Math.max(min,Math.min(max,v))
const snap=v=>Math.round(v*2)/2
function ribbonTextColor(color){
  const channels=[1,3,5].map(offset=>{
    const srgb=parseInt(color.slice(offset,offset+2),16)/255
    return srgb<=.04045?srgb/12.92:((srgb+.055)/1.055)**2.4
  })
  const luminance=channels[0]*.2126+channels[1]*.7152+channels[2]*.0722
  return luminance<.53?'#fff1e0':color
}
function toPosition(layer,board){
  return {left:layer.x+'%',top:layer.y+'%',width:layer.w+'%',height:layer.h+'%',
    zIndex:layer.z,opacity:layer.opacity/100,
    transform:'rotate('+layer.rotation+'deg)'}
}
function LayerElement({section,layerId,layer,scene,urls,device,editable,selected,
  onSelectLayer,onPatchLayer,boardRef,dragRef,lockImageRatio,continuousSilk=false}){
  const type=sceneLayerType(layerId)
  const index=type==='image'?Number(layerId.split(':')[1]):-1
  const image=index>=0?section.images[index]:null
  const url=image?.path?urls[image.path]:null
  const note=layerId.startsWith('note:')?scene.notes.find(n=>'note:'+n.id===layerId):null
  const source=layerId==='title'?section.title:
    layerId==='eyebrow'?section.eyebrow:
    layerId==='body'?section.body:note?.text||''
  const label=sceneLayerTitle(layerId)
  const ratio=device==='mobile'?390:1200
  const textStyle={
    color:section.backdrop===LUXURY_RIBBON||continuousSilk?ribbonTextColor(layer.color):layer.color,textAlign:layer.align,fontFamily:sceneFont(layer.font),
    fontWeight:layer.weight,lineHeight:layer.lineHeight,
    letterSpacing:layer.spacing+'px',whiteSpace:'pre-line',
    fontSize:'clamp(9px,'+(layer.size*100/ratio).toFixed(3)+'cqw,180px)',
    textShadow:layerId==='title'?'0 7px 22px #0a132837':'none',
    filter:layer.blur?'blur('+layer.blur+'px)':'none',
    overflowWrap:'anywhere'
  }
  const startDrag=(event,mode)=>{
    if(!editable||event.button!==0||layer.hidden||!event.isPrimary)return
    event.stopPropagation()
    const bounds=boardRef.current?.getBoundingClientRect()
    if(!bounds?.width||!bounds?.height)return
    dragRef.current={
      id:layerId,mode,pointerId:event.pointerId,
      startX:event.clientX,startY:event.clientY,
      layer:{...layer},bounds,locked:type==='image'&&lockImageRatio
    }
    onSelectLayer?.(layerId)
    event.currentTarget.focus({preventScroll:true})
    event.currentTarget.setPointerCapture?.(event.pointerId)
    event.preventDefault()
  }
  const moveDrag=event=>{
    const d=dragRef.current
    if(!d||d.id!==layerId||d.pointerId!==event.pointerId||!editable)return
    event.stopPropagation()
    const dx=(event.clientX-d.startX)/d.bounds.width*100
    const dy=(event.clientY-d.startY)/d.bounds.height*100
    if(d.mode==='resize'){
      if(type==='text'){
        // A text frame reflows at a new width, preserving its font and height.
        const w=snap(clamp(d.layer.w+dx,8,100-d.layer.x))
        if(w===d.lastW)return
        d.lastW=w
        onPatchLayer?.(layerId,{w})
      }else{
        const size=resizeDimensions(d.layer.w,d.layer.h,dx,dy,{
          locked:d.locked,minWidth:8,minHeight:3,maxWidth:100-d.layer.x,maxHeight:100-d.layer.y
        })
        const w=d.locked?size.w:snap(size.w),h=d.locked?size.h:snap(size.h)
        if(w===d.lastW&&h===d.lastH)return
        d.lastW=w;d.lastH=h
        onPatchLayer?.(layerId,{w,h})
      }
    }else{
      const x=snap(clamp(d.layer.x+dx,0,100-d.layer.w))
      const y=snap(clamp(d.layer.y+dy,0,100-d.layer.h))
      if(x===d.lastX&&y===d.lastY)return
      d.lastX=x;d.lastY=y
      onPatchLayer?.(layerId,{x,y})
    }
  }
  const endDrag=event=>{
    const drag=dragRef.current
    if(drag?.id===layerId&&drag.pointerId===event.pointerId)dragRef.current=null
  }
  const keyDown=event=>{
    if(!editable||layer.hidden||!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key))return
    event.stopPropagation();event.preventDefault()
    const amount=event.shiftKey?5:.5
    const dx=event.key==='ArrowLeft'?-amount:event.key==='ArrowRight'?amount:0
    const dy=event.key==='ArrowUp'?-amount:event.key==='ArrowDown'?amount:0
    onSelectLayer?.(layerId)
    onPatchLayer?.(layerId,{
      x:snap(clamp(layer.x+dx,0,100-layer.w)),
      y:snap(clamp(layer.y+dy,0,100-layer.h))
    })
  }
  if(layer.hidden&&!editable)return null
  const visible=Boolean(source||url||editable)
  if(!visible)return null
  return <div
    data-image-slot={index>=0?index:undefined}
    role={editable?'button':undefined}
    tabIndex={editable?0:undefined}
    aria-label={editable?'Kéo layer '+label+', dùng phím mũi tên để di chuyển':undefined}
    aria-pressed={editable?Boolean(selected):undefined}
    className={'pt-artboard__layer '+(type==='image'?'is-image':'is-text')+
      (type==='image'&&isCutoutArtwork(image)?' is-cutout pt-cutout-stage pt-cutout-stage--'+cutoutStageStyle(image):'')+
      (selected&&editable?' is-selected':'')+
      (editable?' is-editable':'')+
      (layer.hidden?' is-hidden':'')}
    style={toPosition(layer)}
    onPointerDown={event=>startDrag(event,'move')}
    onPointerMove={moveDrag}
    onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag}
    onKeyDown={keyDown}
    onClick={event=>{event.stopPropagation();if(editable)onSelectLayer?.(layerId)}}>
    {type==='image'
      ? <div className="pt-artboard__photo" style={{
          borderRadius:layer.radius+'px',
          filter:layer.blur?'blur('+layer.blur+'px)':'none'
        }}>
          {url?<PhotoMotion asset={image} paused={editable} revealOrder={index>=0?index:0}>
            <img src={url} alt={image?.alt||label} draggable={false}
              loading="lazy" decoding="async"
              style={{objectFit:isCutoutArtwork(image)?'contain':layer.fit}}/>
          </PhotoMotion>:
            <div className="pt-artboard__empty">+<small>{label}<br/>Tải ảnh ở bảng bên trái</small></div>}
        </div>
      : <div className="pt-artboard__text" style={textStyle}
          data-pt-scroll-reveal={layerId==='title'?'title':layerId==='eyebrow'?'eyebrow':'body'}>
          <CharacterBurst text={source||'Chạm để chỉnh '+label}
            disabled={editable} maxCharacters={layerId==='body'?140:160}/>
        </div>}
    {editable&&selected&&<div className="pt-artboard__selection">
      <span>{label}</span>
      <button type="button"
        className={'pt-artboard__handle'+(type==='text'?' pt-artboard__handle--width':'')}
        aria-label={type==='text'?'Kéo để đổi độ rộng khung '+label:
          'Kéo để thay đổi kích thước '+label}
        title={type==='text'?'Chỉ thay đổi độ rộng khung, không đổi cỡ chữ':undefined}
        onPointerDown={event=>startDrag(event,'resize')}
        onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag}
      >{type==='text'?'↔':'↘'}</button>
    </div>}
  </div>
}
/** This exact artboard is used in edit mode and live full preview.
 * The shared form provides the slots and section structure; this scene
 * provides only artist-specific positions and styling.
 */
export default function SectionArtboard({
  section,scene,device='desktop',urls={},editable=false,
  index=0,ribbonLayout='vertical',ribbonDirection='right',continuousSilk=false,
  selectedLayer='',onSelectLayer,
  onPatchLayer,onUploadImage,onAddNote,lockImageRatio=true
}){
  const boardRef=useRef(null),dragRef=useRef(null)
  const fileRef=useRef(null),pendingSlot=useRef(null)
  const [menu,setMenu]=useState(null)
  function emptySlot(){
    return (section.images||[]).findIndex(image=>!image?.path)
  }
  function targetSlot(target){
    const slot=target.closest('[data-image-slot]')?.dataset.imageSlot
    return slot===undefined?emptySlot():Number(slot)
  }
  function chooseImage(slot){
    pendingSlot.current=slot
    setMenu(null)
    fileRef.current?.click()
  }
  function dropImage(event){
    if(!editable||!event.dataTransfer.types.includes('Files'))return
    event.preventDefault()
    const slot=targetSlot(event.target)
    const file=event.dataTransfer.files[0]
    if(slot<0||!file)return
    setMenu(null)
    onSelectLayer?.('image:'+slot)
    onUploadImage?.(slot,file)
  }
  function openMenu(event){
    if(!editable)return
    event.preventDefault()
    const slot=targetSlot(event.target)
    setMenu({slot})
  }
  const firstImage=(section.images||[]).find(x=>x?.path&&urls[x.path])
  const firstUrl=firstImage?urls[firstImage.path]:null
  const hasRibbon=!section.backdrop&&scene.background==='ribbon-luxury'
  const ribbonVariant=index===0||section.layout==='cover'?'hero':
    ['grid','mosaic','wide'].includes(section.layout)?'gallery':'standard'
  return <section id={'pt-'+section.id}
    className={'pt-scene-section pt-scene-section--'+device+
      (editable?' is-editing':'')} aria-label={section.label}>
    {editable&&<div className="pt-artboard__tools" onKeyDown={event=>{
      if(event.key==='Escape')setMenu(null)
    }}>
      <button type="button" className="pt-btn pt-btn--light" disabled={emptySlot()<0}
        onClick={()=>chooseImage(emptySlot())}>+ Thêm ảnh</button>
      <button type="button" className="pt-btn pt-btn--light"
        onClick={()=>{setMenu(null);onAddNote?.()}}>+ Thêm chữ</button>
      <input ref={fileRef} type="file" hidden accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={event=>{
          const file=event.target.files?.[0]
          const slot=pendingSlot.current
          if(file&&slot!=null){
            onSelectLayer?.('image:'+slot)
            onUploadImage?.(slot,file)
          }
          event.target.value=''
        }}/>
      {menu&&<div className="pt-artboard__menu" aria-label="Thao tác trên vùng thiết kế">
        {menu.slot>=0&&<button type="button" className="pt-btn pt-btn--light"
          onClick={()=>chooseImage(menu.slot)}>
          {section.images[menu.slot]?.path?'Thay ảnh':'Thêm ảnh'} vào vị trí {menu.slot+1}
        </button>}
        <button type="button" className="pt-btn pt-btn--light"
          onClick={()=>{setMenu(null);onAddNote?.()}}>Thêm chữ</button>
        <button type="button" className="pt-btn pt-btn--light"
          onClick={()=>setMenu(null)}>Đóng</button>
      </div>}
    </div>}
    <div ref={boardRef} className={'pt-artboard'+(hasRibbon?' pt-artboard--ribbon':'')+
      (continuousSilk?' pt-artboard--continuous-silk':'')}
      style={{background:continuousSilk?'transparent':sceneGradient(
        section.backdrop==='none'&&scene.background==='ribbon-luxury'?'paper':scene.background)}}
      onContextMenu={openMenu}
      onDragOver={event=>{
        if(!editable||!event.dataTransfer.types.includes('Files'))return
        event.preventDefault()
        event.dataTransfer.dropEffect=targetSlot(event.target)>=0?'copy':'none'
      }}
      onDrop={dropImage}
      onClick={()=>{if(editable){setMenu(null);onSelectLayer?.('')}}}>
      {!continuousSilk&&section.backdrop===LUXURY_RIBBON&&<RibbonLuxuryBackground
        layout={ribbonLayout} direction={ribbonDirection}/>}
      {!continuousSilk&&hasRibbon&&<PortfolioRibbonBackdrop index={index} variant={ribbonVariant}
        layout={ribbonLayout} direction={ribbonDirection}/>}
      {firstUrl&&!continuousSilk&&!hasRibbon&&section.backdrop!==LUXURY_RIBBON&&<div className="pt-artboard__ambient" aria-hidden="true">
        <img src={firstUrl} alt=""/>
      </div>}
      {!continuousSilk&&!hasRibbon&&section.backdrop!==LUXURY_RIBBON&&<div className="pt-artboard__flare" aria-hidden="true"/>}
      <span className="pt-artboard__watermark" aria-hidden="true">
        {(section.title||'PORTFOLIO').slice(0,45)}
      </span>
      {sceneLayerIds(section,scene)
        .map(layerId=><LayerElement key={layerId}
          section={section} layerId={layerId} scene={scene}
          layer={scene.layers[layerId]} urls={urls} device={device}
          editable={editable} selected={selectedLayer===layerId}
          onSelectLayer={onSelectLayer} onPatchLayer={onPatchLayer}
          boardRef={boardRef} dragRef={dragRef} lockImageRatio={lockImageRatio}
          continuousSilk={continuousSilk}/>)}
      {editable&&<div className="pt-artboard__edit-hint">
        Kéo chữ hoặc ảnh để đổi vị trí · Thả file lên ô ảnh hoặc nhấp chuột phải để thêm ảnh
      </div>}
    </div>
  </section>
}
