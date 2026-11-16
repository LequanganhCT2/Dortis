import React,{useEffect,useState} from 'react'
import {supabase} from '../../../infrastructure/supabase/client'
import {canManageContent} from '../../../core/auth/roles'
import {clientNavigate} from '../../../app/navigation'
import PortfolioTemplateSite from './PortfolioTemplateSite'
import './template-admin.css'

const BUCKET='dortis-artist-web-drafts'

export default function PublishedPortfolio(){
  const id=window.location.pathname.split('/')[2]
  const [publication,setPublication]=useState(null)
  const [urls,setUrls]=useState({})
  const [admin,setAdmin]=useState(null)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [mobile,setMobile]=useState(()=>window.matchMedia('(max-width: 680px)').matches)

  useEffect(()=>{
    const media=window.matchMedia('(max-width: 680px)')
    const change=event=>setMobile(event.matches)
    media.addEventListener('change',change)
    return ()=>media.removeEventListener('change',change)
  },[])

  useEffect(()=>{
    if(!supabase)return
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>{
      const user=session?.user
      setAdmin(canManageContent(user)?user:null)
    })
    return ()=>subscription.unsubscribe()
  },[])

  useEffect(()=>{
    let active=true
    async function load(){
      setLoading(true);setError('')
      try{
        if(!supabase)throw new Error('Chưa cấu hình Supabase.')
        const {data,error:readError}=await supabase.from('artist_portfolio_publications')
          .select('snapshot,image_paths').eq('instance_id',id).maybeSingle()
        if(readError)throw readError
        if(!data)throw new Error('Website chưa được xuất bản hoặc đã được gỡ.')
        let images={}
        if(data.image_paths.length){
          const {data:signed,error:signError}=await supabase.storage.from(BUCKET)
            .createSignedUrls(data.image_paths,3600)
          if(signError)throw signError
          images=Object.fromEntries(signed.filter(image=>image.signedUrl)
            .map(image=>[image.path,image.signedUrl]))
        }
        if(active){
          setPublication(data.snapshot);setUrls(images)
          if(Object.keys(images).length!==data.image_paths.length)
            setError('Một số ảnh chưa tải được. Hãy tải lại trang.')
        }
      }catch(e){
        if(active){setPublication(null);setUrls({});setError(e.message)}
      }
      finally{if(active)setLoading(false)}
    }
    load()
    return ()=>{active=false}
  },[id])

  function editWebsite(){
    if(!admin)return
    // Reuse the authenticated Admin workspace/editor, never mount a second
    // editor instance inside the publicly visible portfolio route.
    clientNavigate('/admin/templates?edit='+encodeURIComponent(id))
  }

  return <div className="pt-published">
    {admin&&publication&&<div className="pt-published__toolbar">
      <button type="button" className="pt-btn" onClick={editWebsite}>
        Chỉnh sửa website
      </button>
    </div>}
    {error&&<p className="pt-alert" role="alert">{error}</p>}
    {loading&&<p role="status">Đang tải portfolio…</p>}
    {!loading&&publication&&<PortfolioTemplateSite publishedView={publication.view}
      instance={{content:{scenes:publication.scenes,positions:publication.positions,typography:publication.typography}}} urls={urls} device={mobile?'mobile':'desktop'}/>}
  </div>
}
