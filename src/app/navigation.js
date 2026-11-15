/** Single client-side navigation contract for public and admin routes. */
export const NAVIGATION_EVENT = 'dortis:route-change'

export function internalUrl(href,currentHref){
  try{
    const current=new URL(currentHref)
    const next=new URL(href,current)
    return next.origin===current.origin && (next.protocol==='https:'||next.protocol==='http:') ? next : null
  }catch{return null}
}
export function navigationPath(url){
  return url.pathname+url.search+url.hash
}
export function clientNavigate(href,{replace=false}={}){
  const target=internalUrl(href,window.location.href)
  if(!target){
    try{
      const url=new URL(href,window.location.href)
      if(url.protocol==='https:'||url.protocol==='http:')window.location.assign(url.href)
    }catch{}
    return false
  }
  const path=navigationPath(target)
  if(path===navigationPath(new URL(window.location.href)))return false
  window.history[replace?'replaceState':'pushState']({},'',path)
  window.dispatchEvent(new Event(NAVIGATION_EVENT))
  return true
}
export function isPlainInternalLink(event,anchor){
  if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||
    event.shiftKey||event.altKey||!anchor)return false
  if(anchor.hasAttribute('download')||anchor.hasAttribute('data-hard-navigation')||
    anchor.getAttribute('target')&&anchor.getAttribute('target')!=='_self')return false
  const href=anchor.getAttribute('href')
  if(!href||href.startsWith('javascript:'))return false
  return Boolean(internalUrl(href,window.location.href))
}
