import {getScene,patchSceneNote} from './sectionDesign.js'
import {setSectionField} from './model.js'

const SECTION_TEXT_FIELDS=new Set(['title','eyebrow','body'])
export function isEditablePortfolioText(layerId){
  return SECTION_TEXT_FIELDS.has(layerId)||/^note:[a-f0-9-]{8,45}$/i.test(layerId||'')
}
export function getPublishedText(publication,sectionId,device,layerId){
  if(!isEditablePortfolioText(layerId))return ''
  const section=publication?.view?.sections?.find(item=>item.id===sectionId)
  if(!section)return ''
  if(SECTION_TEXT_FIELDS.has(layerId))return String(section[layerId]||'')
  const scene=getScene(publication,section,device)
  return String(scene?.notes?.find(item=>'note:'+item.id===layerId)?.text||'')
}
/**
 * Edit an artist portfolio field while preserving its PDF source mapping.
 * Drafts store fieldOverrides[field]=true; the published snapshot also needs
 * view.sections updated because its public renderer reads that projection.
 * Every field is independent from the other fields / section / device settings.
 */
export function patchPublishedText(document,section,device,layerId,value){
  if(!document||!section||!isEditablePortfolioText(layerId)||
    typeof value!=='string')return document
  if(layerId.startsWith('note:')){
    const noteId=layerId.slice(5)
    if(!getScene(document,section,device)?.notes.some(note=>note.id===noteId))
      return document
    return patchSceneNote(document,section,device,noteId,value.slice(0,280))
  }
  const text=value.slice(0,10000)
  const updated=setSectionField(document,section.id,layerId,text)
  if(!document.view?.sections)return updated
  return {...updated,view:{...document.view,sections:document.view.sections.map(current=>
    current.id===section.id?{...current,[layerId]:text}:current)}}
}
