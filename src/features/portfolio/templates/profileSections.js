import {normalizeBlueprint} from './model.js'

/** Explicit source order, independent of artist names and heading keywords. */
export function importProfileSections(template,profile,content={}){
  if(content.studioPending)throw new Error('Hãy lưu hoặc hủy bản nháp Studio trước khi nạp hồ sơ.')
  const sources=Array.isArray(profile?.sections)?profile.sections:[]
  if(!sources.length)throw new Error('Hồ sơ chưa có phần nội dung. Hãy nhập và lưu hồ sơ trước.')
  if(sources.length>24)throw new Error('Mẫu hỗ trợ tối đa 24 phần. Hãy gộp các phần trong hồ sơ trước khi nạp.')
  const layouts=normalizeBlueprint(template?.blueprint||{}).sections
  if(!layouts.length)throw new Error('Mẫu chưa có bố cục phần nội dung.')
  const definitions=[],sections={...content.sections},used=new Set()
  sources.forEach((source,index)=>{
    const page=Number(source.page)||index+1
    if(used.has(page))throw new Error('Các phần hồ sơ cần có mã phần riêng biệt.')
    used.add(page)
    const id='profile-part-'+page
    const design=content.profileSections?.find(section=>section.id===id)||
      layouts[index]||layouts.find(x=>x.layout==='text')||layouts[layouts.length-1]
    definitions.push({...design,id,label:String(source.name||source.title||'Phần '+(index+1))})
    const previous=sections[id]||{}
    sections[id]={...previous,sourcePage:page,fieldOverrides:previous.fieldOverrides||{}}
  })
  const alreadyLinked=content.sourceMode==='profile-sections'
  return {...content,sourceMode:'profile-sections',profileSections:definitions,sections,
    extraSections:alreadyLinked?(content.extraSections||[]):[],
    ...(!alreadyLinked&&content.extraSections?.length
      ?{legacyExtraSections:content.extraSections}:{})}
}
