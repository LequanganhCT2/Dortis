import React,{useCallback,useEffect,useMemo,useState} from 'react'
import {PRESET_FORMS,blueprintFor,normalizeBlueprint,templateAssignments,FORM_LAYOUTS,FORM_EFFECTS,FORM_VISUAL_THEMES,FORM_RIBBON_LAYOUTS,
  ribbonDirectionOptions,normalizeRibbonChoice} from './model'
import PortfolioInstanceEditor from './PortfolioInstanceEditor'
import './template-admin.css'

/** Shared form => many artist instances. All data is protected by Admin RLS.
 * A template stores only layout. Its instances store independently edited text/photos.
 */
export default function PortfolioTemplateManager({supabase,user,initialArtistSlug='',onArtistList}){
  const [templates,setTemplates]=useState([])
  const [profiles,setProfiles]=useState([])
  const [instances,setInstances]=useState([])
  const [loading,setLoading]=useState(true)
  const [working,setWorking]=useState(false)
  const [error,setError]=useState('')
  const [notice,setNotice]=useState('')
  const [selection,setSelection]=useState(null)
  const [choice,setChoice]=useState({})
  const [editingTemplate,setEditingTemplate]=useState(null)
  const [blueprint,setBlueprint]=useState(null)
  const [createName,setCreateName]=useState('')
  const [createFrom,setCreateFrom]=useState('')
  const load=useCallback(async()=>{
    const [t,i,p]=await Promise.all([
      supabase.from('artist_website_templates').select('*').order('created_at',{ascending:true}),
      supabase.from('artist_website_instances').select('*').order('updated_at',{ascending:false}),
      supabase.from('artist_profiles').select('id,name,role,slug,status,sections').order('name',{ascending:true})
    ])
    if(t.error||i.error||p.error)throw (t.error||i.error||p.error)
    setTemplates(t.data||[]);setInstances(i.data||[]);setProfiles(p.data||[])
  },[supabase])
  useEffect(()=>{
    let active=true
    load().catch(e=>{if(active)setError('Không tải được thư viện form: '+e.message)})
      .finally(()=>{if(active)setLoading(false)})
    return ()=>{active=false}
  },[load])
  const groups=useMemo(()=>templateAssignments(templates,instances,profiles),[templates,instances,profiles])
  const selected=instances.find(i=>i.id===selection)
  const artist=selected&&profiles.find(p=>p.id===selected.profile_id)
  const template=selected&&templates.find(t=>t.id===selected.template_id)
  const desired=profiles.find(p=>p.slug===initialArtistSlug)
  async function assign(t){
    const profileId=choice[t.id]
    if(!profileId){setError('Cần có hồ sơ nghệ sĩ trước khi gán form.');return}
    const existing=instances.find(i=>i.template_id===t.id&&i.profile_id===profileId)
    if(existing){setSelection(existing.id);return}
    setWorking(true);setError('');setNotice('')
    try{
      const {data,error:e}=await supabase.from('artist_website_instances')
        .insert({template_id:t.id,profile_id:profileId,
          content:{sections:{},images:{}},
          updated_by:user.id,status:'draft'}).select().single()
      if(e)throw e
      setInstances(current=>[data,...current]);setSelection(data.id)
    }catch(e){setError('Không gán được form: '+e.message)}
    finally{setWorking(false)}
  }
  /** Saves layout + its own directional control on a single Form blueprint. */
  async function updateRibbonChoice(form,patch){
    if(working)return
    const current=normalizeBlueprint(form.blueprint)
    const chosen=normalizeRibbonChoice(
      patch.ribbonLayout||current.ribbonLayout,
      patch.ribbonLayout?undefined:(patch.ribbonDirection||current.ribbonDirection)
    )
    if(current.ribbonLayout===chosen.ribbonLayout&&
       current.ribbonDirection===chosen.ribbonDirection)return
    setWorking(true);setError('');setNotice('')
    try{
      const {data,error:e}=await supabase.from('artist_website_templates')
        .update({blueprint:{...current,...chosen},version:form.version+1,
          updated_at:new Date().toISOString()})
        .eq('id',form.id).eq('version',form.version).select().maybeSingle()
      if(e)throw e
      if(!data)throw new Error('Form đã được cập nhật ở nơi khác. Hãy tải lại trước khi chọn.')
      setTemplates(list=>list.map(item=>item.id===data.id?data:item))
      setNotice('Đã lưu layout và hướng dải lụa của '+form.name+
        '. Website đã xuất bản cần cập nhật để nhận thay đổi.')
    }catch(e){setError('Không lưu được hướng dải lụa: '+e.message)}
    finally{setWorking(false)}
  }
  async function detach(group,person){
    if(working||!window.confirm(`Gỡ ${person.artist.name} khỏi mẫu ${group.name}? Bản nháp và website đã xuất bản trên mẫu này sẽ bị gỡ.`))return
    setWorking(true);setError('');setNotice('')
    try{
      const {data,error:e}=await supabase.from('artist_website_instances')
        .delete().eq('id',person.instance.id).eq('revision',person.instance.revision||1)
        .select('id').maybeSingle()
      if(e)throw e
      if(!data)throw new Error('Bản nháp đã thay đổi. Hãy tải lại thư viện.')
      setInstances(list=>list.filter(item=>item.id!==data.id))
      setChoice(previous=>({...previous,[group.id]:''}))
      setNotice('Đã gỡ '+person.artist.name+' khỏi mẫu '+group.name+'.')
    }catch(e){setError('Không gỡ được mẫu: '+e.message)}
    finally{setWorking(false)}
  }
  function openTemplateEdit(t){
    setEditingTemplate(t.id);setBlueprint(normalizeBlueprint(t.blueprint))
    setError('');setNotice('')
  }
  function updateSection(index,key,value){
    setBlueprint(cur=>({...cur,sections:cur.sections.map((s,i)=>i===index?{...s,[key]:value}:s)}))
  }
  function moveSection(index,delta){
    setBlueprint(cur=>{
      const next=cur.sections.map(s=>({...s})),target=index+delta
      if(target<0||target>=next.length)return cur
      const [item]=next.splice(index,1);next.splice(target,0,item)
      return {...cur,sections:next}
    })
  }
  function appendSection(){
    setBlueprint(cur=>({...cur,sections:[...cur.sections,{
      id:'custom_'+crypto.randomUUID().slice(0,8),
      label:'Khu vực mới',layout:'split',effect:'auto',slots:1
    }]}))
  }
  async function saveTemplate(){
    const t=templates.find(item=>item.id===editingTemplate)
    if(!t||working)return
    const next=normalizeBlueprint(blueprint)
    if(!next.sections.length){setError('Form cần ít nhất một khu vực.');return}
    setWorking(true);setError('');setNotice('')
    try{
      const {data,error:e}=await supabase.from('artist_website_templates')
        .update({blueprint:next,version:t.version+1,updated_at:new Date().toISOString()})
        .eq('id',t.id).eq('version',t.version).select().maybeSingle()
      if(e)throw e
      if(!data)throw new Error('Form đã được sửa ở phiên khác. Hãy tải lại để tránh ghi đè.')
      setTemplates(list=>list.map(item=>item.id===data.id?data:item))
      setEditingTemplate(null);setBlueprint(null)
      setNotice('Đã lưu bố cục mới. Tất cả nghệ sĩ đang sử dụng form kế thừa bản cập nhật; ảnh/chữ riêng vẫn giữ nguyên.')
    }catch(e){setError('Không lưu được bố cục: '+e.message)}
    finally{setWorking(false)}
  }
  async function createTemplate(){
    const name=createName.trim()
    if(name.length<3){setError('Tên form phải có ít nhất 3 ký tự.');return}
    const base=templates.find(t=>t.id===createFrom)||templates[0]
    if(!base){setError('Không có form gốc để kế thừa.');return}
    setWorking(true);setError('');setNotice('')
    try{
      const slug='custom-'+crypto.randomUUID().slice(0,10)
      const {data,error:e}=await supabase.from('artist_website_templates')
        .insert({slug,name,description:'Form riêng được tạo từ '+base.name,
          blueprint:normalizeBlueprint(base.blueprint),created_by:user.id,status:'active'})
        .select().single()
      if(e)throw e
      setTemplates(list=>[data,...list]);setCreateName('')
      setNotice('Đã tạo form "'+name+'". Bạn có thể tùy chỉnh bố cục và gán cho nhiều nghệ sĩ.')
    }catch(e){setError('Không tạo được form: '+e.message)}
    finally{setWorking(false)}
  }
  if(loading)return <main className="pt-manager"><p role="status">Đang tải các form Portfolio...</p></main>
  if(selected&&artist&&template){
    return <main className="pt-manager">
      <PortfolioInstanceEditor key={selected.id} supabase={supabase} user={user}
        template={template} instance={selected} profile={artist}
        onBack={()=>setSelection(null)} onSaved={record=>
          setInstances(list=>list.map(item=>item.id===record.id?record:item))}/>
    </main>
  }
  return <main className="pt-manager">
    <header className="pt-manager__header">
      <div><span className="pt-overline">DORTIS / SHARED DESIGN SYSTEM</span>
        <h1>Thư viện mẫu Portfolio<span>.</span></h1>
        <p>Nhập PDF ở Hồ sơ nghệ sĩ, xác nhận chữ theo từng trang. Gán hồ sơ vào bất kỳ mẫu nào: bố cục 3D dùng chung, nội dung luôn đến từ hồ sơ đó, ảnh do bạn tự tải lên.</p></div>
      <div><span className="pt-status">{templates.length} FORM · {instances.length} LƯỢT SỬ DỤNG</span>
        <button type="button" className="pt-btn pt-btn--light" onClick={onArtistList}>Hồ sơ nghệ sĩ ↗</button></div>
    </header>
    {desired&&<div className="pt-manager__focus">Đang chọn mẫu cho <strong>{desired.name}</strong>.
      Bạn có thể tạo mẫu từ bố cục có sẵn hoặc chọn hồ sơ này trên một mẫu để gán.</div>}
    {error&&<p className="pt-alert" role="alert">{error}</p>}
    {notice&&<p className="pt-note" role="status">{notice}</p>}
    {editingTemplate&&blueprint?
      <section className="pt-blueprint">
        <div className="pt-blueprint__header">
          <div><span className="pt-overline">FORM BLUEPRINT · INHERITED DESIGN</span>
            <h2>Chỉnh bố cục: {templates.find(t=>t.id===editingTemplate)?.name}</h2>
            <p>Form chung được kế thừa bởi mọi nghệ sĩ. Luxury Motion dùng MỘT hệ lụa đỏ vàng chạy xuyên suốt Portfolio: các nhánh vắt chéo màn hình, cắt nhau và chuyển động độc lập. Lụa không lặp lại tại đầu mỗi khu vực; ảnh tự vào các ô riêng, không chồng nhau. Chỉnh mẫu dùng chung sẽ áp dụng cho các nghệ sĩ đang kế thừa, nhưng chữ và ảnh của họ vẫn độc lập.</p>
          </div>
          <div className="pt-action-row">
            <button type="button" className="pt-btn pt-btn--light"
              onClick={()=>{setEditingTemplate(null);setBlueprint(null)}}>← Quay về chọn mẫu Portfolio</button>
            <button type="button" className="pt-btn" onClick={saveTemplate} disabled={working}>Lưu form gốc</button>
          </div>
        </div>
        <div className="pt-blueprint__themes">
          <label className="pt-blueprint__style">Phong cách chữ
            <select value={blueprint.style}
              onChange={e=>setBlueprint(v=>({...v,style:e.target.value}))}>
              <option value="editorial">Editorial Story</option>
              <option value="cinematic">Cinematic Stage</option>
              <option value="minimal">Minimal Signature</option>
            </select>
          </label>
          <label className="pt-blueprint__style">Chủ đề nền xuyên suốt mọi trang
            <select value={blueprint.visualTheme||'ribbon-luxury'}
              onChange={e=>setBlueprint(v=>({...v,visualTheme:e.target.value}))}>
              {FORM_VISUAL_THEMES.map(item=><option value={item.id} key={item.id}>
                {item.label}
              </option>)}
            </select>
          </label>
          <label className="pt-blueprint__style">Kiểu dải lụa
            <select aria-label="Kiểu dải lụa của Form" value={blueprint.ribbonLayout}
              onChange={e=>setBlueprint(v=>({...v,
                ...normalizeRibbonChoice(e.target.value)}))}>
              {FORM_RIBBON_LAYOUTS.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          <label className="pt-blueprint__style">Hướng dải lụa
            <select aria-label="Hướng dải lụa của Form" value={blueprint.ribbonDirection}
              onChange={e=>setBlueprint(v=>({...v,ribbonDirection:e.target.value}))}>
              {ribbonDirectionOptions(blueprint.ribbonLayout).map(item=>
                <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
        </div>
        <p className="pt-blueprint__visual-note">
          Kiểu và hướng lụa được áp dụng cho một dòng lụa liền mạch từ đầu đến cuối Form,
          không lặp lại ở mỗi trang. Các nhánh chuyển động độc lập, cắt chéo chiều ngang;
          ảnh nghệ sĩ giữ nguyên từng ô Grid độc lập và không bị làm mờ.
          Bố cục chữ và ảnh chỉnh tay của nghệ sĩ vẫn là lớp tùy chỉnh độc lập.
        </p>
        <div className="pt-blueprint__sections">
          {blueprint.sections.map((section,i)=><div key={section.id} className="pt-blueprint__row">
            <span className="pt-blueprint__number">{String(i+1).padStart(2,'0')}</span>
            <label>Tên khu vực<input value={section.label}
              onChange={e=>updateSection(i,'label',e.target.value)}/></label>
            <label>Bố cục<select value={section.layout}
              onChange={e=>updateSection(i,'layout',e.target.value)}>
              {FORM_LAYOUTS.map(layout=><option key={layout} value={layout}>{layout}</option>)}
            </select></label>
            <label>Hiệu ứng hình & chữ<select value={section.effect||'auto'}
              onChange={e=>updateSection(i,'effect',e.target.value)}>
              {FORM_EFFECTS.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
            </select></label>
            <label>Vị trí ảnh<select value={section.slots}
              onChange={e=>updateSection(i,'slots',Number(e.target.value))}>
              {Array.from({length:11},(_,n)=><option key={n} value={n}>{n}</option>)}
            </select></label>
            <div className="pt-blueprint__moves">
              <button type="button" disabled={i===0} onClick={()=>moveSection(i,-1)}>↑</button>
              <button type="button" disabled={i===blueprint.sections.length-1}
                onClick={()=>moveSection(i,1)}>↓</button>
            </div>
          </div>)}
        </div>
        <button type="button" className="pt-btn pt-btn--light" onClick={appendSection}
          disabled={blueprint.sections.length>=24}>+ Thêm khu vực vào form</button>
      </section>:
    <>
      <section className="pt-create">
        <div><span className="pt-overline">EXTEND / REUSABLE FORM</span>
          <h2>Tạo mẫu Portfolio từ mẫu có sẵn</h2>
          <p>Chọn mẫu có sẵn để sao chép bố cục. Sau khi tạo, bạn có thể gán mẫu mới cho nhiều hồ sơ nghệ sĩ.</p></div>
        <div className="pt-create__fields">
          <input type="text" value={createName} onChange={e=>setCreateName(e.target.value)}
            placeholder="Tên form mới, ví dụ: Nghệ sĩ Acoustic"/>
          <select aria-label="Mẫu Portfolio làm nền" value={createFrom||templates[0]?.id||''}
            onChange={e=>setCreateFrom(e.target.value)}>
            {templates.map(t=><option key={t.id} value={t.id}>Kế thừa từ {t.name}</option>)}
          </select>
          <button type="button" className="pt-btn" disabled={working||!templates.length}
            onClick={createTemplate}>Tạo form mới</button>
        </div>
      </section>
      <section className="pt-catalog">
        <div className="pt-catalog__heading"><h2>Các form có thể tái sử dụng</h2>
          <p>Mỗi mẫu có thể dùng cho nhiều nghệ sĩ. Chọn từng hồ sơ để gán hoặc mở bản chỉnh sửa riêng.</p></div>
        <div className="pt-catalog__grid">{groups.map(group=>{
          const chosen=choice[group.id]||''
          const person=group.people.find(item=>item.artist.id===chosen)
          return <article key={group.id} className="pt-template">
            <div className={'pt-template__visual pt-template__visual--'+(group.blueprint?.style||'editorial')}>
              <span>{group.name}</span>
              <div className="pt-template__skeleton"><i/><i/><i/></div>
              <small>FORM / {group.slug.toUpperCase()}</small>
            </div>
            <div className="pt-template__body">
              <div className="pt-template__title"><h3>{group.name}</h3>
                <span>v{group.version}</span></div>
              <p>{group.description}</p>
              <div className="pt-template__stats"><span>{normalizeBlueprint(group.blueprint).sections.length} khu vực</span>
                <span>{group.people.length} nghệ sĩ sử dụng</span><span>3D / layered visuals</span></div>
              <div className="pt-template__ribbon-choice">
                <label>Kiểu dải lụa
                  <select aria-label={'Kiểu dải lụa '+group.name}
                    value={normalizeBlueprint(group.blueprint).ribbonLayout}
                    disabled={working}
                    onChange={e=>updateRibbonChoice(group,{ribbonLayout:e.target.value})}>
                    {FORM_RIBBON_LAYOUTS.map(item=>
                      <option key={item.id} value={item.id}>{item.label}</option>)}
                  </select>
                </label>
                <label>Hướng dải lụa
                  <select aria-label={'Hướng dải lụa '+group.name}
                    value={normalizeBlueprint(group.blueprint).ribbonDirection}
                    disabled={working}
                    onChange={e=>updateRibbonChoice(group,{ribbonDirection:e.target.value})}>
                    {ribbonDirectionOptions(normalizeBlueprint(group.blueprint).ribbonLayout)
                      .map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
                  </select>
                </label>
              </div>
              <button type="button" className="pt-btn pt-btn--light pt-template__edit"
                onClick={()=>openTemplateEdit(group)}>Chỉnh bố cục form gốc</button>
              <div className="pt-template__assign">
                {profiles.length?<><label>Nghệ sĩ
                    <select value={chosen} disabled={working}
                      onChange={e=>setChoice(previous=>({...previous,[group.id]:e.target.value}))}>
                      <option value="">Chọn một nghệ sĩ</option>
                      {profiles.map(p=><option value={p.id} key={p.id}>
                        {p.name}{group.people.some(item=>item.artist.id===p.id)?' · Đã gán':''}
                      </option>)}
                    </select></label>
                    <button type="button" className="pt-btn" disabled={working||!chosen}
                      onClick={()=>person?setSelection(person.instance.id):assign(group)}>
                      {person?'Mở chỉnh sửa':'Gán mẫu'}
                    </button>
                    {person&&<button type="button" className="pt-btn pt-btn--light"
                      disabled={working} onClick={()=>detach(group,person)}>Gỡ khỏi mẫu</button>}</>:
                  <span className="pt-template__empty">Chưa có hồ sơ nghệ sĩ.</span>}
              </div>
            </div>
          </article>
        })}</div>
      </section>
      <p className="pt-manager__disclaimer">
        Tài liệu DORTIS Design Reference v2 hướng dẫn phương pháp thiết kế; mọi palette hiện tại chỉ là gợi ý nội bộ.
        Không tự áp nhận diện cho nghệ sĩ khác. Ảnh và nội dung chỉ tồn tại trong bản nháp Admin.
      </p>
    </>}
  </main>
}
