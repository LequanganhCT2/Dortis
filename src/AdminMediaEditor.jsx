import React, { useCallback, useEffect, useMemo, useState } from 'react'
import './admin-media-editor.css'
import AdminSectionContent from './AdminSectionContent'
import AdminHeroCards from './AdminHeroCards'
import { HERO_IMAGES_PER_CARD, HERO_CARD_LIMIT, heroImageSlot } from './heroImageSets'

const MB5 = 5 * 1024 * 1024
const MAX_GALLERY = 24
const HERO_INTRO_FIELDS = ['kicker','before','artist','action','quality','tail','impact','description','primaryButton','secondaryButton','signature']
const MIME = { 'image/jpeg':'jpg', 'image/png':'png', 'image/webp':'webp', 'image/avif':'avif' }
const GROUPS = [
  { id:'hero', title:'Trang đầu / Hero', note:'Tối đa 6 thẻ, mỗi thẻ có 6 ảnh riêng và chỉnh chữ trong một lần', slots:[]},
  { id:'services', title:'Dịch vụ', note:'10 vị trí thẻ, mỗi vị trí có thư viện ảnh riêng', slots:[
    {id:'service-cv',title:'CV & Portfolio'}, {id:'service-brand',title:'Thương hiệu nghệ sĩ'},
    {id:'service-visual',title:'Thiết kế truyền thông'}, {id:'service-web',title:'Website nghệ sĩ'},
    ...Array.from({length:6},(_,i)=>({id:'service-gallery-'+String(i+5).padStart(2,'0'),title:'Thẻ dịch vụ mở rộng '+String(i+5).padStart(2,'0') }))
  ]},
  {id:'projects',title:'Dự án công khai',note:'Chỉ thêm hình ảnh khách hàng đã đồng ý công bố; không tải PDF riêng tư',slots:[
    {id:'project-approved-01',title:'Dự án công khai 01'},
    {id:'project-approved-02',title:'Dự án công khai 02'},
    {id:'project-approved-03',title:'Dự án công khai 03'},
  ]},
  {id:'artist',title:'Trải nghiệm nghệ sĩ',note:'Ảnh nền Quick EPK và Explore; dữ liệu minh họa vẫn giữ nguyên',slots:[
    {id:'artist-experience',title:'Ảnh nền trải nghiệm nghệ sĩ'}]},
  {id:'about',title:'Triết lý Dortis',note:'Ảnh lớp nền thẻ kể chuyện',slots:[{id:'about',title:'The Dortis Philosophy'}]},
  {id:'values',title:'Giá trị DORTIS',note:'Ảnh nền mờ giúp khối 3D vẫn dễ đọc',slots:[{id:'values',title:'Sáu giá trị D/O/R/T/I/S'}]},
  {id:'faq',title:'Câu hỏi thường gặp',note:'Ảnh nền trang trí nhẹ cho phần FAQ',slots:[{id:'faq',title:'Frequently Asked Questions'}]},
  {id:'contact',title:'Liên hệ / CTA',note:'Ảnh trong bộ thẻ ở cuối trang',slots:[{id:'contact',title:'Bộ thẻ kết nối'}]},
]
const LABELS = Object.fromEntries(GROUPS.flatMap(group => group.slots.map(slot => [slot.id,slot.title])))
const errorText = (error, fallback='Không thể hoàn tất thao tác.') =>
  error?.code === '42501' || error?.message?.includes('row-level security')
    ? 'Không có quyền ghi. Đăng xuất và đăng nhập lại để làm mới quyền admin.'
    : error?.message || fallback

function checkImage(file) {
  if (!MIME[file.type]) return 'Chỉ hỗ trợ JPG, PNG, WebP hoặc AVIF.'
  if (file.size > MB5) return 'Ảnh '+file.name+' vượt quá 5 MB.'
  if (!file.size) return 'Ảnh '+file.name+' rỗng.'
  return null
}
export default function AdminMediaEditor({ user, supabase }) {
  const [groupId,setGroupId]=useState('hero')
  const [primary,setPrimary]=useState({})
  const [gallery,setGallery]=useState({})
  const [busy,setBusy]=useState('')
  const [progress,setProgress]=useState(null)
  const [error,setError]=useState('')
  const [notice,setNotice]=useState('')
  const [confirm,setConfirm]=useState(null)
  const [loading,setLoading]=useState(true)
  const activeGroup = GROUPS.find(group=>group.id===groupId)||GROUPS[0]

  const reload = useCallback(async () => {
    const [first,second] = await Promise.all([
      supabase.from('site_images').select('slot,image_url,storage_path'),
      supabase.from('site_image_gallery').select('id,slot,image_url,storage_path,position,created_at').order('position').order('created_at'),
    ])
    if (first.error || second.error) {
      setError(errorText(first.error||second.error,'Không tải được thư viện ảnh Supabase.'))
      setLoading(false)
      return
    }
    setPrimary(Object.fromEntries((first.data||[]).map(row=>[row.slot,row])))
    const groups={}
    for(const row of second.data||[]) (groups[row.slot]??=[]).push(row)
    setGallery(groups)
    setLoading(false)
  },[supabase])

  useEffect(()=>{
    reload()
    const listener=supabase.channel('dortis-admin-media-library')
      .on('postgres_changes',{event:'*',schema:'public',table:'site_images'},()=>reload())
      .on('postgres_changes',{event:'*',schema:'public',table:'site_image_gallery'},()=>reload())
      .subscribe()
    return ()=>{supabase.removeChannel(listener)}
  },[reload,supabase])

  const createPath=(slot,file)=> slot+'/'+crypto.randomUUID()+'.'+MIME[file.type]
  const addStorage=async(slot,file)=>{
    const path=createPath(slot,file)
    const {error:uploadError}=await supabase.storage.from('dortis-media').upload(path,file,{contentType:file.type,cacheControl:'3600',upsert:false})
    if(uploadError)throw uploadError
    const {data}=supabase.storage.from('dortis-media').getPublicUrl(path)
    return {path,url:data.publicUrl}
  }

  async function replacePrimary(slot,file){
    if(!file)return
    const issue=checkImage(file)
    if(issue){setError(issue);return}
    setBusy(slot);setError('');setNotice('')
    let filePath=null
    try{
      const {path,url}=await addStorage(slot,file)
      filePath=path
      const {error:dbError}=await supabase.from('site_images').upsert({
        slot,image_url:url,storage_path:path,updated_by:user.id,updated_at:new Date().toISOString()
      },{onConflict:'slot'})
      if(dbError)throw dbError
      const old=primary[slot]?.storage_path
      if(old&&old!==path)await supabase.storage.from('dortis-media').remove([old])
      setNotice('Đã thay ảnh chính của '+(LABELS[slot]||slot)+'.')
      await reload()
    }catch(err){
      if(filePath)await supabase.storage.from('dortis-media').remove([filePath])
      setError(errorText(err,'Lỗi tải ảnh chính.'))
    }finally{setBusy('')}
  }

  async function uploadBatch(slot,files){
    const chosen=Array.from(files||[])
    if(!chosen.length)return
    const existing=gallery[slot]||[]
    if(chosen.length+existing.length>MAX_GALLERY){
      setError('Mỗi khu vực hỗ trợ tối đa '+MAX_GALLERY+' ảnh bổ sung. Hiện đang có '+existing.length+' ảnh.');return
    }
    const failed=chosen.map(checkImage).filter(Boolean)
    if(failed.length){setError(failed[0]);return}
    setBusy(slot);setProgress({done:0,total:chosen.length});setError('');setNotice('')
    let success=0
    const errors=[]
    let nextPosition=Math.max(0,...existing.map(x=>x.position))+1
    for(let i=0;i<chosen.length;i++){
      let filePath=null
      try{
        const {path,url}=await addStorage(slot,chosen[i])
        filePath=path
        const {error:dbError}=await supabase.from('site_image_gallery').insert({
          slot,image_url:url,storage_path:path,position:nextPosition++,updated_by:user.id
        })
        if(dbError)throw dbError
        success++
      }catch(err){
        if(filePath)await supabase.storage.from('dortis-media').remove([filePath])
        errors.push(chosen[i].name+': '+errorText(err))
      }finally{setProgress({done:i+1,total:chosen.length})}
    }
    await reload()
    setBusy('');setProgress(null)
    if(success)setNotice('Đã thêm '+success+' ảnh vào '+(LABELS[slot]||slot)+'.')
    if(errors.length)setError('Có '+errors.length+' ảnh chưa lưu: '+errors.slice(0,2).join(' • '))
  }

  async function deleteSelected(){
    if(!confirm)return
    const target=confirm
    setBusy(target.slot);setError('');setNotice('')
    try{
      let dbError
      if(target.kind==='primary'){
        const r=await supabase.from('site_images').upsert({
          slot:target.slot,image_url:null,storage_path:null,
          updated_by:user.id,updated_at:new Date().toISOString()
        },{onConflict:'slot'})
        dbError=r.error
      }else{
        const r=await supabase.from('site_image_gallery').delete().eq('id',target.id)
        dbError=r.error
      }
      if(dbError)throw dbError
      if(target.storage_path){
        const {error:storageError}=await supabase.storage.from('dortis-media').remove([target.storage_path])
        if(storageError)setError('Đã gỡ ảnh khỏi trang nhưng file trong Storage chưa xóa được.')
      }
      setNotice('Đã gỡ ảnh khỏi khu vực.')
      await reload()
    }catch(err){setError(errorText(err,'Không thể xóa ảnh.'))}
    finally{setConfirm(null);setBusy('')}
  }

  async function move(slot,index,direction){
    const rows=gallery[slot]||[],next=rows[index+direction],current=rows[index]
    if(!next||!current||busy)return
    setBusy(slot);setError('');setNotice('')
    try{
      // Use two temporary ascending positions so repeated swaps remain deterministic.
      const maxPos=Math.max(0,...rows.map(x=>x.position))
      const tempPos=Math.max(maxPos+2,9000)
      const updates=[
        {id:current.id,position:tempPos},
        {id:next.id,position:current.position},
        {id:current.id,position:next.position}
      ]
      for(const item of updates){
        const {error:e}=await supabase.from('site_image_gallery')
          .update({position:item.position,updated_by:user.id}).eq('id',item.id)
        if(e)throw e
      }
      setNotice('Đã cập nhật thứ tự ảnh.')
      await reload()
    }catch(err){setError(errorText(err,'Không thể đổi thứ tự ảnh.'))}
    finally{setBusy('')}
  }

  const allSlots=[
    ...Array.from({length:HERO_IMAGES_PER_CARD*HERO_CARD_LIMIT},(_,i)=>({
      id:heroImageSlot(Math.floor(i/HERO_CARD_LIMIT)+1,i%HERO_CARD_LIMIT+1)
    })),
    ...GROUPS.flatMap(group=>group.slots)
  ]
  const totalImages=useMemo(()=>allSlots.reduce((count,slot)=>
    count+(primary[slot.id]?.image_url?1:0)+(gallery[slot.id]?.length||0),0),[primary,gallery])

  return <main className="admin-dashboard admin-media-v2">
    <header className="admin-intro"><span>DORTIS / ADMIN / MEDIA LIBRARY</span><h1>Thư viện hình ảnh.</h1>
      <p>Chỉnh sửa cả nội dung chữ và ảnh theo từng khu vực. Mở “Chỉnh nội dung” để sửa tiêu đề, mô tả, chữ trên thẻ; bấm “Lưu nội dung” để cập nhật website. Vẫn hỗ trợ tải nhiều ảnh, đổi thứ tự và xóa ảnh.</p>
      <a className="admin-media-workspace-link" href="/admin/artists">QUẢN LÝ HỒ SƠ NGHỆ SĨ ↗</a>
      <div className="admin-media-stat"><b>{totalImages}</b><span>ẢNH ĐANG QUẢN LÝ</span><b>{allSlots.length}</b><span>VỊ TRÍ TRÊN WEBSITE</span></div>
    </header>
    {error&&<p role="alert" className="admin-alert error">{error}</p>}
    {notice&&<p role="status" className="admin-alert success">{notice}</p>}
    <div className="admin-media-tabs" role="tablist" aria-label="Các khu vực của Dortis">
      {GROUPS.map(group=><button type="button" role="tab" aria-selected={groupId===group.id}
        className={groupId===group.id?'active':''} key={group.id} disabled={!!busy}
        onClick={()=>{setGroupId(group.id);setError('');setNotice('')}}>{group.title}</button>)}
    </div>
    <section className="admin-media-section">
      <div className="admin-media-section-title"><div><small>{activeGroup.id.toUpperCase()} / MEDIA</small><h2>{activeGroup.title}</h2><p>{activeGroup.note}</p></div><span>{groupId==='hero'?'TỐI ĐA 6 THẺ × 6 ẢNH':activeGroup.slots.length+' VỊ TRÍ'}</span></div>
      <AdminSectionContent key={'group-'+groupId} supabase={supabase} user={user}
        contentKey={groupId==='artist'?'artist-experience':groupId} label={groupId==='hero'?'Hero · Tiêu đề & mô tả bên trái':activeGroup.title}
        fieldKeys={groupId==='hero'?HERO_INTRO_FIELDS:null}/>
      {loading?<p className="admin-media-loading">Đang tải thư viện ảnh...</p>:
      groupId==='hero'?<AdminHeroCards supabase={supabase} user={user}
        primary={primary} onMediaUpdated={reload} onNotice={setNotice} onError={setError}/>:
      <div className="admin-media-slots">{activeGroup.slots.map(slot=>{
        const main=primary[slot.id]?.image_url
        const photos=gallery[slot.id]||[]
        const slotBusy=busy===slot.id
        return <article key={slot.id} className="admin-media-slot">
          <div className="admin-media-slot-head">
            <div><small>{slot.id.toUpperCase()}</small><h3>{slot.title}</h3><p>{slot.note||'Thêm nhiều ảnh trong cùng một khu vực; ảnh sẽ tự chuyển trên website.'}</p></div>
            <span>{photos.length+(main?1:0)} ẢNH</span>
          </div>
          {(slot.id.startsWith('service-')||slot.id.startsWith('project-approved-'))&&
            <AdminSectionContent key={slot.id} supabase={supabase} user={user}
              contentKey={slot.id} label={slot.title}/>}
          <div className="admin-media-primary">
            <div className="admin-media-primary-thumb">{main?<img src={main} alt={'Ảnh chính '+slot.title} loading="lazy"/>:<span>CHƯA CÓ ẢNH CHÍNH</span>}</div>
            <div className="admin-media-primary-actions">
              <strong>Ảnh chính</strong><span>Ảnh hiện có được ưu tiên hiển thị đầu tiên.</span>
              <label className={'admin-upload'+(busy?' disabled':'')}>
                <input type="file" accept="image/jpeg,image/png,image/webp,image/avif"
                  disabled={!!busy} onChange={event=>{const file=event.target.files?.[0];event.target.value='';replacePrimary(slot.id,file)}}/>
                {slotBusy?'ĐANG LƯU...':main?'THAY ẢNH CHÍNH':'TẢI ẢNH CHÍNH'}
              </label>
              {main&&<button className="admin-media-remove" type="button" disabled={!!busy}
                onClick={()=>setConfirm({slot:slot.id,kind:'primary',storage_path:primary[slot.id]?.storage_path})}>GỠ ẢNH CHÍNH</button>}
            </div>
          </div>
          <div className="admin-media-gallery-head">
            <div><strong>Album ảnh bổ sung</strong><span>{photos.length} / {MAX_GALLERY} ảnh</span></div>
            <label className={'admin-upload admin-media-multiple'+(busy?' disabled':'')}>
              <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif"
                disabled={!!busy} onChange={event=>{const files=Array.from(event.target.files||[]);event.target.value='';uploadBatch(slot.id,files)}}/>
              + THÊM NHIỀU ẢNH
            </label>
          </div>
          {slotBusy&&progress&&<div className="admin-media-progress" role="status">
            <span>Đang tải {progress.done}/{progress.total} ảnh...</span>
            <div><i style={{width:Math.round(100*progress.done/Math.max(progress.total,1))+'%'}}/></div>
          </div>}
          {!photos.length?<p className="admin-media-gallery-empty">Chưa có ảnh bổ sung. Chọn nhiều ảnh cùng lúc để tạo album.</p>:
          <div className="admin-media-photo-grid">
            {photos.map((photo,index)=><div className="admin-media-photo" key={photo.id}>
              <img src={photo.image_url} alt={'Ảnh '+(index+1)+' của '+slot.title} loading="lazy"/>
              <div className="admin-media-photo-footer">
                <span>#{String(index+1).padStart(2,'0')}</span>
                <div>
                  <button type="button" aria-label="Đưa ảnh lên trước" title="Lên trước" disabled={!!busy||index===0} onClick={()=>move(slot.id,index,-1)}>←</button>
                  <button type="button" aria-label="Đưa ảnh xuống sau" title="Xuống sau" disabled={!!busy||index===photos.length-1} onClick={()=>move(slot.id,index,1)}>→</button>
                  <button type="button" className="danger" aria-label="Xóa ảnh này" title="Xóa ảnh" disabled={!!busy}
                    onClick={()=>setConfirm({slot:slot.id,kind:'gallery',id:photo.id,storage_path:photo.storage_path})}>×</button>
                </div>
              </div>
            </div>)}
          </div>}
        </article>
      })}</div>}
    </section>
    <p className="admin-media-disclaimer">Chỉ tải hình ảnh đã được phép công bố. Ảnh khu vực Dự án sẽ xuất hiện công khai sau khi bạn tải lên. Không tải PDF hoặc ảnh chứa thông tin riêng tư.</p>
    {confirm&&<div className="admin-confirm-backdrop"><section className="admin-confirm" role="dialog" aria-modal="true" aria-label="Xác nhận xóa ảnh">
      <h2>Xóa ảnh này?</h2><p>Ảnh sẽ bị gỡ khỏi thẻ và Storage. Các ảnh còn lại không bị ảnh hưởng.</p>
      <div><button type="button" onClick={()=>setConfirm(null)} disabled={!!busy}>HỦY</button>
      <button type="button" disabled={!!busy} onClick={deleteSelected}>{busy?'ĐANG XÓA...':'XÓA ẢNH'}</button></div>
    </section></div>}
  </main>
}
