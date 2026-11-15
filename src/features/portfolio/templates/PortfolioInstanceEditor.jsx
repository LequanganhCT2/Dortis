import React,{useEffect,useMemo,useState} from 'react'
import PortfolioTemplateSite from './PortfolioTemplateSite'
import {normalizeBlueprint,setSectionField,setSlotImage} from './model'
import {artistSourcePages,copySourceSection,hydrateInstanceFromArtist} from './sourceBinding'
import './template-site.css'

const BUCKET='dortis-artist-web-drafts'
const ALLOWED=new Set(['image/jpeg','image/png','image/webp','image/avif'])
const MAX_SIZE=4*1024*1024
const EXT={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif'}
const getSlot=(section,index)=>section.id+':'+index

export default function PortfolioInstanceEditor({
  supabase,user,template,instance,profile,onBack,onSaved
}){
  // Backfill existing assigned portfolios (including legacy empty drafts) from
  // verified artist profile text, without ever replacing artist-specific photos.
  const [content,setContent]=useState(()=>hydrateInstanceFromArtist(
    template,profile,instance.content||{},true))
  const [active,setActive]=useState(()=>normalizeBlueprint(template.blueprint).sections[0]?.id||'')
  const [sourcePage,setSourcePage]=useState('')
  const [device,setDevice]=useState('desktop')
  const [urls,setUrls]=useState({})
  const [dirty,setDirty]=useState(false)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [notice,setNotice]=useState('')
  const sections=useMemo(()=>normalizeBlueprint(template.blueprint).sections,[template.blueprint])
  const current=sections.find(s=>s.id===active)||sections[0]
  const sourcePages=useMemo(()=>artistSourcePages(profile),[profile])
  useEffect(()=>{
    const inferred=hydrateInstanceFromArtist(template,profile,instance.content||{},true)
    const changed=JSON.stringify(inferred)!==JSON.stringify(instance.content||{})
    setContent(inferred)
    setActive(normalizeBlueprint(template.blueprint).sections[0]?.id||'')
    setSourcePage('')
    setDirty(changed)
    setNotice(changed?'Đã tự lấy chữ và các mục từ Hồ sơ nghệ sĩ. Nhấn Lưu thay đổi để lưu bản nháp.':'')
    setError('')
  },[instance.id,template.id])
  useEffect(()=>{
    let alive=true
    const entries=Object.values(content.images||{}).filter(x=>x&&x.path)
    const paths=[...new Set(entries.map(x=>x.path))]
    if(!paths.length){setUrls({});return}
    Promise.all(paths.map(async path=>{
      const {data,error}=await supabase.storage.from(BUCKET).createSignedUrl(path,3600)
      return [path,error?null:data?.signedUrl||null]
    })).then(rows=>{
      if(alive)setUrls(Object.fromEntries(rows.filter(([,url])=>url)))
    }).catch(e=>{if(alive)setError('Không tải được ảnh xem trước: '+e.message)})
    return ()=>{alive=false}
  },[instance.id,supabase,content.images])
  async function persist(next,message='Đã lưu nội dung riêng của nghệ sĩ.'){
    const {data,error:dbError}=await supabase.from('artist_website_instances')
      .update({content:next,updated_by:user.id,updated_at:new Date().toISOString(),
        revision:(instance.revision||1)+1})
      .eq('id',instance.id).eq('revision',instance.revision||1)
      .select().maybeSingle()
    if(dbError)throw dbError
    if(!data)throw new Error('Nội dung đã thay đổi ở phiên khác. Hãy mở lại Portfolio để tránh ghi đè.')
    setContent(data.content||{})
    setDirty(false)
    onSaved(data)
    setNotice(message)
    return data
  }
  function changeText(field,value){
    setContent(prev=>setSectionField(prev,current.id,field,value))
    setDirty(true);setNotice('')
  }
  function importCurrentSource(){
    if(!current||!sourcePage)return
    const chosen=sourcePages.find(p=>p.page===Number(sourcePage))
    if(!chosen)return
    setContent(prev=>copySourceSection(prev,current.id,chosen))
    setDirty(true);setNotice('Đã nạp mục từ hồ sơ PDF. Nhấn Lưu thay đổi để ghi nhận.')
  }
  function importAllBlank(){
    setContent(prev=>hydrateInstanceFromArtist(template,profile,prev,true))
    setDirty(true);setNotice('Các khu vực còn trống đã được điền từ hồ sơ nghệ sĩ. Ảnh riêng không thay đổi.')
  }
  async function save(){
    if(busy)return
    setBusy(true);setError('')
    try{await persist(content)}
    catch(e){setError('Không lưu được: '+e.message)}
    finally{setBusy(false)}
  }
  async function upload(section,index,file){
    if(!file||busy)return
    if(!ALLOWED.has(file.type)){setError('Chỉ hỗ trợ JPG, PNG, WebP hoặc AVIF.');return}
    if(file.size>MAX_SIZE){setError('Ảnh cần nhỏ hơn hoặc bằng 4 MB.');return}
    if(file.size===0){setError('Ảnh bị trống.');return}
    const slot=getSlot(section,index),previous=content.images?.[slot]
    const path=profile.id+'/'+template.id+'/'+section.id+'/'+index+'-'+crypto.randomUUID()+'.'+EXT[file.type]
    setBusy(true);setError('');setNotice('Đang tải ảnh...')
    try{
      const {error:uploadError}=await supabase.storage.from(BUCKET).upload(path,file,{
        contentType:file.type,cacheControl:'3600',upsert:false
      })
      if(uploadError)throw uploadError
      const next=setSlotImage(content,slot,{path,alt:previous?.alt||''})
      try{
        await persist(next,'Đã tải ảnh vào '+section.label+' · vị trí '+(index+1)+'.')
      }catch(e){
        await supabase.storage.from(BUCKET).remove([path]).catch(()=>{})
        throw e
      }
      if(previous?.path&&previous.path!==path){
        await supabase.storage.from(BUCKET).remove([previous.path]).catch(()=>{})
      }
    }catch(e){setError('Tải ảnh thất bại: '+e.message)}
    finally{setBusy(false)}
  }
  async function removeImage(section,index){
    if(busy)return
    const slot=getSlot(section,index),before=content.images?.[slot]
    if(!before?.path)return
    setBusy(true);setError('')
    try{
      await persist(setSlotImage(content,slot,null),'Đã xóa ảnh khỏi vị trí này.')
      await supabase.storage.from(BUCKET).remove([before.path]).catch(()=>{})
    }catch(e){setError('Không xóa được: '+e.message)}
    finally{setBusy(false)}
  }
  function changeAlt(section,index,text){
    const slot=getSlot(section,index),previous=content.images?.[slot]
    if(!previous?.path)return
    setContent(v=>setSlotImage(v,slot,{...previous,alt:text.slice(0,240)}))
    setDirty(true)
  }
  const currentOwn=content.sections?.[current?.id]||{}
  return <div className="pt-editor">
    <header className="pt-editor__head">
      <div><button type="button" onClick={onBack} className="pt-link">← Thư viện form</button>
        <p className="pt-overline">DORTIS / PORTFOLIO INSTANCE</p>
        <h1>{profile.name}</h1>
        <p>Đang kế thừa <strong>{template.name}</strong> · phiên bản {template.version}.
          Nội dung được liên kết với {sourcePages.length} mục của hồ sơ nghệ sĩ; ảnh do bạn tự tải lên, độc lập với PDF gốc.</p></div>
      <div className="pt-editor__actions">
        <button type="button" className="pt-btn pt-btn--light" disabled={busy||!sourcePages.length}
          onClick={importAllBlank}>↓ Lấy dữ liệu còn trống từ PDF</button>
        <span className="pt-status">BẢN NHÁP · ADMIN ONLY</span>
        <button type="button" className="pt-btn" disabled={!dirty||busy}
          onClick={save}>{busy?'Đang xử lý...':dirty?'Lưu thay đổi':'Đã lưu'}</button>
      </div>
    </header>
    {error&&<p className="pt-alert" role="alert">{error}</p>}
    {notice&&<p className="pt-note" role="status">{notice}</p>}
    <div className="pt-editor__layout">
      <aside className="pt-editor__sidebar">
        <h2>01 / Các khu vực</h2>
        <div className="pt-editor__sections">
          {sections.map((section,i)=><button key={section.id} type="button"
            className={current?.id===section.id?'is-selected':''}
            onClick={()=>{setActive(section.id);setSourcePage('')}}>
            <span>{String(i+1).padStart(2,'0')}</span>{section.label}
            <small>{section.slots} ảnh</small>
          </button>)}
        </div>
        {current&&<div className="pt-editor__form" key={current.id}>
          <h2>02 / Nội dung: {current.label}</h2>
          <div className="pt-editor__source">
            <span className="pt-overline">KẾ THỪA CÁC MỤC TỪ HỒ SƠ PDF</span>
            <p>{sourcePages.length?sourcePages.length+' mục đã đọc và lưu ở Hồ sơ nghệ sĩ.':
              'Hồ sơ nghệ sĩ chưa có mục chữ. Tải PDF từ trang Hồ sơ nghệ sĩ.'}</p>
            <label>Chọn mục nguồn để điền vào phần này
              <select value={sourcePage||String(currentOwn.sourcePage||'')} disabled={busy||!sourcePages.length}
                onChange={e=>setSourcePage(e.target.value)}>
                <option value="">Chọn trang PDF / mục nội dung</option>
                {sourcePages.map(p=><option key={p.page} value={p.page}>
                  Trang {String(p.page).padStart(2,'0')} · {p.title||'Chưa có tiêu đề'}
                </option>)}
              </select>
            </label>
            <button type="button" className="pt-btn pt-btn--light"
              disabled={busy||!sourcePage} onClick={importCurrentSource}>
              Lấy chữ của mục đã chọn ↓
            </button>
            {currentOwn.sourcePage&&<small>Đang dùng dữ liệu từ trang {currentOwn.sourcePage} ·
              Bạn vẫn có thể sửa nội dung bên dưới mà không sửa PDF gốc.</small>}
          </div>
          <label>Nhãn phụ
            <input type="text" value={currentOwn.eyebrow||''}
              onChange={e=>changeText('eyebrow',e.target.value)} placeholder="Ví dụ: Nghệ sĩ / Giới thiệu"/>
          </label>
          <label>Tiêu đề
            <input type="text" value={currentOwn.title??(current.id==='hero'?profile.name:'')}
              onChange={e=>changeText('title',e.target.value)} placeholder="Nhập tiêu đề"/>
          </label>
          <label>Mô tả
            <textarea rows={4} value={currentOwn.body||''}
              onChange={e=>changeText('body',e.target.value)} placeholder="Nhập nội dung riêng của nghệ sĩ..."/>
          </label>
          <h3>03 / Ảnh của khu vực ({current.slots})</h3>
          <p>Chọn ảnh gốc từ máy, tối đa 4 MB/ảnh. Không cắt hoặc nhập ảnh từ PDF.</p>
          {current.slots===0&&<p className="pt-editor__hint">Khu vực chỉ có chữ. Có thể thêm vị trí ảnh khi chỉnh bố cục form gốc.</p>}
          <div className="pt-editor__uploads">
            {Array.from({length:current.slots},(_,index)=>{
              const slot=getSlot(current,index),image=content.images?.[slot],url=image?.path&&urls[image.path]
              return <div className="pt-upload" key={slot}>
                <div className="pt-upload__head"><strong>Ảnh {index+1}</strong>
                  {image?.path&&<button type="button" disabled={busy} onClick={()=>removeImage(current,index)}>Xóa ảnh</button>}
                </div>
                <label className="pt-upload__area">
                  {url?<img src={url} alt={image?.alt||''}/>:
                    <span>+ <small>Chọn ảnh để tải lên</small></span>}
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/avif"
                    disabled={busy} onChange={e=>{
                      const file=e.target.files?.[0]
                      if(file)upload(current,index,file)
                      e.target.value=''
                    }}/>
                </label>
                {image?.path&&<input type="text" value={image.alt||''}
                  placeholder="Mô tả ảnh (alt text)" onChange={e=>changeAlt(current,index,e.target.value)}/>}
              </div>
            })}
          </div>
        </div>}
      </aside>
      <section className="pt-editor__preview">
        <div className="pt-editor__preview-head"><div>
          <strong>LIVE PREVIEW</strong><span> Bố cục lấy từ form dùng chung · Nội dung riêng của {profile.name}</span>
        </div><div className="pt-segment">
          <button type="button" className={device==='desktop'?'is-active':''}
            onClick={()=>setDevice('desktop')}>Desktop</button>
          <button type="button" className={device==='mobile'?'is-active':''}
            onClick={()=>setDevice('mobile')}>Mobile</button>
        </div></div>
        <PortfolioTemplateSite template={template} instance={{...instance,content}} profile={profile}
          urls={urls} device={device}/>
      </section>
    </div>
  </div>
}
