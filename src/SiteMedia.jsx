import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import './site-media.css'

const MediaOpacityContext=createContext({})
export function MediaOpacityProvider({opacities={},children}){
  return <MediaOpacityContext.Provider value={opacities}>{children}</MediaOpacityContext.Provider>
}

/** Existing primary image first, then additional images in the admin-defined order. */
export function getMediaUrls(primary = {}, gallery = {}, slot) {
  const result = []
  const seen = new Set()
  const add = url => {
    if (typeof url !== 'string' || !url.startsWith('https://') || seen.has(url)) return
    seen.add(url)
    result.push(url)
  }
  add(primary?.[slot])
  for (const item of gallery?.[slot] || []) add(typeof item === 'string' ? item : item.image_url)
  return result
}

/** CSS crossfade; no canvas and no full-page reload. */
export function RotatingImage({ urls = [], className = '', alt = '', interval = 5800, offset = 0, loading = 'lazy', onIndexChange = null, imageZoom = 100 }) {
  const validUrls = useMemo(() => [...new Set(urls.filter(url => typeof url === 'string' && url.startsWith('https://')))], [urls])
  const [step, setStep] = useState(0)
  const opacityByUrl=useContext(MediaOpacityContext)
  const holder = useRef(null)
  const onIndexChangeRef=useRef(onIndexChange)
  useEffect(()=>{onIndexChangeRef.current=onIndexChange},[onIndexChange])
  const [visible,setVisible] = useState(false)
  const [pageVisible,setPageVisible] = useState(true)
  useEffect(()=>{
    if(typeof window==='undefined')return
    const node=holder.current
    if(!node)return
    const onVisibility=()=>setPageVisible(document.visibilityState==='visible')
    onVisibility()
    document.addEventListener('visibilitychange',onVisibility)
    if(!('IntersectionObserver' in window))setVisible(true)
    else{
      const observer=new IntersectionObserver(entries=>setVisible(entries.some(x=>x.isIntersecting)),{rootMargin:'160px'})
      observer.observe(node)
      return ()=>{document.removeEventListener('visibilitychange',onVisibility);observer.disconnect()}
    }
    return ()=>document.removeEventListener('visibilitychange',onVisibility)
  },[])
  useEffect(() => {
    if (validUrls.length < 2 || !visible || !pageVisible || typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => setStep(prev => (prev + 1) % validUrls.length), interval)
    return () => window.clearInterval(timer)
  }, [validUrls.length, interval, visible, pageVisible])
  const active = validUrls.length ? (step + offset) % validUrls.length : 0
  useEffect(()=>{onIndexChangeRef.current?.(active)},[active])
  if (!validUrls.length) return null
  const prev = (active - 1 + validUrls.length) % validUrls.length
  const savedOpacity=opacityByUrl[validUrls[active]]
  const mediaStyle={
    ...(Number.isFinite(savedOpacity)?{opacity:Math.min(100,Math.max(0,savedOpacity))/100}:{}),
    '--dortis-image-zoom':Math.min(2.5,Math.max(.5,Number(imageZoom)/100||1))
  }
  return <span ref={holder} className={'dortis-rotating-media ' + className}
    style={mediaStyle} aria-hidden={!alt}>
    {validUrls.length > 1 && <img className="dortis-media-layer dormant" src={validUrls[prev]} alt="" loading="lazy" decoding="async" />}
    <img key={validUrls[active]} className="dortis-media-layer current" src={validUrls[active]} alt={alt} loading={loading} decoding="async" />
  </span>
}
