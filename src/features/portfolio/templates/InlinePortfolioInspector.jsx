import React,{useEffect,useState} from 'react'
import {FONT_OPTIONS,detectCurrentFont,isImageLayer} from './publicElementStyle'
import {SCENE_LAYER_LABELS} from './sectionDesign'
import {TEXT_QUICK_LAYOUTS} from './textQuickLayouts'
import './inline-portfolio-inspector.css'

const displayNumber=(v,fallback=0,precision=1)=>{
  const n=Number(v)
  return Number.isFinite(n)?Number(n.toFixed(precision)):fallback
}
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n))
export default function InlinePortfolioInspector({
  selection,layer,device='desktop',onApply,onClose,onClearNotice
}){
  const [tab,setTab]=useState('layout')
  useEffect(()=>setTab(isImageLayer(selection?.layerId)?'frame':'type'),
    [selection?.sectionId,selection?.layerId])
  if(!selection||!layer)return null
  const id=selection.layerId
  const image=isImageLayer(id),scene=layer.scene
  const vals=layer.values||{}
  const measured=selection.metrics||{}
  const title=image?'Ảnh '+(Number(id.split(':')[1])+1):
    SCENE_LAYER_LABELS[id]||'Chữ trang trí'
  const fontId=vals.font||detectCurrentFont(measured.fontFamily)
  const size=displayNumber(vals.size,measured.fontSize||16)
  const lineHeight=displayNumber(vals.lineHeight,measured.lineHeight||1.3,2)
  const width=displayNumber(scene?vals.w:vals.widthPct,measured.widthPct||90)
  const height=displayNumber(scene?vals.h:vals.scaleY?vals.scaleY*100:100,100)
  const x=displayNumber(vals.x,0)
  const y=displayNumber(vals.y,0)
  const radius=displayNumber(vals.radius,measured.radius||0)
  const opacity=displayNumber(vals.opacity,100)
  const scaleX=displayNumber((vals.scaleX??1)*100,100)
  const scaleY=displayNumber((vals.scaleY??1)*100,100)
  const align=vals.align||measured.align||'left'
  const rect=selection.rect||{}
  const posTop=clamp(rect.top||120,74,Math.max(74,(typeof window!=='undefined'?window.innerHeight:850)-430))
  const apply=(group,patch)=>{onApply(selection.sectionId,id,group,patch);onClearNotice?.()}
  function numberField(label,value,group,key,min,max,step=1,suffix=''){
    return <label className="pt-inline-inspector__field" key={key}>
      <span>{label}</span>
      <div className="pt-inline-inspector__input">
        <input key={selection.sectionId+id+device+key+String(value)}
          type="number" min={min} max={max} step={step} defaultValue={value}
          aria-label={label}
          onKeyDown={event=>{if(event.key==='Enter')event.currentTarget.blur()}}
          onBlur={event=>{
            if(!event.currentTarget.validity.valid)return
            const n=Number(event.currentTarget.value)
            if(!Number.isFinite(n)||n<min||n>max||Math.abs(n-value)<.001)return
            apply(group,{[key]:n})
          }}/>
        {suffix&&<small>{suffix}</small>}
      </div>
    </label>
  }
  return <aside className="pt-inline-inspector" role="dialog"
    aria-label={'Chỉnh trực tiếp '+title} style={{'--pt-inspector-top':posTop+'px'}}
    onClick={event=>event.stopPropagation()}
    onPointerDown={event=>event.stopPropagation()}>
    <header className="pt-inline-inspector__header">
      <div>
        <strong>{title}</strong>
        <span>{layer.section.label} · {device==='mobile'?'Mobile':'Desktop'}</span>
      </div>
      <button type="button" aria-label="Đóng menu chỉnh sửa" onClick={onClose}>×</button>
    </header>
    <div className="pt-inline-inspector__tabs" role="tablist" aria-label="Thông số phần tử">
      {!image&&<button type="button" role="tab" aria-selected={tab==='type'}
        className={tab==='type'?'is-active':''} onClick={()=>setTab('type')}>Chữ</button>}
      <button type="button" role="tab" aria-selected={tab==='layout'}
        className={tab==='layout'?'is-active':''} onClick={()=>setTab('layout')}>Bố cục</button>
      <button type="button" role="tab" aria-selected={tab==='frame'}
        className={tab==='frame'?'is-active':''} onClick={()=>setTab('frame')}>{image?'Ảnh / Khung':'Khung'}</button>
    </div>
    <div className="pt-inline-inspector__body">
      {tab==='type'&&!image&&<>
        <label className="pt-inline-inspector__field">
          <span>Font chữ hiện tại</span>
          <select value={fontId} onChange={event=>apply('typography',{font:event.target.value})}>
            {FONT_OPTIONS.map(font=><option key={font.id} value={font.id}>{font.label}</option>)}
          </select>
        </label>
        <div className="pt-inline-inspector__grid">
          {numberField('Cỡ chữ',size,'typography','size',8,scene?240:180,1,'px')}
          {numberField('Giãn dòng',lineHeight,'typography','lineHeight',.7,3,.05,'×')}
        </div>
        <p className="pt-inline-inspector__actual">
          Kích thước đang hiển thị: <b>{displayNumber(measured.fontSize,size)} px</b>
          {scene?' · Cỡ thiết kế thay đổi theo kích thước khung':''}
        </p>
      </>}
      {tab==='layout'&&<>
        {!image&&<>
          <span className="pt-inline-inspector__hint">Căn chữ và hướng trình bày</span>
          <div className="pt-inline-inspector__presets">
            {TEXT_QUICK_LAYOUTS.map(opt=><button key={opt.id} type="button"
              title={'Bố cục '+opt.label}
              onClick={()=>apply('layout',{id:opt.id})}>
              <span aria-hidden="true">{opt.symbol}</span> {opt.label}
            </button>)}
          </div>
          <label className="pt-inline-inspector__field">
            <span>Căn văn bản</span>
            <select value={align}
              onChange={event=>apply('typography',{align:event.target.value})}>
              <option value="left">Trái</option>
              <option value="center">Giữa</option>
              <option value="right">Phải</option>
            </select>
          </label>
        </>}
        <div className="pt-inline-inspector__grid">
          {numberField('Ngang X',x,'position','x',scene?0:-95,scene?100:95,.5,'%')}
          {numberField('Dọc Y',y,'position','y',scene?0:-95,scene?100:95,.5,'%')}
          {numberField('Xoay',displayNumber(vals.rotation,0),'position','rotation',
            scene?-45:-15,scene?45:15,1,'°')}
        </div>
        <p className="pt-inline-inspector__actual">Có thể kéo phần tử ngay trên website.
          Các thay đổi được lưu riêng cho {device==='desktop'?'desktop':'mobile'}.</p>
      </>}
      {tab==='frame'&&<>
        <div className="pt-inline-inspector__grid">
          {numberField('Rộng',image&&!scene?
            displayNumber(vals.scaleX??1,1,2):width,'position',
            scene?'w':image?'scaleX':'widthPct',
            scene?8:(image ? 0.25 : 15),scene?100:(image?3:100),
            (image&&!scene)?0.05:1,image&&!scene?'×':'%')}
          {scene?
            numberField('Cao',height,'position','h',3,100,1,'%'):
            image?numberField('Chiều cao',displayNumber((vals.scaleY??1),1,2),
              'position','scaleY',.25,3,.05,'×'):null}
          {image&&!scene&&numberField('Bo góc',radius,'position','radius',0,80,1,'px')}
          {image&&numberField('Độ mờ',opacity,'position','opacity',0,100,5,'%')}
          {image&&scene&&numberField('Bo góc',radius,'position','radius',0,50,1,'px')}
        </div>
        {image&&<label className="pt-inline-inspector__field">
          <span>Cách hiển thị ảnh trong khung</span>
          <select value={vals.fit||'cover'} onChange={event=>apply('position',{fit:event.target.value})}>
            <option value="cover">Lấp đầy (có thể cắt ảnh)</option>
            <option value="contain">Hiện đầy đủ ảnh</option>
          </select>
        </label>}
        {!image&&<p className="pt-inline-inspector__actual">
          Chỉnh độ rộng khung chữ mà không tự đổi cỡ font.</p>}
        {image&&<p className="pt-inline-inspector__actual">
          Khung ảnh giữ nguyên ảnh gốc và tỷ lệ crop đã lưu nếu bạn không đổi.</p>}
      </>}
    </div>
    <footer className="pt-inline-inspector__footer">
      <small>Thả chuột hoặc rời ô nhập để tự động lưu</small>
      <button type="button" onClick={onClose}>Xong</button>
    </footer>
  </aside>
}
