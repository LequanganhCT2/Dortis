import React from 'react'
import {resolveInstance} from './model'

/** Shared, data-driven website renderer. Admin preview uses identical markup for
 * every form; the only differences are the template blueprint and artist data.
 * No PDF images are ever extracted or auto-imported.
 */
export default function PortfolioTemplateSite({template,instance,profile,urls={},device='desktop'}){
  const view=resolveInstance(template,instance,profile)
  return <div className={'pt-device pt-device--'+device}>
    <main className={'pt-site pt-site--'+view.style} aria-label={'Xem trước '+view.templateName}>
      <header className="pt-site__nav">
        <strong>{view.artistName||'ARTIST NAME'}<span>.</span></strong>
        <nav aria-label="Điều hướng Portfolio">
          {view.sections.slice(0,4).map(s=><a key={s.id} href={'#pt-'+s.id}>{s.label}</a>)}
        </nav>
        <span className="pt-site__nav-meta">PORTFOLIO / PREVIEW</span>
      </header>
      {view.sections.map((section,index)=><section key={section.id}
        id={'pt-'+section.id} className={'pt-site__section pt-layout--'+section.layout+
          (index===0?' is-first':'')}>
        <div className="pt-site__copy">
          <small>{String(index+1).padStart(2,'0')} / {section.eyebrow||section.label}</small>
          <h2>{section.title||<span className="pt-site__placeholder-text">Tiêu đề chưa nhập</span>}</h2>
          {section.body?<p>{section.body}</p>:
            <p className="pt-site__placeholder-text">Chưa có nội dung. Nhập chữ riêng cho nghệ sĩ này trong thanh chỉnh sửa.</p>}
        </div>
        {section.slots>0&&<div className="pt-site__media">
          {section.images.map((asset,i)=>{
            const url=asset?.path?urls[asset.path]:null
            return <div key={section.id+':'+i}
              className={'pt-site__media-tile'+(!url?' is-empty':'')}>
              {url?<img src={url} alt={asset?.alt||section.label+' '+(i+1)}
                decoding="async" loading={index===0?'eager':'lazy'}/>:
                <div className="pt-site__empty-image">
                  <span>+</span><small>ẢNH {String(i+1).padStart(2,'0')}</small>
                  <em>Tải ảnh trong Admin</em>
                </div>}
            </div>
          })}
        </div>}
      </section>)}
      <footer className="pt-site__footer">
        <span>{view.artistName||'ARTIST'} / PORTFOLIO</span>
        <small>Chỉ là bản nháp nội bộ · Không có thông tin booking chưa xác nhận</small>
      </footer>
    </main>
  </div>
}
