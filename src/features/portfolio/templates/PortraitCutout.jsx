import React,{useEffect,useRef,useState} from 'react'

export default function PortraitCutout({disabled,onApply}){
  const fileInput=useRef(null)
  const active=useRef(true)
  const [processing,setProcessing]=useState(false)
  const [preview,setPreview]=useState(null)
  const [error,setError]=useState('')

  useEffect(()=>{
    active.current=true
    return ()=>{active.current=false}
  },[])
  useEffect(()=>()=>{
    if(preview)URL.revokeObjectURL(preview.url)
  },[preview])

  async function prepare(file,alreadyTransparent){
    if(!file||processing)return
    setPreview(null)
    setError('')
    setProcessing(true)
    try{
      const result=alreadyTransparent?file:
        await (await import('./cutOutPortrait')).cutOutPortrait(file)
      if(result.size>4*1024*1024)throw new Error('Ảnh cần nhỏ hơn hoặc bằng 4 MB.')
      if(active.current)setPreview({file:result,url:URL.createObjectURL(result)})
    }catch(error){
      if(active.current)setError('Không xử lý được ảnh. '+error.message)
    }finally{
      if(active.current)setProcessing(false)
    }
  }

  return <div className="pt-cutout">
    <strong>Ảnh chính · Ô 1</strong>
    <div className="pt-cutout__actions">
      <button type="button" className="pt-btn pt-btn--light"
        disabled={disabled||processing} onClick={()=>fileInput.current?.click()}>
        {processing?'Đang tách nền…':'Tách nền từ ảnh'}
      </button>
      <input ref={fileInput} type="file" hidden accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={event=>{prepare(event.target.files?.[0],false);event.target.value=''}}/>
      <label className="pt-btn pt-btn--light pt-cutout__file">
        Chọn PNG/WebP trong suốt
        <input type="file" accept="image/png,image/webp" disabled={disabled||processing}
          onChange={event=>{prepare(event.target.files?.[0],true);event.target.value=''}}/>
      </label>
    </div>
    {error&&<p className="pt-alert" role="alert">{error}</p>}
    {preview&&<div className="pt-cutout__preview">
      <img src={preview.url} alt="Xem trước ảnh chính" />
      <div className="pt-cutout__actions">
        <button type="button" className="pt-btn" disabled={disabled}
          onClick={async()=>{if(await onApply(preview.file))setPreview(null)}}>Dùng làm ảnh chính</button>
        <button type="button" className="pt-btn pt-btn--light" disabled={disabled}
          onClick={()=>setPreview(null)}>Hủy</button>
      </div>
    </div>}
  </div>
}
