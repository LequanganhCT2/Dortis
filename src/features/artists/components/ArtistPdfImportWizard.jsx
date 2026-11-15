import React,{useEffect,useMemo,useRef,useState} from 'react'
import {extractArtistPdf,slugifyArtist} from '../../../artistPdf'
import {buildReviewFromExtraction,normalizeReviewedPage,validateReviewedImport} from '../domain/pdfReviewModel'
import './artist-pdf-import.css'

const LIMIT=100*1024*1024
const LAYOUTS=[
  ['cover','Bìa / Hero'],['biography','Tiểu sử'],['feature','Giới thiệu / Thế mạnh'],
  ['stats','Số liệu / Dấu ấn'],['gallery','Thư viện ảnh'],['media','Media / Video'],
  ['awards','Thành tích'],['list','Danh sách'],['contact','Booking']
]
const STEPS=['Tải PDF','Kiểm tra dữ liệu','Lưu hồ sơ']
export default function ArtistPdfImportWizard({supabase,user,onImported}){
  const [file,setFile]=useState(null)
  const [doc,setDoc]=useState(null)
  const [pageIndex,setPageIndex]=useState(0)
  const [stage,setStage]=useState('pick')
  const [busy,setBusy]=useState(false)
  const [progress,setProgress]=useState('')
  const [error,setError]=useState('')
  const [dragging,setDragging]=useState(false)
  const inputRef=useRef(null)
  const [previewUrl,setPreviewUrl]=useState('')
  useEffect(()=>{
    if(!file){setPreviewUrl('');return}
    const url=URL.createObjectURL(file)
    setPreviewUrl(url)
    return ()=>URL.revokeObjectURL(url)
  },[file])
  const page=doc?.pages?.[pageIndex]
  const complete=useMemo(()=>doc?doc.pages.filter(p=>p.reviewed).length:0,[doc])
  function patchDoc(key,value){setDoc(d=>({...d,[key]:value}))}
  function patchPage(key,value){
    setDoc(d=>({...d,pages:d.pages.map((p,i)=>i===pageIndex?
      {...p,[key]:value,reviewed:key==='reviewed'?value:false}:p)}))
  }
  async function load(fileToRead){
    if(!fileToRead)return
    setError('')
    if(!/\.pdf$/i.test(fileToRead.name)||!fileToRead.size||fileToRead.size>LIMIT){
      setError('Vui lòng chọn PDF hợp lệ, dung lượng tối đa 100 MB.');return
    }
    setFile(fileToRead);setDoc(null);setPageIndex(0);setBusy(true);setStage('extract')
    try{
      const parsed=await extractArtistPdf(fileToRead,(done,total)=>
        setProgress('Đang đọc lớp chữ của trang '+done+'/'+total+'…'))
      const review=buildReviewFromExtraction(parsed)
      if(!review.pages.length)throw new Error('PDF không có trang hợp lệ.')
      setDoc(review);setStage('review')
    }catch(e){
      setError('Không phân tích được PDF: '+e.message)
      setStage('pick')
    }finally{setBusy(false);setProgress('')}
  }
  function cancel(){
    setFile(null);setDoc(null);setPageIndex(0);setStage('pick');setError('')
  }
  async function uniqueSlug(name){
    const seed=slugifyArtist(name)
    const {data,error:e}=await supabase.from('artist_profiles').select('slug').like('slug',seed+'%')
    if(e)throw e
    const used=new Set((data||[]).map(row=>row.slug))
    if(!used.has(seed))return seed
    let index=2;while(used.has(seed+'-'+index))index++
    return seed+'-'+index
  }
  async function commit(){
    const issue=validateReviewedImport(doc)
    if(issue){setError(issue);return}
    setBusy(true);setError('');setStage('save')
    try{
      const slug=await uniqueSlug(doc.name.trim())
      const {data,error:e}=await supabase.from('artist_profiles').insert({
        name:doc.name.trim().slice(0,160),slug,
        role:doc.role.trim()||'Nghệ sĩ',
        tagline:doc.tagline.trim().slice(0,250),
        intro:doc.intro.trim().slice(0,4000),
        sections:doc.pages.map(normalizeReviewedPage),
        render_mode:'editorial',status:'draft',created_by:user.id
      }).select('*').single()
      if(e)throw e
      // We do NOT upload PDF into Supabase and never create artist_profile_sources.
      // The local File and its object URL are released when the wizard resets.
      cancel()
      onImported?.(data)
    }catch(e){setError('Không lưu được hồ sơ: '+e.message);setStage('review')}
    finally{setBusy(false)}
  }
  const selectable=(doc?.pages||[]).map((p,i)=>({p,i}))
  return <section className="pdf-import" id="artist-upload" aria-label="Nhập hồ sơ nghệ sĩ từ PDF">
    <header className="pdf-import__intro">
      <div><span className="pdf-import__eyebrow">01 / ARTIST SOURCE LIBRARY</span>
        <h2>Nhập Portfolio từ PDF<span>.</span></h2>
        <p>Đọc chữ và các mục từ PDF, đối chiếu từng trang, rồi lưu thành một hồ sơ nghệ sĩ có thể gán vào nhiều form. Không lưu PDF gốc lên server.</p></div>
      <div className="pdf-import__steps" aria-label="Các bước nhập PDF">
        {STEPS.map((name,i)=><span key={name} className={
          (i===0&&stage==='pick'||i===1&&['extract','review'].includes(stage)||i===2&&stage==='save')?'is-active':''}>
          <b>0{i+1}</b> {name}</span>)}
      </div>
    </header>
    {error&&<div className="pdf-import__error" role="alert">{error}</div>}
    {stage==='pick'&&<div className={'pdf-import__drop'+(dragging?' is-dragging':'')}
      onDragOver={e=>{e.preventDefault();setDragging(true)}}
      onDragLeave={e=>{e.preventDefault();setDragging(false)}}
      onDrop={e=>{e.preventDefault();setDragging(false);load(e.dataTransfer.files?.[0])}}>
      <div className="pdf-import__drop-icon" aria-hidden="true">PDF<span>＋</span></div>
      <strong>Thả file PDF hoặc chọn từ máy</strong>
      <p>Tệp tối đa 100 MB · Đọc trong trình duyệt · Không gửi PDF vào Supabase</p>
      <button type="button" onClick={()=>inputRef.current?.click()}>+ CHỌN FILE PDF</button>
      <input ref={inputRef} type="file" accept=".pdf,application/pdf" hidden onChange={e=>{
        const picked=e.target.files?.[0];e.target.value='';load(picked)
      }}/>
    </div>}
    {stage==='extract'&&<div className="pdf-import__working" role="status">
      <span className="pdf-import__spinner" aria-hidden="true"/>
      <h3>Đang phân tích Portfolio…</h3>
      <p>{progress||'Đọc nội dung từng trang, không cắt ảnh.'}</p></div>}
    {(stage==='review'||stage==='save')&&doc&&<div className="pdf-import__review">
      <div className="pdf-import__summary">
        <div className="pdf-import__summary-title">
          <span className="pdf-import__eyebrow">02 / REVIEW BEFORE SAVING</span>
          <h3>Kiểm tra dữ liệu trích xuất</h3>
          <p>Trang có chữ nằm trong ảnh được đánh dấu để bạn nhập thủ công. Chỉ các trang bạn xác nhận mới được đưa vào hồ sơ.</p>
        </div>
        <div className="pdf-import__metrics">
          <div><strong>{doc.pageCount}</strong><span>Trang PDF</span></div>
          <div><strong>{doc.quality.extracted}</strong><span>Có chữ</span></div>
          <div className={doc.quality.imageOnly?'is-warning':''}>
            <strong>{doc.quality.imageOnly}</strong><span>Cần nhập tay</span></div>
          <div><strong>{complete}/{doc.pageCount}</strong><span>Đã duyệt</span></div>
        </div>
      </div>
      <div className="pdf-import__identity">
        <label>Tên nghệ sĩ<input value={doc.name} disabled={busy}
          onChange={e=>patchDoc('name',e.target.value)} maxLength={160}/></label>
        <label>Vai trò / chuyên môn<input value={doc.role} disabled={busy}
          onChange={e=>patchDoc('role',e.target.value)} maxLength={120}/></label>
        <label>Giới thiệu ngắn<input value={doc.tagline} disabled={busy}
          onChange={e=>patchDoc('tagline',e.target.value)} maxLength={250}
          placeholder="Không tự tạo nội dung nếu PDF chưa có"/></label>
      </div>
      <div className="pdf-import__workspace">
        <nav className="pdf-import__pages" aria-label="Chọn trang PDF">
          <span className="pdf-import__eyebrow">CÁC MỤC ĐÃ TRÍCH</span>
          {selectable.map(({p,i})=><button key={p.page} type="button"
            className={'pdf-import__page'+(pageIndex===i?' is-current':'')+(p.reviewed?' is-done':'')}
            onClick={()=>setPageIndex(i)} disabled={busy}>
            <span>{String(p.page).padStart(2,'0')}</span>
            <strong>{p.title||'Chưa có tiêu đề'}</strong>
            <em>{p.reviewed?'✓':p.textFound?'CHỜ DUYỆT':'CẦN NHẬP'}</em>
          </button>)}
        </nav>
        <div className="pdf-import__fields">
          <div className="pdf-import__fields-head"><span>TRANG {page.page}/{doc.pageCount}</span>
            <b className={page.textFound?'':'is-warning'}>
              {page.textFound?'ĐÃ TRÍCH LỚP CHỮ':'CHỮ TRONG ẢNH / CHƯA ĐỌC ĐƯỢC'}</b></div>
          {page.warnings.length>0&&<p className="pdf-import__warning">
            {page.warnings.join(' ')}</p>}
          <label>Loại nội dung
            <select value={page.layout} disabled={busy}
              onChange={e=>patchPage('layout',e.target.value)}>
              {LAYOUTS.map(([value,label])=><option key={value} value={value}>{label}</option>)}
            </select></label>
          <label>Tiêu đề mục
            <input value={page.title} disabled={busy} maxLength={240}
              placeholder="Nhập chính xác tiêu đề trên trang PDF"
              onChange={e=>patchPage('title',e.target.value)}/></label>
          <label>Nhãn phụ (nếu có)
            <input value={page.eyebrow} disabled={busy} maxLength={160}
              placeholder="Không bắt buộc"
              onChange={e=>patchPage('eyebrow',e.target.value)}/></label>
          <label>Văn bản trích xuất
            <textarea rows={9} value={page.body} disabled={busy}
              onChange={e=>patchPage('body',e.target.value)}
              placeholder={page.textFound?'Kiểm tra câu, dấu và nội dung.':
                'Trang này không có text layer. Nhìn PDF bên cạnh và nhập nội dung nếu có.'}/></label>
          <label className="pdf-import__confirm">
            <input type="checkbox" checked={page.reviewed} disabled={busy||!page.title.trim()}
              onChange={e=>patchPage('reviewed',e.target.checked)}/>
            <span>Tôi đã đối chiếu nội dung của trang này với PDF.</span>
          </label>
          <div className="pdf-import__page-actions">
            <button type="button" disabled={busy||pageIndex===0}
              onClick={()=>setPageIndex(i=>Math.max(0,i-1))}>← Trang trước</button>
            <button type="button" disabled={busy||pageIndex===doc.pages.length-1}
              onClick={()=>setPageIndex(i=>Math.min(doc.pages.length-1,i+1))}>Trang sau →</button>
          </div>
        </div>
        <div className="pdf-import__preview">
          <div><strong>PDF GỐC / CHỈ XEM CỤC BỘ</strong><span>Trang {page.page} / {doc.pageCount}</span></div>
          {previewUrl&&<iframe key={page.page} src={previewUrl+'#page='+page.page+'&toolbar=0&navpanes=0'}
            title={'Xem PDF gốc · trang '+page.page}/>}
          <p>File chỉ mở từ bộ nhớ trình duyệt. Không được tải lên Supabase.</p>
        </div>
      </div>
      <footer className="pdf-import__footer">
        <button type="button" onClick={cancel} disabled={busy}
          className="pdf-import__cancel">Hủy, bỏ dữ liệu chưa lưu</button>
        <div><span>{complete}/{doc.pageCount} trang đã xác nhận</span>
          <button type="button" disabled={busy||!!validateReviewedImport(doc)} onClick={commit}>
            {busy?'ĐANG LƯU...':'LƯU HỒ SƠ NGHỆ SĨ →'}</button></div>
      </footer>
      <p className="pdf-import__footnote">
        Chỉ lưu text/nhóm nội dung đã duyệt thành bản nháp tại Hồ sơ nghệ sĩ.
        File PDF gốc không có trong database hay Storage. File trên máy của bạn không bị xóa.
      </p>
    </div>}
  </section>
}
