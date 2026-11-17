import React,{useEffect,useRef,useState} from 'react'
import {FONT_OPTIONS,detectCurrentFont,isImageLayer} from './publicElementStyle'
import {SCENE_LAYER_LABELS} from './sectionDesign'
import {TEXT_QUICK_LAYOUTS} from './textQuickLayouts'
import {wheelStepValue} from './inlineInspectorWheel'
import {SCENE_MOVE_LIMIT,OFFSET_MOVE_LIMIT} from './freePlacement'
import {TEXT_MOTION_EFFECTS,TEXT_MOTION_UNITS,TEXT_MOTION_DIRECTIONS,
  normalizeTextMotion} from './textLayerMotion'
import './inline-portfolio-inspector.css'

const number=(value,fallback=0,precision=1)=>{
  const n=Number(value)
  return Number.isFinite(n)?Number(n.toFixed(precision)):fallback
}
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n))
function hex(value,fallback='#ffffff'){
  const raw=String(value||'').trim()
  if(/^#[a-f0-9]{6}$/i.test(raw))return raw
  if(/^#[a-f0-9]{3}$/i.test(raw))return '#'+raw.slice(1).split('').map(x=>x+x).join('')
  const rgb=raw.match(/^rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/i)
  return rgb?'#'+rgb.slice(1,4).map(v=>Number(v).toString(16).padStart(2,'0')).join(''):fallback
}
/** Editing updates the on-page element immediately. Wheel events are non-passive
 * so hovering a numeric field adjusts it rather than scrolling the page. */
function LiveNumberField({label,value,min,max,step=1,suffix='',onApply,identity}){
  const [draft,setDraft]=useState(String(value))
  const inputRef=useRef(null),boxRef=useRef(null)
  const latestRef=useRef(value),applyRef=useRef(onApply)
  applyRef.current=onApply
  useEffect(()=>{
    if(document.activeElement!==inputRef.current){
      latestRef.current=value
      setDraft(String(value))
    }
  },[value,identity])
  useEffect(()=>{
    latestRef.current=value
    setDraft(String(value))
  },[identity])
  useEffect(()=>{
    const box=boxRef.current
    if(!box)return undefined
    const wheel=event=>{
      if(event.ctrlKey)return
      event.preventDefault()
      event.stopPropagation()
      const next=wheelStepValue(latestRef.current,event.deltaY,{
        step,min,max,shiftKey:event.shiftKey,altKey:event.altKey
      })
      if(!Number.isFinite(next)||next===latestRef.current)return
      latestRef.current=next
      setDraft(String(next))
      inputRef.current?.focus({preventScroll:true})
      applyRef.current(next)
    }
    box.addEventListener('wheel',wheel,{passive:false})
    return ()=>box.removeEventListener('wheel',wheel)
  },[step,min,max,identity])
  function change(raw){
    setDraft(raw)
    if(raw.trim()==='')return
    const next=Number(raw)
    if(!Number.isFinite(next)||next<min||next>max)return
    if(next===latestRef.current)return
    latestRef.current=next
    applyRef.current(next)
  }
  function finish(){
    const next=Number(draft)
    if(draft.trim()===''||!Number.isFinite(next)||next<min||next>max){
      setDraft(String(latestRef.current))
    }else{
      setDraft(String(next))
    }
  }
  return <label className="pt-inline-inspector__field">
    <span>{label}</span>
    <div ref={boxRef} className="pt-inline-inspector__input"
      title={'Lăn chuột để tăng/giảm '+label+' · Shift: nhanh ×10 · Alt: tinh chỉnh'}>
      <input ref={inputRef} type="number" min={min} max={max} step="any"
        value={draft} aria-label={label}
        onChange={event=>change(event.currentTarget.value)}
        onBlur={finish}
        onKeyDown={event=>{if(event.key==='Enter')event.currentTarget.blur()}}/>
      {suffix&&<small>{suffix}</small>}
    </div>
  </label>
}

export default function InlinePortfolioInspector({
  selection,layer,device='desktop',onApply,onClose,onClearNotice,onReplayMotion,
  textValue='',onStartInlineEdit
}){
  const [tab,setTab]=useState('size')
  useEffect(()=>setTab(isImageLayer(selection?.layerId)?'size':'content'),
    [selection?.sectionId,selection?.layerId])
  if(!selection||!layer)return null

  const id=selection.layerId
  const image=isImageLayer(id),scene=layer.scene
  const vals=layer.values||{},measured=selection.metrics||{}
  const motion=normalizeTextMotion(vals.motion)
  const title=image?'Ảnh '+(Number(id.split(':')[1])+1):
    SCENE_LAYER_LABELS[id]||(id.startsWith('note:')?'Chữ trang trí':'Nội dung')
  const fontId=vals.font||detectCurrentFont(measured.fontFamily)
  // For a scene the stored font is a design unit (cqw). The input always
  // shows real rendered pixels; edits are translated back to design units.
  const size=number(measured.fontSize,number(vals.size,16))
  const storedFontSize=number(vals.size,size)
  const lineHeight=number(vals.lineHeight??measured.lineHeight,1.3,2)
  const width=number(scene?vals.w:vals.widthPct,measured.widthPct||90)
  const height=number(vals.h,100)
  const radius=number(vals.radius??measured.radius,0)
  const opacity=number(vals.opacity??measured.opacity,100)
  const borderWidth=number(vals.borderWidth??measured.borderWidth,0)
  const align=vals.align||measured.align||'left'
  const rect=selection.rect||{}
  const posTop=clamp(rect.top||120,74,Math.max(74,
    (typeof window!=='undefined'?window.innerHeight:850)-430))
  const apply=(group,patch)=>onApply(selection.sectionId,id,group,patch)
  const numberField=(label,value,group,key,min,max,step=1,suffix='',convert=n=>n)=>
    <LiveNumberField key={key} label={label} value={value}
      min={min} max={max} step={step} suffix={suffix}
      identity={selection.sectionId+':'+device+':'+id+':'+key}
      onApply={n=>apply(group,{[key]:convert(n)})}/>
  const colorField=(label,value,group,key)=>
    <label className="pt-inline-inspector__field pt-inline-inspector__field--color" key={key}>
      <span>{label}</span>
      <input type="color" value={hex(value)} aria-label={label}
        onChange={event=>{
          const next=event.currentTarget.value
          if(next!==hex(value))apply(group,{[key]:next})
        }}/>
    </label>
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
      {!image&&<button type="button" role="tab" aria-selected={tab==='content'}
        className={tab==='content'?'is-active':''}
        onClick={()=>setTab('content')}>Nội dung</button>}
      <button type="button" role="tab" aria-selected={tab==='size'}
        className={tab==='size'?'is-active':''} onClick={()=>setTab('size')}>Kích cỡ</button>
      <button type="button" role="tab" aria-selected={tab==='layout'}
        className={tab==='layout'?'is-active':''} onClick={()=>setTab('layout')}>Bố cục</button>
      {!image&&<button type="button" role="tab" aria-selected={tab==='type'}
        className={tab==='type'?'is-active':''} onClick={()=>setTab('type')}>Font chữ</button>}
      {!image&&<button type="button" role="tab" aria-selected={tab==='motion'}
        className={tab==='motion'?'is-active':''} onClick={()=>setTab('motion')}>Hiệu ứng</button>}
      <button type="button" role="tab" aria-selected={tab==='frame'}
        className={tab==='frame'?'is-active':''} onClick={()=>setTab('frame')}>
        {image?'Ảnh / Khung':'Khung'}
      </button>
    </div>
    <div className="pt-inline-inspector__body">
      <div className="pt-inline-inspector__measure" role="status">
        <span>Kích thước đang hiển thị:</span>
        <strong>{number(measured.widthPx,0)} × {number(measured.heightPx,0)} px</strong>
        {!image&&<small>Chữ thực tế: {size} px ·
          {scene?' cỡ thiết kế '+storedFontSize+' px':' theo khung hiện tại'}</small>}
      </div>
      {tab==='content'&&!image&&<>
        <label className="pt-inline-inspector__field">
          <span>Nội dung {title.toLowerCase()}</span>
          <textarea className="pt-inline-inspector__textarea"
            aria-label={'Sửa nội dung '+title}
            value={textValue} maxLength={id.startsWith('note:')?280:10000}
            placeholder="Nhập tiêu đề hoặc nội dung…"
            rows={id==='body'?6:3}
            onChange={event=>apply('content',{value:event.currentTarget.value})}/>
        </label>
        <button type="button" className="pt-inline-inspector__replay"
          onClick={onStartInlineEdit}>
          <span aria-hidden="true">✎</span> Sửa trực tiếp trên chữ
        </button>
        <p className="pt-inline-inspector__actual">
          Nhấp đúp lên chữ trong trang để nhập ngay tại vị trí đó. Nội dung
          cập nhật tức thì và tự lưu. Bản gốc trong hồ sơ nghệ sĩ không bị sửa.
        </p>
      </>}
      {tab==='size'&&<>
        <div className="pt-inline-inspector__grid">
          {!image&&numberField('Cỡ chữ hiện tại',size,'typography','size',8,180,1,'px',
            n=>scene?clamp(number(storedFontSize*n/Math.max(size,1),storedFontSize,2),9,240):n)}
          {scene?<>
            {numberField('Rộng khung',width,'position','w',8,100,1,'%')}
            {numberField('Cao khung',height,'position','h',3,100,1,'%')}
          </>:image?<>
            {numberField('Rộng ảnh',number(vals.scaleX??1,1,2),'position','scaleX',.25,3,.05,'×')}
            {numberField('Cao ảnh',number(vals.scaleY??1,1,2),'position','scaleY',.25,3,.05,'×')}
          </>:numberField('Rộng khung',width,'position','widthPct',15,100,1,'%')}
        </div>
        <p className="pt-inline-inspector__actual">
          Lăn chuột trên ô số để tăng/giảm; trang cập nhật ngay khi nhập.
          Mỗi thiết bị có bộ thông số riêng.</p>
      </>}
      {tab==='layout'&&<>
        {!image&&<>
          <span className="pt-inline-inspector__hint">Chọn nhanh bố cục chữ</span>
          <div className="pt-inline-inspector__presets">
            {TEXT_QUICK_LAYOUTS.map(opt=><button key={opt.id} type="button"
              title={'Bố cục '+opt.label} onClick={()=>apply('layout',{id:opt.id})}>
              <span aria-hidden="true">{opt.symbol}</span> {opt.label}
            </button>)}
          </div>
          <label className="pt-inline-inspector__field">
            <span>Căn văn bản</span>
            <select value={align} onChange={event=>apply('typography',{align:event.target.value})}>
              <option value="left">Trái</option>
              <option value="center">Giữa</option>
              <option value="right">Phải</option>
            </select>
          </label>
        </>}
        <div className="pt-inline-inspector__grid">
          {numberField('Ngang X',number(vals.x,0),'position','x',
            scene?-SCENE_MOVE_LIMIT:-OFFSET_MOVE_LIMIT,
            scene?SCENE_MOVE_LIMIT:OFFSET_MOVE_LIMIT,.5,'%')}
          {numberField('Dọc Y',number(vals.y,0),'position','y',
            scene?-SCENE_MOVE_LIMIT:-OFFSET_MOVE_LIMIT,
            scene?SCENE_MOVE_LIMIT:OFFSET_MOVE_LIMIT,.5,'%')}
          {numberField('Xoay',number(vals.rotation,0),'position','rotation',
            scene?-45:-15,scene?45:15,1,'°')}
          {scene&&numberField('Thứ tự lớp',number(vals.z,10),'position','z',0,99,1)}
        </div>
        <p className="pt-inline-inspector__actual">
          Kéo chữ hoặc ảnh đến vị trí bất kỳ, kể cả ngoài cột và ô mặc định. Giữ Shift + cuộn để đi nhanh.</p>
      </>}
      {tab==='type'&&!image&&<>
        <label className="pt-inline-inspector__field">
          <span>Font chữ hiện tại</span>
          <select value={fontId} onChange={event=>apply('typography',{font:event.target.value})}>
            {FONT_OPTIONS.map(font=><option key={font.id} value={font.id}>{font.label}</option>)}
          </select>
        </label>
        <div className="pt-inline-inspector__grid">
          {numberField('Giãn dòng',lineHeight,'typography','lineHeight',.7,3,.05,'×')}
          {numberField('Giãn chữ',number(vals.spacing??measured.spacing,0),'typography',
            'spacing',-8,20,.5,'px')}
          <label className="pt-inline-inspector__field">
            <span>Độ đậm</span>
            <select value={String(vals.weight??measured.weight??500)}
              onChange={event=>apply('typography',{weight:Number(event.target.value)})}>
              {[400,500,600,700,800,900].map(value=><option key={value} value={value}>
                {value}
              </option>)}
            </select>
          </label>
          {colorField('Màu chữ',vals.color||measured.color,'typography','color')}
        </div>
      </>}
      {tab==='motion'&&!image&&<>
        <p className="pt-inline-inspector__actual">
          Mỗi khối chữ có hiệu ứng riêng. Chọn cách xuất hiện và điều chỉnh
          thông số trực tiếp; nội dung chữ và vị trí không bị thay đổi.</p>
        <label className="pt-inline-inspector__field">
          <span>Kiểu hiệu ứng</span>
          <select value={motion.effect}
            onChange={event=>apply('motion',{effect:event.target.value})}>
            {TEXT_MOTION_EFFECTS.map(item=><option key={item.id} value={item.id}>
              {item.label}</option>)}
          </select>
        </label>
        <div className="pt-inline-inspector__grid">
          <label className="pt-inline-inspector__field">
            <span>Cách chạy</span>
            <select value={motion.unit}
              onChange={event=>apply('motion',{unit:event.target.value})}>
              {TEXT_MOTION_UNITS.map(item=><option key={item.id} value={item.id}>
                {item.label}</option>)}
            </select>
          </label>
          <label className="pt-inline-inspector__field">
            <span>Hướng xuất hiện</span>
            <select value={motion.direction}
              onChange={event=>apply('motion',{direction:event.target.value})}>
              {TEXT_MOTION_DIRECTIONS.map(item=><option key={item.id} value={item.id}>
                {item.label}</option>)}
            </select>
          </label>
        </div>
        <div className="pt-inline-inspector__grid">
          {numberField('Thời gian',motion.duration,'motion','duration',120,2400,50,'ms')}
          {numberField('Độ trễ',motion.delay,'motion','delay',0,1600,50,'ms')}
          {numberField('Giãn từng chữ',motion.stagger,'motion','stagger',0,150,5,'ms')}
          {numberField('Quãng di chuyển',motion.distance,'motion','distance',0,180,5,'px')}
        </div>
        <button type="button" className="pt-inline-inspector__replay"
          onClick={onReplayMotion} title="Phát lại hiệu ứng ngay trên trang">
          ↻ Xem thử hiệu ứng
        </button>
      </>}
      {tab==='frame'&&<>
        <div className="pt-inline-inspector__grid">
          {numberField('Bo góc',radius,'position','radius',0,scene?50:80,1,'px')}
          {numberField('Độ hiển thị',opacity,'position','opacity',0,100,5,'%')}
          {numberField('Độ dày viền',borderWidth,'position','borderWidth',0,12,1,'px')}
          {colorField('Màu viền',vals.borderColor||measured.borderColor,'position','borderColor')}
        </div>
        {image&&<label className="pt-inline-inspector__field">
          <span>Hiển thị ảnh trong khung</span>
          <select value={vals.fit||measured.fit||'cover'}
            onChange={event=>apply('position',{fit:event.target.value})}>
            <option value="cover">Lấp đầy / cắt theo khung</option>
            <option value="contain">Giữ toàn bộ ảnh gốc</option>
          </select>
        </label>}
        <p className="pt-inline-inspector__actual">
          Chỉnh viền và khung không làm thay đổi tệp ảnh hoặc nội dung gốc.</p>
      </>}
    </div>
    <footer className="pt-inline-inspector__footer">
      <small>Thay đổi hiển thị ngay · tự lưu sau khi dừng thao tác</small>
      <button type="button" onClick={onClose}>Xong</button>
    </footer>
  </aside>
}
