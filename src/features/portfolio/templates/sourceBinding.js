import {normalizeBlueprint} from './model.js'

/** Reusable source mapping for any Portfolio. All texts originate from the
 * artist_profiles record. A mapping is a suggestion until Admin reviews it;
 * users can change the source page per section in the instance editor.
 */
const PURPOSES={
  hero:{types:['cover'],keys:['hero','trang bìa','cover','mở đầu']},
  story:{types:['biography'],keys:['tiểu sử','biography','câu chuyện','giới thiệu','story']},
  about:{types:['biography'],keys:['tiểu sử','biography','giới thiệu','about']},
  bio:{types:['biography'],keys:['tiểu sử','biography','giới thiệu','about']},
  skills:{types:['feature','list'],keys:['kỹ năng','chuyên môn','skills','năng lực','thế mạnh']},
  performance:{types:['feature'],keys:['biểu diễn','performance','thế mạnh','năng lực']},
  live:{types:['gallery','media'],keys:['live','biểu diễn','show','sân khấu','dự án']},
  highlights:{types:['stats','awards'],keys:['highlights','dấu ấn','thành tích','thành tựu']},
  moments:{types:['stats','awards','gallery'],keys:['khoảnh khắc','dấu ấn','moments','highlights']},
  gallery:{types:['gallery','media'],keys:['thư viện','hình ảnh','gallery','photo','tác phẩm']},
  portfolio:{types:['gallery','media'],keys:['portfolio','tác phẩm','dự án','gallery']},
  media:{types:['media','gallery'],keys:['media','video','ảnh','tư liệu']},
  press:{types:['awards','stats'],keys:['truyền thông','press','giải thưởng','thành tích']},
  contact:{types:['contact'],keys:['liên hệ','contact','booking']},
  booking:{types:['contact'],keys:['liên hệ','contact','booking']}
}
const norm=value=>String(value||'').trim().toLocaleLowerCase('vi-VN')
export function artistSourcePages(profile){
  return (Array.isArray(profile?.sections)?profile.sections:[])
    .map((section,index)=>({...section,page:Number(section.page)||index+1}))
    .sort((a,b)=>a.page-b.page)
}
const combineSourceText=section=>{
  const blocks=[String(section.body||'').trim()]
  if(Array.isArray(section.highlights)&&section.highlights.length)
    blocks.push(section.highlights.map(s=>'• '+String(s)).join('\n'))
  if(Array.isArray(section.metrics)&&section.metrics.length)
    blocks.push(section.metrics.filter(Array.isArray)
      .map(([value,label])=>String(value)+' · '+String(label)).join('\n'))
  return blocks.filter(Boolean).join('\n\n')
}
export function suggestSourceForLayout(section,sourcePages,used=new Set()){
  if(!sourcePages?.length)return null
  const concept=PURPOSES[section.id]||{
    types:[],keys:[section.label||'',section.id]
  }
  const available=sourcePages.filter(page=>!used.has(page.page))
  const tokens=concept.keys.map(norm).filter(Boolean)
  const exact=available.find(page=>
    tokens.some(token=>norm(page.title).includes(token))||
    concept.types.includes(page.layout))
  if(exact)return exact
  if(section.id==='hero')return available.find(page=>page.page===1)||available[0]||null
  // No arbitrary page must be used to invent an approved booking endpoint.
  if(['contact','booking'].includes(section.id))return null
  return available[0]||null
}
export function copySourceSection(content={},sectionId,source){
  if(!source)return content
  const existing=content.sections?.[sectionId]||{}
  return {...content,sections:{...(content.sections||{}),[sectionId]:{
    ...existing,title:String(source.title||''),eyebrow:String(source.eyebrow||''),
    body:combineSourceText(source),
    highlights:Array.isArray(source.highlights)?[...source.highlights]:[],
    metrics:Array.isArray(source.metrics)?source.metrics.map(x=>Array.isArray(x)?[...x]:x):[],
    sourcePage:Number(source.page)||null
  }}}
}
/** Hydrates only empty sections, preserves instance-specific images/text. */
export function hydrateInstanceFromArtist(template,profile,content={},onlyBlank=true){
  const blueprint=normalizeBlueprint(template?.blueprint||{})
  const sources=artistSourcePages(profile)
  let result={...content,sections:{...(content.sections||{})},images:{...(content.images||{})}}
  const used=new Set()
  for(const section of blueprint.sections){
    const existing=result.sections[section.id]
    if(onlyBlank&&existing&&(existing.title||existing.body)){
      if(existing.sourcePage)used.add(Number(existing.sourcePage))
      continue
    }
    const matched=suggestSourceForLayout(section,sources,used)
    if(!matched)continue
    result=copySourceSection(result,section.id,matched)
    used.add(matched.page)
  }
  return result
}
