import React,{useEffect,useLayoutEffect,useRef,useState} from 'react'
import {CONTENT_BLOCK_PRESETS,STUDIO_EFFECTS,STUDIO_FONTS,studioElements,resolveStudioLayout,isStudioText} from './studioModel.js'
import './studio.css'
import {PHOTO_MOTION_OPTIONS,photoMotionMode,photoMotionIntensity,photoMotionPointer,supportsPhotoPointer} from './photoMotionConfig.js'
const labels={title:'Tiêu đề',text:'Text',body:'Nội dung',image:'Ảnh',shape:'Hình khối',button:'Button'}
const effects={inherit:'Theo template / trang',auto:'Hiệu ứng mặc định',rise:'Bung nổi 3D',none:'Không',fade:'Fade in/out',slide:'Trượt',zoom:'Scale',flip:'3D Rotate',blur:'Blur reveal',letters:'Từng ký tự'}
function NumberField({label,value,min,max,step=1,onChange}){
  const ref=useRef(null)
  useEffect(()=>{
    const node=ref.current
    const wheel=e=>{if(document.activeElement!==node)return;e.preventDefault();onChange(Math.max(min,Math.min(max,Number(value)+(e.deltaY<0?1:-1)*step*(e.shiftKey?10:e.altKey ? .2 : 1))))}
    node?.addEventListener('wheel',wheel,{passive:false});return ()=>node?.removeEventListener('wheel',wheel)
  },[value,min,max,step,onChange])
  return <label>{label}<input ref={ref} type="number" value={value} min={min} max={max} step={step} onChange={e=>{if(e.target.value!=='')onChange(Number(e.target.value))}}/></label>
}
export default function StudioPanel({publication,device,studio,baseSelection,busy,onAdd,onAddSection,onBlockAction,onUpload,onReplaceBase,onPatchBaseImage,onSelectBase,onUndo,onRedo,canUndo,canRedo,onDevice,onPreview,onPublish,onDiscard,notice,inspector}){
  const sections=publication?.view?.sections||[]
  const [sectionId,setSectionId]=useState(sections[0]?.id||'')
  const [blockOpen,setBlockOpen]=useState(false)
  const [tab,setTab]=useState('content')
  const [collapsed,setCollapsed]=useState(false)
  const [pos,setPos]=useState(null)
  const panel=useRef(null),drag=useRef(null),upload=useRef(null),replace=useRef(null)
  useEffect(()=>{if(studio.selection?.sectionId)setSectionId(studio.selection.sectionId)},[studio.selection?.sectionId])
  useEffect(()=>{if(baseSelection?.sectionId)setSectionId(baseSelection.sectionId)},[baseSelection?.sectionId])
  const section=sections.find(s=>s.id===sectionId)||sections[0]
  const items=studioElements(publication,section?.id)
  const item=items.find(e=>studio.selection?.sectionId===section?.id&&studio.selection?.id===e.id)
  const v=item?resolveStudioLayout(item[device],item.kind,device):null
  const [computed,setComputed]=useState({})
  useLayoutEffect(()=>{
    if(!item||!isStudioText(item.kind)){setComputed({});return}
    const node=Array.from(document.querySelectorAll('[data-studio-text-id]')).find(n=>n.dataset.studioTextId===item.id)
    if(!node)return
    const s=getComputedStyle(node),size=parseFloat(s.fontSize)||v.size
    const rgb=s.color.match(/\\d+/g)||[]
    const color=rgb.length>=3?'#'+rgb.slice(0,3).map(x=>Number(x).toString(16).padStart(2,'0')).join(''):v.color
    const family=s.fontFamily.split(',')[0].replace(/["']/g,'').trim().toLowerCase()
    const font=STUDIO_FONTS.find(f=>f.toLowerCase()===family)||v.font
    setComputed({size,weight:parseFloat(s.fontWeight)||v.weight,spacing:parseFloat(s.letterSpacing)||0,lineHeight:parseFloat(s.lineHeight)/size||v.lineHeight,align:['left','center','right'].includes(s.textAlign)?s.textAlign:'left',color,font})
  },[item,device,section,publication?.typography,publication?.scenes])
  const valueFor=key=>v?.textOverrides?.[key]?v[key]:computed[key]??v?.[key]
  const baseImage=!item&&baseSelection?.sectionId===section?.id&&baseSelection?.layerId?.startsWith('image:')?section.images?.[Number(baseSelection.layerId.slice(6))]:null
  function moveTo(x,y){const w=panel.current?.offsetWidth||300;setPos({x:Math.max(0,Math.min(x,window.innerWidth-w)),y:Math.max(0,Math.min(y,window.innerHeight-48))})}
  useEffect(()=>{const resize=()=>setPos(p=>p?{x:Math.max(0,Math.min(p.x,window.innerWidth-(panel.current?.offsetWidth||300))),y:Math.max(0,Math.min(p.y,window.innerHeight-48))}:p);window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize)},[])
  const patch=p=>studio.patch(section.id,item.id,p)
  const num=(label,key,min,max,step=1)=><NumberField key={key} {...{label,min,max,step}} value={valueFor(key)} onChange={value=>patch({[key]:value})}/>
  const pick=(label,key,options)=><label>{label}<select value={valueFor(key)} onChange={e=>patch({[key]:e.target.value})}>{options.map(([value,name])=><option key={value} value={value}>{name}</option>)}</select></label>
  const color=(label,key)=><label>{label}<input type="color" value={valueFor(key)} onChange={e=>patch({[key]:e.target.value})}/></label>
  const check=(label,key)=><label><span><input type="checkbox" checked={v[key]} onChange={e=>patch({[key]:e.target.checked})}/> {label}</span></label>
  return <aside className="pt-studio-panel" ref={panel} aria-label="DORTIS Studio" style={pos?{'--studio-panel-x':pos.x+'px','--studio-panel-y':pos.y+'px'}:undefined}>
    <header className="pt-studio-panel__header" onPointerDown={e=>{if(e.button!==0||e.target.closest('button'))return;const r=panel.current.getBoundingClientRect();drag.current={id:e.pointerId,dx:e.clientX-r.left,dy:e.clientY-r.top};e.currentTarget.setPointerCapture(e.pointerId);e.preventDefault()}}
      onPointerMove={e=>{const d=drag.current;if(d?.id===e.pointerId)moveTo(e.clientX-d.dx,e.clientY-d.dy)}}
      onPointerUp={()=>drag.current=null} onPointerCancel={()=>drag.current=null} onLostPointerCapture={()=>drag.current=null}>
      <strong>⠿ DORTIS STUDIO</strong><span><button type="button" aria-label="Đặt lại vị trí" onClick={()=>setPos(null)}>↺</button> <button type="button" aria-label={collapsed?'Mở rộng':'Thu nhỏ'} onClick={()=>setCollapsed(x=>!x)}>{collapsed?'+':'−'}</button></span>
    </header>
    {!collapsed&&<div className="pt-studio-panel__body">
      <div className="pt-studio-panel__grid"><button aria-pressed={device==='desktop'} onClick={()=>onDevice('desktop')}>Desktop</button><button aria-pressed={device==='mobile'} onClick={()=>onDevice('mobile')}>Mobile</button>
      <button disabled={!canUndo||busy} onClick={onUndo}>↶ Hoàn tác</button><button disabled={!canRedo||busy} onClick={onRedo}>↷ Làm lại</button></div>
      <button type="button" aria-expanded={blockOpen} onClick={()=>setBlockOpen(x=>!x)}>Khối nội dung {blockOpen?'−':'+'}</button>
      {blockOpen&&<div style={{display:'grid',gap:6}}>
        <label>Mẫu nhanh<select value="" disabled={busy} onChange={e=>{const preset=CONTENT_BLOCK_PRESETS[Number(e.target.value)];if(preset){const id=onAddSection(...preset);if(id)setSectionId(id)}}}><option value="" disabled>+ Thêm mẫu nội dung</option>{CONTENT_BLOCK_PRESETS.map((p,i)=><option key={i} value={i}>{p[0]}</option>)}</select></label>
        {sections.map((s,i)=><div key={s.id} draggable={!busy} onDragStart={e=>e.dataTransfer.setData('text/plain',s.id)} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();onBlockAction(e.dataTransfer.getData('text/plain'),'move',s.id)}} style={{display:'grid',gap:3,border:'1px solid #7775',borderRadius:6,padding:5}}>
          <button onClick={()=>{setSectionId(s.id);studio.clear();document.getElementById('pt-'+s.id)?.scrollIntoView({block:'start'})}}>⠿ {s.label}</button>
          <div className="pt-studio-panel__grid"><button disabled={busy} onClick={()=>onBlockAction(s.id,'toggle')}>{publication.contentBlockHidden?.[s.id]?'Hiện':'Ẩn'}</button><button disabled={busy} onClick={()=>onBlockAction(s.id,'clone')}>Clone</button><button disabled={busy||i===0} onClick={()=>onBlockAction(s.id,'move',sections[i-1].id)}>↑</button><button disabled={busy||i===sections.length-1} onClick={()=>onBlockAction(s.id,'move',sections[i+1].id)}>↓</button></div>
        </div>)}
      </div>}
      <label>Khu vực<select value={section?.id||''} onChange={e=>{setSectionId(e.target.value);studio.clear();document.getElementById('pt-'+e.target.value)?.scrollIntoView({block:'start',behavior:'smooth'})}}>{sections.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
      <div className="pt-studio-panel__grid">
        {Object.entries(labels).map(([kind,label])=><button disabled={busy||!section} key={kind} onClick={()=>kind==='image'?upload.current.click():onAdd(section.id,kind)}>+ {label}</button>)}
        <button disabled={busy} onClick={()=>{const name=window.prompt('Tên khu vực mới','Khu vực mới');if(name?.trim()){const id=onAddSection(name.trim());if(id)setSectionId(id)}}}>+ Section</button>
        <button disabled={busy||!section} onClick={()=>studio.clear()}>Bỏ chọn</button>
      </div>
      <input ref={upload} hidden type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple onChange={e=>{const files=Array.from(e.target.files||[]);e.target.value='';if(section&&files.length)onUpload(section.id,files)}}/>
      <input ref={replace} hidden type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;if(item)onUpload(section.id,[file],item.id);else if(baseSelection)onReplaceBase(baseSelection.sectionId,baseSelection.layerId,file)}}/>
      <strong>Layer · {section?.label}</strong>
      <div className="pt-studio-panel__layers">
        {items.slice().sort((a,b)=>resolveStudioLayout(b[device],b.kind,device).z-resolveStudioLayout(a[device],a.kind,device).z).map(e=><button key={e.id} aria-pressed={item?.id===e.id} onClick={()=>studio.select(section.id,e.id)}>{e[device]?.hidden?'◌ ':''}{e[device]?.locked?'🔒 ':''}{labels[e.kind]} · {e.text||e.alt||'Layer'}</button>)}
        {section&&['eyebrow','title','body',...Array.from({length:section.slots||0},(_,i)=>'image:'+i)].map(id=><button key={id} aria-pressed={baseSelection?.sectionId===section.id&&baseSelection?.layerId===id} onClick={()=>onSelectBase(section.id,id)}>{id.startsWith('image:')?'Ảnh '+(Number(id.slice(6))+1):({eyebrow:'Nhãn phụ',title:'Tiêu đề gốc',body:'Nội dung gốc'})[id]}</button>)}
      </div>
      {baseSelection?.layerId?.startsWith('image:')&&!item&&<><button disabled={busy} onClick={()=>replace.current.click()}>Thay / thêm ảnh đang chọn</button>
        {baseImage?.path&&<><label>Hiệu ứng ảnh<select value={photoMotionMode(baseImage)} onChange={e=>onPatchBaseImage(section.id,baseSelection.layerId,{motion:e.target.value,motionPointer:supportsPhotoPointer(e.target.value)})}>{PHOTO_MOTION_OPTIONS.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}</select></label>
        <NumberField label="Cường độ ảnh (%)" value={photoMotionIntensity(baseImage)} min={0} max={100} onChange={value=>onPatchBaseImage(section.id,baseSelection.layerId,{motionIntensity:value})}/>
        {supportsPhotoPointer(photoMotionMode(baseImage))&&<label><span><input type="checkbox" checked={photoMotionPointer(baseImage)} onChange={e=>onPatchBaseImage(section.id,baseSelection.layerId,{motionPointer:e.target.checked})}/> Theo con trỏ</span></label>}</>}
      </>}
      {inspector}
      {item&&isStudioText(item.kind)&&<div className="pt-studio-panel__grid"><button onClick={()=>studio.duplicate(section.id,item.id)}>Nhân bản</button><button onClick={()=>patch({locked:!v.locked})}>{v.locked?'Mở khóa':'Khóa vị trí'}</button><label>Chuyển khu vực<select value={section.id} onChange={e=>studio.move(section.id,item.id,e.target.value)}>{sections.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label></div>}
      {item&&!isStudioText(item.kind)&&<>
        <div className="pt-studio-panel__tabs">{[['content','Nội dung'],['type','Kiểu chữ'],['layout','Bố cục'],['style','Giao diện'],['motion','Hiệu ứng'],['layer','Layer']].map(([id,label])=><button key={id} aria-pressed={tab===id} onClick={()=>setTab(id)}>{label}</button>)}</div>
        {tab==='content'&&<><button type="button" style={{color:'#ff7777'}} disabled={busy} onClick={()=>{if(window.confirm('Xóa layer này?'))studio.remove(section.id,item.id)}}>Xóa nội dung / layer</button>{item.kind==='image'?<><label>Mô tả ảnh<input value={item.alt||''} onChange={e=>patch({alt:e.target.value})}/></label><button disabled={busy} onClick={()=>replace.current.click()}>Thay ảnh</button></>:item.kind!=='shape'?<><label>Nội dung<textarea rows={4} value={item.text||''} onChange={e=>patch({text:e.target.value})}/></label>{item.kind==='button'&&<label>Liên kết<input value={item.href||''} onChange={e=>patch({href:e.target.value})} placeholder="https://..."/></label>}</>:<span>Chỉnh nền, viền tại Giao diện.</span>}</>}
        {tab==='type'&&<>{isStudioText(item.kind)&&<><span>Kiểu chữ mặc định lấy từ template / title hoặc nội dung gốc.</span><button onClick={()=>patch({inheritTypography:true})}>Khôi phục CSS template</button></>}{pick('Font','font',STUDIO_FONTS.map(f=>[f,f]))}<div className="pt-studio-panel__grid">{num('Cỡ chữ','size',8,240)}{num('Độ đậm','weight',100,900,100)}{num('Giãn chữ','spacing',-8,20,.1)}{num('Giãn dòng','lineHeight',.7,3,.05)}{color('Màu chữ','color')}</div>{pick('Căn chữ','align',[['left','Trái'],['center','Giữa'],['right','Phải']])}</>}
        {tab==='layout'&&<div className="pt-studio-panel__grid">{num('X (%)','x',-100,200,.5)}{num('Y (%)','y',-100,200,.5)}{num('Rộng (%)','w',4,180,.5)}{num('Cao (%)','h',3,180,.5)}{num('Xoay (°)','rotation',-180,180)}{num('Thứ tự','z',1,99)}</div>}
        {tab==='style'&&<><div className="pt-studio-panel__grid">{num('Opacity (%)','opacity',0,100)}{num('Bo góc','radius',0,200)}{num('Viền','border',0,20)}{color('Màu viền','borderColor')}{num('Shadow','shadow',0,80)}{num('Blur','blur',0,20)}{color('Màu nền','background')}{check('Hiện nền','fill')}</div>{item.kind==='image'&&pick('Hiển thị ảnh','fit',[['cover','Phủ đầy'],['contain','Vừa khung']])}</>}
        {tab==='motion'&&<>{pick('Hiệu ứng','effect',STUDIO_EFFECTS.map(f=>[f,effects[f]]))}{v.effect==='inherit'&&<span>Dùng chung hiệu ứng cuộn của trang (fade in/out).</span>}{!['inherit','auto','none'].includes(v.effect)&&<div className="pt-studio-panel__grid">{num('Thời gian (s)','duration',.12,2.4,.1)}{num('Trễ (s)','delay',0,1.6,.1)}</div>}{check('Đảo ngược khi cuộn lên','reverse')}<button onClick={onPreview}>Xem thử hiệu ứng</button></>}
        {tab==='layer'&&<>{check('Ẩn layer','hidden')}{check('Khóa vị trí','locked')}<div className="pt-studio-panel__grid"><button onClick={()=>patch({z:v.z+1})}>Lên lớp</button><button onClick={()=>patch({z:v.z-1})}>Xuống lớp</button><button onClick={()=>studio.duplicate(section.id,item.id)}>Nhân bản</button><button onClick={()=>{if(window.confirm('Xóa layer này?'))studio.remove(section.id,item.id)}}>Xóa</button></div><label>Chuyển sang khu vực<select value={section.id} onChange={e=>studio.move(section.id,item.id,e.target.value)}>{sections.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label></>}
      </>}
      <div className="pt-studio-panel__status" role="status">{notice||'Chỉnh sửa trên bản nháp'}</div>
      <div className="pt-studio-panel__grid"><button disabled={busy} onClick={onPreview}>Xem trước</button><button disabled={busy} onClick={onPublish}>Xuất bản</button></div>
      <button disabled={busy} onClick={onDiscard}>Hủy bản nháp</button>
    </div>}
  </aside>
}
