import React, { useCallback, useEffect, useRef, useState } from 'react'
import { extractArtistPdf, renderPagesFromPdf, slugifyArtist, destroyArtistPdf } from './artistPdf'
import { designArtistPdf, identifyArtistLayout, normalizeArtistSection, ARTIST_LAYOUT_OPTIONS } from './artistLayouts'
import { renderArtistPhotoCrops } from './artistPhotoCrops'
import ArtistPortfolioSections from './ArtistPortfolioSections'
import { uploadArtistPdf, downloadArtistPdf, removeArtistPdf } from './artistPdfStorage'
import './admin-artists.css'

const PAGE_BUCKET='dortis-artist-pages'
const MAX_PDF=100*1024*1024
const emptyNotice='Hồ sơ chỉ công khai sau khi bạn bấm Xuất bản. Các section được dựng bằng HTML/CSS, không nhúng ảnh toàn trang PDF.'
const getError=(e,fallback='Có lỗi xảy ra.')=>{
  if(e?.statusCode==='413'||/maximum size exceeded|entitytoo(?:large|big)|413/i.test(String(e?.message||'')))return 'Storage đang từ chối một phần PDF 4 MB. Kiểm tra Storage → Settings: Global file size limit phải ít nhất 4 MB, hoặc liên hệ quản trị viên Supabase.'
  return e?.message||fallback
}
const cleanSection=normalizeArtistSection
const allPhotoPaths=sections=>[...new Set((sections||[]).flatMap(s=>[
  s.image_storage_path,
  ...(Array.isArray(s.media)?s.media.map(x=>x.path):[])
]).filter(Boolean))]

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
  const [preview,setPreview]=useState(false)
  const [previewData,setPreviewData]=useState(null)
  const previewUrls=useRef([])
  useEffect(()=>()=>{for(const url of previewUrls.current)URL.revokeObjectURL(url)},[])

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
    setError('');setNotice('');setPreview(false);setPreviewData(null)
  }
  function updateField(key,value){setForm(prev=>({...prev,[key]:value}))}
  function updateSection(index,key,value){
    setForm(prev=>({...prev,sections:prev.sections.map((section,i)=>
      i===index?{...section,[key]:value}:section)}))
  }
  function applyOriginalDesign(){
    if(!form||form.status==='published')return
    const filename=sources[form.id]?.original_filename||''
    if(!identifyArtistLayout(filename)){
      setError('PDF này chưa có bố cục dựng sẵn. Bạn có thể chọn kiểu section và vùng ảnh theo từng trang.');return
    }
    if(!window.confirm('Áp dụng bố cục đã dựng từ PDF sẽ thay nội dung và vùng cắt ảnh đang chỉnh sửa. Tiếp tục?'))return
    const design=designArtistPdf({sections:form.sections,page_count:form.sections.length,name:form.name,role:form.role},filename)
    setForm(prev=>({...prev,name:design.name,role:design.role,tagline:design.tagline,
      intro:design.intro,sections:design.sections}))
    setNotice('Đã áp dụng bố cục HTML/CSS theo PDF nguồn. Hãy xem trước và nhấn Lưu nội dung.')
    setError('')
  }
  function updatePhoto(index,photoIndex,key,value){
    setForm(prev=>({...prev,sections:prev.sections.map((section,i)=>i!==index?section:{
      ...section,photos:(section.photos||[]).map((photo,j)=>j!==photoIndex?photo:{...photo,[key]:Number(value)/100})
    })}))
  }
  function addPhoto(index){
    setForm(prev=>({...prev,sections:prev.sections.map((section,i)=>i!==index?section:{
      ...section,photos:[...(section.photos||[]),{x:.58,y:.04,w:.34,h:.9}].slice(0,8)
    })}))
  }
  function removePhoto(index,photoIndex){
    setForm(prev=>({...prev,sections:prev.sections.map((section,i)=>i!==index?section:{
      ...section,photos:(section.photos||[]).filter((_,j)=>j!==photoIndex)
    })}))
  }
  const toMetrics=text=>text.split('\n').map(row=>row.split('|').map(x=>x.trim())).filter(row=>row[0]&&row[1]).map(row=>row.slice(0,2))
  async function buildCssPreview(){
    if(!form||busy)return
    if(preview){setPreview(false);return}
    const source=sources[form.id]
    if(!source){setError('Không có PDF nguồn để xem trước vùng ảnh.');return}
    setBusy(true);setError('')
    let pdf
    const generated=[]
    try {
      setProgress('Đang chuẩn bị bản xem trước HTML/CSS từ PDF...')
      const blob=await downloadArtistPdf(supabase,source.pdf_storage_path,(done,total)=>
        setProgress('Đang tải PDF nguồn để xem trước · '+done+'/'+total))
      pdf=await renderPagesFromPdf(blob)
      const sections=[]
      let index=0
      for(const section of form.sections){
        const copy=cleanSection(section)
        const crops=section.photos||[]
        if(crops.length){
          setProgress('Đang trích ảnh riêng '+(++index)+'/'+form.sections.filter(s=>(s.photos||[]).length).length)
          const page=await pdf.getPage(section.page)
          let renders
          try {renders=await renderArtistPhotoCrops(page,crops)}finally{page.cleanup()}
          copy.media=renders.map((r,i)=>{
            const url=URL.createObjectURL(r.blob)
            generated.push(url)
            return {url,alt:'Ảnh '+form.name+' · '+section.title+' '+(i+1)}
          })
        }
        sections.push(copy)
      }
      for(const old of previewUrls.current)URL.revokeObjectURL(old)
      previewUrls.current=generated
      setPreviewData({...form,sections})
      setPreview(true)
      setNotice('Đây là bản HTML/CSS thật. Chỉ vùng ảnh nhỏ được dùng làm media, không có ảnh chụp nguyên trang PDF.')
    }catch(error){
      for(const url of generated)URL.revokeObjectURL(url)
      setError(getError(error,'Không tạo được bản xem trước CSS.'))
    }finally{
      if(pdf)await destroyArtistPdf(pdf)
      setBusy(false);setProgress('')
    }
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
        const designed=designArtistPdf(parsed,file.name)
        const slug=await uniqueSlug(slugifyArtist(designed.name))
        const basePath='artist-pdfs/'+crypto.randomUUID()+'/'+file.name.replace(/[^a-zA-Z0-9._-]/g,'_').slice(-90)
        setProgress('['+(i+1)+'/'+list.length+'] Đang lưu PDF riêng tư...')
        const uploaded = await uploadArtistPdf(supabase,file,basePath,(done,total)=>
          setProgress('['+(i+1)+'/'+list.length+'] Đã lưu phần '+done+'/'+total+' · '+file.name))
        storageRef=uploaded.storageRef
        const {data:created,error:insertError}=await supabase.from('artist_profiles')
          .insert({name:designed.name,slug,role:designed.role,tagline:designed.tagline||'',
            intro:designed.intro||'',sections:designed.sections,status:'draft',created_by:user.id})
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
      const photoByPage={}
      let processed=0
      const withCrops=form.sections.filter(section=>(section.photos||[]).length>0)
      for(const section of withCrops){
        const pageNumber=section.page
        if(pageNumber>pdf.numPages)throw new Error('Không tìm thấy trang PDF '+pageNumber)
        setProgress('Đang dựng vùng ảnh riêng cho section '+(++processed)+'/'+withCrops.length+' · trang '+pageNumber)
        const page=await pdf.getPage(pageNumber)
        let crops
        try {
          crops=await renderArtistPhotoCrops(page,section.photos)
        } finally {page.cleanup()}
        const media=[]
        for(let i=0;i<crops.length;i++){
          const {blob:image,extension,type}=crops[i]
          const assetPath=form.id+'/section-'+String(pageNumber).padStart(2,'0')
            +'-photo-'+String(i+1).padStart(2,'0')+'-'+crypto.randomUUID()+'.'+extension
          const {error:uploadError}=await supabase.storage.from(PAGE_BUCKET)
            .upload(assetPath,image,{contentType:type,cacheControl:'3600',upsert:false})
          if(uploadError)throw uploadError
          uploaded.push(assetPath)
          const {data:url}=supabase.storage.from(PAGE_BUCKET).getPublicUrl(assetPath)
          media.push({url:url.publicUrl,path:assetPath,alt:'Ảnh '+form.name+' · '+section.title})
        }
        photoByPage[pageNumber]=media
      }
      const sections=form.sections.map(section=>({...cleanSection(section),
        media:photoByPage[section.page]||[],image_url:null,image_storage_path:null}))
      const cover=sections.find(section=>section.layout==='cover'&&section.media.length)?.media[0]?.url
        ||sections.find(section=>section.media.length)?.media[0]?.url||null
      const {error:saveError}=await supabase.from('artist_profiles')
        .update({name:form.name.trim(),slug:form.slug,role:form.role,tagline:form.tagline,
          intro:form.intro,sections,status:'published',
          cover_image_url:cover,
          updated_at:new Date().toISOString()}).eq('id',form.id)
      if(saveError)throw saveError
      await load()
      edit({...form,sections,status:'published',cover_image_url:cover})
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
    const paths=allPhotoPaths(form.sections)
    try{
      const sections=form.sections.map(s=>({...cleanSection(s),media:[],image_url:null,image_storage_path:null}))
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
    const imagePaths=allPhotoPaths(row.sections)
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
        <p>Mỗi PDF tạo một hồ sơ nghệ sĩ riêng. Mỗi trang PDF tương ứng một section HTML/CSS có bố cục, chữ và các vùng ảnh riêng. Các PDF mẫu được dựng sát phong cách gốc; Admin có thể điều chỉnh toàn bộ.</p>
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
            <div className="artist-admin-pages-heading">
              <div><h3>Thiết kế từng section theo PDF</h3>
                <p>{form.sections.length} trang PDF = {form.sections.length} section HTML/CSS. Ảnh chỉ được cắt từ vùng chân dung, không dùng ảnh chụp trang.</p></div>
              <div className="artist-admin-design-tools">
                <button type="button" disabled={busy||form.status==='published'||!identifyArtistLayout(sources[form.id]?.original_filename)}
                  onClick={applyOriginalDesign}>ÁP DỤNG BỐ CỤC PDF GỐC</button>
                <button type="button" disabled={busy} onClick={buildCssPreview}>
                  {preview?'ĐÓNG BẢN XEM TRƯỚC':'XEM TRƯỚC HTML / CSS ↗'}</button>
              </div>
            </div>
            <div className="artist-admin-pages">
              {form.sections.map((section,i)=><article key={section.page||i} className="artist-admin-page">
                <div className="artist-admin-page-top"><span>SECTION {String(section.page||i+1).padStart(2,'0')}</span>
                  <span>{(section.photos||[]).length} ẢNH RIÊNG · {(section.highlights||[]).length} MỤC CHỮ</span></div>
                <label>KIỂU BỐ CỤC CSS
                  <select value={section.layout||'feature'} disabled={busy} onChange={e=>updateSection(i,'layout',e.target.value)}>
                    {ARTIST_LAYOUT_OPTIONS.map(([id,label])=><option key={id} value={id}>{label}</option>)}
                  </select>
                </label>
                <label>NHÃN TRÊN SECTION
                  <input disabled={busy} value={section.eyebrow||''} maxLength={160}
                    onChange={e=>updateSection(i,'eyebrow',e.target.value)} placeholder="ARTIST / STORY / 01" />
                </label>
                <label>TIÊU ĐỀ SECTION
                  <input disabled={busy} value={section.title||''}
                    onChange={e=>updateSection(i,'title',e.target.value)} />
                </label>
                <label>DÒNG PHỤ
                  <input disabled={busy} value={section.subtitle||''} maxLength={280}
                    onChange={e=>updateSection(i,'subtitle',e.target.value)} />
                </label>
                <label>NỘI DUNG CHỮ (HTML/CSS THẬT)
                  <textarea disabled={busy} rows={Math.min(9,Math.max(4,(section.body||'').split('\n').length))}
                    value={section.body||''} onChange={e=>updateSection(i,'body',e.target.value)}
                    placeholder="Nội dung chữ được dựng thành văn bản có thể chọn và chỉnh sửa trên website." />
                </label>
                <label>DANH SÁCH / THÀNH TÍCH (MỖI DÒNG MỘT MỤC)
                  <textarea disabled={busy} rows={4} value={(section.highlights||[]).join('\n')}
                    onChange={e=>updateSection(i,'highlights',e.target.value.split('\n').filter(Boolean))}
                    placeholder={'TOP 10 ...\nTOP 15 ...'} />
                </label>
                <label>THỐNG KÊ (MỘT DÒNG: GIÁ TRỊ | NHÃN)
                  <textarea disabled={busy} rows={3}
                    value={(section.metrics||[]).map(([value,label])=>value+' | '+label).join('\n')}
                    onChange={e=>updateSection(i,'metrics',toMetrics(e.target.value))}
                    placeholder={'4+ | Năm kinh nghiệm\n500+ | Show diễn'} />
                </label>
                <div className="artist-admin-region-head"><strong>VÙNG ẢNH RIÊNG TỪ PDF</strong>
                  <button type="button" disabled={busy||(section.photos||[]).length>=8} onClick={()=>addPhoto(i)}>+ THÊM VÙNG ẢNH</button></div>
                <p className="artist-admin-region-notice">Chỉ chọn vùng có ảnh nghệ sĩ hoặc tư liệu; KHÔNG chọn nguyên trang hay vùng chứa tiêu đề/chữ. Toạ độ theo tỷ lệ % của trang PDF.</p>
                {(section.photos||[]).map((photo,j)=><div className="artist-admin-region-row" key={j}>
                  <span>ẢNH {String(j+1).padStart(2,'0')}</span>
                  {['x','y','w','h'].map(key=><label key={key}>{key.toUpperCase()} %
                    <input type="number" min={key==='w'||key==='h'?5:0} max={100} step={1}
                      disabled={busy} value={Math.round((Number(photo[key])||0)*100)}
                      onChange={e=>updatePhoto(i,j,key,e.target.value)}/>
                  </label>)}
                  <button type="button" aria-label={'Xóa vùng ảnh '+(j+1)} disabled={busy}
                    onClick={()=>removePhoto(i,j)}>×</button>
                </div>)}
                {Array.isArray(section.media)&&section.media.length>0&&<div className="artist-admin-extracted-media">
                  {section.media.map((image,j)=><img src={image.url} key={image.path||j}
                    alt={'Ảnh được tách riêng '+(j+1)} loading="lazy" />)}
                </div>}
              </article>)}
            </div>
            {preview&&previewData&&<section className="artist-admin-css-preview">
              <div className="artist-admin-css-preview-heading">
                <strong>BẢN XEM TRƯỚC / CSS THẬT</strong>
                <button type="button" onClick={()=>setPreview(false)}>ĐÓNG ×</button>
              </div>
              <ArtistPortfolioSections profile={previewData} sections={previewData.sections}/>
            </section>}
            <div className="artist-admin-editor-actions">
              <button type="button" className="artist-admin-save" disabled={busy} onClick={save}>LƯU NỘI DUNG</button>
              {form.status==='draft'?<button type="button" className="artist-admin-publish" disabled={busy} onClick={publish}>XUẤT BẢN HỒ SƠ ↗</button>:
                <button type="button" className="artist-admin-unpublish" disabled={busy} onClick={unpublish}>CHUYỂN VỀ BẢN NHÁP</button>}
              {form.status==='published'&&<a href={'/artists/'+form.slug} target="_blank" rel="noreferrer">XEM TRANG CÔNG KHAI ↗</a>}
              <button type="button" className="artist-admin-delete" disabled={busy} onClick={()=>setDeleteTarget(profiles.find(x=>x.id===form.id))}>XÓA HỒ SƠ</button>
            </div>
            <p className="artist-admin-warning">Các bản dựng HTML/CSS sử dụng nội dung từ PDF và vùng ảnh riêng. Một số trang PDF dùng ảnh raster có thể không tách được chữ tự động; hãy đối chiếu với PDF gốc và sửa nội dung trước khi xuất bản. Chỉ đăng nội dung bạn có quyền sử dụng. Chỉ những vùng ảnh riêng đã duyệt mới có đường dẫn công khai. Website không hiển thị ảnh chụp toàn trang PDF.</p>
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
