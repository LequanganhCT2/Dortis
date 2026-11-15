/* Pure, defensive adapter from the existing artist_profiles data to a website
 * preview. It never fabricates artist claims, media or booking endpoints.
 * Sources remain IN_PORTFOLIO_UNVERIFIED until separately approved. */
export const LONG_NHAT_SLUG='long-nhat'
export const LONG_NHAT_TEMPLATE_STATUS='PROVISIONAL_NOT_APPROVED'
export const ARTIST_WEBSITE_SECTIONS=Object.freeze([
  {id:'home',label:'S01 / Hero'},
  {id:'about',label:'S02 / Giới thiệu'},
  {id:'performance',label:'S03 / Thế mạnh'},
  {id:'moments',label:'S04 / Dấu ấn'},
  {id:'video',label:'S05 / Video'},
  {id:'gallery',label:'S06 / Thư viện ảnh'},
  {id:'epk',label:'S07 / EPK'},
  {id:'booking',label:'S08 / Booking'}
])
export function safeMediaUrl(value){
  if(typeof value!=='string'||!value.trim())return null
  try{
    const url=new URL(value)
    return url.protocol==='https:'||url.protocol==='http:'?url.href:null
  }catch{return null}
}
export function extractSectionPhotos(section){
  if(!section)return []
  const photos=Array.isArray(section.media)?section.media:[]
  const candidatePhotos=photos.map(photo=>({
    src:safeMediaUrl(photo?.url||photo?.image_url),
    alt:typeof photo?.alt==='string'?photo.alt:'',
    caption:String(section.title||'').trim(),
    page:Number(section.page)||null
  }))
  if(section.image_url)candidatePhotos.push({
    src:safeMediaUrl(section.image_url),alt:'',caption:String(section.title||''),page:Number(section.page)||null
  })
  const seen=new Set()
  return candidatePhotos.filter(item=>{
    if(!item.src||seen.has(item.src))return false
    seen.add(item.src);return true
  })
}
export function websiteFromArtist(profile){
  if(!profile||!profile.id)return null
  const sections=Array.isArray(profile.sections)?[...profile.sections]:[]
  sections.sort((a,b)=>(Number(a?.page)||0)-(Number(b?.page)||0))
  const page=n=>sections.find(item=>Number(item?.page)===n)||null
  const allPhotos=sections.flatMap(extractSectionPhotos)
  const photos=[...new Map(allPhotos.map(item=>[item.src,item])).values()]
  const safeCover=safeMediaUrl(profile.cover_image_url)
  const heroPhoto=safeCover||extractSectionPhotos(page(1))[0]?.src||photos[0]?.src||null
  const bioText=String(profile.intro||page(2)?.body||'').trim()
  const performanceText=String(page(3)?.body||'').trim()
  const momentText=String(page(4)?.body||'').trim()
  const performances=[5,6,7].map(n=>page(n)).filter(Boolean).map((item,index)=>({
    id:String(item.page||index+5),title:String(item.title||''),
    subtitle:String(item.subtitle||''),photos:extractSectionPhotos(item)
  }))
  // Videos require an explicitly provided and validated official URL. Images
  // alone are not evidence of a video, even if their source page says "Video".
  const videos=sections.flatMap(section=>(Array.isArray(section.videos)?section.videos:[])
    .map(item=>({title:String(item?.title||''),url:safeMediaUrl(item?.url)}))
    .filter(item=>item.url))
  const mediaPhotos=[...extractSectionPhotos(page(8)),...photos]
    .filter((item,index,arr)=>arr.findIndex(entry=>entry.src===item.src)===index)
  return {
    id:profile.id,slug:profile.slug||LONG_NHAT_SLUG,
    name:String(profile.name||'').trim(),
    role:String(profile.role||'').trim(),
    tagline:String(profile.tagline||'').trim(),
    bio:bioText,performance:performanceText,momentsText:momentText,
    heroPhoto,heroAlt:photos.find(photo=>photo.src===heroPhoto)?.alt||'',
    photos:mediaPhotos,performances,videos,
    pageCount:sections.length,photoCount:photos.length,
    sourcePublication:profile.status||'draft',
    websitePublication:LONG_NHAT_TEMPLATE_STATUS,
    publicBookingApproved:false,booking:null,
    sourceReview:'IN_PORTFOLIO_UNVERIFIED'
  }
}
export function templateCanGoPublic(review={}){
  return Boolean(review.portfolioPagesAudited&&review.visualApproved&&review.claimsApproved&&
    review.mediaRightsApproved&&review.bookingApproved&&review.releaseApproved)
}
