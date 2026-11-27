import {useEffect,useLayoutEffect,useRef,useState} from 'react'
import {snapshotImagePaths,withoutPending} from './studioModel.js'
const BUCKET='dortis-artist-web-drafts'
const EXT={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif'}

export default function useStudioSession({supabase,id,admin,publication,publishedAt,urls,setPublication,setPublishedAt,setUrls,setSaveState,setSaveNotice}){
  const session=useRef(null),timer=useRef(null),saving=useRef(null),busyRef=useRef(false)
  const user=useRef(admin);user.current=admin
  const [active,setActive]=useState(false),[busy,setBusy]=useState(false),[version,setVersion]=useState(0)
  const notify=(state,message)=>{setSaveState(state);setSaveNotice(message)}
  const valid=s=>session.current===s&&user.current?.id===s.owner
  function lock(value){busyRef.current=value;setBusy(value)}
  function clearTimer(){if(timer.current){clearTimeout(timer.current);timer.current=null}}
  function reset(restore=true){
    const s=session.current
    clearTimer();session.current=null;lock(false);setActive(false);setVersion(v=>v+1)
    if(restore&&s){setPublication(s.live);setUrls(s.liveUrls);setPublishedAt(s.basePublishedAt)}
  }
  useLayoutEffect(()=>{if(session.current&&session.current.owner!==admin?.id){reset();notify('','')}},[admin?.id])
  useEffect(()=>()=>{clearTimer();session.current=null},[])
  useEffect(()=>{
    if(!active)return
    const guard=e=>{const s=session.current;if(s&&(s.version!==s.savedVersion||busyRef.current)){e.preventDefault();e.returnValue=''}}
    window.addEventListener('beforeunload',guard);return()=>window.removeEventListener('beforeunload',guard)
  },[active])
  async function signed(paths,strict=true){
    if(!paths.length)return {}
    const {data,error}=await supabase.storage.from(BUCKET).createSignedUrls(paths,3600)
    if(error)throw error
    const result=Object.fromEntries((data||[]).filter(x=>x.signedUrl).map(x=>[x.path,x.signedUrl]))
    if(strict&&Object.keys(result).length!==paths.length)throw new Error('Một số ảnh chưa có quyền đọc hoặc không tồn tại.')
    return result
  }
  async function open(){
    if(session.current)return true
    if(!admin||busyRef.current||!supabase)return false
    const owner=admin.id;lock(true);notify('saving','Đang mở Studio…')
    try{
      const [a,b]=await Promise.all([
        supabase.from('artist_website_instances').select('id,revision,content,profile_id,template_id').eq('id',id).single(),
        supabase.from('artist_portfolio_publications').select('snapshot,published_at,image_paths').eq('instance_id',id).single()
      ])
      if(a.error)throw a.error;if(b.error)throw b.error
      const draft=a.data,live=b.data
      const pending=draft.content?.studioPending
      const base=withoutPending(draft.content)
      const matches=pending?.revision===draft.revision&&pending?.basePublishedAt===live.published_at&&pending?.snapshot?.view&&pending?.content
      if(pending&&!matches){
        if(!window.confirm('Bản nháp Studio cũ không còn khớp phiên bản. Bỏ bản nháp cũ để bắt đầu lại từ website hiện tại?')){notify('error','Bản nháp cũ được giữ nguyên.');return false}
      }
      const working=matches?{snapshot:pending.snapshot,content:pending.content}:{snapshot:live.snapshot,content:base}
      const liveUrls=await signed(Array.isArray(live.image_paths)?live.image_paths:[],false)
      const draftUrls=await signed(snapshotImagePaths(working.snapshot),false)
      if(user.current?.id!==owner)return false
      session.current={owner,revision:draft.revision,base,basePublishedAt:live.published_at,
        live:live.snapshot,liveUrls,profileId:draft.profile_id,templateId:draft.template_id,
        working,hasPending:Boolean(pending),version:0,savedVersion:0,past:[],future:[]}
      setPublication(working.snapshot);setPublishedAt(live.published_at);setUrls({...liveUrls,...draftUrls});setActive(true);setVersion(v=>v+1)
      notify('saved',matches?'Đã khôi phục bản nháp Studio.':'Studio sẵn sàng. Website công khai chưa thay đổi.')
      return true
    }catch(e){notify('error','Không mở được Studio: '+e.message);return false}
    finally{lock(false)}
  }
  function schedule(){
    clearTimer();timer.current=setTimeout(()=>{timer.current=null;void flush()},450)
  }
  function commit(fn,internal=false){
    const s=session.current
    if(!s||!valid(s)||(busyRef.current&&!internal))return false
    const next=fn(s.working)
    if(!next||next===s.working)return false
    s.past=[...s.past.slice(-49),s.working];s.future=[];s.working=next;s.version++
    setPublication(next.snapshot);setVersion(v=>v+1);notify('saving','Đang lưu bản nháp…');schedule();return true
  }
  function history(direction){
    const s=session.current
    if(!s||!valid(s)||busyRef.current)return
    const from=direction==='undo'?'past':'future',to=direction==='undo'?'future':'past'
    if(!s[from].length)return
    s[to].push(s.working);s.working=s[from].pop();s.version++
    setPublication(s.working.snapshot);setVersion(v=>v+1);notify('saving','Đang lưu bản nháp…');schedule()
  }
  async function flush(){
    clearTimer()
    const s=session.current
    if(!s||!valid(s)||s.version===s.savedVersion)return true
    if(saving.current)return saving.current
    if(busyRef.current){schedule();return false}
    const run=async()=>{
      const working=s.working,version=s.version,revision=s.revision
      try{
        const pending={snapshot:working.snapshot,content:withoutPending(working.content),basePublishedAt:s.basePublishedAt,revision:revision+1}
        const {data,error}=await supabase.from('artist_website_instances')
          .update({content:{...s.base,studioPending:pending},revision:revision+1,updated_by:s.owner,updated_at:new Date().toISOString()})
          .eq('id',id).eq('revision',revision).select('revision').maybeSingle()
        if(error)throw error;if(!data)throw new Error('Phiên chỉnh sửa khác đã thay đổi dữ liệu. Bản đang sửa vẫn còn trên màn hình.')
        s.revision=data.revision;s.savedVersion=version;s.hasPending=true
        if(valid(s))notify('saved',s.version===version?'Đã tự lưu bản nháp · Chưa xuất bản':'Đang lưu thay đổi mới…')
        return true
      }catch(e){if(valid(s))notify('error','Không lưu được bản nháp: '+e.message);return false}
    }
    const promise=run();saving.current=promise
    const ok=await promise
    if(saving.current===promise)saving.current=null
    if(ok&&valid(s)&&s.version!==s.savedVersion&&!busyRef.current)schedule()
    return ok
  }
  async function publish(){
    const s=session.current
    if(!s||!valid(s)||busyRef.current||!window.confirm('Xuất bản bản nháp Studio lên website công khai?'))return false
    lock(true);clearTimer();notify('saving','Đang xuất bản…')
    try{
      if(saving.current&&!await saving.current)throw new Error('Bản nháp chưa được lưu do xung đột phiên bản.')
      if(!valid(s))return false
      const {snapshot,content}=s.working
      const {data,error}=await supabase.rpc('publish_artist_portfolio',{p_instance_id:id,p_revision:s.revision,
        p_content:withoutPending(content),p_snapshot:snapshot,p_image_paths:snapshotImagePaths(snapshot)}).single()
      if(error)throw error
      if(!valid(s))return false
      // The RPC commits the draft and the public snapshot atomically under admin RLS.
      reset(false);setPublication(snapshot)
      setUrls(previous=>Object.fromEntries(Object.entries(previous).filter(([path])=>snapshotImagePaths(snapshot).includes(path))))
      if(data?.updated_at)setPublishedAt(data.updated_at)
      notify('saved','Đã xuất bản website công khai.');return true
    }catch(e){if(valid(s))notify('error','Không xuất bản được: '+e.message);return false}
    finally{lock(false)}
  }
  async function discard(){
    const s=session.current
    if(!s||!valid(s)||busyRef.current||!window.confirm('Hủy toàn bộ bản nháp Studio chưa xuất bản?'))return false
    lock(true);clearTimer()
    try{
      if(saving.current&&!await saving.current)throw new Error('Có xung đột phiên bản. Tải lại trang để kiểm tra bản nháp.')
      if(!valid(s))return false
      if(s.hasPending){
        const {data,error}=await supabase.from('artist_website_instances').update({content:s.base,revision:s.revision+1,updated_by:s.owner,updated_at:new Date().toISOString()})
          .eq('id',id).eq('revision',s.revision).select('revision').maybeSingle()
        if(error)throw error;if(!data)throw new Error('Bản nháp đã thay đổi ở phiên khác.')
      }
      if(valid(s)){reset();notify('saved','Đã hủy bản nháp. Website công khai không thay đổi.');return true}
      return false
    }catch(e){if(valid(s))notify('error','Không hủy được: '+e.message);return false}
    finally{lock(false)}
  }
  async function upload(sectionId,files,onReady){
    const s=session.current
    if(!s||!valid(s)||busyRef.current)return
    lock(true);notify('saving','Đang tải ảnh…')
    try{
      for(const file of files){
        if(!EXT[file.type]||file.size===0||file.size>25*1024*1024)throw new Error('Chỉ nhận JPG, PNG, WebP, AVIF từ 1 byte đến 25 MB.')
        const path=s.profileId+'/'+s.templateId+'/'+sectionId+'/studio-'+crypto.randomUUID()+'.'+EXT[file.type]
        const {error}=await supabase.storage.from(BUCKET).upload(path,file,{contentType:file.type,cacheControl:'3600',upsert:false})
        if(error)throw error
        const nextUrls=await signed([path])
        if(!valid(s))return
        setUrls(u=>({...u,...nextUrls}))
        onReady(path,file.name)
      }
      notify('saving','Đã tải ảnh · Đang lưu bản nháp…')
    }catch(e){if(valid(s))notify('error','Tải ảnh thất bại: '+e.message)}
    finally{lock(false);if(valid(s)&&s.version!==s.savedVersion)schedule()}
  }
  return {active,busy,busyRef,session,version,open,commit,history,flush,publish,discard,upload,
    canUndo:Boolean(session.current?.past.length),canRedo:Boolean(session.current?.future.length)}
}
