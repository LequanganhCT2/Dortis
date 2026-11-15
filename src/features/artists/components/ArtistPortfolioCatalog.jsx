import React, { useMemo, useState } from 'react'
import {filterPortfolioRows,portfolioCounts} from '../domain/portfolioFilters'

/** All actual artist_profiles rows; never creates a synthetic Portfolio record. */
export default function ArtistPortfolioCatalog({profiles=[],selected,onSelect,disabled=false,loading=false}){
  const [query,setQuery]=useState('')
  const [filter,setFilter]=useState('all')
  const list=useMemo(()=>filterPortfolioRows(profiles,query,filter),[profiles,query,filter])
  const {total,published,drafts}=portfolioCounts(profiles)
  return <section className="artist-catalog" aria-label="Danh sách Portfolio trong hệ thống">
    <div className="artist-catalog__heading">
      <div><p className="artist-catalog__kicker">DORTIS / PORTFOLIO LIBRARY</p>
        <h2>Portfolio trong hệ thống <span>{total}</span></h2>
        <p>Các hồ sơ lấy trực tiếp từ dữ liệu đang lưu, gồm bản nháp và đã xuất bản.</p></div>
      <a href="/artists" target="_blank" rel="noreferrer">Xem trang công khai ↗</a>
    </div>
    <div className="artist-catalog__toolbar">
      <label className="artist-catalog__search">
        <span className="sr-only">Tìm kiếm Portfolio</span>
        <input type="search" value={query} onChange={event=>setQuery(event.target.value)}
          placeholder="Tìm tên nghệ sĩ, vai trò hoặc đường dẫn..." />
      </label>
      <div className="artist-catalog__filters" role="group" aria-label="Trạng thái Portfolio">
        <button className={filter==='all'?'active':''} type="button" aria-pressed={filter==='all'}
          onClick={()=>setFilter('all')}>Tất cả ({total})</button>
        <button className={filter==='published'?'active':''} type="button" aria-pressed={filter==='published'}
          onClick={()=>setFilter('published')}>Công khai ({published})</button>
        <button className={filter==='draft'?'active':''} type="button" aria-pressed={filter==='draft'}
          onClick={()=>setFilter('draft')}>Bản nháp ({drafts})</button>
      </div>
    </div>
    {loading?<div className="artist-catalog__empty" role="status">Đang tải danh sách Portfolio...</div>:
    list.length?<div className="artist-catalog__grid">
      {list.map(profile=>{
        const chosen=selected===profile.id
        const pageCount=Array.isArray(profile.sections)?profile.sections.length:0
        return <article key={profile.id}
          className={'artist-catalog__card'+(chosen?' is-selected':'')}>
          <button type="button" className="artist-catalog__select"
            disabled={disabled} onClick={()=>onSelect(profile)}
            aria-pressed={chosen} aria-label={'Chỉnh sửa hồ sơ '+profile.name}>
          <div className="artist-catalog__cover">
            {profile.cover_image_url?<img src={profile.cover_image_url}
              alt="" loading="lazy"/>:<span aria-hidden="true">DT</span>}
            <span className={'artist-catalog__status '+(profile.status==='published'?'is-public':'')}>
              {profile.status==='published'?'Đã xuất bản':'Bản nháp'}
            </span>
          </div>
          <div className="artist-catalog__meta">
            <small>{profile.role||'Hồ sơ nghệ sĩ'}</small>
            <strong>{profile.name}</strong>
            <p>{pageCount} trang · /artists/{profile.slug}</p>
            <span>{chosen?'Đang chỉnh sửa':'Xem và chỉnh sửa'} <span aria-hidden="true">↗</span></span>
          </div>
          </button>
          {profile.slug==='long-nhat'&&<a className="artist-catalog__website"
            href="/admin/portfolio" aria-label={'Xem website mẫu của '+profile.name}>
            <span>WEBSITE NGHỆ SĨ · XEM TRƯỚC</span>
            <strong>Xem website mẫu ↗</strong>
          </a>}
        </article>
      })}
    </div>:<div className="artist-catalog__empty">
      {total?'Không tìm thấy Portfolio phù hợp với bộ lọc.':'Chưa có Portfolio nào. Tải PDF để tạo hồ sơ mới.'}
    </div>}
  </section>
}
