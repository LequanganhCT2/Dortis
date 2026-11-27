import {resolveInstance} from './model.js'
import {artistSourcePages,copySourceSection,hydrateInstanceFromArtist} from './sourceBinding.js'

const FIELDS=['title','eyebrow','body']
/** Admin preview reads the artist profile as the source of truth.
 * Only explicit per-instance fieldOverrides detach a field from that source.
 * The JSON stored in the instance still holds snapshots as a recoverable cache.
 */
export function resolveArtistPortfolio(template,instance,profile){
  // A newly assigned Form may have no saved page links yet. Project safe
  // links in memory so its real PDF titles appear immediately in previews.
  const linked=hydrateInstanceFromArtist(template,profile,instance?.content||{},true)
  const base=resolveInstance(template,{...instance,content:linked},profile)
  const sections=artistSourcePages(profile)
  const content=linked.sections||{}
  return {...base,sections:base.sections.map(section=>{
    const own=content[section.id]||{}
    if(!own.sourcePage)return {...section,sourceStatus:'unlinked',sourcePage:null}
    const original=sections.find(x=>x.page===Number(own.sourcePage))
    if(!original){
      const fields=Object.fromEntries(FIELDS.map(field=>[
        field,own.fieldOverrides?.[field]===true?String(own[field]||''):''
      ]))
      return {...section,...fields,sourcePage:Number(own.sourcePage),sourceStatus:'missing'}
    }
    const fresh=copySourceSection({sections:{}},'fresh',original).sections.fresh
    if(linked.sourceMode==='profile-sections')fresh.body=String(original.body||'')
    const fields=Object.fromEntries(FIELDS.map(field=>[
      field,own.fieldOverrides?.[field]===true?String(own[field]||''):String(fresh[field]||'')
    ]))
    return {...section,...fields,links:Array.isArray(original.links)?original.links:[],
      ...(linked.sourceMode==='profile-sections'?{label:String(original.name||original.title||section.label)}:{}),
      sourcePage:original.page,sourceStatus:'linked',
      fieldOverrides:own.fieldOverrides||{}}
  })}
}
export function sourceBoundField(profile,content,sectionId,field){
  const own=content?.sections?.[sectionId]||{}
  if(!own.sourcePage)return String(own[field]||'')
  if(own.fieldOverrides?.[field]===true)return String(own[field]||'')
  const page=artistSourcePages(profile).find(p=>p.page===Number(own.sourcePage))
  if(!page)return ''
  if(content.sourceMode==='profile-sections'&&field==='body')return String(page.body||'')
  return String(copySourceSection({sections:{}},'live',page).sections.live[field]||'')
}
export function restoreLinkedFields(content,sectionId,fields=FIELDS){
  const own=content.sections?.[sectionId]||{}
  if(!own.sourcePage)return content
  const newFlags={...(own.fieldOverrides||{})}
  fields.forEach(key=>{delete newFlags[key]})
  return {...content,sections:{...(content.sections||{}),
    [sectionId]:{...own,fieldOverrides:newFlags}
  }}
}
