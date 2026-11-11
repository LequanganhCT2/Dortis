import React, { useEffect, useState } from 'react'
import './artist-original.css'
import { getOriginalPageUrl } from './artistOriginalData'

export default function ArtistOriginalPages({profile,sections}) {
  const [layout,setLayout]=useState('continuous')
  const [zoomPage,setZoomPage]=useState(-1)
  const pages=(Array.isArray(sections)?sections:[]).map((section,index)=>({
    url:getOriginalPageUrl(section),
    index,
    title:section.title||('Trang '+(index+1)),
    width:Number(section.original_page_width)||null,
    height:Number(section.original_page_height)||null
  }))
  useEffect(()=>{
    if(zoomPage<0)return
    const keydown=event=>{
      if(event.key==='Escape')setZoomPage(-1)
      if(event.key==='ArrowRight')setZoomPage(current=>Math.min(pages.length-1,current+1))
      if(event.key==='ArrowLeft')setZoomPage(current=>Math.max(0,current-1))
    }
    document.addEventListener('keydown',keydown)
    return ()=>document.removeEventListener('keydown',keydown)
  },[pages.length,zoomPage])
  return <main className="artist-pdf-original">
    <header className="artist-original-heading">
      <div>
        <p>✳ DORTIS / ORIGINAL ARTIST PORTFOLIO</p>
        <h1>{profile.name}<span>.</span></h1>
        <span>{profile.role} <i aria-hidden="true">/</i> {pages.length} trang</span>
      </div>
      <div className="artist-original-layout-switch" role="group" aria-label="Cách xem portfolio">
        <button type="button" className={layout==='continuous'?'active':''} aria-pressed={layout==='continuous'}
          onClick={()=>setLayout('continuous')}>Cuộn liền mạch</button>
        <button type="button" className={layout==='separate'?'active':''} aria-pressed={layout==='separate'}
          onClick={()=>setLayout('separate')}>Từng trang</button>
      </div>
    </header>
    <div className={'artist-original-stack '+(layout==='continuous'?'is-continuous':'is-separate')}>
      {pages.map(page=><section id={'portfolio-page-'+(page.index+1)} className="artist-original-page" key={page.index}
        aria-label={'Trang '+(page.index+1)+' trong portfolio '+profile.name}>
        {layout==='separate'&&<div className="artist-original-page-label">
          <span>PAGE {String(page.index+1).padStart(2,'0')} / {String(pages.length).padStart(2,'0')}</span>
          <span>DORTIS · {profile.name}</span>
        </div>}
        <button type="button" className="artist-original-page-image"
          onClick={()=>setZoomPage(page.index)} aria-label={'Phóng to trang '+(page.index+1)}
          style={page.width&&page.height?{aspectRatio:page.width+'/'+page.height}:undefined}>
          {page.url?<img src={page.url} alt={'Nguyên bản trang '+(page.index+1)+' – '+profile.name}
            width={page.width||undefined} height={page.height||undefined}
            decoding="async" loading={page.index<2?'eager':'lazy'}/>:
            <span className="artist-original-missing">Trang {page.index+1} chưa có ảnh được xuất bản.</span>}
        </button>
      </section>)}
    </div>
    <footer className="artist-original-footer">
      <div><span>DORTIS / ORIGINAL EDITION</span><p>Nhấn vào một trang để xem ở kích thước lớn hơn.</p></div>
      <a href="/#lien-he">KẾT NỐI HỢP TÁC ↗</a>
    </footer>
    {zoomPage>=0&&<div className="artist-original-lightbox"
      role="dialog" aria-modal="true" aria-label={'Xem chi tiết trang '+(zoomPage+1)}
      onClick={event=>{if(event.target===event.currentTarget)setZoomPage(-1)}}>
      <div className="artist-original-lightbox-toolbar">
        <strong>TRANG {String(zoomPage+1).padStart(2,'0')} / {String(pages.length).padStart(2,'0')}</strong>
        <div>
          <button type="button" disabled={zoomPage===0} onClick={()=>setZoomPage(x=>Math.max(0,x-1))}
            aria-label="Trang trước">←</button>
          <button type="button" disabled={zoomPage===pages.length-1} onClick={()=>setZoomPage(x=>Math.min(pages.length-1,x+1))}
            aria-label="Trang tiếp">→</button>
          <button type="button" className="artist-original-close" onClick={()=>setZoomPage(-1)}>ĐÓNG ×</button>
        </div>
      </div>
      <div className="artist-original-lightbox-scroll">
        <img src={pages[zoomPage].url} alt={'Trang '+(zoomPage+1)+' được phóng to'} />
      </div>
    </div>}
  </main>
}
