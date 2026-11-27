import {sceneFont,sceneLayerDefault} from './sectionDesign.js'
import {normalizeTextMotion,motionUnit,textMotionAttributes} from './textLayerMotion.js'
import {LUXURY_RIBBON} from './model.js'
import {studioTextRole,STUDIO_TEXT_KEYS} from './studioModel.js'

function ribbonTextColor(color){
  const channels=[1,3,5].map(offset=>{
    const srgb=parseInt(color.slice(offset,offset+2),16)/255
    return srgb<=.04045?srgb/12.92:((srgb+.055)/1.055)**2.4
  })
  return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722<.53?'#fff1e0':color
}
// Shared with original artboard layers; keep the scene's palette and scale.
export function sceneTextStyle(layer,role,section,device,continuousSilk){
  const authoredColor=layer.color!==sceneLayerDefault(role,section,device).color
  const ratio=device==='mobile'?390:1200
  return {
    color:section.backdrop===LUXURY_RIBBON||continuousSilk?ribbonTextColor(layer.color):layer.color,
    textAlign:layer.align,fontFamily:sceneFont(layer.font),
    fontWeight:layer.weight,lineHeight:layer.lineHeight,
    letterSpacing:layer.spacing+'px',whiteSpace:'pre-line',
    fontSize:'clamp(9px,'+(layer.size*100/ratio).toFixed(3)+'cqw,180px)',
    textShadow:role==='title'?'0 7px 22px #0a132837':'none',
    '--pt-direct-text-color':authoredColor?layer.color:undefined,
    filter:layer.blur?'blur('+layer.blur+'px)':'none',overflowWrap:'anywhere'
  }
}
export function studioTextMotion(v,sourceMotion){
  if(v.effect==='inherit')return sourceMotion
  if(v.effect==='auto')return undefined
  return normalizeTextMotion({effect:v.effect==='letters'?'rise':v.effect,
    unit:v.effect==='letters'?'letters':'auto',duration:v.duration*1000,delay:v.delay*1000})
}
export function studioMotionAttributes(v,sourceMotion){
  const motion=studioTextMotion(v,sourceMotion)
  return {...textMotionAttributes(motion),'data-pt-studio-reveal':'true',
    'data-pt-motion-reverse':String(v.reverse)}
}
export function studioTextPresentation({v,kind,section,device,scene,typography,continuousSilk=false}){
  const role=studioTextRole(kind),source=scene?.layers?.[role]||typography?.[role]||{}
  const motion=studioTextMotion(v,source.motion)
  const style=scene?sceneTextStyle(source,role,section,device,continuousSilk):{
    fontFamily:source.font?sceneFont(source.font):undefined,
    fontSize:Number.isFinite(source.size)?source.size+'px':undefined,
    fontWeight:source.weight,lineHeight:source.lineHeight,
    letterSpacing:Number.isFinite(source.spacing)?source.spacing+'px':undefined,
    textAlign:source.align,color:source.color,'--pt-direct-text-color':source.color,
    '--pt-direct-font-size':Number.isFinite(source.size)?source.size+'px':undefined
  }
  const overrides=v.textOverrides||{}
  const custom={size:'fontSize',font:'fontFamily',weight:'fontWeight',align:'textAlign',spacing:'letterSpacing',lineHeight:'lineHeight',color:'color'}
  for(const key of STUDIO_TEXT_KEYS){
    if(!overrides[key])continue
    const value=key==='size'?v.size+'px':key==='spacing'?v.spacing+'px':v[key]
    style[custom[key]]=value
    if(key==='size')style['--pt-direct-font-size']=value
    if(key==='color')style['--pt-direct-text-color']=value
  }
  const authoredColor=overrides.color||(!scene?Boolean(source.color):source.color!==sceneLayerDefault(role,section,device).color)
  return {role,style,authoredColor,authoredSize:Boolean(overrides.size||(!scene&&Number.isFinite(source.size))),
    mode:motionUnit(motion,role==='title'?'letters':'words'),
    attrs:studioMotionAttributes(v,source.motion)}
}
