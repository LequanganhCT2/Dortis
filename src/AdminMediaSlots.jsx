import React,{useEffect,useMemo,useState} from 'react'
import {SITE_CONTENT_DEFAULTS,SITE_CONTENT_SCHEMAS} from './siteContent'
import './admin-media-slots-v3.css'

const editKey=(group,slot)=>group.id==='artist'?'artist-experience':
  ['services','projects'].includes(group.id)?slot.id:group.id
const hasFile=photo=>Boolean(photo?.image_url)
const toFieldList=key=>(SITE_CONTENT_SCHEMAS[key]||[]).flatMap(section=>section.fields)
const errMsg=error=>error?.message||'Không thể hoàn tất thao tác.'
const PREVIEW_TEXT={
  services:['line1','line2','description'],projects:['title','description',''],
  artist:['demoStageName','demoRole','demoDescription'],
  about:['heading1','accent1','description'],values:['heading','accent','description'],
  faq:['heading','accent','description'],contact:['heading','accent','description'],
}
function MediaPreview({group,draft,image,slot,opacity}){
  const keys=PREVIEW_TEXT[group.id]||['title','description','']
  const headline=String(draft[keys[0]]||slot.title||'')
  const accent=String(draft[keys[1]]||'')
  const desc=String(draft[keys[2]]||'')
  return <div className={'media-v3-preview-media media-v3-preview-'+group.id}>
    {image&&<img src={image.image_url} alt="" aria-hidden="true"
      style={opacity==null?undefined:{opacity:Number(opacity)/100}}/>}
    <div className="media-v3-preview-overlay">
      <span>DORTIS / {slot.title}</span>
      <strong>{headline}<em>{accent}</em></strong>
      {desc&&<small>{desc}</small>}
    </div>
  </div>
}

export default function AdminMediaSlots({group,supabase,user,primary,gallery,
  busy,progress,replacePrimary,replaceGallery,uploadBatch,move,requestDelete,
  reload,onNotice,onError}){
  const [open,setOpen]=useState(null)
  const [records,setRecords]=useState({})
  const [draft,setDraft]=useState({})
  const [selected,setSelected]=useState({})
  const [pending,setPending]=useState('')
  const [feedback,setFeedback]=useState('')
  const [localError,setLocalError]=useState('')
  const [initialized,setInitialized]=useState(false)
  const [opacityDraft,setOpacityDraft]=useState({})
  const keys=useMemo(()=>[...new Set(group.slots.map(slot=>editKey(group,slot)))],[group.id])
  useEffect(()=>{
    let alive=true
    const read=async()=>{
      const {data,error}=await supabase.from('site_content').select('key,content').in('key',keys)
      if(!alive)return
      if(error)setLocalError(errMsg(error))
      else setRecords(Object.fromEntries((data||[]).map(row=>[row.key,row.content||{}])))
      setInitialized(true)
    }
    read()
    const channel=supabase.channel('dortis-media-editor-'+group.id)
      .on('postgres_changes',{event:'*',schema:'public',table:'site_content'},read).subscribe()
    return()=>{alive=false;supabase.removeChannel(channel)}
  },[supabase,group.id,keys])

  const getDraft=slot=>{
    const key=editKey(group,slot)
    return {...(SITE_CONTENT_DEFAULTS[key]||{}),...(records[key]||{})}
  }
  const fieldList=slot=>toFieldList(editKey(group,slot))
  const dirty=slot=>{
    const initial=getDraft(slot)
    return fieldList(slot).some(field=>
      String(draft[field.key]??'')!==String(initial[field.key]??''))
  }
  const edit=slot=>{
    if(pending||busy)return
    if(open&&open!==slot.id){
      const old=group.slots.find(item=>item.id===open)
      if(old&&dirty(old)&&!window.confirm('Nội dung đang sửa chưa được lưu. Bỏ các thay đổi?'))return
    }else if(open===slot.id&&dirty(slot)){
      if(!window.confirm('Chữ vừa sửa chưa được lưu. Đóng mà không lưu?'))return
    }
    setOpen(open===slot.id?null:slot.id)
    setDraft(getDraft(slot));setFeedback('');setLocalError('')
  }
  const mutate=async(key,changes)=>{
    const {data:before,error:rError}=await supabase.from('site_content')
      .select('content').eq('key',key).maybeSingle()
    if(rError)throw rError
    const merged={...(before?.content||{}),...changes}
    const {data,error}=await supabase.from('site_content').upsert({
      key,content:merged,updated_by:user.id,updated_at:new Date().toISOString()
    },{onConflict:'key'}).select('key').single()
    if(error||!data)throw error||new Error('Supabase chưa xác nhận bản ghi.')
    setRecords(old=>({...old,[key]:merged}))
    return merged
  }
  const saveOpacity=async(photo,slot,value)=>{
    if(!photo||busy||pending)return
    const percent=value===null?null:Math.max(0,Math.min(100,Math.round(Number(value))))
    const photoKey=photo.kind==='primary'?'primary:'+slot.id:'gallery:'+photo.id
    setPending('opacity-'+photoKey);setLocalError('');setFeedback('')
    try{
      const query=photo.kind==='primary'
        ?supabase.from('site_images')
          .update({opacity_percent:percent,updated_by:user.id,updated_at:new Date().toISOString()})
          .eq('slot',slot.id).select('slot').single()
        :supabase.from('site_image_gallery')
          .update({opacity_percent:percent,updated_by:user.id})
          .eq('id',photo.id).eq('slot',slot.id).select('id').single()
      const {error,data}=await query
      if(error||!data)throw error||new Error('Không thể lưu độ mờ cho ảnh đã chọn.')
      setOpacityDraft(old=>{const next={...old};delete next[photoKey];return next})
      await reload()
      setFeedback(percent===null?'Đã khôi phục độ mờ mặc định.':'Đã lưu độ hiển thị '+percent+'% cho ảnh.')
      onNotice('Đã lưu độ mờ riêng cho '+slot.title+'.')
    }catch(error){setLocalError(errMsg(error));onError(errMsg(error))}
    finally{setPending('')}
  }
  const save=async slot=>{
    if(pending||busy)return
    const key=editKey(group,slot)
    setPending(slot.id);setLocalError('');setFeedback('')
    try{
      const patch={}
      for(const field of fieldList(slot)){
        const value=String(draft[field.key]??'').trim()
        if(value.length>field.max)throw new Error(field.label+' vượt giới hạn '+field.max+' ký tự.')
        patch[field.key]=value
      }
      patch.archived=false
      await mutate(key,patch)
      setOpen(null)
      setFeedback('Đã lưu '+slot.title+' và tự thu gọn.')
      onNotice('Đã cập nhật nội dung '+slot.title+'.')
    }catch(error){setLocalError(errMsg(error));onError(errMsg(error))}
    finally{setPending('')}
  }
  const add=async()=>{
    if(pending||busy)return
    const choices=group.slots.filter(slot=>!hasFile(primary[slot.id])&&!(gallery[slot.id]||[]).length)
    const empty=group.id==='services'?
      choices.find(slot=>slot.id.startsWith('service-gallery-')||records[editKey(group,slot)]?.archived):
      choices[0]
    if(!empty)return
    setPending(empty.id);setLocalError('')
    try{
      const key=editKey(group,empty)
      if(records[key]?.archived)await mutate(key,{archived:false})
      setOpen(empty.id);setDraft(getDraft(empty))
      setFeedback('Đang thêm '+empty.title+'. Tải ảnh hoặc nhập nội dung và lưu để hoàn thành.')
    }catch(error){setLocalError(errMsg(error))}
    finally{setPending('')}
  }
  const deleteCard=async slot=>{
    if(pending||busy)return
    if(!window.confirm('Xóa thẻ "'+slot.title+'"? Toàn bộ ảnh của thẻ sẽ được gỡ khỏi website và Storage.'))return
    const key=editKey(group,slot)
    setPending(slot.id);setLocalError('');setFeedback('')
    try{
      // Hide service cards first, so partial cleanup never exposes obsolete content.
      await mutate(key,{archived:true})
      const oldPrimary=primary[slot.id]
      const oldGallery=gallery[slot.id]||[]
      const paths=[oldPrimary?.storage_path,...oldGallery.map(row=>row.storage_path)].filter(Boolean)
      if(oldPrimary?.image_url){
        const {error}=await supabase.from('site_images').upsert({
          slot:slot.id,image_url:null,storage_path:null,
          updated_by:user.id,updated_at:new Date().toISOString()
        },{onConflict:'slot'})
        if(error)throw error
      }
      if(oldGallery.length){
        const {error}=await supabase.from('site_image_gallery').delete().eq('slot',slot.id)
        if(error)throw error
      }
      if(paths.length){
        const {error}=await supabase.storage.from('dortis-media').remove(paths)
        if(error)setLocalError('Thẻ đã ẩn nhưng có file ảnh cũ chưa dọn khỏi Storage.')
      }
      await reload()
      setOpen(null)
      onNotice('Đã xóa thẻ '+slot.title+'. Có thể thêm lại từ thanh chính.')
    }catch(error){setLocalError(errMsg(error));onError(errMsg(error))}
    finally{setPending('')}
  }
  const hasAdd=group.id==='services'||group.id==='projects'
  const availableAdd=group.slots.some(slot=>{
    if(hasFile(primary[slot.id])||(gallery[slot.id]||[]).length)return false
    return group.id==='projects'||slot.id.startsWith('service-gallery-')||
      Boolean(records[editKey(group,slot)]?.archived)
  })
  if(!initialized)return <p className="admin-media-loading">Đang tải các thẻ...</p>
  return <div className="media-v3-group">
    <div className="media-v3-toolbar">
      <div><strong>Quản lý {group.title.toLowerCase()}</strong>
        <p>Nhấn Sửa để chỉnh nội dung, quản lý ảnh và xem trước. Lưu sẽ tự thu gọn thẻ.</p></div>
      {hasAdd&&<button type="button" className="hero-add-card" disabled={!!busy||!!pending||!availableAdd}
        onClick={add}>{availableAdd?'+ THÊM THẺ':'ĐÃ ĐỦ VỊ TRÍ'}</button>}
    </div>
    {localError&&<p role="alert" className="hero-editor-error">{localError}</p>}
    {feedback&&<p role="status" className="hero-editor-success">{feedback}</p>}
    {group.slots.map((slot,index)=>{
      const key=editKey(group,slot)
      const expanded=open===slot.id
      const primaryPhoto=primary[slot.id]?.image_url?{kind:'primary',...primary[slot.id]}:null
      const photos=(gallery[slot.id]||[]).map((photo,i)=>({...photo,kind:'gallery',galleryIndex:i}))
      const allPhotos=[...(primaryPhoto?[primaryPhoto]:[]),...photos]
      const selectedId=selected[slot.id]
      const photo=allPhotos.find(item=>item.kind==='primary'?(selectedId==='primary'):(selectedId===item.id))||allPhotos[0]
      const opacityKey=photo?.kind==='primary'?'primary:'+slot.id:'gallery:'+photo?.id
      const storedOpacity=photo?.opacity_percent
      const photoOpacity=opacityDraft[opacityKey]??storedOpacity??100
      const opacityDirty=storedOpacity==null||Number(photoOpacity)!==Number(storedOpacity)
      const slotBusy=busy===slot.id
      const fields=SITE_CONTENT_SCHEMAS[key]||[]
      const cardText=expanded?draft:getDraft(slot)
      const archived=Boolean(records[key]?.archived)
      return <article key={slot.id} className={'media-v3-card'+(expanded?' is-open':'')}>
        <div className="media-v3-card-heading">
          <div className="hero-editor-card-label">
            <span className="hero-card-sequence">{String(index+1).padStart(2,'0')}</span>
            <div><strong>{slot.title}</strong>
              <small>{allPhotos.length} ảnh{archived?' · ĐÃ ẨN':' · '+(expanded?'ĐANG SỬA':'ĐÃ THU GỌN')}</small></div>
          </div>
          <div className="hero-editor-head-actions">
            {hasAdd&&<button type="button" className="hero-editor-delete-button"
              disabled={!!pending||!!busy} onClick={()=>deleteCard(slot)}>XÓA THẺ</button>}
            <button type="button" className="hero-editor-edit-button" disabled={!!pending||!!busy}
              onClick={()=>edit(slot)}>{expanded?'THU GỌN':'✎ SỬA THẺ'}</button>
          </div>
        </div>
        {expanded&&<>
          <div className="hero-editor-columns">
            <div className="hero-editor-col hero-editor-text">
              <h4>01 / NỘI DUNG CHỮ</h4>
              <p>Sửa nội dung của {slot.title}</p>
              {fields.map(section=><fieldset className="media-v3-fieldset" key={section.title}>
                <legend>{section.title}</legend>
                {section.fields.map(field=><label key={field.key}>
                  <span>{field.label}</span>
                  {field.multiline?
                    <textarea rows={3} maxLength={field.max}
                      value={draft[field.key]??''}
                      onChange={e=>setDraft(value=>({...value,[field.key]:e.target.value}))}/>:
                    <input type="text" maxLength={field.max}
                      value={draft[field.key]??''}
                      onChange={e=>setDraft(value=>({...value,[field.key]:e.target.value}))}/>}
                </label>)}
              </fieldset>)}
            </div>
            <div className="hero-editor-col hero-editor-media">
              <h4>02 / QUẢN LÝ ẢNH</h4>
              <p>Thư viện ảnh riêng · Tối đa 24 ảnh bổ sung</p>
              <div className="media-v3-image-tools">
                <label className={'hero-photo-upload'+(busy||pending?' disabled':'')}>
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/avif"
                    disabled={!!busy||!!pending} onChange={e=>{
                      const file=e.target.files?.[0];e.target.value=''
                      replacePrimary(slot.id,file)
                    }}/>
                  <span>{primaryPhoto?'THAY ẢNH CHÍNH':'+ TẢI ẢNH CHÍNH'}</span>
                  <small>JPG, PNG, WebP, AVIF · Tối đa 5 MB</small>
                </label>
                <label className={'hero-photo-upload'+(busy||pending||photos.length>=24?' disabled':'')}>
                  <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif"
                    disabled={!!busy||!!pending||photos.length>=24}
                    onChange={e=>{
                      const files=Array.from(e.target.files||[]);e.target.value=''
                      uploadBatch(slot.id,files)
                    }}/>
                  <span>+ THÊM NHIỀU ẢNH</span><small>{photos.length} / 24 ảnh bổ sung</small>
                </label>
              </div>
              {slotBusy&&progress&&<p className="media-v3-progress" role="status">
                Đang tải {progress.done}/{progress.total} ảnh...</p>}
              {allPhotos.length?
                <div className="hero-photo-options">
                  {allPhotos.map((item,i)=><button type="button" key={item.kind==='primary'?'primary':item.id}
                    className={'hero-photo-option'+(item===photo?' active':'')}
                    aria-label={'Chọn ảnh '+(i+1)} onClick={()=>setSelected(old=>({
                      ...old,[slot.id]:item.kind==='primary'?'primary':item.id
                    }))}>
                    <img src={item.image_url} alt={'Ảnh '+(i+1)} loading="lazy"/>
                    <small>{item.kind==='primary'?'CHÍNH':String(i+1).padStart(2,'0')}</small>
                  </button>)}
                </div>:<p className="media-v3-empty">Chưa có ảnh. Tải ảnh chính hoặc thêm ảnh vào album.</p>}
              {photo&&<div className="hero-photo-selected-actions">
                <span>{photo.kind==='primary'?'Ảnh chính':'Ảnh bổ sung'} đang chọn</span>
                <div>
                  <label className={'hero-photo-replace'+(busy||pending?' disabled':'')}>
                    <input type="file" disabled={!!busy||!!pending} accept="image/jpeg,image/png,image/webp,image/avif"
                      onChange={e=>{
                        const file=e.target.files?.[0];e.target.value=''
                        if(photo.kind==='primary')replacePrimary(slot.id,file)
                        else replaceGallery(slot.id,photo,file)
                      }}/>
                    SỬA ẢNH
                  </label>
                  <button type="button" className="hero-photo-delete" disabled={!!busy||!!pending}
                    onClick={()=>requestDelete(photo.kind==='primary'?
                      {slot:slot.id,kind:'primary',storage_path:photo.storage_path}:
                      {slot:slot.id,kind:'gallery',id:photo.id,storage_path:photo.storage_path})}>
                    XÓA ẢNH
                  </button>
                  {photo.kind==='gallery'&&<>
                    <button type="button" className="media-v3-move" disabled={!!busy||!!pending||photo.galleryIndex===0}
                      onClick={()=>move(slot.id,photo.galleryIndex,-1)}>← TRƯỚC</button>
                    <button type="button" className="media-v3-move" disabled={!!busy||!!pending||photo.galleryIndex===photos.length-1}
                      onClick={()=>move(slot.id,photo.galleryIndex,1)}>SAU →</button>
                  </>}
                </div>
              </div>}
              {photo&&<div className="media-opacity-control">
                <div className="media-opacity-top"><label htmlFor={'media-opacity-'+slot.id}>
                  ĐỘ HIỂN THỊ ẢNH</label><output>{photoOpacity}%</output></div>
                <input id={'media-opacity-'+slot.id} type="range" min="0" max="100" step="1"
                  value={photoOpacity} disabled={!!busy||!!pending}
                  onChange={event=>setOpacityDraft(old=>({...old,[opacityKey]:Number(event.target.value)}))}/>
                <div className="media-opacity-actions">
                  <button type="button" disabled={!!busy||!!pending||!opacityDirty}
                    onClick={()=>saveOpacity(photo,slot,photoOpacity)}>LƯU ĐỘ MỜ</button>
                  <button type="button" disabled={!!busy||!!pending||storedOpacity==null}
                    onClick={()=>saveOpacity(photo,slot,null)}>MẶC ĐỊNH</button>
                </div>
                <small>Độ mờ được lưu riêng cho ảnh đang chọn, không ảnh hưởng các ảnh khác.</small>
              </div>}
            </div>
            <div className="hero-editor-col hero-editor-preview">
              <h4>03 / XEM TRƯỚC HTML/CSS</h4>
              <p>Chữ cập nhật tức thì khi chỉnh sửa.</p>
              <MediaPreview group={group} slot={slot} draft={cardText} image={photo} opacity={photoOpacity}/>
              <a href="/" target="_blank" rel="noreferrer" className="hero-live-site-link">
                XEM TRÊN WEBSITE ↗</a>
            </div>
          </div>
          <div className="hero-editor-footer">
            <span>{dirty(slot)?'● Có thay đổi chưa lưu':'Nội dung đã được đồng bộ'}</span>
            <div>
              <button type="button" className="hero-editor-cancel" disabled={!!busy||!!pending}
                onClick={()=>edit(slot)}>ĐÓNG</button>
              <button type="button" className="hero-editor-save" disabled={!!busy||!!pending}
                onClick={()=>save(slot)}>
                {pending===slot.id?'ĐANG LƯU...':'LƯU THẺ & THU GỌN ✓'}
              </button>
            </div>
          </div>
        </>}
      </article>
    })}
  </div>
}
