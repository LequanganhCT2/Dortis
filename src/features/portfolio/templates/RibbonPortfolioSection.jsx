import React from 'react'
import PortfolioRibbonBackdrop from './PortfolioRibbonBackdrop'
import {ribbonGridColumns,ribbonVariant} from './ribbonLayout'

/**
 * Safe, non-overlapping layout for every shared Dortis form.
 * All original photos map to their own slots. No negative margins,
 * absolute photo positioning, auto-generated artist imagery or hidden tiles.
 */
export default function RibbonPortfolioSection({section,index=0,urls={},artistRole=''}){
  const tiles=(section.images||[]).map((asset,position)=>({
    asset,position,url:asset?.path?urls[asset.path]:null
  }))
  const columns=ribbonGridColumns(section.layout,tiles.length)
  const hasCopy=Boolean(section.title||section.eyebrow||section.body)
  const layout=tiles.length?'pt-ribbon-layout--'+section.layout:'pt-ribbon-layout--text'
  return <section id={'pt-'+section.id} aria-label={section.label}
    className={'pt-ribbon-section '+layout+
      ' pt-ribbon-effect--'+(section.effect||'auto')+
      (index===0?' is-first':'')}>
    <PortfolioRibbonBackdrop index={index} variant={ribbonVariant(section,index)}/>
    <div className="pt-ribbon__copy">
      <small>{String(index+1).padStart(2,'0')} / {section.eyebrow||
        (index===0&&artistRole?artistRole:section.label)}</small>
      {section.title?<h2>{section.title}</h2>:
        <h2 className="pt-ribbon__missing">Chưa có tiêu đề trong hồ sơ</h2>}
      {section.body?<p>{section.body}</p>:
        !hasCopy?<p className="pt-ribbon__missing">
          {section.sourceStatus==='missing'
            ?'Mục liên kết không còn trong Hồ sơ nghệ sĩ. Hãy chọn lại nguồn.'
            :'Chưa có nội dung từ Hồ sơ nghệ sĩ.'}
        </p>:null}
      {section.sourceStatus==='linked'&&<span className="pt-ribbon__source">
        Hồ sơ nghệ sĩ · Trang {String(section.sourcePage).padStart(2,'0')}
      </span>}
    </div>
    {tiles.length>0&&<div className={'pt-ribbon__media'+
        (tiles.length===1?' pt-ribbon__media--single':'')}
      style={{'--pt-ribbon-cols':columns}}
      aria-label={'Ảnh riêng khu vực '+section.label}>
      {tiles.map(({asset,position,url})=><div
        className={'pt-ribbon__tile'+(!url?' pt-ribbon__tile--empty':'')}
        key={section.id+':'+position}>
        {url?<img src={url}
          alt={asset?.alt||section.title||section.label}
          loading={index===0&&position===0?'eager':'lazy'}
          decoding="async"/>:
          <>
            <span aria-hidden="true">+</span>
            <small>ẢNH {String(position+1).padStart(2,'0')}
              <br/>Tải ảnh riêng trong Admin</small>
          </>}
      </div>)}
    </div>}
  </section>
}
