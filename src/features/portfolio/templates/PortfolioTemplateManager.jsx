import React,{useCallback,useEffect,useMemo,useState} from 'react'
import {normalizeBlueprint,templateAssignments,FORM_LAYOUTS,FORM_EFFECTS,FORM_VISUAL_THEMES,FORM_RIBBON_LAYOUTS,
  ribbonDirectionOptions,normalizeRibbonChoice} from './model'
import PortfolioPalettePicker from './PortfolioPalettePicker'
import PortfolioInstanceEditor from './PortfolioInstanceEditor'
import {clientNavigate} from '../../../app/navigation'
import './template-admin.css'

/** Shared form => many artist instances. All data is protected by Admin RLS.
 * A template stores only layout. Its instances store independently edited text/photos.
 */
export default function PortfolioTemplateManager({supabase,user,initialArtistSlug='',initialInstanceId='',onArtistList}){
  const [templates,setTemplates]=useState([])
  const [profiles,setProfiles]=useState([])
  const [instances,setInstances]=useState([])
  const [loading,setLoading]=useState(true)
  const [working,setWorking]=useState(false)
  const [error,setError]=useState('')
  const [notice,setNotice]=useState('')
  const [selection,setSelection]=useState(null)
  const [linkedTemplate,setLinkedTemplate]=useState(null)
  const [choice,setChoice]=useState({})
  const [editingTemplate,setEditingTemplate]=useState(null)
  const [blueprint,setBlueprint]=useState(null)
  const load=useCallback(async()=>{
    const [t,i,p]=await Promise.all([
      supabase.from('artist_website_templates').select('*').eq('status','active').order('created_at',{ascending:true}),
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
  // Public portfolio edit links target this exact Admin editor by instance ID.
  // Archived templates are loaded only for the selected legacy publication;
  // they remain hidden from the active Form catalog.
  useEffect(()=>{
    if(!initialInstanceId||loading)return
    if(!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(initialInstanceId)){
      setError('Đường dẫn chỉnh sửa Portfolio không hợp lệ.')
      return
    }
    const record=instances.find(instance=>instance.id===initialInstanceId)
    if(!record){
      setError('Không tìm thấy Portfolio cần chỉnh sửa hoặc bạn không có quyền truy cập.')
      return
    }
    setSelection(record.id)
    if(templates.some(t=>t.id===record.template_id)||linkedTemplate?.id===record.template_id)return
    let active=true
    setError('')
    supabase.from('artist_website_templates').select('*')
      .eq('id',record.template_id).single().then(({data,error:readError})=>{
        if(!active)return
        if(readError||!data){
          setError('Không tải được Form gốc của Portfolio này: '+
            (readError?.message||'Không tìm thấy Form.'))
          return
        }
        setLinkedTemplate(data)
      }).catch(e=>{
        if(active)setError('Không mở được Form đã lưu trữ: '+e.message)
      })
    return ()=>{active=false}
  },[initialInstanceId,loading,instances,templates,linkedTemplate,supabase])
  const groups=useMemo(()=>templateAssignments(templates,instances,profiles),[templates,instances,profiles])
  const selected=instances.find(i=>i.id===selection)
  const artist=selected&&profiles.find(p=>p.id===selected.profile_id)
  const template=selected&&(templates.find(t=>t.id===selected.template_id)||
    (linkedTemplate?.id===selected.template_id?linkedTemplate:null))
  const desired=profiles.find(p=>p.slug===initialArtistSlug)
  function closeInstanceEditor(){
    setSelection(null)
    // Removing the deep-link prevents the editor reopening on subsequent
    // navigation or refresh, while keeping the Admin workspace mounted.
    if(new URLSearchParams(window.location.search).has('edit')){
      clientNavigate('/admin/templates',{replace:true})
    }
  }
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
  /** Save ribbon direction or palette directly on the catalog card.
   * Version comparison prevents a stale card from overwriting the shared Form.
   */
  async function updateTemplateChoice(form,patch){
    if(working)return
    const current=normalizeBlueprint(form.blueprint)
    const chosen=normalizeRibbonChoice(
      patch.ribbonLayout||current.ribbonLayout,
      patch.ribbonLayout?undefined:(patch.ribbonDirection||current.ribbonDirection)
    )
    const next=normalizeBlueprint({...current,...chosen,
      colorPalette:patch.colorPalette||current.colorPalette})
    if(current.ribbonLayout===next.ribbonLayout&&
       current.ribbonDirection===next.ribbonDirection&&
       current.colorPalette===next.colorPalette)return
    setWorking(true);setError('');setNotice('')
    try{
      const {data,error:e}=await supabase.from('artist_website_templates')
        .update({blueprint:next,version:form.version+1,
          updated_at:new Date().toISOString()})
        .eq('id',form.id).eq('version',form.version).select().maybeSingle()
      if(e)throw e
      if(!data)throw new Error('Form đã được cập nhật ở nơi khác. Hãy tải lại trước khi chọn.')
      setTemplates(list=>list.map(item=>item.id===data.id?data:item))
      setNotice((patch.colorPalette?'Đã lưu bảng màu ':'Đã lưu hướng dải lụa ')+
        'cho '+form.name+'. Các website đã xuất bản cần cập nhật lại.')
    }catch(e){setError('Không lưu được thiết kế Form: '+e.message)}
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
  if(loading)return <main className="pt-manager"><p role="status">Đang tải các form Portfolio...</p></main>
  if(selected&&artist&&template){
    return <main className="pt-manager">
      <PortfolioInstanceEditor key={selected.id} supabase={supabase} user={user}
        template={template} instance={selected} profile={artist}
        onBack={closeInstanceEditor} onSaved={record=>
          setInstances(list=>list.map(item=>item.id===record.id?record:item))}/>
    </main>
  }
  if(selected&&artist&&!template&&initialInstanceId)return <main className="pt-manager">
    <p role={error?'alert':'status'}>{error||'Đang tải Form gốc của Portfolio...'}</p>
    <button type="button" className="pt-btn pt-btn--light"
      onClick={closeInstanceEditor}>← Quay về thư viện mẫu</button>
  </main>
  return <main className="pt-manager">
    <header className="pt-manager__header">
      <div><span className="pt-overline">DORTIS / SHARED DESIGN SYSTEM</span>
        <h1>Dortis Silk Atelier<span>.</span></h1>
        <p>Một Form nghệ thuật duy nhất. Dải lụa đỏ-vàng vắt chéo xuyên suốt Portfolio;
          quầng sáng bán trong suốt nằm ở lớp trên cùng.
          Nội dung lấy từ Hồ sơ nghệ sĩ và ảnh được quản lý riêng theo từng khu vực.</p></div>
      <div><span className="pt-status">{templates.length} FORM · {groups.reduce((sum,group)=>sum+group.people.length,0)} HỒ SƠ ĐƯỢC GÁN</span>
        <button type="button" className="pt-btn pt-btn--light" onClick={onArtistList}>Hồ sơ nghệ sĩ ↗</button></div>
    </header>
    {desired&&<div className="pt-manager__focus">Đang chọn mẫu cho <strong>{desired.name}</strong>.
      Hãy chọn Form Silk Atelier bên dưới để gán hồ sơ nghệ sĩ này.</div>}
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
        <PortfolioPalettePicker
          heading="Bảng màu mặc định của Form"
          hint="Màu mới áp dụng cho Portfolio kế thừa Form này sau khi lưu Form và xuất bản website."
          value={blueprint.colorPalette||'red-gold'} disabled={working}
          onChange={palette=>setBlueprint(current=>({...current,colorPalette:palette}))}/>
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
        <div className="pt-blueprint__glow">
          <label htmlFor="pt-glow-opacity">Quầng sáng trên cùng · {Math.round((blueprint.glowOpacity??.28)*100)}%</label>
          <input id="pt-glow-opacity" type="range" min="0" max="55" step="1"
            value={Math.round((blueprint.glowOpacity??.28)*100)}
            onChange={event=>setBlueprint(value=>({...value,glowOpacity:Number(event.target.value)/100}))}/>
          <small>Hiệu ứng nằm phủ trên chữ và ảnh nhưng không cản thao tác.
            Có thể hạ độ đậm để giữ khả năng đọc.</small>
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
      <section className="pt-catalog">
        <div className="pt-catalog__heading"><h2>Form Silk Atelier</h2>
          <p>Một Form chung cho nhiều nghệ sĩ. Bạn có thể thay đổi bố cục và kiểu dải lụa ở Form gốc;
          ảnh, nội dung và thiết kế riêng của mỗi nghệ sĩ vẫn độc lập.</p></div>
        <div className="pt-catalog__grid">{groups.map(group=>{
          const chosen=choice[group.id]||''
          const person=group.people.find(item=>item.artist.id===chosen)
          return <article key={group.id} className="pt-template">
            <div className={'pt-template__visual pt-template__visual--'+(group.blueprint?.style||'editorial')+
              ' pt-template__visual--palette-'+normalizeBlueprint(group.blueprint).colorPalette}>
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
                    onChange={e=>updateTemplateChoice(group,{ribbonLayout:e.target.value})}>
                    {FORM_RIBBON_LAYOUTS.map(item=>
                      <option key={item.id} value={item.id}>{item.label}</option>)}
                  </select>
                </label>
                <label>Hướng dải lụa
                  <select aria-label={'Hướng dải lụa '+group.name}
                    value={normalizeBlueprint(group.blueprint).ribbonDirection}
                    disabled={working}
                    onChange={e=>updateTemplateChoice(group,{ribbonDirection:e.target.value})}>
                    {ribbonDirectionOptions(normalizeBlueprint(group.blueprint).ribbonLayout)
                      .map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
                  </select>
                </label>
              </div>
              <PortfolioPalettePicker
                heading="Bảng màu Form này"
                hint="Chọn màu tại đây để lưu vào Form. Website nghệ sĩ cần cập nhật để nhận màu mới."
                value={normalizeBlueprint(group.blueprint).colorPalette}
                disabled={working}
                onChange={palette=>updateTemplateChoice(group,{colorPalette:palette})}/>
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
