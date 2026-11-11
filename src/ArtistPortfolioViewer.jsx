import React, { useEffect, useState } from 'react'
import ArtistPortfolioSections from './ArtistPortfolioSections'
import ArtistOriginalPages from './ArtistOriginalPages'
import {hasOriginalPages, defaultArtistDisplayMode} from './artistOriginalData'

/** Public view supports pixel-faithful original pages or editable editorial CSS. */
export default function ArtistPortfolioViewer({profile,sections}) {
  const originalAvailable=hasOriginalPages(sections)
  const defaultMode=defaultArtistDisplayMode(profile,sections)
  const [mode,setMode]=useState(defaultMode)
  useEffect(()=>setMode(defaultMode),[defaultMode,profile.id])
  return <div className="artist-portfolio-view">
    {originalAvailable&&<div className="artist-portfolio-modebar" role="group" aria-label="Chọn cách hiển thị portfolio">
      <span>CHẾ ĐỘ XEM</span>
      <button type="button" className={mode==='original'?'active':''}
        aria-pressed={mode==='original'} onClick={()=>setMode('original')}>
        Bản gốc PDF
      </button>
      <button type="button" className={mode==='editorial'?'active':''}
        aria-pressed={mode==='editorial'} onClick={()=>setMode('editorial')}>
        Thiết kế web
      </button>
    </div>}
    {mode==='original'&&originalAvailable
      ? <ArtistOriginalPages profile={profile} sections={sections}/>
      : <ArtistPortfolioSections profile={profile} sections={sections}/>}
  </div>
}
