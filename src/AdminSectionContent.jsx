import React, { useEffect, useMemo, useState } from 'react'
import { SITE_CONTENT_SCHEMAS, SITE_CONTENT_DEFAULTS } from './siteContent'
import './admin-section-content.css'

const failText=(error)=>{
  if(error?.code==='42501'||/row-level security|permission denied/i.test(error?.message||''))return 'Tài khoản chưa có quyền chỉnh nội dung. Đăng xuất rồi đăng nhập lại để cập nhật quyền quản trị.'
  return error?.message||'Không lưu được nội dung.'
}

/** Editable page copy, scoped to one homepage section or image slot. */
export default function AdminSectionContent({supabase,user,contentKey,label}){
  const defaults=SITE_CONTENT_DEFAULTS[contentKey]||{}
  const schema=SITE_CONTENT_SCHEMAS[contentKey]||[]
  const [draft,setDraft]=useState(defaults)
  const [lastSaved,setLastSaved]=useState(defaults)
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const [success,setSuccess]=useState('')
  const [expanded,setExpanded]=useState(false)
  useEffect(()=>{
    let mounted=true
    async function fetch(){
      setLoading(true)
      const {data,error:e}=await supabase.from('site_content').select('content').eq('key',contentKey).maybeSingle()
      if(!mounted)return
      if(e)setError(failText(e))
      else{
        const fetched={...defaults,...(data?.content||{})}
        setDraft(fetched);setLastSaved(fetched)
      }
      setLoading(false)
    }
    fetch()
    return ()=>{mounted=false}
  },[supabase,contentKey])

  const changed=useMemo(()=>JSON.stringify(draft)!==JSON.stringify(lastSaved),[draft,lastSaved])
  const edit=(key,value)=>{
    setDraft(prev=>({...prev,[key]:value}))
    setError('');setSuccess('')
  }
  const save=async(event)=>{
    event?.preventDefault()
    if(!changed||busy)return
    setError('');setSuccess('');setBusy(true)
    try{
      const safe={}
      for(const group of schema)for(const field of group.fields){
        const value=String(draft[field.key]??'').trim()
        if(value.length>field.max)throw new Error('Nội dung "'+field.label+'" vượt quá '+field.max+' ký tự.')
        safe[field.key]=value
      }
      const {data,error:e}=await supabase.from('site_content').upsert({
        key:contentKey,content:safe,updated_by:user.id,updated_at:new Date().toISOString()
      },{onConflict:'key'}).select('key').single()
      if(e||!data)throw e||new Error('Supabase chưa xác nhận bản ghi đã lưu.')
      setDraft(safe);setLastSaved(safe)
      setSuccess('Đã lưu nội dung. Trang chủ sẽ tự cập nhật mà không tải lại toàn bộ.')
    }catch(e){setError(failText(e))}
    finally{setBusy(false)}
  }
  const restore=async()=>{
    if(!window.confirm('Khôi phục nội dung mặc định của "'+label+'"? Nội dung bạn đã thay đổi sẽ bị mất.'))return
    setBusy(true);setError('');setSuccess('')
    try{
      const {error:e}=await supabase.from('site_content').delete().eq('key',contentKey)
      if(e)throw e
      setDraft(defaults);setLastSaved(defaults)
      setSuccess('Đã khôi phục nội dung mặc định.')
    }catch(e){setError(failText(e))}
    finally{setBusy(false)}
  }

  if(!schema.length)return null
  return <section className={'admin-copy-editor'+(expanded?' is-expanded':'')} aria-label={'Chỉnh nội dung '+label}>
    <button type="button" className="admin-copy-editor-toggle" aria-expanded={expanded}
      onClick={()=>setExpanded(current=>!current)}>
      <span><strong><span aria-hidden="true">✎</span> Chỉnh nội dung {label}</strong>
        <small>Tiêu đề · Mô tả · Chữ trên thẻ</small></span>
      <span className="admin-copy-editor-right">
        {changed&&<span className="admin-copy-dirty">CHƯA LƯU</span>}
        <span className="admin-copy-chevron" aria-hidden="true">{expanded?'−':'+'}</span>
      </span>
    </button>
    {expanded&&<div className="admin-copy-body">
      {loading?<p role="status">Đang tải nội dung từ Supabase...</p>:
      <form onSubmit={save}>
        {schema.map(group=><fieldset key={group.title} disabled={busy} className="admin-copy-fieldset">
          <legend>{group.title}</legend>
          <div className="admin-copy-field-grid">
            {group.fields.map(field=><label className={'admin-copy-field'+(field.multiline?' is-long':'')} key={field.key}>
              <span>{field.label}</span>
              {field.multiline?
                <textarea value={draft[field.key]??''} maxLength={field.max} rows={3}
                  onChange={event=>edit(field.key,event.target.value)} />:
                <input type="text" value={draft[field.key]??''} maxLength={field.max}
                  onChange={event=>edit(field.key,event.target.value)} />}
              <small>{String(draft[field.key]??'').length} / {field.max} ký tự</small>
            </label>)}
          </div>
        </fieldset>)}
        {error&&<p className="admin-copy-error" role="alert">{error}</p>}
        {success&&<p className="admin-copy-success" role="status">{success}</p>}
        <div className="admin-copy-actions">
          <button className="admin-copy-save" type="submit" disabled={busy||!changed}>
            {busy?'ĐANG LƯU...':'LƯU NỘI DUNG'}</button>
          <button type="button" onClick={restore} disabled={busy}>KHÔI PHỤC MẶC ĐỊNH</button>
          <a href="/#top" target="_blank" rel="noreferrer">XEM WEBSITE ↗</a>
        </div>
      </form>}
    </div>}
  </section>
}
