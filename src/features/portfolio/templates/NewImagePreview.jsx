import React,{useEffect,useRef,useState} from 'react'
import {createPortal} from 'react-dom'
import PhotoMotion from './PhotoMotion'
import {PHOTO_MOTION_OPTIONS} from './photoMotionConfig.js'
import {NEW_IMAGE_APPEARANCE,inspectImageFile} from './newImageAppearance.js'
import './new-image-preview.css'

export default function NewImagePreview({files,busy=false,onCancel,onConfirm}){
  const dialog=useRef(null)
  const [style,setStyle]=useState({...NEW_IMAGE_APPEARANCE})
  const [entries,setEntries]=useState([]),[error,setError]=useState(''),[index,setIndex]=useState(0)
  const [submitting,setSubmitting]=useState(false)
  const pending=busy||submitting
  useEffect(()=>{dialog.current?.showModal();return()=>dialog.current?.close()},[])
  useEffect(()=>{
    let active=true
    const urls=files.map(file=>URL.createObjectURL(file))
    Promise.all(files.map(async(file,i)=>({file,url:urls[i],info:await inspectImageFile(file)})))
      .then(data=>{if(active)setEntries(data)})
      .catch(e=>{if(active)setError('Không đọc được ảnh: '+e.message)})
    return()=>{active=false;urls.forEach(url=>URL.revokeObjectURL(url))}
  },[files])
  const entry=entries[index]
  const patch=(key,value)=>setStyle(old=>({...old,[key]:value}))
  async function confirm(){
    setSubmitting(true);setError('')
    try{await onConfirm(style,entries)}catch(e){setError(e.message)}
    finally{setSubmitting(false)}
  }
  return createPortal(<dialog ref={dialog} className="pt-new-image" aria-labelledby="pt-new-image-title"
    onCancel={event=>{event.preventDefault();if(!pending)onCancel()}}>
    <header><div><small>ẢNH MỚI / XEM TRƯỚC</small><h2 id="pt-new-image-title">Hoàn thiện ảnh trước khi thêm</h2></div>
      <button type="button" disabled={pending} onClick={onCancel} aria-label="Đóng xem trước ảnh">×</button></header>
    <div className="pt-new-image__layout">
      <div className="pt-new-image__stage">
        {entry?<div className="pt-studio-layer__visual pt-new-image__photo" style={{borderRadius:style.radius,boxShadow:'0 6px '+style.shadow+'px #0004'}}>
          <PhotoMotion asset={{motion:style.photoMotion,motionIntensity:style.photoIntensity}}>
            <img src={entry.url} alt={entry.file.name} style={{objectFit:style.fit}}/>
          </PhotoMotion></div>:<p role="status">Đang đọc thông tin ảnh…</p>}
      </div>
      <div className="pt-new-image__controls">
        <p>Chỉ áp dụng cho {files.length} ảnh đang thêm. Ảnh đã có giữ nguyên.</p>
        {entries.length>1&&<label>Ảnh xem trước<select value={index} onChange={e=>setIndex(Number(e.target.value))}>
          {entries.map((entry,i)=><option key={i} value={i}>{entry.file.name}</option>)}
        </select></label>}
        {entry&&<dl><dt>Nhận diện ảnh</dt><dd>{entry.info.width} × {entry.info.height} px · {{portrait:'Ảnh dọc',landscape:'Ảnh ngang',square:'Ảnh vuông'}[entry.info.orientation]}</dd>
          <dt>Nền ảnh</dt><dd>{entry.info.transparencyDetected?'Phát hiện vùng trong suốt':'Chưa thấy vùng trong suốt'}</dd>
          <dt>Tệp</dt><dd>{entry.file.type.replace('image/','').toUpperCase()} · {(entry.file.size/1024/1024).toFixed(2)} MB</dd></dl>}
        <label>Bo góc · {style.radius}px<input type="range" min="0" max="100" value={style.radius} onChange={e=>patch('radius',Number(e.target.value))}/></label>
        <label>Shadow · {style.shadow}<input type="range" min="0" max="80" value={style.shadow} onChange={e=>patch('shadow',Number(e.target.value))}/></label>
        <label>Cách hiển thị<select value={style.fit} onChange={e=>patch('fit',e.target.value)}><option value="cover">Phủ đầy khung</option><option value="contain">Hiện toàn bộ ảnh</option></select></label>
        <label>Chuyển động ảnh<select value={style.photoMotion} onChange={e=>patch('photoMotion',e.target.value)}>
          {PHOTO_MOTION_OPTIONS.map(option=><option key={option.id} value={option.id}>{option.label}</option>)}
        </select></label>
        <label>Cường độ · {style.photoIntensity}%<input type="range" min="0" max="100" value={style.photoIntensity} onChange={e=>patch('photoIntensity',Number(e.target.value))}/></label>
        <small>Ảnh kế thừa hiệu ứng cuộn của trang. Kiểm tra nền trong suốt bằng ảnh thu nhỏ; không tách nền.</small>
      </div>
    </div>
    {error&&<p role="alert">{error}</p>}
    <footer><button type="button" disabled={pending} onClick={onCancel}>Hủy</button>
      <button type="button" disabled={pending||!entries.length} onClick={confirm}>{pending?'Đang thêm ảnh…':'Thêm '+files.length+' ảnh vào bản nháp'}</button></footer>
  </dialog>,document.body)
}
