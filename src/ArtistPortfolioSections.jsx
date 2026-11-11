/**
 * Each original PDF page becomes an actual responsive HTML section with
 * separately cropped photographs and CSS text, never a full-page screenshot.
 */
import React from 'react'
import './artist-editorial.css'

function PortfolioMedia({ section, artist, index }) {
  const stored=(Array.isArray(section.media)?section.media:[]).filter(m=>m?.url)
  const items=stored.length?stored:
    (section.legacy_page_image_url&&Array.isArray(section.photos))?
      section.photos.map((region,i)=>({url:section.legacy_page_image_url,region,isLegacy:true,
        alt:'Ảnh nghệ sĩ '+artist.name+' · '+(i+1)})):[]

  if(!items.length)return <div className="a2-media-placeholder" aria-hidden="true">
    <span className="a2-placeholder-ornament">✳</span><span>{artist.name}</span>
  </div>
  return <div className={'a2-media-cluster a2-media-count-'+Math.min(items.length,4)}>
    {items.map((item,i)=><div className="a2-media-photo" key={item.path||item.url}>
      <img src={item.url} loading={index===0&&i===0?'eager':'lazy'}
        className={item.isLegacy?'a2-legacy-cropped-media':''}
        style={item.isLegacy?{
          width:(100/item.region.w)+'%',height:(100/item.region.h)+'%',
          maxWidth:'none',maxHeight:'none',
          left:(-100*item.region.x/item.region.w)+'%',
          top:(-100*item.region.y/item.region.h)+'%',
          position:'absolute',objectFit:'fill'
        }:undefined}
        alt={item.alt||'Hình ảnh '+artist.name+' – '+section.title+' '+(i+1)}/>
      <span aria-hidden="true">{String(i+1).padStart(2,'0')}</span>
    </div>)}
  </div>
}
function List({items,type='highlights'}){
  if(!Array.isArray(items)||!items.length)return null
  return <div className={'a2-points a2-points-'+type}>
    {items.map((item,i)=><div className="a2-point-item" key={i}>
      <span>{String(i+1).padStart(2,'0')}</span><strong>{item}</strong>
    </div>)}
  </div>
}
function Metrics({items}){
  if(!Array.isArray(items)||!items.length)return null
  return <div className="a2-metrics">{items.map(([number,label],i)=>
    <div className="a2-metric" key={i}><strong>{number}</strong><span>{label}</span></div>)}
  </div>
}
function Copy({section,artist,index}) {
  const layout=section.layout||'feature'
  return <div className="a2-section-copy">
    <div className="a2-meta"><span>{String(index+1).padStart(2,'0')}</span><span className="a2-meta-rule"/><span>{section.eyebrow||artist.role}</span></div>
    <h2 className="a2-title">{section.title||artist.name}</h2>
    {section.subtitle&&<p className="a2-subtitle">{section.subtitle}</p>}
    {section.body&&<div className={'a2-body'+(layout==='quote'?' is-quote':'')}>{section.body}</div>}
    <Metrics items={section.metrics}/>
    <List items={section.highlights} type={layout==='awards'?'timeline':'highlights'}/>
    {Array.isArray(section.links)&&section.links.length>0&&<div className="a2-platforms">
      {section.links.map((link,i)=><span key={i}>{link}</span>)}
    </div>}
    {layout==='contact'&&<a className="a2-contact-cta" href="/#lien-he">KẾT NỐI & HỢP TÁC <span aria-hidden="true">↗</span></a>}
  </div>
}

function EditorialSection({section,artist,index}){
  const layout=section.layout||'feature'
  const isCover=layout==='cover'
  const isGallery=layout==='gallery'
  return <section id={'artist-chapter-'+(index+1)}
    className={'a2-section a2-'+layout+' a2-section-'+index%2}
    aria-label={'Chương '+(index+1)+' – '+(section.title||artist.name)}>
    <div className="a2-section-backdrop" aria-hidden="true"><span/><span/><span/></div>
    <div className={'a2-section-inner'+(isGallery?' a2-gallery-inner':'')}>
      {isGallery?<><Copy section={section} artist={artist} index={index}/>
        <div className="a2-section-visual"><PortfolioMedia section={section} artist={artist} index={index}/></div></>:
      isCover?<><Copy section={section} artist={artist} index={index}/>
        <div className="a2-section-visual"><PortfolioMedia section={section} artist={artist} index={index}/></div></>:
      <><div className="a2-section-visual"><PortfolioMedia section={section} artist={artist} index={index}/></div>
        <Copy section={section} artist={artist} index={index}/></>}
    </div>
    <span className="a2-section-footer" aria-hidden="true">DORTIS / {artist.name.toUpperCase()} — {String(index+1).padStart(2,'0')}</span>
  </section>
}

export default function ArtistPortfolioSections({profile,sections}){
  const artist={
    ...profile,
    theme:['stage','pearl','rose'].includes(profile?.theme)?profile.theme:
      /long-nhat/.test(profile?.slug||'')?'stage':
      /la-trinh/.test(profile?.slug||'')?'rose':'pearl'
  }
  const prepared=Array.isArray(sections)?sections:[]
  return <main className={'a2-portfolio a2-theme-'+artist.theme}>
    <div className="a2-portfolio-topline">
      <span>ARTIST PORTFOLIO / DORTIS</span>
      <nav aria-label="Các chương của hồ sơ">
        {prepared.map((s,i)=><a key={i} href={'#artist-chapter-'+(i+1)} title={s.title||'Chương '+(i+1)}>
          {String(i+1).padStart(2,'0')}</a>)}
      </nav>
    </div>
    {prepared.map((section,index)=><EditorialSection section={section} artist={artist} index={index} key={section.page??index}/>)}
    <section className="a2-outro">
      <span>DORTIS / EVERY ARTIST HAS A STORY</span>
      <h2>Những câu chuyện<br/><em>xứng đáng được nhìn thấy.</em></h2>
      <a href="/#lien-he">HỢP TÁC CÙNG DORTIS ↗</a>
    </section>
  </main>
}

export { EditorialSection }
