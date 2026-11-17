import React,{useRef} from 'react'
import {sceneFont,resizeDimensions} from './sectionDesign'
import {ribbonGridColumns} from './ribbonLayout'
import {isCutoutArtwork,cutoutStageStyle} from './imagePresentation'
import PhotoMotion from './PhotoMotion'
import CharacterBurst from './CharacterBurst'
import {isTextFrame,measuredTextWidth,resizeTextWidth,storedTextWidth,textBoxWidthStyle} from './textFrameSizing'

/**
 * A section inherits its structure, slots and grid from the shared Form.
 * Editing and preview render this SAME markup. There is no visual-mode switch
 * to legacy MotionSection when "Chỉnh trực tiếp" is pressed.
 */
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value))
const clampPosition=value=>Math.round(clamp(value,-95,95)*10)/10
function positionStyle(position={},type={},key=''){
  const text=isTextFrame(key)
  const align=['left','center','right'].includes(type?.align)?type.align:'left'
  const angle=Number(position?.rotation)
  return {
    translate:position.x||position.y?(Number(position.x)||0)+'% '+(Number(position.y)||0)+'%':undefined,
    // Legacy scale fields are ignored on text: wrapping never changes the font.
    scale:!text&&position.scaleX&&position.scaleY?
      position.scaleX+' '+position.scaleY:undefined,
    ...(text?textBoxWidthStyle(position):{}),
    ...(text?{
      textAlign:align,
      alignSelf:align==='center'?'center':align==='right'?'flex-end':'flex-start',
      rotate:Number.isFinite(angle)?clamp(angle,-15,15)+'deg':undefined
    }:{}),
    fontFamily:type.font?sceneFont(type.font):undefined,
    fontSize:Number.isFinite(type.size)?clamp(type.size,8,180)+'px':undefined,
    lineHeight:Number.isFinite(type.lineHeight)?clamp(type.lineHeight,.7,3):undefined
  }
}
export default function RibbonPortfolioSection({
  section,index=0,urls={},artistRole='',isPublic=false,
  selectedLayer='',positions={},typography={},onMoveElement,onSelectLayer,
  onEditText,onUploadImage,lockImageRatio=true
}){
  const drag=useRef(null),suppressClick=useRef(false)
  const fileInput=useRef(null),pendingSlot=useRef(-1)
  const editing=Boolean(onMoveElement||onEditText||onUploadImage)
  const allTiles=(section.images||[]).map((asset,position)=>({
    asset,position,url:asset?.path?urls[asset.path]:null
  }))
  // Only show photo placeholders while editing. A live preview with no photo
  // becomes a clean text-led composition instead of large dashed boxes.
  const tiles=editing?allTiles:allTiles.filter(tile=>tile.url)
  const columns=ribbonGridColumns(section.layout,tiles.length)
  const hasCopy=Boolean(section.title||section.eyebrow||section.body)
  const layout=tiles.length?'pt-ribbon-layout--'+section.layout:'pt-ribbon-layout--text'

  function startDrag(event,key,resizing=false,locked=false){
    if(!onMoveElement||event.button!==0||event.isPrimary===false)return
    if(!resizing&&event.target.closest('button,input'))return
    event.stopPropagation()
    const target=resizing?event.currentTarget.parentElement:event.currentTarget
    const rect=target.getBoundingClientRect()
    if(!rect.width||!rect.height)return
    const saved=positions?.[key]||{}
    const initial={...saved,x:Number(saved.x)||0,y:Number(saved.y)||0,
      scaleX:Number(saved.scaleX)||1,scaleY:Number(saved.scaleY)||1}
    const isTextResize=resizing&&isTextFrame(key)
    const containerWidth=target.parentElement?.getBoundingClientRect().width||rect.width
    drag.current={key,pointerId:event.pointerId,element:target,rect,
      x:event.clientX,y:event.clientY,initial,locked,preview:null,
      mode:isTextResize?'text-width':resizing?'image-scale':'move',
      containerWidth,
      startWidthPct:storedTextWidth(saved)??measuredTextWidth(target.offsetWidth,containerWidth),
      originalStyleWidth:target.style.width}
    event.currentTarget.setPointerCapture?.(event.pointerId)
    onSelectLayer?.(key)
    event.preventDefault()
  }
  function dragMove(event){
    const current=drag.current
    if(!current||current.pointerId!==event.pointerId)return
    const dx=event.clientX-current.x,dy=event.clientY-current.y
    if(!current.preview&&Math.hypot(dx,dy)<3)return
    if(current.mode==='text-width'){
      const widthPct=resizeTextWidth(current.startWidthPct,dx,current.containerWidth)
      current.preview={...current.initial,widthPct}
      current.element.style.width=widthPct+'%'
    }else if(current.mode==='image-scale'){
      const dimensions=resizeDimensions(current.initial.scaleX,current.initial.scaleY,
        dx*2/current.rect.width,dy*2/current.rect.height,{
          locked:current.locked,minWidth:.25,minHeight:.25,maxWidth:2,maxHeight:2
        })
      current.preview={...current.initial,scaleX:dimensions.w,scaleY:dimensions.h}
      current.element.style.scale=dimensions.w+' '+dimensions.h
    }else{
      current.preview={...current.initial,
        x:clampPosition(current.initial.x+dx/current.rect.width*100),
        y:clampPosition(current.initial.y+dy/current.rect.height*100)}
      current.element.style.translate=current.preview.x+'% '+current.preview.y+'%'
    }
  }
  function finishDrag(event,commit=true){
    const current=drag.current
    if(!current||current.pointerId!==event.pointerId)return
    drag.current=null
    if(commit&&current.preview){
      suppressClick.current=true
      onMoveElement?.(current.key,current.preview)
    }else if(current.mode==='text-width'){
      current.element.style.width=current.originalStyleWidth
    }else{
      current.element.style.translate=positionStyle(current.initial,{},current.key).translate||''
      if(current.mode==='image-scale'){
        current.element.style.scale=current.initial.scaleX+' '+current.initial.scaleY
      }
    }
  }
  function moveKey(event,key){
    const d={ArrowUp:[0,-.5],ArrowDown:[0,.5],ArrowLeft:[-.5,0],ArrowRight:[.5,0]}[event.key]
    if(!d||!onMoveElement)return false
    event.preventDefault();event.stopPropagation()
    const original=positions?.[key]||{x:0,y:0}
    const multiplier=event.shiftKey?10:1
    onSelectLayer?.(key)
    onMoveElement(key,{...original,
      x:clampPosition((Number(original.x)||0)+d[0]*multiplier),
      y:clampPosition((Number(original.y)||0)+d[1]*multiplier)})
    return true
  }
  const draggableProps=key=>({
    style:positionStyle(positions?.[key],typography?.[key],key),
    ...(onMoveElement?{
      'data-portfolio-movable':'',tabIndex:0,
      onPointerDown:event=>startDrag(event,key),
      onPointerMove:dragMove,
      onPointerUp:finishDrag,
      onPointerCancel:event=>finishDrag(event,false),
      onLostPointerCapture:event=>finishDrag(event,false),
      onKeyDown:event=>moveKey(event,key)
    }:{})
  })
  function resizeHandle(key,label,locked){
    if(!onMoveElement||selectedLayer!==key)return null
    const text=isTextFrame(key)
    return <button type="button"
      className={'pt-ribbon__resize'+(text?' pt-ribbon__resize--text':'')}
      aria-label={text?'Điều chỉnh độ rộng khung '+label:'Đổi kích thước '+label}
      title={text?'Kéo ngang để đổi độ rộng khung, giữ nguyên cỡ chữ':'Đổi kích thước ảnh'}
      onClick={event=>event.stopPropagation()}
      onPointerDown={event=>startDrag(event,key,true,locked)}
      onPointerMove={dragMove}
      onPointerUp={finishDrag}
      onPointerCancel={event=>finishDrag(event,false)}
      onLostPointerCapture={event=>finishDrag(event,false)}
      onKeyDown={text?event=>{
        if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return
        event.preventDefault();event.stopPropagation()
        const saved=positions?.[key]||{}
        const target=event.currentTarget.parentElement
        const parentWidth=target?.parentElement?.getBoundingClientRect().width||0
        const start=storedTextWidth(saved)??measuredTextWidth(target?.offsetWidth||0,parentWidth)
        const delta=(event.key==='ArrowRight'?1:-1)*(event.shiftKey?10:2)
        onMoveElement(key,{...saved,widthPct:resizeTextWidth(start,parentWidth*delta/100,parentWidth)})
      }:undefined}>{text?'↔':'↘'}</button>
  }
  function editTextProps(field){
    const base=draggableProps(field)
    return {...base,'data-portfolio-text-frame':field,
      'data-pt-scroll-reveal':field,
      ...(onEditText?{
        'data-portfolio-edit-field':field,
        'data-portfolio-edit-selected':selectedLayer===field?'true':undefined,
        role:'button',tabIndex:0,
        onClick:event=>{
          event.stopPropagation()
          if(!suppressClick.current)onEditText(field)
          suppressClick.current=false
        },
        onKeyDown:event=>{
          if(moveKey(event,field))return
          if(event.key==='Enter'||event.key===' '){
            event.preventDefault();onEditText(field)
          }
        }
      }:{})
    }
  }
  function uploadTo(slot,file){
    if(slot<0||!file||!onUploadImage)return
    onSelectLayer?.('image:'+slot)
    onUploadImage(slot,file)
  }
  return <section id={'pt-'+section.id} aria-label={section.label}
    className={'pt-ribbon-section '+layout+
      ' pt-ribbon-effect--'+(section.effect||'auto')+
      (editing?' pt-ribbon-section--editing':'')+
      (index===0?' is-first':'')}
    onDragOver={editing?event=>{
      if(event.dataTransfer?.types?.includes('Files')){
        event.preventDefault();event.dataTransfer.dropEffect='copy'
      }
    }:undefined}
    onDrop={editing?event=>{
      if(!event.dataTransfer?.types?.includes('Files'))return
      event.preventDefault()
      const box=event.target.closest('[data-image-slot]')
      const blank=allTiles.find(tile=>!tile.asset?.path)
      const slot=box?Number(box.dataset.imageSlot):blank?.position??-1
      uploadTo(slot,event.dataTransfer.files[0])
    }:undefined}>
    {editing&&<input ref={fileInput} hidden type="file"
      accept="image/jpeg,image/png,image/webp,image/avif"
      onChange={event=>{
        uploadTo(pendingSlot.current,event.target.files?.[0])
        event.target.value=''
      }}/>}
    <div className="pt-ribbon__copy">
      <small {...editTextProps('eyebrow')}>
        <CharacterBurst disabled={editing} maxCharacters={120}
          text={String(index+1).padStart(2,'0')+' / '+(section.eyebrow||
          (index===0&&artistRole?artistRole:section.label))}/>
        {resizeHandle('eyebrow','nhãn phụ',true)}
      </small>
      {section.title?<h2 {...editTextProps('title')}>
          <CharacterBurst text={section.title} disabled={editing}
            maxCharacters={160}/>{resizeHandle('title','tiêu đề',true)}
        </h2>:
        editing?<button type="button" className="pt-ribbon__add-text"
          onClick={()=>onEditText?.('title')}>+ Thêm tiêu đề</button>:
        !isPublic?<h2 className="pt-ribbon__missing">Chưa có tiêu đề trong hồ sơ</h2>:null}
      {section.body?<p {...editTextProps('body')}>
          <CharacterBurst text={section.body} disabled={editing}
            maxCharacters={140}/>{resizeHandle('body','nội dung',true)}
        </p>:
        editing?<button type="button" className="pt-ribbon__add-text"
          onClick={()=>onEditText?.('body')}>+ Thêm mô tả</button>:
        !hasCopy&&!isPublic?<p className="pt-ribbon__missing">
          {section.sourceStatus==='missing'
            ?'Mục liên kết không còn trong Hồ sơ nghệ sĩ. Hãy chọn lại nguồn.'
            :'Chưa có nội dung từ Hồ sơ nghệ sĩ.'}
        </p>:null}
      {section.sourceStatus==='linked'&&!isPublic&&<span className="pt-ribbon__source">
        Hồ sơ nghệ sĩ · Trang {String(section.sourcePage).padStart(2,'0')}
      </span>}
    </div>
    {tiles.length>0&&<div className={'pt-ribbon__media'+
        (tiles.length===1?' pt-ribbon__media--single':'')}
      style={{'--pt-ribbon-cols':columns}}
      aria-label={'Ảnh riêng khu vực '+section.label}>
      {tiles.map(({asset,position,url})=><div
        data-image-slot={editing?position:undefined}
        className={'pt-ribbon__tile'+(!url?' pt-ribbon__tile--empty':'')+
          (url&&isCutoutArtwork(asset)?' pt-ribbon__tile--cutout pt-cutout-stage pt-cutout-stage--'+cutoutStageStyle(asset):'')+
          (editing?' pt-ribbon__tile--editable':'')}
        data-image-selected={editing&&selectedLayer==='image:'+position?'true':undefined}
        key={section.id+':'+position}
        {...draggableProps('image:'+position)}>
        {url?<PhotoMotion asset={asset} paused={editing} revealOrder={position}>
          <img src={url}
            alt={asset?.alt||section.title||section.label}
            loading={index===0&&position===0?'eager':'lazy'}
            decoding="async" draggable={false}/>
        </PhotoMotion>:
          editing?<button type="button" className="pt-ribbon__upload-trigger"
            onClick={()=>{
              pendingSlot.current=position
              fileInput.current?.click()
            }}>
            <span aria-hidden="true">+</span><small>ẢNH {String(position+1).padStart(2,'0')}</small>
            <small>Chọn ảnh từ máy</small>
          </button>:
          <><span aria-hidden="true">+</span>
            <small>ẢNH {String(position+1).padStart(2,'0')}
              <br/>Tải ảnh riêng trong Admin</small></>}
        {resizeHandle('image:'+position,'ảnh '+(position+1),lockImageRatio)}
      </div>)}
    </div>}
  </section>
}
