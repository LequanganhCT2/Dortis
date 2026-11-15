import React,{useEffect,useRef} from 'react'
import {resolveArtistPortfolio} from './resolvedPortfolio'
import {chooseSectionEffect,sectionHasRealImage} from './visualEffects'
import {getScene} from './sectionDesign'
import SectionArtboard from './SectionArtboard'
import './portfolio-effects.css'

/** Preview and future renderer share exactly the same source-bound markup.
 * Visual effects never alter the stored profile text or the original images.
 */
function MotionSection({section,index,styleName,urls,artistRole}){
  const frame=useRef(0)
  const realAssets=(section.images||[]).filter(asset=>asset?.path&&urls[asset.path])
  const hasImage=sectionHasRealImage(section,urls)
  const effect=chooseSectionEffect({effect:section.effect,layout:section.layout,
    index,style:styleName,imageCount:realAssets.length})
  const firstImage=realAssets[0]&&urls[realAssets[0].path]
  useEffect(()=>()=>{if(frame.current)cancelAnimationFrame(frame.current)},[])
  function handleMove(event){
    if(event.pointerType==='touch'||!hasImage)return
    const element=event.currentTarget
    const bounds=element.getBoundingClientRect()
    if(!bounds.width||!bounds.height)return
    const x=(event.clientX-bounds.left)/bounds.width-.5
    const y=(event.clientY-bounds.top)/bounds.height-.5
    if(frame.current)cancelAnimationFrame(frame.current)
    frame.current=requestAnimationFrame(()=>{
      element.style.setProperty('--pt-rotate-x',(-y*5).toFixed(2)+'deg')
      element.style.setProperty('--pt-rotate-y',(x*7).toFixed(2)+'deg')
      element.style.setProperty('--pt-shift-x',(x*20).toFixed(1)+'px')
      element.style.setProperty('--pt-shift-y',(y*13).toFixed(1)+'px')
    })
  }
  function handleLeave(event){
    if(frame.current)cancelAnimationFrame(frame.current)
    frame.current=0
    const el=event.currentTarget
    for(const key of ['--pt-rotate-x','--pt-rotate-y','--pt-shift-x','--pt-shift-y'])el.style.removeProperty(key)
  }
  const textPresent=Boolean(section.title||section.body||section.eyebrow)
  return <section id={'pt-'+section.id}
    className={'pt-site__section pt-layout--'+section.layout+
      ' pt-fx-section pt-fx--'+effect+
      (hasImage?' pt-fx--has-photo':' pt-fx--waiting-photo')+
      (index===0?' is-first':'')}
    onPointerMove={handleMove} onPointerLeave={handleLeave}>
    {firstImage&&<div className="pt-fx__ambient" aria-hidden="true">
      <img src={firstImage} alt="" loading="lazy" decoding="async"/>
    </div>}
    <span className="pt-fx__index" aria-hidden="true">{String(index+1).padStart(2,'0')}</span>
    {section.title&&<span className="pt-fx__type-echo" aria-hidden="true">{section.title}</span>}
    <div className="pt-site__copy">
      <small>{String(index+1).padStart(2,'0')} / {section.eyebrow||
        (index===0&&artistRole?artistRole:section.label)}</small>
      {section.title?<h2>{section.title}</h2>:
        <h2 className="pt-site__placeholder-text">Chưa có tiêu đề trong hồ sơ</h2>}
      {section.body?<p>{section.body}</p>:
        <p className="pt-site__placeholder-text">
          {section.sourceStatus==='missing'
            ?'Mục liên kết không còn trong Hồ sơ nghệ sĩ. Hãy chọn lại nguồn.'
            :textPresent?'':'Chưa có nội dung từ Hồ sơ nghệ sĩ.'}
        </p>}
      {section.sourceStatus==='linked'&&<span className="pt-fx__source-note">
        Hồ sơ nghệ sĩ · Trang {String(section.sourcePage).padStart(2,'0')}
      </span>}
    </div>
    {section.slots>0&&<div className="pt-site__media" aria-label={'Ảnh khu vực '+section.label}>
      {section.images.map((asset,i)=>{
        const url=asset?.path?urls[asset.path]:null
        return <div key={section.id+':'+i}
          className={'pt-site__media-tile pt-fx__tile'+(!url?' is-empty':'')}>
          {url?<img src={url} alt={asset?.alt||section.title||section.label}
            loading={index===0&&i===0?'eager':'lazy'} decoding="async"/>:
            <div className="pt-site__empty-image">
              <span aria-hidden="true">+</span>
              <small>ẢNH {String(i+1).padStart(2,'0')}</small>
              <em>Tải ảnh riêng trong Admin</em>
            </div>}
        </div>
      })}
    </div>}
    <span className="pt-fx__detail" aria-hidden="true"/>
  </section>
}
export default function PortfolioTemplateSite({
  template,instance,profile,urls={},device='desktop',
  focusedSectionId='',editSectionId='',selectedLayer='',
  onSelectLayer,onPatchLayer
}){
  const view=resolveArtistPortfolio(template,instance,profile)
  const activeSections=view.sections.filter(s=>s.title||s.body||s.slots)
  const visibleSections=focusedSectionId?
    view.sections.filter(s=>s.id===focusedSectionId):view.sections
  return <div className={'pt-device pt-device--'+device+
    (focusedSectionId?' pt-device--focused':'')}>
    <main className={'pt-site pt-site--'+view.style} aria-label={'Xem trước '+view.templateName}>
      {!focusedSectionId&&<header className="pt-site__nav">
        <strong>{view.artistName||'Chưa có tên trong hồ sơ'}<span>.</span></strong>
        <nav aria-label="Điều hướng Portfolio">
          {activeSections.slice(0,4).map(s=><a key={s.id}
            href={'#pt-'+s.id}>{s.title?s.title.slice(0,27):s.label}</a>)}
        </nav>
        <span className="pt-site__nav-meta">{view.artistRole||'PORTFOLIO'}</span>
      </header>}
      {visibleSections.map((section,index)=>{
        const scene=getScene(instance?.content||{},section,device)
        return scene?<SectionArtboard key={section.id}
          section={section} scene={scene} device={device} urls={urls}
          editable={editSectionId===section.id}
          selectedLayer={selectedLayer}
          onSelectLayer={onSelectLayer} onPatchLayer={onPatchLayer}/>:
          <MotionSection key={section.id} section={section} index={index}
            styleName={view.style} urls={urls} artistRole={view.artistRole}/>
      })}
      {!focusedSectionId&&<footer className="pt-site__footer">
        <span>{view.artistName||'PORTFOLIO'}</span>
        <small>Hồ sơ nghệ sĩ / Bản xem trước nội bộ · Nội dung từ PDF đã xác nhận.</small>
      </footer>}
    </main>
  </div>
}
