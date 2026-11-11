import React, { useEffect, useMemo, useState } from 'react'
import { SITE_CONTENT_DEFAULTS } from './siteContent'
import { HERO_CARD_LIMIT, HERO_IMAGES_PER_CARD, getActiveHeroCardCount, heroImageSlot } from './heroImageSets'
import './admin-hero-cards.css'

const BUCKET='dortis-media'
const MAX_FILE=5*1024*1024
const FILE_TYPES={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif'}
const FIELDS=[
  ['Title','Tên thẻ','Tên thẻ hiển thị trong quản trị'],
  ['Eyebrow','Dòng chữ nhỏ','DORTIS STUDIO / 01'],
  ['Line1','Tiêu đề – dòng 1','CV &'],
  ['Line2','Tiêu đề – dòng 2','Portfolio'],
  ['Footer','Chữ chân thẻ','HỒ SƠ NGHỆ SĨ'],
]
const PHOTO_FIELDS=[
  ['Eyebrow','Dòng nhỏ trên ảnh'],
  ['Line1','Chữ lớn – dòng 1'],
  ['Line2','Chữ lớn – dòng 2'],
  ['Footer','Chữ chân ảnh'],
]
const cardKey=(card,field)=>'card'+card+field
const photoKey=(card,image,field)=>'card'+card+'Image'+image+field
const cardKeys=card=>[
  ...FIELDS.map(([field])=>cardKey(card,field)),
  ...Array.from({length:HERO_IMAGES_PER_CARD},(_,index)=>
    PHOTO_FIELDS.map(([field])=>photoKey(card,index+1,field))).flat()
]
const validImage=file=>{
  if(!FILE_TYPES[file.type])return 'Chỉ chấp nhận JPG, PNG, WebP hoặc AVIF.'
  if(!file.size||file.size>MAX_FILE)return 'Mỗi ảnh phải có dung lượng từ 1 byte đến 5 MB.'
  return ''
}
const fail=error=>error?.message||'Thao tác không thành công, vui lòng thử lại.'

export default function AdminHeroCards({supabase,user,primary,onMediaUpdated,onNotice,onError}){
  const defaults=SITE_CONTENT_DEFAULTS.hero
  const [saved,setSaved]=useState(defaults)
  const [draft,setDraft]=useState(defaults)
  const [loading,setLoading]=useState(true)
  const [open,setOpen]=useState(null)
  const [selected,setSelected]=useState({})
  const [busy,setBusy]=useState('')
  const [progress,setProgress]=useState(null)
  const [localError,setLocalError]=useState('')
  const [localSuccess,setLocalSuccess]=useState('')
  const cardCount=getActiveHeroCardCount(saved)
  const counts=useMemo(()=>Array.from({length:cardCount},(_,i)=>{
    const card=i+1
    return Array.from({length:HERO_IMAGES_PER_CARD},(_,j)=>({
      number:j+1,slot:heroImageSlot(j+1,card),
      image:primary[heroImageSlot(j+1,card)]||null
    }))
  }),[cardCount,primary])

  useEffect(()=>{
    let active=true
    const read=async()=>{
      const {data,error}=await supabase.from('site_content').select('content').eq('key','hero').maybeSingle()
      if(!active)return
      if(error){setLocalError(fail(error))}
      else{
        const merged={...defaults,...(data?.content||{})}
        setSaved(merged);setDraft(prev=>open===null?merged:prev)
      }
      setLoading(false)
    }
    read()
    const channel=supabase.channel('dortis-admin-hero-editor')
      .on('postgres_changes',{event:'*',schema:'public',table:'site_content',filter:'key=eq.hero'},read)
      .subscribe()
    return()=>{active=false;supabase.removeChannel(channel)}
  },[supabase,open,defaults])

  const dirty=card=>cardKeys(card).some(key=>
    String(draft[key]??'')!==String(saved[key]??''))
  const clearMessages=()=>{setLocalError('');setLocalSuccess('');onError('')}
  const chooseCard=card=>{
    if(open!==null&&dirty(open)&&!window.confirm('Thẻ đang có chữ chưa lưu. Bỏ thay đổi và mở thẻ khác?'))return
    setDraft({...defaults,...saved})
    setOpen(card===open?null:card)
    clearMessages()
  }
  const update=(key,value)=>{setDraft(old=>({...old,[key]:value}));setLocalSuccess('')}
  const readRaw=async()=>{
    const {data,error}=await supabase.from('site_content').select('content').eq('key','hero').maybeSingle()
    if(error)throw error
    return data?.content||{}
  }
  const writeRaw=async(content)=>{
    const {data,error}=await supabase.from('site_content').upsert({
      key:'hero',content,updated_by:user.id,updated_at:new Date().toISOString()
    },{onConflict:'key'}).select('key').single()
    if(error||!data)throw error||new Error('Dữ liệu chưa được lưu.')
    setSaved({...defaults,...content})
    setDraft({...defaults,...content})
  }
  const addCard=async()=>{
    if(busy)return
    setBusy('adding');clearMessages()
    try{
      const current=await readRaw()
      const count=getActiveHeroCardCount(current)
      if(count>=HERO_CARD_LIMIT)throw new Error('Hero đã đủ 6 thẻ.')
      await writeRaw({...current,cardCount:String(count+1)})
      setOpen(count+1)
      setLocalSuccess('Đã thêm thẻ '+(count+1)+'. Chỉnh nội dung và nhấn Lưu để thu gọn.')
      onNotice('Đã thêm thẻ Hero '+(count+1)+'.')
    }catch(error){setLocalError(fail(error));onError(fail(error))}
    finally{setBusy('')}
  }
  const saveCard=async card=>{
    if(busy)return
    setBusy('saving');clearMessages()
    try{
      const updates={}
      for(const key of cardKeys(card)){
        const value=String(draft[key]??'').trim()
        if(value.length>800)throw new Error('Văn bản '+key+' không được dài quá 800 ký tự.')
        updates[key]=value
      }
      const current=await readRaw()
      await writeRaw({...current,...updates})
      setOpen(null)
      onNotice('Đã lưu thẻ '+card+' và tự thu gọn.')
    }catch(error){setLocalError(fail(error));onError(fail(error))}
    finally{setBusy('')}
  }
  const upload=async(card,files)=>{
    const chosen=Array.from(files||[])
    if(!chosen.length||busy)return
    const available=counts[card-1].filter(item=>!item.image?.image_url)
    if(chosen.length>available.length){
      setLocalError('Thẻ này chỉ còn '+available.length+' vị trí ảnh (tối đa 6 ảnh).');return
    }
    const issue=chosen.map(validImage).find(Boolean)
    if(issue){setLocalError(issue);return}
    setBusy('upload-'+card);setProgress({done:0,total:chosen.length});clearMessages()
    const filesAdded=[]
    try{
      for(let index=0;index<chosen.length;index++){
        const file=chosen[index],slot=available[index].slot
        const path=slot+'/'+crypto.randomUUID()+'.'+FILE_TYPES[file.type]
        const {error}=await supabase.storage.from(BUCKET).upload(path,file,{
          contentType:file.type,cacheControl:'3600',upsert:false
        })
        if(error)throw error
        filesAdded.push({slot,path,url:supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl})
        setProgress({done:index+1,total:chosen.length})
      }
      const {error}=await supabase.from('site_images').upsert(filesAdded.map(file=>({
        slot:file.slot,image_url:file.url,storage_path:file.path,
        updated_by:user.id,updated_at:new Date().toISOString()
      })),{onConflict:'slot'})
      if(error)throw error
      setSelected(old=>({...old,[card]:available[0].number}))
      await onMediaUpdated()
      onNotice('Đã thêm '+filesAdded.length+' ảnh vào thẻ '+card+'.')
      setLocalSuccess('Ảnh đã lưu; bạn có thể sửa chữ rồi nhấn Lưu thẻ.')
    }catch(error){
      if(filesAdded.length)await supabase.storage.from(BUCKET).remove(filesAdded.map(file=>file.path))
      setLocalError(fail(error));onError(fail(error))
    }finally{setBusy('');setProgress(null)}
  }
  const replace=async(item,file)=>{
    if(!file||busy)return
    const issue=validImage(file);if(issue){setLocalError(issue);return}
    setBusy('replacing');clearMessages()
    const oldPath=item.image?.storage_path
    const path=item.slot+'/'+crypto.randomUUID()+'.'+FILE_TYPES[file.type]
    let uploaded=false
    try{
      const {error:upError}=await supabase.storage.from(BUCKET).upload(path,file,{
        contentType:file.type,cacheControl:'3600',upsert:false
      })
      if(upError)throw upError
      uploaded=true
      const url=supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
      const {error:dbError}=await supabase.from('site_images').upsert({
        slot:item.slot,image_url:url,storage_path:path,
        updated_by:user.id,updated_at:new Date().toISOString()
      },{onConflict:'slot'})
      if(dbError)throw dbError
      await onMediaUpdated()
      if(oldPath&&oldPath!==path)await supabase.storage.from(BUCKET).remove([oldPath])
      onNotice('Đã thay ảnh '+item.number+'.')
      setLocalSuccess('Ảnh thay thế đã được cập nhật.')
    }catch(error){
      if(uploaded)await supabase.storage.from(BUCKET).remove([path])
      setLocalError(fail(error));onError(fail(error))
    }finally{setBusy('')}
  }
  const remove=async item=>{
    if(busy||!item.image?.image_url||!window.confirm('Xóa ảnh '+item.number+' này? Chữ đã lưu cho ảnh sẽ được giữ lại.'))return
    setBusy('removing');clearMessages()
    try{
      const {error}=await supabase.from('site_images').upsert({
        slot:item.slot,image_url:null,storage_path:null,
        updated_by:user.id,updated_at:new Date().toISOString()
      },{onConflict:'slot'})
      if(error)throw error
      await onMediaUpdated()
      if(item.image.storage_path)await supabase.storage.from(BUCKET).remove([item.image.storage_path])
      setSelected(old=>({...old,[open]:undefined}))
      onNotice('Đã xóa ảnh '+item.number+'.')
    }catch(error){setLocalError(fail(error));onError(fail(error))}
    finally{setBusy('')}
  }

  if(loading)return <p className="admin-media-loading">Đang tải danh sách thẻ Hero...</p>
  return <section className="hero-editor-root" aria-label="Các thẻ Hero">
    <div className="hero-editor-toolbar">
      <div><span>HERO / CARD MANAGER</span><strong>{cardCount} / {HERO_CARD_LIMIT} thẻ</strong>
        <p>Mỗi thẻ độc lập, có tối đa 6 ảnh. Chỉ mở thẻ đang sửa để giao diện luôn gọn.</p></div>
      <button type="button" className="hero-add-card" onClick={addCard}
        disabled={!!busy||cardCount>=HERO_CARD_LIMIT}>
        {busy==='adding'?'ĐANG THÊM...':cardCount>=HERO_CARD_LIMIT?'ĐÃ ĐỦ 6 THẺ':'+ THÊM THẺ'}
      </button>
    </div>
    {localError&&<p className="hero-editor-error" role="alert">{localError}</p>}
    {localSuccess&&<p className="hero-editor-success" role="status">{localSuccess}</p>}
    <div className="hero-editor-stack">{counts.map((items,index)=>{
      const card=index+1
      const isOpen=open===card
      const currentPhoto=items.find(item=>item.number===selected[card]&&item.image?.image_url)
        ||items.find(item=>item.image?.image_url)||items[0]
      const photoNumber=currentPhoto.number
      const txt=field=>String(draft[cardKey(card,field)]??'')
      const photoText=field=>String(draft[photoKey(card,photoNumber,field)]??'')
      const display=field=>photoText(field)||txt(field)
      const cardDirty=dirty(card)
      return <article key={card} className={'hero-editor-card'+(isOpen?' is-open':'')}>
        <div className="hero-editor-card-heading">
          <div className="hero-editor-card-label">
            <span className="hero-card-sequence">{String(card).padStart(2,'0')}</span>
            <div><strong>{saved[cardKey(card,'Title')]||'Thẻ '+card}</strong>
              <small>{items.filter(item=>item.image?.image_url).length} / 6 ảnh · {isOpen?'ĐANG CHỈNH SỬA':'ĐÃ THU GỌN'}</small></div>
          </div>
          <button type="button" className="hero-editor-edit-button" onClick={()=>chooseCard(card)} disabled={!!busy}>
            {isOpen?'THU GỌN':'✎ SỬA THẺ'}
          </button>
        </div>
        {isOpen&&<>
          <div className="hero-editor-columns">
            <div className="hero-editor-col hero-editor-text">
              <h4>01 / NỘI DUNG CHỮ</h4>
              <p>Thông tin mặc định của thẻ</p>
              {FIELDS.map(([field,label,placeholder])=><label key={field}>
                <span>{label}</span>
                <input value={txt(field)} onChange={e=>update(cardKey(card,field),e.target.value)}
                  maxLength={800} placeholder={placeholder}/>
              </label>)}
              <div className="hero-editor-text-divider"/>
              <p>Chữ riêng cho ảnh {String(photoNumber).padStart(2,'0')}
                <small>Để trống sẽ sử dụng chữ mặc định của thẻ.</small>
              </p>
              {PHOTO_FIELDS.map(([field,label])=><label key={field}>
                <span>{label}</span>
                <input value={photoText(field)}
                  onChange={e=>update(photoKey(card,photoNumber,field),e.target.value)}
                  maxLength={800} placeholder={txt(field)}/>
              </label>)}
            </div>
            <div className="hero-editor-col hero-editor-media">
              <h4>02 / QUẢN LÝ ẢNH</h4>
              <p>Ảnh chỉ xuất hiện ở thẻ {card}, không dùng chung.</p>
              <div className="hero-photo-upload-row">
                <label className={'hero-photo-upload'+(busy?' disabled':'')}>
                  <input type="file" multiple disabled={!!busy||items.every(item=>item.image?.image_url)}
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    onChange={e=>{const files=Array.from(e.target.files||[]);e.target.value='';upload(card,files)}}/>
                  <span>+ TẢI ẢNH</span><small>Chọn nhiều ảnh · Tối đa 6</small>
                </label>
                {progress&&busy==='upload-'+card&&<span>{progress.done} / {progress.total} ảnh</span>}
              </div>
              <div className="hero-photo-options">
                {items.map(item=><button type="button" key={item.slot}
                  className={'hero-photo-option'+(currentPhoto.number===item.number?' active':'')}
                  onClick={()=>setSelected(old=>({...old,[card]:item.number}))}>
                  {item.image?.image_url?<img src={item.image.image_url}
                    alt={'Ảnh '+item.number+' thẻ '+card} loading="lazy"/>:
                    <span className="hero-photo-empty">+</span>}
                  <small>{String(item.number).padStart(2,'0')}</small>
                </button>)}
              </div>
              <div className="hero-photo-selected-actions">
                <span>{currentPhoto.image?.image_url?'Ảnh '+photoNumber+' đang chọn':'Vị trí ảnh '+photoNumber+' còn trống'}</span>
                {currentPhoto.image?.image_url&&<div>
                  <label className={'hero-photo-replace'+(busy?' disabled':'')}>
                    <input type="file" disabled={!!busy} accept="image/jpeg,image/png,image/webp,image/avif"
                      onChange={e=>{const file=e.target.files?.[0];e.target.value='';replace(currentPhoto,file)}}/>
                    SỬA ẢNH
                  </label>
                  <button type="button" className="hero-photo-delete"
                    disabled={!!busy} onClick={()=>remove(currentPhoto)}>XÓA ẢNH</button>
                </div>}
              </div>
            </div>
            <div className="hero-editor-col hero-editor-preview">
              <h4>03 / XEM TRƯỚC HTML/CSS</h4>
              <p>Nội dung thay đổi trực tiếp khi bạn nhập.</p>
              <div className="hero-card-live-preview" aria-label={'Bản xem trước thẻ '+card}>
                {currentPhoto.image?.image_url&&<img src={currentPhoto.image.image_url} alt=""
                  aria-hidden="true"/>}
                <div className="hero-card-live-content">
                  <span>{display('Eyebrow')}</span>
                  <strong>{display('Line1')}<em>{display('Line2')}</em></strong>
                  <small>{display('Footer')} <b aria-hidden="true">↗</b></small>
                </div>
              </div>
              <a href="/" target="_blank" rel="noreferrer" className="hero-live-site-link">XEM TRÊN TRANG CHỦ ↗</a>
            </div>
          </div>
          <div className="hero-editor-footer">
            <span>{cardDirty?'● Có thay đổi chữ chưa lưu':'Đã đồng bộ nội dung chữ'}</span>
            <div>
              <button type="button" className="hero-editor-cancel"
                onClick={()=>chooseCard(card)} disabled={!!busy}>ĐÓNG</button>
              <button type="button" className="hero-editor-save" disabled={!!busy}
                onClick={()=>saveCard(card)}>
                {busy==='saving'?'ĐANG LƯU...':'LƯU THẺ & THU GỌN ✓'}
              </button>
            </div>
          </div>
        </>}
      </article>
    })}</div>
  </section>
}
