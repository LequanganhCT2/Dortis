import {normalizePortfolioPalette,paletteOptionsForTheme} from './portfolioPalette.js'
import {normalizeRevealSpeed} from './blockRevealState.js'

/** Reusable layout only. Artist names, claims, images, and booking live on instances.
 * Suggested neutral tokens are PROPOSED, never an artist's approved identity.
 */
/** Two independent new Forms. Older blueprints are retained in DB as archived
 * references for existing published artist URLs; not selectable in Admin. */
export const PRESET_FORMS=Object.freeze([
  {slug:'silk-atelier',name:'Dortis Silk Atelier',
   description:'Portfolio nghệ thuật với một trường lụa đỏ-vàng chuyển động xuyên suốt, các quầng sáng trong suốt ở lớp trên cùng và ảnh theo từng khu vực.',
   style:'editorial',sections:[
    {id:'hero',label:'01 · Chân dung nghệ sĩ',layout:'cover',slots:1},
    {id:'story',label:'02 · Câu chuyện nghệ thuật',layout:'split-reverse',slots:1},
    {id:'journey',label:'03 · Hành trình & dấu ấn',layout:'split',slots:1},
    {id:'skills',label:'04 · Thế mạnh / Phong cách',layout:'text',slots:0},
    {id:'achievements',label:'05 · Thành tựu',layout:'grid',slots:3},
    {id:'performance',label:'06 · Khoảnh khắc biểu diễn',layout:'mosaic',slots:4},
    {id:'gallery',label:'07 · Thư viện nghệ thuật',layout:'grid',slots:6},
    {id:'contact',label:'08 · Liên hệ & Booking',layout:'text',slots:0}
  ]},
  {slug:'silk-flow',name:'Dortis Silk Flow',
   description:'Template 02: lụa xanh trong suốt nhiều lớp bay trên nền trắng, kế thừa đầy đủ 8 khu vực và công cụ chỉnh sửa của Silk Atelier.',
   style:'editorial',visualTheme:'silk-flow',colorPalette:'ice-blue',
   sections:[
    {id:'hero',label:'01 · Chân dung nghệ sĩ',layout:'cover',slots:1},
    {id:'story',label:'02 · Câu chuyện nghệ thuật',layout:'split-reverse',slots:1},
    {id:'journey',label:'03 · Hành trình & dấu ấn',layout:'split',slots:1},
    {id:'skills',label:'04 · Thế mạnh / Phong cách',layout:'text',slots:0},
    {id:'achievements',label:'05 · Thành tựu',layout:'grid',slots:3},
    {id:'performance',label:'06 · Khoảnh khắc biểu diễn',layout:'mosaic',slots:4},
    {id:'gallery',label:'07 · Thư viện nghệ thuật',layout:'grid',slots:6},
    {id:'contact',label:'08 · Liên hệ & Booking',layout:'text',slots:0}
  ]}
])
export const FORM_LAYOUTS=['split','split-reverse','cover','grid','mosaic','wide','text']
export const FORM_RIBBON_LAYOUTS=Object.freeze([
  {id:'vertical',label:'Lụa dọc',description:'Dải lụa buông mềm theo chiều dọc'},
  {id:'diagonal',label:'Lụa chéo',description:'Dải lụa chảy theo đường chéo'},
  {id:'horizontal',label:'Lụa sóng ngang',description:'Dải lụa trải mềm theo phương ngang'},
  {id:'curtain',label:'Lụa hai bên',description:'Hai dải lụa đối xứng như sân khấu'}
])
export const FORM_RIBBON_DIRECTIONS=Object.freeze({
  vertical:[{id:'right',label:'Bên phải'},{id:'left',label:'Bên trái'}],
  diagonal:[{id:'down-right',label:'Trái trên → Phải dưới'},{id:'down-left',label:'Phải trên → Trái dưới'},
    {id:'up-right',label:'Trái dưới → Phải trên'},{id:'up-left',label:'Phải dưới → Trái trên'}],
  horizontal:[{id:'to-right',label:'Trái → Phải'},{id:'to-left',label:'Phải → Trái'}],
  curtain:[{id:'inward',label:'Hướng vào giữa'},{id:'outward',label:'Hướng ra hai bên'}]
})
export function ribbonDirectionOptions(layout){
  return FORM_RIBBON_DIRECTIONS[layout]||FORM_RIBBON_DIRECTIONS.vertical
}
export function normalizeRibbonChoice(layout,direction){
  const selectedLayout=FORM_RIBBON_LAYOUTS.some(item=>item.id===layout)?layout:'vertical'
  const options=ribbonDirectionOptions(selectedLayout)
  return {ribbonLayout:selectedLayout,
    ribbonDirection:options.some(item=>item.id===direction)?direction:options[0].id}
}
export const FORM_VISUAL_THEMES=[
  {id:'ribbon-luxury',label:'Dải lụa đỏ vàng · Luxury Motion'},
  {id:'classic',label:'Bố cục hiệu ứng cũ · Classic'},
  {id:'silk-flow',label:'Lụa xanh trong suốt · Silk Flow'}
]
export const FORM_EFFECTS=[
  {id:'auto',label:'Tự động theo khu vực'},
  {id:'ribbon',label:'Sân khấu dải lụa'},
  {id:'depth',label:'Ảnh nổi 3D + nền mờ'},
  {id:'overlap',label:'Chữ đè ảnh'},
  {id:'spotlight',label:'Spotlight sân khấu'},
  {id:'glass',label:'Chữ kính mờ trên ảnh'},
  {id:'orbit',label:'Ảnh xếp lớp / chiều sâu'},
  {id:'typography',label:'Chữ khổng lồ + ảnh'}
]
export const FORM_EFFECT_IDS=FORM_EFFECTS.map(item=>item.id)
export function blueprintFor(preset){
  return {style:preset.style,colorPalette:preset.colorPalette||'red-gold',visualTheme:preset.visualTheme||'ribbon-luxury',ribbonLayout:'diagonal',ribbonDirection:'down-right',glowOpacity:preset.visualTheme==='silk-flow'?0.12:0.28,
    sections:preset.sections.map(s=>({...s})),
    source:'DORTIS_DESIGN_KNOWLEDGE_REFERENCE_v2',approval:'PROPOSED'}
}
export function normalizeBlueprint(input={}){
  const style=['editorial','cinematic','minimal'].includes(input.style)?input.style:'editorial'
  const colorPalette=normalizePortfolioPalette(input.colorPalette)
  const visualTheme=FORM_VISUAL_THEMES.some(t=>t.id===input.visualTheme)?
    input.visualTheme:'ribbon-luxury'
  const {ribbonLayout,ribbonDirection}=normalizeRibbonChoice(input.ribbonLayout,input.ribbonDirection)
  const glowValue=Number(input.glowOpacity)
  const glowOpacity=input.glowOpacity==null?0.28:
    Number.isFinite(glowValue)?Math.max(0,Math.min(.55,glowValue)):0.28
  const ids=new Set()
  const sections=(Array.isArray(input.sections)?input.sections:[])
    .filter(x=>{
      if(!x||typeof x.id!=='string'||!/^[a-z0-9_-]{1,40}$/.test(x.id)||ids.has(x.id))return false
      ids.add(x.id)
      return true
    })
    .slice(0,24).map(x=>({
      id:x.id,label:String(x.label||'Khu vực').slice(0,80),
      layout:FORM_LAYOUTS.includes(x.layout)?x.layout:'split',
      effect:FORM_EFFECT_IDS.includes(x.effect)?x.effect:'auto',
      slots:Math.max(0,Math.min(10,Math.floor(Number(x.slots)||0)))
    }))
  return {style,visualTheme,colorPalette,ribbonLayout,ribbonDirection,glowOpacity,sections,source:'DORTIS_DESIGN_KNOWLEDGE_REFERENCE_v2',approval:'PROPOSED'}
}
/** Preserve distinct template identities even if a legacy form save stored
 * a palette/theme from the other Form. Does not mutate database objects.
 */
export function normalizeTemplateBlueprint(template){
  const blueprint=normalizeBlueprint(template?.blueprint||{})
  if(template?.slug!=='silk-flow')return blueprint
  const validFlowPalette=paletteOptionsForTheme('silk-flow')
    .some(p=>p.id===blueprint.colorPalette)
  return {...blueprint,visualTheme:'silk-flow',
    colorPalette:validFlowPalette?blueprint.colorPalette:'ice-blue'}
}
export function portfolioSections(template,content){
  const shared=normalizeBlueprint(template?.blueprint||{}).sections
  const sharedIds=new Set(shared.map(section=>section.id))
  const personal=normalizeBlueprint({sections:content?.extraSections}).sections
  return [...shared,...personal.filter(section=>!sharedIds.has(section.id))]
}
export const LUXURY_RIBBON='luxury-ribbon'
const validBackdrop=value=>value==='none'||value===LUXURY_RIBBON

export function resolveInstance(template,instance,profile){
  const blueprint=normalizeTemplateBlueprint(template)
  const content=instance?.content||{}
  const ownPalette=normalizePortfolioPalette(content.colorPalette||blueprint.colorPalette)
  const colorPalette=template?.slug==='silk-flow'&&
    !paletteOptionsForTheme('silk-flow').some(p=>p.id===ownPalette)?'ice-blue':ownPalette
  const artistName=String(profile?.name||'').trim()
  return {
    templateName:template?.name||'',templateVersion:template?.version||1,
    artistName,artistRole:String(profile?.role||''),
    style:blueprint.style,visualTheme:blueprint.visualTheme,
    colorPalette,
    revealSpeed:normalizeRevealSpeed(content.revealSpeed),
    ribbonLayout:blueprint.ribbonLayout,ribbonDirection:blueprint.ribbonDirection,
    glowOpacity:blueprint.glowOpacity,profileId:profile?.id,
    sections:portfolioSections(template,content).map(section=>{
      const own=content.sections?.[section.id]||{}
      const effect=content.effects?.[section.id]
      const localBackdrop=content.sectionBackdrops?.[section.id]
      const backdrop=validBackdrop(localBackdrop)?localBackdrop:content.defaultBackdrop
      return {...section,...(validBackdrop(backdrop)?{backdrop}:{}),effect:FORM_EFFECT_IDS.includes(effect)?effect:section.effect,
        title:typeof own.title==='string'?own.title:section.id==='hero'?artistName:'',
        eyebrow:String(own.eyebrow||''),
        body:String(own.body||''),
        images:Array.from({length:section.slots},(_,i)=>content.images?.[section.id+':'+i]||null)
      }
    })
  }
}
export function setSectionField(content={},id,field,value){
  if(!/^[a-z0-9_-]{1,40}$/.test(id)||!['title','eyebrow','body'].includes(field))
    throw new Error('Invalid field')
  const existing=content.sections?.[id]||{}
  return {...content,sections:{...(content.sections||{}),
    [id]:{...existing,[field]:String(value).slice(0,10000),
      fieldOverrides:{...(existing.fieldOverrides||{}),[field]:true}}}}
}
export function setSlotImage(content={},slot,image){
  if(!/^[a-z0-9_-]{1,40}:[0-9]{1,2}$/.test(slot))throw new Error('Invalid slot')
  return {...content,images:{...(content.images||{}),[slot]:image}}
}
export function templateAssignments(templates=[],instances=[],artists=[]){
  return templates.map(template=>({...template,people:instances
    .filter(i=>i.template_id===template.id)
    .map(i=>({instance:i,artist:artists.find(p=>p.id===i.profile_id)||null}))
    .filter(x=>x.artist)}))
}
