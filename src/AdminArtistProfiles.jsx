import React, { useCallback, useEffect, useState } from 'react'
import { extractArtistPdf, renderPagesFromPdf, renderPdfPage, slugifyArtist, destroyArtistPdf } from './artistPdf'
import { uploadArtistPdf, downloadArtistPdf, removeArtistPdf } from './artistPdfStorage'
import './admin-artists.css'

const PAGE_BUCKET='dortis-artist-pages'
const MAX_PDF=100*1024*1024
const emptyNotice='Hồ sơ chỉ công khai sau khi bạn bấm Xuất bản. PDF gốc luôn ở bucket riêng tư.'
const getError=(e,fallback='Có lỗi xảy ra.')=>{
  if(e?.statusCode==='413'||/maximum size exceeded|entitytoo(?:large|big)|413/i.test(String(e?.message||'')))return 'Storage đang từ chối một phần PDF 4 MB. Kiểm tra Storage → Settings: Global file size limit phải ít nhất 4 MB, hoặc liên hệ quản trị viên Supabase.'
  return e?.message||fallback
}
const cleanSection=s=>({
  page:Number(s.page)||1,
  title:String(s.title||'').slice(0,240),
  body:String(s.body||'').slice(0,14000),
  kind:['cover','editorial','visual'].includes(s.kind)?s.kind:'editorial',
  image_url:s.image_url||null,
  image_storage_path:s.image_storage_path||null
})
export default function AdminArtistProfiles({user,signOut,supabase}){
  const [profiles,setProfiles]=useState([])
  const [sources,setSources]=useState({})
  const [selected,setSelected]=useState(null)
  const [form,setForm]=useState(null)
  const [busy,setBusy]=useState(false)
  const [progress,setProgress]=useState('')
  const [error,setError]=useState('')
  const [notice,setNotice]=useState(emptyNotice)
  const [deleteTarget,setDeleteTarget]=useState(null)

  const load=useCallback(async()=>{
    const [p,s]=await Promise.all([
      supabase.from('artist_profiles').select('*').order('updated_at',{ascending:false}),
      supabase.from('artist_profile_sources').select('profile_id,original_filename,pdf_storage_path,page_count')
    ])
    if(p.error||s.error){setError(getError(p.error||s.error));return}
    setProfiles(p.data||[])
    setSources(Object.fromEntries((s.data||[]).map(row=>[row.profile_id,row])))
    setSelected(prev=>{
      if(prev&&!(p.data||[]).some(x=>x.id===prev))return null
      return prev
    })
  },[supabase])
  useEffect(()=>{load()},[load])

  function edit(profile){
    setSelected(profile.id)
    setForm({
      id:profile.id,name:profile.name,slug:profile.slug,role:profile.role,
      tagline:profile.tagline||'',intro:profile.intro||'',
      sections:Array.isArray(profile.sections)?profile.sections.map(cleanSection):[],
      status:profile.status,cover_image_url:profile.cover_image_url
    })
    setError('');setNotice('')
  }
  function updateField(key,value){setForm(prev=>({...prev,[key]:value}))}
  function updateSection(index,key,value){
    setForm(prev=>({...prev,sections:prev.sections.map((section,i)=>
      i===index?{...section,[key]:value}:section)}))
  }
  const validate=profile=>{
    if(!profile.name||profile.name.trim().length<2)return 'Tên nghệ sĩ cần ít nhất 2 ký tự.'
    if(!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(profile.slug))return 'Đường dẫn chỉ gồm chữ thường không dấu, số và dấu gạch ngang.'
    if(!profile.sections.length)return 'Hồ sơ cần có ít nhất một trang.'
    return null
  }

  async function uniqueSlug(seed){
    const slug=slugifyArtist(seed)
    const {data,error:queryError}=await supabase.from('artist_profiles').select('slug').like('slug',slug+'%')
    if(queryError)throw queryError
    const used=new Set((data||[]).map(x=>x.slug))
    if(!used.has(slug))return slug
    let n=2
    while(used.has(slug+'-'+n))n++
    return slug+'-'+n
  }



  async function importFiles(files){
    const list=Array.from(files||[])
    if(!list.length)return
    if(list.length>8){setError('Mỗi lượt nhập tối đa 8 PDF.');return}
    setBusy(true);setError('');setNotice('')
    let imported=0
    const failed=[]
    for(let i=0;i<list.length;i++){
      const file=list[i]
      let storageRef=null,createdId=null
      try{
        if(!/\.pdf$/i.test(file.name)||file.size>MAX_PDF)throw new Error('Chỉ nhận PDF tối đa 100 MB.')
        setProgress('['+(i+1)+'/'+list.length+'] Đang trích xuất '+file.name+'...')
        const parsed=await extractArtistPdf(file,(done,total)=>
          setProgress('['+(i+1)+'/'+list.length+'] Đọc trang '+done+'/'+total+' · '+file.name))
        const slug=await uniqueSlug(parsed.slug)
        const basePath='artist-pdfs/'+crypto.randomUUID()+'/'+file.name.replace(/[^a-zA-Z0-9._-]/g,'_').slice(-90)
        setProgress('['+(i+1)+'/'+list.length+'] Đang lưu PDF riêng tư...')
        const uploaded = await uploadArtistPdf(supabase,file,basePath,(done,total)=>
          setProgress('['+(i+1)+'/'+list.length+'] Đã lưu phần '+done+'/'+total+' · '+file.name))
        storageRef=uploaded.storageRef
        const introduction=parsed.sections.find(s=>s.body&&s.body.length>75)?.body.slice(0,500)||''
        const {data:created,error:insertError}=await supabase.from('artist_profiles')
          .insert({name:parsed.name,slug,role:parsed.role,tagline:'',
            intro:introduction,sections:parsed.sections,status:'draft',created_by:user.id})
          .select('id').single()
        if(insertError)throw insertError
        createdId=created.id
        const {error:sourceError}=await supabase.from('artist_profile_sources')
          .insert({profile_id:createdId,original_filename:file.name,pdf_storage_path:storageRef,
            page_count:parsed.page_count,uploaded_by:user.id})
        if(sourceError)throw sourceError
        imported++
      }catch(e){
        if(createdId)await supabase.from('artist_profiles').delete().eq('id',createdId)
        if(storageRef)await removeArtistPdf(supabase,storageRef)
        failed.push(file.name+': '+getError(e))
      }
    }
    await load()
    setBusy(false);setProgress('')
    if(imported)setNotice('Đã tạo '+imported+' hồ sơ bản nháp. Hãy mở từng ca sĩ để kiểm tra nội dung và xuất bản.')
    if(failed.length)setError(failed.slice(0,3).join(' • '))
  }

  async function save(){
    if(!form||busy)return
    const issue=validate(form)
    if(issue){setError(issue);return}
    setBusy(true);setError('');setProgress('Đang lưu nội dung đã chỉnh sửa...')
    try{
      const {error:saveError}=await supabase.from('artist_profiles').update({
        name:form.name.trim(),slug:form.slug,role:form.role.trim()||'Nghệ sĩ',
        tagline:form.tagline.trim(),intro:form.intro,
        sections:form.sections.map(cleanSection),updated_at:new Date().toISOString()
      }).eq('id',form.id)
      if(saveError)throw saveError
      await load()
      setNotice('Đã lưu hồ sơ '+form.name+'.')
    }catch(e){setError(getError(e,'Không lưu được hồ sơ.'))}
    finally{setBusy(false);setProgress('')}
  }

  async function publish(){
    if(!form||busy)return
    const issue=validate(form)
    if(issue){setError(issue);return}
    if(form.status==='published'){setNotice('Hồ sơ này đã được xuất bản.');return}
    const source=sources[form.id]
    if(!source){setError('Chưa có PDF nguồn. Vui lòng nhập lại hồ sơ từ PDF để có thể xuất bản đầy đủ từng trang.');return}
    setBusy(true);setError('');setNotice('')
    const uploaded=[]
    let pdf
    try{
      setProgress('Đang tải PDF gốc từ khu vực lưu trữ riêng tư...')
      const blob=await downloadArtistPdf(supabase,source.pdf_storage_path,(done,total)=>
        setProgress('Đang khôi phục PDF nguồn · '+done+'/'+total+' phần'))
      pdf=await renderPagesFromPdf(blob)
      const pageImages={}
      for(let i=1;i<=pdf.numPages;i++){
        setProgress('Đang dựng ảnh trang '+i+'/'+pdf.numPages+' và chuẩn bị CSS...')
        const page=await pdf.getPage(i)
        const {blob:image,extension,type}=await renderPdfPage(page,{maxWidth:1160,quality:.77})
        page.cleanup()
        if(image.size>5*1024*1024)throw new Error('Trang '+i+' vượt quá giới hạn 5MB. Hãy giảm chất lượng PDF.')
        const assetPath=form.id+'/page-'+String(i).padStart(2,'0')+'-'+crypto.randomUUID()+'.'+extension
        const {error:pageError}=await supabase.storage.from(PAGE_BUCKET)
          .upload(assetPath,image,{contentType:type,cacheControl:'3600',upsert:false})
        if(pageError)throw pageError
        uploaded.push(assetPath)
        const {data:url}=supabase.storage.from(PAGE_BUCKET).getPublicUrl(assetPath)
        pageImages[i]={image_url:url.publicUrl,image_storage_path:assetPath}
      }
      const sections=form.sections.map(s=>({...cleanSection(s),...pageImages[s.page]}))
      const {error:saveError}=await supabase.from('artist_profiles')
        .update({name:form.name.trim(),slug:form.slug,role:form.role,tagline:form.tagline,
          intro:form.intro,sections,status:'published',
          cover_image_url:pageImages[1]?.image_url||null,
          updated_at:new Date().toISOString()}).eq('id',form.id)
      if(saveError)throw saveError
      await load()
      edit({...form,sections,status:'published',cover_image_url:pageImages[1]?.image_url||null})
      setNotice('Đã xuất bản '+form.name+'. Trang: /artists/'+form.slug)
    }catch(e){
      if(uploaded.length)await supabase.storage.from(PAGE_BUCKET).remove(uploaded)
      setError(getError(e,'Không thể xuất bản hồ sơ PDF.'))
    }finally{
      if(pdf)await destroyArtistPdf(pdf)
      setBusy(false);setProgress('')
    }
  }

  async function unpublish(){
    if(!form||busy)return
    setBusy(true);setError('');setProgress('Đang ẩn hồ sơ và thu hồi ảnh công khai...')
    const paths=form.sections.map(s=>s.image_storage_path).filter(Boolean)
    try{
      const sections=form.sections.map(s=>({...cleanSection(s),image_url:null,image_storage_path:null}))
      const {error:dbError}=await supabase.from('artist_profiles').update({
        status:'draft',sections,cover_image_url:null,updated_at:new Date().toISOString()
      }).eq('id',form.id)
      if(dbError)throw dbError
      if(paths.length){
        const {error:storageError}=await supabase.storage.from(PAGE_BUCKET).remove(paths)
        if(storageError)setError('Đã ẩn hồ sơ, nhưng chưa thu hồi được một số ảnh từ Storage: '+storageError.message)
      }
      await load()
      edit({...form,status:'draft',sections,cover_image_url:null})
      setNotice('Đã chuyển '+form.name+' về bản nháp.')
    }catch(e){setError(getError(e))}
    finally{setBusy(false);setProgress('')}
  }

  async function deleteProfile(){
    const row=deleteTarget
    if(!row||busy)return
    setBusy(true);setError('');setProgress('Đang xóa hồ sơ...')
    const imagePaths=(row.sections||[]).map(x=>x.image_storage_path).filter(Boolean)
    const pdfPath=sources[row.id]?.pdf_storage_path
    try{
      const {error:dbError}=await supabase.from('artist_profiles').delete().eq('id',row.id)
      if(dbError)throw dbError
      if(imagePaths.length){
        const {error:imagesError}=await supabase.storage.from(PAGE_BUCKET).remove(imagePaths)
        if(imagesError)setError('Đã xóa hồ sơ, nhưng một số ảnh còn trong Storage.')
      }
      if(pdfPath){
        const {error:pdfError}=await removeArtistPdf(supabase,pdfPath)
        if(pdfError)setError('Đã xóa hồ sơ, nhưng PDF nguồn chưa được thu hồi khỏi Storage.')
      }
      if(selected===row.id){setSelected(null);setForm(null)}
      setNotice('Đã xóa hồ sơ '+row.name+'.')
      await load()
    }catch(e){setError(getError(e))}
    finally{setDeleteTarget(null);setBusy(false);setProgress('')}
  }

  return <div className="artist-admin-wrapper">
    <div className="admin-dashboard artist-admin">
      <div className="admin-topline"><a href="/admin" className="admin-home">← QUẢN LÝ HÌNH ẢNH</a><button type="button" onClick={signOut}>ĐĂNG XUẤT ↗</button></div>
      <header className="artist-admin-intro"><span>DORTIS / ARTIST PROFILE CMS</span>
        <h1>Hồ sơ <em>nghệ sĩ.</em></h1>
        <p>Mỗi PDF tạo một hồ sơ riêng. File lớn được lưu thành nhiều phần riêng tư để tránh giới hạn dung lượng Supabase. Nội dung trích xuất được dựng lại bằng HTML/CSS khi xuất bản.</p>
        <div className="artist-admin-heading-actions"><a href="/artists" target="_blank" rel="noreferrer">XEM TRANG NGHỆ SĨ ↗</a><a href="/admin">QUẢN LÝ ẢNH ↗</a></div>
      </header>
      {error&&<p className="admin-alert error" role="alert">{error}</p>}
      {notice&&<p className="admin-alert success" role="status">{notice}</p>}
      {busy&&<div className="artist-admin-progress" role="status"><span className="artist-admin-loader"/>{progress||'Đang xử lý...'}</div>}
      <section className="artist-admin-upload">
        <div><span>01 / IMPORT PDF</span><h2>Nhập hồ sơ từ PDF.</h2>
          <p>Chọn tối đa 8 PDF trong một lượt. Mỗi file là một ca sĩ/nghệ sĩ, có thể gồm nhiều trang. PDF gốc được lưu riêng tư; hồ sơ mới luôn ở trạng thái bản nháp.</p></div>
        <label className={'artist-admin-file'+(busy?' is-disabled':'')}>
          <input type="file" accept=".pdf,application/pdf" multiple disabled={busy} onChange={e=>{
            const files=Array.from(e.target.files||[])
            e.target.value=''
            importFiles(files)
          }}/>
          <span>+ TẢI PDF NGHỆ SĨ</span><small>PDF · TỐI ĐA 100 MB / FILE · TỰ CHIA NHỎ</small>
        </label>
      </section>
      <section className="artist-admin-content">
        <aside className="artist-admin-index">
          <div className="artist-admin-index-heading"><h2>Danh sách hồ sơ</h2><span>{profiles.length} hồ sơ</span></div>
          {profiles.length?profiles.map((row,i)=><button type="button" key={row.id}
              className={'artist-admin-index-row'+(selected===row.id?' active':'')}
              onClick={()=>edit(row)} disabled={busy}>
              <span className="artist-admin-index-number">{String(i+1).padStart(2,'0')}</span>
              <span className="artist-admin-index-label"><strong>{row.name}</strong><small>{row.role} · {(row.sections||[]).length} trang</small></span>
              <span className={'artist-admin-status '+row.status}>{row.status==='published'?'CÔNG KHAI':'BẢN NHÁP'}</span>
            </button>):<p className="artist-admin-index-empty">Chưa có hồ sơ. Hãy tải PDF ca sĩ đầu tiên.</p>}
        </aside>
        <div className="artist-admin-editor">
          {!form?<div className="artist-admin-empty"><span>✳ DORTIS / PROFILE EDITOR</span><h2>Chọn một hồ sơ để chỉnh sửa.</h2><p>Thay tên nghệ sĩ, sửa nội dung trích xuất từng trang, kiểm duyệt rồi xuất bản để tạo website riêng.</p></div>:
          <div>
            <div className="artist-admin-editor-head"><div><span>02 / EDIT & REVIEW</span><h2>Biên tập hồ sơ</h2></div>
              <span className={'artist-admin-status '+form.status}>{form.status==='published'?'ĐÃ XUẤT BẢN':'BẢN NHÁP'}</span>
            </div>
            <div className="artist-admin-fields">
              <label>TÊN NGHỆ SĨ<input value={form.name} disabled={busy} onChange={e=>updateField('name',e.target.value)} maxLength={160}/></label>
              <label>VAI TRÒ<input value={form.role} disabled={busy} onChange={e=>updateField('role',e.target.value)} maxLength={120} placeholder="Ca sĩ, biên đạo, nghệ sĩ..."/></label>
              <label className="span-2">ĐƯỜNG DẪN <input value={form.slug} disabled={busy} onChange={e=>updateField('slug',slugifyArtist(e.target.value))}/></label>
              <label className="span-2">DÒNG GIỚI THIỆU NGẮN<input value={form.tagline} disabled={busy} onChange={e=>updateField('tagline',e.target.value)} maxLength={250} placeholder="Dòng phụ xuất hiện trên trang cá nhân"/></label>
              <label className="span-2">GIỚI THIỆU<textarea value={form.intro} rows={5} disabled={busy} onChange={e=>updateField('intro',e.target.value)} maxLength={4000}/></label>
            </div>
            <div className="artist-admin-source">
              <span>PDF NGUỒN</span><strong>{sources[form.id]?.original_filename||'Không có bản PDF gốc'}</strong>
              <small>Chỉ Admin có quyền tải PDF gốc. Bản công khai không hiển thị file này.</small>
            </div>
            <div className="artist-admin-pages-heading"><h3>Nội dung từng trang PDF</h3><p>{form.sections.length} trang · Các trang chỉ có ảnh vẫn được giữ khi xuất bản.</p></div>
            <div className="artist-admin-pages">
              {form.sections.map((section,i)=><article key={section.page||i} className="artist-admin-page">
                <div className="artist-admin-page-top"><span>TRANG {String(section.page||i+1).padStart(2,'0')}</span>
                  <span>{section.body?.trim()?'CÓ NỘI DUNG CHỮ':'CHỦ YẾU LÀ ẢNH'}</span></div>
                {section.image_url&&<img className="artist-admin-preview" src={section.image_url} alt={'Ảnh trang '+section.page} loading="lazy"/>}
                <label>TIÊU ĐỀ TRANG<input disabled={busy} value={section.title||''} onChange={e=>updateSection(i,'title',e.target.value)}/></label>
                <label>NỘI DUNG TRÍCH XUẤT<textarea disabled={busy} rows={Math.min(9,Math.max(4,(section.body||'').split('\n').length))}
                  value={section.body||''} onChange={e=>updateSection(i,'body',e.target.value)}
                  placeholder="Trang PDF chỉ có ảnh hoặc chữ không thể nhận diện. Hãy nhập mô tả nếu cần." /></label>
              </article>)}
            </div>
            <div className="artist-admin-editor-actions">
              <button type="button" className="artist-admin-save" disabled={busy} onClick={save}>LƯU NỘI DUNG</button>
              {form.status==='draft'?<button type="button" className="artist-admin-publish" disabled={busy} onClick={publish}>XUẤT BẢN HỒ SƠ ↗</button>:
                <button type="button" className="artist-admin-unpublish" disabled={busy} onClick={unpublish}>CHUYỂN VỀ BẢN NHÁP</button>}
              {form.status==='published'&&<a href={'/artists/'+form.slug} target="_blank" rel="noreferrer">XEM TRANG CÔNG KHAI ↗</a>}
              <button type="button" className="artist-admin-delete" disabled={busy} onClick={()=>setDeleteTarget(profiles.find(x=>x.id===form.id))}>XÓA HỒ SƠ</button>
            </div>
            <p className="artist-admin-warning">Để tránh công bố nhầm dữ liệu cá nhân, chỉ nhấn Xuất bản khi bạn đã kiểm tra và có quyền sử dụng toàn bộ nội dung, hình ảnh trong PDF. Ảnh được tạo từ các trang PDF sẽ có đường dẫn công khai sau khi xuất bản.</p>
          </div>}
        </div>
      </section>
    </div>
    {deleteTarget&&<div className="admin-confirm-backdrop"><section className="admin-confirm" role="dialog" aria-modal="true" aria-label="Xóa hồ sơ ca sĩ">
      <h2>Xóa hồ sơ {deleteTarget.name}?</h2><p>Hành động này xóa cả dữ liệu và tài liệu PDF nguồn của nghệ sĩ. Không thể hoàn tác.</p>
      <div><button type="button" disabled={busy} onClick={()=>setDeleteTarget(null)}>HỦY</button>
      <button type="button" disabled={busy} onClick={deleteProfile}>XÓA HỒ SƠ</button></div>
    </section></div>}
  </div>
}
