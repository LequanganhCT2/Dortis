import React, { useCallback, useEffect, useRef, useState } from 'react'
import { renderPagesFromPdf, slugifyArtist, destroyArtistPdf } from './artistPdf'
import { designArtistPdf, identifyArtistLayout, normalizeArtistSection, ARTIST_LAYOUT_OPTIONS } from './artistLayouts'
import { renderArtistPhotoCrops } from './artistPhotoCrops'
import { renderPdfPageOriginal } from './artistPdfOriginal'
import ArtistOriginalPages from './ArtistOriginalPages'
import ArtistPortfolioSections from './ArtistPortfolioSections'
import ArtistPortfolioCatalog from './features/artists/components/ArtistPortfolioCatalog'
import ArtistPdfImportWizard from './features/artists/components/ArtistPdfImportWizard'
import {createTemplate1Profile} from './features/portfolio/templates/template1'
import {createTemplate2Profile} from './features/portfolio/templates/template2'
import {saveArtistProfile} from './features/artists/application/saveArtistProfile'
import { downloadArtistPdf, removeArtistPdf } from './artistPdfStorage'
import './admin-artists.css'

const PAGE_BUCKET='dortis-artist-pages'
const MAX_PDF=100*1024*1024
const emptyNotice='Bản nháp chỉ công khai sau khi bấm Xuất bản. Chế độ Nguyên bản giữ đúng bố cục mỗi trang PDF; bản HTML/CSS vẫn có thể lựa chọn.'
const getError=(e,fallback='Có lỗi xảy ra.')=>{
  if(e?.statusCode==='413'||/maximum size exceeded|entitytoo(?:large|big)|413/i.test(String(e?.message||'')))return 'Storage đang từ chối một phần PDF 4 MB. Kiểm tra Storage → Settings: Global file size limit phải ít nhất 4 MB, hoặc liên hệ quản trị viên Supabase.'
  return e?.message||fallback
}
const cleanSection=normalizeArtistSection
const allPhotoPaths=sections=>[...new Set((sections||[]).flatMap(s=>[
  s.image_storage_path,
  s.original_page_path,
  ...(Array.isArray(s.media)?s.media.map(x=>x.path):[])
]).filter(Boolean))]

export default function AdminArtistProfiles({user,supabase,initialSlug=''}){
  const [profiles,setProfiles]=useState([])
  const [loadingProfiles,setLoadingProfiles]=useState(true)
  const editorRef=useRef(null)
  const initialSelectionDone=useRef('')
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
    if(p.error||s.error){setError(getError(p.error||s.error));setLoadingProfiles(false);return}
    setProfiles(p.data||[])
    setLoadingProfiles(false)
    setSources(Object.fromEntries((s.data||[]).map(row=>[row.profile_id,row])))
    setSelected(prev=>{
      if(prev&&!(p.data||[]).some(x=>x.id===prev))return null
      return prev
    })
  },[supabase])
  useEffect(()=>{load()},[load])

  function openPortfolio(profile){
    edit(profile)
    window.requestAnimationFrame(()=>editorRef.current?.scrollIntoView({
      behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',
      block:'start'
    }))
  }
  useEffect(()=>{
    if(!initialSlug||!profiles.length||initialSelectionDone.current===initialSlug)return
    const profile=profiles.find(item=>item.slug===initialSlug)
    if(!profile)return
    initialSelectionDone.current=initialSlug
    edit(profile)
    window.requestAnimationFrame(()=>editorRef.current?.scrollIntoView({
      behavior:'instant',block:'start'
    }))
  },[initialSlug,profiles])
  function edit(profile){
    setSelected(profile.id)
    setForm({
      id:profile.id,name:profile.name,slug:profile.slug,role:profile.role,
      render_mode:profile.render_mode||'editorial',
      tagline:profile.tagline||'',intro:profile.intro||'',
      sections:Array.isArray(profile.sections)?profile.sections.map(cleanSection):[],
      status:profile.status,cover_image_url:profile.cover_image_url
    })
    setError('');setNotice('');setPreview(false);setPreviewData(null)
  }
  function updateField(key,value){setForm(prev=>({...prev,[key]:value}))}
  function createManualProfile(){
    setSelected(null);setError('');setNotice('');setPreview(false);setPreviewData(null)
    setForm({id:null,name:'',slug:'',role:'Nghệ sĩ',tagline:'',intro:'',
      render_mode:'editorial',status:'draft',cover_image_url:null,
      sections:[{page:1,name:'Giới thiệu',title:'',body:'',contentVersion:2,layout:'cover'}]})
  }
  function startTemplate1(factory=createTemplate1Profile,label='Template 1 · 12 phần'){
    setSelected(null);setError('');setNotice('Template 1 · Điền thông tin trong 12 phần, lưu hồ sơ rồi chọn Template 1 trong thư viện mẫu.')
    setNotice(label+' · Điền thông tin, lưu hồ sơ rồi chọn mẫu tương ứng trong thư viện.')
    setPreview(false);setPreviewData(null);setForm(factory())
    window.requestAnimationFrame(()=>editorRef.current?.scrollIntoView({block:'start',behavior:'instant'}))
  }
  function addContentPart(){
    setForm(previous=>({...previous,sections:[...previous.sections,{
      page:Math.max(0,...previous.sections.map(section=>Number(section.page)||0))+1,
      name:'Phần '+(previous.sections.length+1),title:'',body:'',contentVersion:2,layout:'feature'
    }]}))
  }
  function moveContentPart(index,offset){
    setForm(previous=>{
      const sections=[...previous.sections],target=index+offset
      if(target<0||target>=sections.length)return previous
      ;[sections[index],sections[target]]=[sections[target],sections[index]]
      return {...previous,sections}
    })
  }
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
    if(!source){
      setPreviewData({...form,sections:form.sections.map(cleanSection)})
      setPreview(true)
      setNotice('Đang xem trước nội dung chữ đã duyệt. Ảnh sẽ được thêm riêng trong Mẫu Portfolio.')
      return
    }
    setBusy(true);setError('')
    let pdf
    const generated=[]
    try {
      setProgress('Đang chuẩn bị bản xem trước HTML/CSS từ PDF...')
      const blob=await downloadArtistPdf(supabase,source.pdf_storage_path,(done,total)=>
        setProgress('Đang tải PDF nguồn để xem trước · '+done+'/'+total))
      pdf=await renderPagesFromPdf(blob)
      if(form.render_mode==='original'){
        const sections=[]
        for(const section of form.sections){
          setProgress('Đang dựng bản xem trước giống PDF · trang '+section.page+'/'+pdf.numPages)
          const page=await pdf.getPage(section.page)
          let rendered
          try{rendered=await renderPdfPageOriginal(page,{targetWidth:1150})}
          finally{page.cleanup()}
          const imageUrl=URL.createObjectURL(rendered.blob)
          generated.push(imageUrl)
          sections.push({...cleanSection(section),
            original_page_url:imageUrl,
            original_page_width:rendered.width,original_page_height:rendered.height})
        }
        for(const old of previewUrls.current)URL.revokeObjectURL(old)
        previewUrls.current=generated
        setPreviewData({...form,sections})
        setPreview(true)
        setNotice('Bản xem trước giữ nguyên màu sắc, font, vị trí và tỷ lệ từng trang PDF.')
        return
      }
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




  async function save(){
    if(!form||busy)return
    setBusy(true);setError('');setNotice('');setProgress('Đang lưu nội dung đã chỉnh sửa...')
    try{
      const saved=await saveArtistProfile({supabase,userId:user?.id,profile:form})
      setForm(previous=>({...previous,id:saved.id,slug:saved.slug,role:saved.role}));setSelected(saved.id)
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
      let sections
      let cover=null
      if(form.render_mode==='original'){
        // High-fidelity mode: one responsive, full-composition image per PDF page.
        // We never expose the private original PDF; only approved page renders.
        const originalByPage={}
        for(let i=1;i<=pdf.numPages;i++){
          setProgress('Đang giữ nguyên bố cục trang PDF '+i+'/'+pdf.numPages+'...')
          const page=await pdf.getPage(i)
          let rendered
          try{rendered=await renderPdfPageOriginal(page,{targetWidth:1850})}
          finally{page.cleanup()}
          const assetPath=form.id+'/original-page-'+String(i).padStart(2,'0')
            +'-'+crypto.randomUUID()+'.'+rendered.extension
          const {error:uploadError}=await supabase.storage.from(PAGE_BUCKET)
            .upload(assetPath,rendered.blob,{contentType:rendered.type,cacheControl:'3600',upsert:false})
          if(uploadError)throw uploadError
          uploaded.push(assetPath)
          const {data:url}=supabase.storage.from(PAGE_BUCKET).getPublicUrl(assetPath)
          originalByPage[i]={
            original_page_url:url.publicUrl,original_page_path:assetPath,
            original_page_width:rendered.width,original_page_height:rendered.height,
          }
        }
        sections=form.sections.map(section=>({
          ...cleanSection(section),
          ...originalByPage[section.page],
          image_url:null,image_storage_path:null,media:[],
        }))
        cover=originalByPage[1]?.original_page_url||null
      }else{
        // Editable editorial mode keeps individual photos and HTML/CSS.
        const photoByPage={}
        let processed=0
        const withCrops=form.sections.filter(section=>(section.photos||[]).length>0)
        for(const section of withCrops){
          const pageNumber=section.page
          if(pageNumber>pdf.numPages)throw new Error('Không tìm thấy trang PDF '+pageNumber)
          setProgress('Đang dựng ảnh riêng '+(++processed)+'/'+withCrops.length+' · trang '+pageNumber)
          const page=await pdf.getPage(pageNumber)
          let crops
          try{crops=await renderArtistPhotoCrops(page,section.photos)}
          finally{page.cleanup()}
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
        sections=form.sections.map(section=>({
          ...cleanSection(section),media:photoByPage[section.page]||[],
          image_url:null,image_storage_path:null,
          original_page_url:null,original_page_path:null,
        }))
        cover=sections.find(section=>section.layout==='cover'&&section.media.length)?.media[0]?.url
          ||sections.find(section=>section.media.length)?.media[0]?.url||null
      }
      const {error:saveError}=await supabase.from('artist_profiles')
        .update({name:form.name.trim(),slug:form.slug,role:form.role,tagline:form.tagline,
          intro:form.intro,render_mode:form.render_mode||'original',sections,status:'published',
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
      const sections=form.sections.map(s=>({...cleanSection(s),media:[],image_url:null,image_storage_path:null,
        original_page_url:null,original_page_path:null,original_page_width:0,original_page_height:0}))
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
      <header className="artist-admin-intro"><span>DORTIS / ARTIST PORTFOLIOS</span>
        <h1>Hồ sơ <em>nghệ sĩ.</em></h1>
        <p>Quản lý toàn bộ Portfolio trong một nơi: chọn hồ sơ bên dưới để chỉnh sửa, nhập PDF mới hoặc thay đổi trạng thái xuất bản.</p>
      </header>
      {error&&<p className="admin-alert error" role="alert">{error}</p>}
      {notice&&<p className="admin-alert success" role="status">{notice}</p>}
      {busy&&<div className="artist-admin-progress" role="status"><span className="artist-admin-loader"/>{progress||'Đang xử lý...'}</div>}
      <ArtistPdfImportWizard supabase={supabase} user={user}
        onImported={async profile=>{
          await load()
          edit(profile)
          window.requestAnimationFrame(()=>editorRef.current?.scrollIntoView({
            behavior:'smooth',block:'start'
          }))
        }}/>
      <ArtistPortfolioCatalog profiles={profiles} loading={loadingProfiles}
        selected={selected} onSelect={openPortfolio} disabled={busy}/>
      <button type="button" className="artist-admin-save" disabled={busy} onClick={createManualProfile}>
        + NHẬP HỒ SƠ THỦ CÔNG
      </button>
      <button type="button" className="artist-admin-save" disabled={busy} onClick={()=>startTemplate1()}>
        + TEMPLATE 1 · ĐIỀN 12 PHẦN
      </button>
      <button type="button" className="artist-admin-save" disabled={busy}
        onClick={()=>startTemplate1(createTemplate2Profile,'Template 2 · 8 phần')}>
        + TEMPLATE 2 · ĐIỀN 8 PHẦN
      </button>
      <section className="artist-admin-content">
        <div className="artist-admin-editor" id="artist-editor" ref={editorRef}>
          {!form?<div className="artist-admin-empty"><span>✳ DORTIS / PROFILE EDITOR</span><h2>Chọn một hồ sơ để chỉnh sửa.</h2><p>Thay tên nghệ sĩ, sửa nội dung trích xuất từng trang, kiểm duyệt rồi xuất bản để tạo website riêng.</p></div>:
          <div>
            <div className="artist-admin-editor-head"><div><span>02 / EDIT & REVIEW</span><h2>Biên tập hồ sơ</h2></div>
              <span className={'artist-admin-status '+form.status}>{form.status==='published'?'ĐÃ XUẤT BẢN':'BẢN NHÁP'}</span>
            </div>
            {sources[form.id]&&<fieldset className="artist-admin-render-mode" disabled={busy||form.status==='published'}>
              <legend>CHẾ ĐỘ HIỂN THỊ PORTFOLIO</legend>
              <label className={form.render_mode==='original'?'chosen':''}>
                <input type="radio" name="portfolio-mode" value="original" checked={form.render_mode!=='editorial'}
                  onChange={()=>{updateField('render_mode','original');setPreview(false);setPreviewData(null)}}/>
                <span><strong>GIỮ NGUYÊN PDF</strong><small>Đề xuất — giữ bố cục gốc từng trang, co giãn vừa màn hình, có phóng to</small></span>
              </label>
              <label className={form.render_mode==='editorial'?'chosen':''}>
                <input type="radio" name="portfolio-mode" value="editorial" checked={form.render_mode==='editorial'}
                  onChange={()=>{updateField('render_mode','editorial');setPreview(false);setPreviewData(null)}}/>
                <span><strong>THIẾT KẾ WEB HTML/CSS</strong><small>Chữ và ảnh có thể chỉnh sửa riêng; bố cục có thể khác PDF gốc</small></span>
              </label>
              {form.status==='published'&&<p>Để thay đổi chế độ, hãy chuyển hồ sơ về bản nháp rồi xuất bản lại.</p>}
            </fieldset>}
            <div className="artist-admin-fields">
              <label>TÊN NGHỆ SĨ<input value={form.name} disabled={busy} onChange={e=>updateField('name',e.target.value)} maxLength={160}/></label>
              <label>VAI TRÒ<input value={form.role} disabled={busy} onChange={e=>updateField('role',e.target.value)} maxLength={120} placeholder="Ca sĩ, biên đạo, nghệ sĩ..."/></label>
              <label className="span-2">ĐƯỜNG DẪN <input value={form.slug} disabled={busy}
                placeholder={form.name.trim()?slugifyArtist(form.name):'Tự tạo từ tên nghệ sĩ khi lưu'}
                onChange={e=>updateField('slug',e.target.value.trim()?slugifyArtist(e.target.value):'')}/>
                <small>Để trống để tự tạo khi lưu. Hồ sơ mới trùng tên sẽ có hậu tố riêng.</small></label>
              <label className="span-2">DÒNG GIỚI THIỆU NGẮN<input value={form.tagline} disabled={busy} onChange={e=>updateField('tagline',e.target.value)} maxLength={250} placeholder="Dòng phụ xuất hiện trên trang cá nhân"/></label>
              <label className="span-2">GIỚI THIỆU<textarea value={form.intro} rows={5} disabled={busy} onChange={e=>updateField('intro',e.target.value)} maxLength={4000}/></label>
            </div>
            <div className="artist-admin-source">
              <span>NGUỒN DỮ LIỆU</span><strong>{sources[form.id]?.original_filename||'Các phần hồ sơ · PDF hoặc nhập thủ công'}</strong>
              <small>{sources[form.id]
                ? 'Hồ sơ nhập theo quy trình cũ, có tệp nguồn trong Storage.'
                : 'Hồ sơ mới chỉ lưu chữ và các mục. PDF gốc không được lưu trên Supabase.'}</small>
            </div>
            <div className="artist-admin-pages-heading">
              <div><h3>{form.render_mode==='original'?'Trang PDF nguyên bản':'Các phần nội dung hồ sơ'}</h3>
                <p>{form.render_mode==='original'
                  ? form.sections.length+' trang sẽ được hiển thị đúng thứ tự và tỷ lệ gốc, không đổi vị trí các thành phần.'
                  : form.sections.length+' phần · mỗi phần có tên riêng, tiêu đề và nội dung. Khi chọn mẫu, các phần được nạp đúng thứ tự này.'}</p></div>
              <div className="artist-admin-design-tools">
                <button type="button" disabled={busy||form.status==='published'||form.render_mode==='original'||!identifyArtistLayout(sources[form.id]?.original_filename)}
                  onClick={applyOriginalDesign}>ÁP DỤNG BỐ CỤC PDF GỐC</button>
                <button type="button" disabled={busy} onClick={buildCssPreview}>
                  {preview?'ĐÓNG BẢN XEM TRƯỚC':form.render_mode==='original'?'XEM TRƯỚC GIỐNG PDF ↗':'XEM TRƯỚC HTML / CSS ↗'}</button>
              </div>
            </div>
            <div className="artist-admin-pages">
              {form.render_mode!=='original'&&<button type="button" disabled={busy||form.sections.length>=24}
                onClick={addContentPart}>+ Thêm phần nội dung</button>}
              {form.render_mode==='original' ? form.sections.map((section,i)=>
                <article key={section.page||i} className="artist-admin-original-page-row">
                  <strong>TRANG {String(section.page||i+1).padStart(2,'0')}</strong>
                  <span>Giữ bố cục, màu, font chữ và ảnh của trang PDF gốc.</span>
                  {(section.original_page_url||section.image_url)&&<img loading="lazy"
                    src={section.original_page_url||section.image_url} alt={'Trang PDF '+(i+1)}/>}
                </article>
              ) : form.sections.map((section,i)=><article key={section.page||i} className="artist-admin-page">
                <div className="artist-admin-page-top"><span>SECTION {String(section.page||i+1).padStart(2,'0')}</span>
                  <span>{(section.photos||[]).length} ẢNH RIÊNG · {(section.highlights||[]).length} MỤC CHỮ</span></div>
                <div>
                  <button type="button" disabled={busy||i===0} onClick={()=>moveContentPart(i,-1)} aria-label={'Đưa phần '+(i+1)+' lên'}>↑</button>
                  <button type="button" disabled={busy||i===form.sections.length-1} onClick={()=>moveContentPart(i,1)} aria-label={'Đưa phần '+(i+1)+' xuống'}>↓</button>
                </div>
                <label>TÊN PHẦN {i+1}
                  <input disabled={busy} value={section.name||''} maxLength={160}
                    onChange={e=>updateSection(i,'name',e.target.value)} placeholder="Ví dụ: Giới thiệu, Hành trình, Liên hệ"/>
                </label>
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
                    placeholder={section.input_hint||'Nhập đầy đủ nội dung của phần này.'} />
                </label>
                <label>LIÊN KẾT CỦA PHẦN (MỖI DÒNG MỘT URL)
                  <textarea disabled={busy} rows={2} value={(section.links||[]).join('\n')}
                    onChange={e=>updateSection(i,'links',e.target.value.split('\n').map(x=>x.trim()).filter(Boolean))}/>
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
                {sources[form.id]&&<><div className="artist-admin-region-head"><strong>VÙNG ẢNH RIÊNG TỪ PDF</strong>
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
                </>}
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
              {previewData.render_mode==='original'
                ? <ArtistOriginalPages profile={previewData} sections={previewData.sections}/>
                : <ArtistPortfolioSections profile={previewData} sections={previewData.sections}/>}
            </section>}
            {error&&<p className="admin-alert error" role="alert">{error}</p>}
            {notice&&<p className="admin-alert success" role="status">{notice}</p>}
            <div className="artist-admin-editor-actions">
              <button type="button" className="artist-admin-save" disabled={busy} onClick={save}>LƯU NỘI DUNG</button>
              {form.status==='draft'?(sources[form.id]?
                <button type="button" className="artist-admin-publish" disabled={busy} onClick={publish}>XUẤT BẢN HỒ SƠ ↗</button>:
                form.id?<a className="artist-admin-publish" href={'/admin/templates?artist='+encodeURIComponent(form.slug)}>
                  GÁN VÀO MẪU PORTFOLIO ↗
                </a>:<span>Lưu hồ sơ trước khi chọn mẫu portfolio.</span>):
                <button type="button" className="artist-admin-unpublish" disabled={busy} onClick={unpublish}>CHUYỂN VỀ BẢN NHÁP</button>}
              {form.status==='published'&&<a href={'/artists/'+form.slug} target="_blank" rel="noreferrer">XEM TRANG CÔNG KHAI ↗</a>}
              <button type="button" className="artist-admin-delete" disabled={busy||!form.id} onClick={()=>setDeleteTarget(profiles.find(x=>x.id===form.id))}>XÓA HỒ SƠ</button>
            </div>
            <p className="artist-admin-warning">{sources[form.id]
              ? 'Hồ sơ cũ còn PDF nguồn phục vụ xuất bản theo chế độ cũ. Bạn có thể chỉnh nội dung riêng và gán form.'
              : 'Bạn có thể dùng chữ trích từ PDF hoặc tự nhập từng phần. Lưu hồ sơ, chọn mẫu portfolio rồi kiểm tra nội dung trước khi xuất bản. Ảnh được tải riêng trong phần Mẫu Portfolio.'}</p>
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
