import React,{useRef} from 'react'
import {
  sceneGradient,sceneFont,sceneLayerIds,sceneLayerTitle,sceneLayerType
} from './sectionDesign.js'
import PortfolioRibbonBackdrop from './PortfolioRibbonBackdrop'
import './section-artboard.css'

const clamp=(v,min,max)=>Math.max(min,Math.min(max,v))
const snap=v=>Math.round(v*2)/2
function toPosition(layer,board){
  return {left:layer.x+'%',top:layer.y+'%',width:layer.w+'%',height:layer.h+'%',
    zIndex:layer.z,opacity:layer.opacity/100,
    transform:'rotate('+layer.rotation+'deg)'}
}
function LayerElement({section,layerId,layer,scene,urls,device,editable,selected,
  onSelectLayer,onPatchLayer,boardRef,dragRef}){
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
    color:layer.color,textAlign:layer.align,fontFamily:sceneFont(layer.font),
    fontWeight:layer.weight,lineHeight:layer.lineHeight,
    letterSpacing:layer.spacing+'px',whiteSpace:'pre-line',
    fontSize:'clamp(9px,'+(layer.size*100/ratio).toFixed(3)+'cqw,180px)',
    textShadow:layerId==='title'?'0 7px 22px #0a132837':'none',
    filter:layer.blur?'blur('+layer.blur+'px)':'none',
    overflowWrap:'anywhere'
  }
  const startDrag=(event,mode)=>{
    if(!editable||event.button!==0||layer.hidden)return
    event.stopPropagation()
    const bounds=boardRef.current?.getBoundingClientRect()
    if(!bounds?.width||!bounds?.height)return
    dragRef.current={
      id:layerId,mode,
      startX:event.clientX,startY:event.clientY,
      layer:{...layer},bounds
    }
    onSelectLayer?.(layerId)
    event.currentTarget.setPointerCapture?.(event.pointerId)
    event.preventDefault()
  }
  const moveDrag=event=>{
    const d=dragRef.current
    if(!d||d.id!==layerId||!editable)return
    const dx=(event.clientX-d.startX)/d.bounds.width*100
    const dy=(event.clientY-d.startY)/d.bounds.height*100
    if(d.mode==='resize'){
      const w=snap(clamp(d.layer.w+dx,8,100-d.layer.x))
      const h=snap(clamp(d.layer.h+dy,3,100-d.layer.y))
      onPatchLayer?.(layerId,{w,h})
    }else{
      const x=snap(clamp(d.layer.x+dx,0,100-d.layer.w))
      const y=snap(clamp(d.layer.y+dy,0,100-d.layer.h))
      onPatchLayer?.(layerId,{x,y})
    }
  }
  const endDrag=()=>{if(dragRef.current?.id===layerId)dragRef.current=null}
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
    role={editable?'button':undefined}
    tabIndex={editable?0:undefined}
    aria-label={editable?'Kéo layer '+label+', dùng phím mũi tên để di chuyển':undefined}
    aria-pressed={editable?Boolean(selected):undefined}
    className={'pt-artboard__layer '+(type==='image'?'is-image':'is-text')+
      (selected&&editable?' is-selected':'')+
      (editable?' is-editable':'')+
      (layer.hidden?' is-hidden':'')}
    style={toPosition(layer)}
    onPointerDown={event=>startDrag(event,'move')}
    onPointerMove={moveDrag}
    onPointerUp={endDrag} onPointerCancel={endDrag}
    onKeyDown={keyDown}
    onClick={event=>{event.stopPropagation();if(editable)onSelectLayer?.(layerId)}}>
    {type==='image'
      ? <div className="pt-artboard__photo" style={{
          borderRadius:layer.radius+'px',
          filter:layer.blur?'blur('+layer.blur+'px)':'none'
        }}>
          {url?<img src={url} alt={image?.alt||label}
            loading="lazy" decoding="async" style={{objectFit:layer.fit}}/>:
            <div className="pt-artboard__empty">+<small>{label}<br/>Tải ảnh ở bảng bên trái</small></div>}
        </div>
      : <div className="pt-artboard__text" style={textStyle}>
          {source||'Chạm để chỉnh '+label}
        </div>}
    {editable&&selected&&<div className="pt-artboard__selection">
      <span>{label}</span>
      <button type="button" className="pt-artboard__handle"
        aria-label={'Kéo để thay đổi kích thước '+label}
        onPointerDown={event=>startDrag(event,'resize')}
        onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}
      >↘</button>
    </div>}
  </div>
}
/** This exact artboard is used in edit mode and live full preview.
 * The shared form provides the slots and section structure; this scene
 * provides only artist-specific positions and styling.
 */
export default function SectionArtboard({
  section,scene,device='desktop',urls={},editable=false,
  index=0,selectedLayer='',onSelectLayer,onPatchLayer
}){
  const boardRef=useRef(null),dragRef=useRef(null)
  const firstImage=(section.images||[]).find(x=>x?.path&&urls[x.path])
  const firstUrl=firstImage?urls[firstImage.path]:null
  const hasRibbon=scene.background==='ribbon-luxury'
  const ribbonVariant=index===0||section.layout==='cover'?'hero':
    ['grid','mosaic','wide'].includes(section.layout)?'gallery':'standard'
  return <section id={'pt-'+section.id}
    className={'pt-scene-section pt-scene-section--'+device+
      (editable?' is-editing':'')} aria-label={section.label}>
    <div ref={boardRef}
      className={'pt-artboard'+(hasRibbon?' pt-artboard--ribbon':'')}
      style={{background:sceneGradient(scene.background)}}
      onClick={()=>{if(editable)onSelectLayer?.('')}}>
      {hasRibbon&&<PortfolioRibbonBackdrop index={index} variant={ribbonVariant}/>}
      {!hasRibbon&&firstUrl&&<div className="pt-artboard__ambient" aria-hidden="true">
        <img src={firstUrl} alt=""/>
      </div>}
      {!hasRibbon&&<div className="pt-artboard__flare" aria-hidden="true"/>}
      <span className="pt-artboard__watermark" aria-hidden="true">
        {(section.title||'PORTFOLIO').slice(0,45)}
      </span>
      {sceneLayerIds(section,scene)
        .map(layerId=><LayerElement key={layerId}
          section={section} layerId={layerId} scene={scene}
          layer={scene.layers[layerId]} urls={urls} device={device}
          editable={editable} selected={selectedLayer===layerId}
          onSelectLayer={onSelectLayer} onPatchLayer={onPatchLayer}
          boardRef={boardRef} dragRef={dragRef}/>)}
      {editable&&<div className="pt-artboard__edit-hint">
        Kéo layer để đổi vị trí · Kéo góc để đổi kích thước · Shift + phím mũi tên: di chuyển nhanh
      </div>}
    </div>
  </section>
}
