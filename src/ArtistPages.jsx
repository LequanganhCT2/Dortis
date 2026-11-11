import React, { useEffect, useState } from 'react'
import { supabase } from './AdminPage'
import './artist-pages.css'
import ArtistPortfolioViewer from './ArtistPortfolioViewer'
import './artist-portfolio-view.css'
import { designArtistPdf, identifyArtistLayout } from './artistLayouts'

function ArtistBrand(){return <a className="artist-brand-link" href="/" aria-label="Dortis – về trang chủ">
  <span className="artist-brand-mark">DT</span><span>DORTIS<span className="artist-brand-dot">.</span></span>
</a>}
function ArtistFrame({children}){return <div className="artist-page">
  <header className="artist-page-header"><ArtistBrand/><nav aria-label="Điều hướng hồ sơ">
    <a href="/">TRANG CHỦ</a><a href="/artists">NGHỆ SĨ</a><a href="/#lien-he">HỢP TÁC ↗</a>
  </nav></header>{children}<footer className="artist-page-footer"><ArtistBrand/><span>ART · IDENTITY · EMOTION</span><a href="/#lien-he">KẾT NỐI DORTIS ↗</a></footer>
</div>}
function ProfileCard({profile,index}){return <a href={'/artists/'+encodeURIComponent(profile.slug)}
  className={'artist-index-card artist-index-card-'+index%3}>
  <div className="artist-index-visual">
    {profile.cover_image_url?<img src={profile.cover_image_url} alt="" loading="lazy"/>:
      <span className="artist-index-symbol">{profile.name.slice(0,2).toUpperCase()}</span>}
    <span className="artist-index-number">0{index+1} / ARTIST</span>
    <span className="artist-index-arrow" aria-hidden="true">↗</span>
  </div>
  <div className="artist-index-info"><span>{profile.role}</span><h2>{profile.name}</h2>
    <p>{profile.tagline||'Một hành trình nghệ thuật đang chờ được khám phá.'}</p></div>
</a>}
export default function ArtistPages(){
  const pathname=decodeURI(window.location.pathname).replace(/\/+$/,'')
  const slug=pathname.startsWith('/artists/')?pathname.slice('/artists/'.length):''
  const [profiles,setProfiles]=useState([])
  const [profile,setProfile]=useState(null)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  useEffect(()=>{
    let active=true
    async function load(){
      if(!supabase){setError('Chưa cấu hình kết nối dữ liệu.');setLoading(false);return}
      const query=slug?
        supabase.from('artist_profiles').select('id,slug,name,role,tagline,intro,sections,cover_image_url,render_mode').eq('slug',slug).eq('status','published').maybeSingle():
        supabase.from('artist_profiles').select('id,slug,name,role,tagline,cover_image_url').eq('status','published').order('updated_at',{ascending:false})
      const {data,error:e}=await query
      if(!active)return
      if(e)setError('Không thể tải danh sách nghệ sĩ.')
      else if(slug)setProfile(data||null)
      else setProfiles(data||[])
      setLoading(false)
    }
    load()
    return ()=>{active=false}
  },[slug])
  useEffect(()=>{document.title=profile?.name?'Dortis | '+profile.name:'Nghệ sĩ | Dortis'},[profile])
  return <ArtistFrame>
    {loading?<main className="artist-loading" role="status">Đang tải hồ sơ nghệ sĩ...</main>:
    error?<main className="artist-loading" role="alert">{error}</main>:
    slug?(!profile?<main className="artist-loading"><h1>Hồ sơ chưa công khai.</h1><p>Trang này chưa được xuất bản hoặc không tồn tại.</p><a href="/artists">← TẤT CẢ NGHỆ SĨ</a></main>:
      <ArtistPortfolioViewer profile={profile} sections={(()=> {
        const existing=Array.isArray(profile.sections)?profile.sections:[]
        if(!existing.length || existing[0]?.layout || !identifyArtistLayout(profile.slug))return existing
        const designed=designArtistPdf({name:profile.name,role:profile.role,
          page_count:existing.length,sections:existing},profile.slug)
        return designed.sections.map((section,i)=>({
          ...section,
          image_url:existing[i]?.image_url||null,
          image_storage_path:existing[i]?.image_storage_path||null,
          original_page_url:existing[i]?.original_page_url||null,
          legacy_page_image_url:existing[i]?.image_url||null
        }))
      })()}/>    ):
    <main className="artist-list-main">
      <section className="artist-list-header"><span className="artist-kicker">DORTIS / ARTIST STORIES</span>
        <h1>Những gương mặt.<br/><em>Những câu chuyện riêng.</em></h1>
        <p>Mỗi nghệ sĩ được giới thiệu bằng một không gian riêng, từ hồ sơ và hành trình đến những dấu ấn nghệ thuật.</p>
      </section>
      {profiles.length?<section className="artist-index-grid" aria-label="Hồ sơ nghệ sĩ">
        {profiles.map((item,i)=><ProfileCard key={item.id} profile={item} index={i}/>)}
      </section>:
      <section className="artist-list-empty"><strong>Những hồ sơ đang được chuẩn bị.</strong>
        <p>Hồ sơ nghệ sĩ sẽ xuất hiện sau khi được duyệt và xuất bản.</p>
        <a href="/#dich-vu">KHÁM PHÁ DỊCH VỤ ↗</a></section>}
    </main>}
  </ArtistFrame>
}
