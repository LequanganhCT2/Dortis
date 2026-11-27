import React,{useEffect,useRef,useState} from 'react'
import {resolveStudioLayout,studioLayout,safeStudioHref,isStudioText} from './studioModel.js'
import {studioTextPresentation,studioMotionAttributes} from './studioTextPresentation.js'
import DirectEditableText from './DirectEditableText'
import PhotoReveal from './PhotoReveal'
import PhotoMotion from './PhotoMotion'
import './studio.css'

function StudioLayer({item,section,sectionId,device,urls,studio,scene,typography,useClassic,continuousSilk}){
  const v=resolveStudioLayout(item[device],item.kind,device)
  const ref=useRef(null),drag=useRef(null)
  const [preview,setPreview]=useState(null)
  const [inline,setInline]=useState(false)
  const editing=Boolean(studio),selected=studio?.selection?.sectionId===sectionId&&studio?.selection?.id===item.id
  useEffect(()=>{if(!selected||!editing)setInline(false)},[selected,editing])
  function start(e,resize=''){
    if(!editing||e.button!==0||inline)return
    e.stopPropagation();studio.select(sectionId,item.id)
    if(v.locked)return
    if(!resize&&e.detail>1)return
    const box=ref.current.parentElement.getBoundingClientRect()
    drag.current={pointer:e.pointerId,x:e.clientX,y:e.clientY,box,resize,base:v,next:null}
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function move(e){
    const d=drag.current
    if(!d||d.pointer!==e.pointerId)return
    const dx=(e.clientX-d.x)*100/Math.max(1,d.box.width),dy=(e.clientY-d.y)*100/Math.max(1,d.box.height)
    if(Math.abs(dx)+Math.abs(dy)<.2&&!d.next)return
    let patch
    if(d.resize){
      const west=d.resize.includes('w'),north=d.resize.includes('n'),east=d.resize.includes('e'),south=d.resize.includes('s')
      const rawW=d.base.w+(west?-dx:east?dx:0),rawH=d.base.h+(north?-dy:south?dy:0)
      const w=Math.max(4,Math.min(180,rawW)),h=Math.max(3,Math.min(180,e.shiftKey&&(west||east)?d.base.h*w/d.base.w:rawH))
      patch={w,h,x:west?d.base.x+d.base.w-w:d.base.x,y:north?d.base.y+d.base.h-h:d.base.y}
    }else{
      const snap=n=>e.altKey?n:Math.round(n*2)/2
      patch={x:snap(d.base.x+dx),y:snap(d.base.y+dy)}
    }
    const next=studioLayout({...d.base,...patch},item.kind,device)
    d.next=d.resize?{x:next.x,y:next.y,w:next.w,h:next.h}:{x:next.x,y:next.y}
    setPreview(d.next)
  }
  function finish(e,commit=true){
    const d=drag.current
    if(!d||d.pointer!==e.pointerId)return
    drag.current=null;setPreview(null)
    if(commit&&d.next)studio.patch(sectionId,item.id,d.next)
  }
  if(v.hidden&&!editing)return null
  const p={...v,...preview},src=urls[item.path]
  const text=item.text||''
  const isText=isStudioText(item.kind)
  const presentation=isText?studioTextPresentation({v,kind:item.kind,section,device,scene,typography,continuousSilk}):null
  const TextTag=item.kind==='title'?'h2':'p'
  const copyClass=scene?'pt-studio-scene-copy':useClassic?'pt-site__copy':'pt-ribbon__copy'
  return <div ref={ref} className={'pt-studio-layer'+(editing?' is-editable':'')+(selected?' is-selected':'')+(v.hidden?' is-hidden':'')}
    style={{left:p.x+'%',top:p.y+'%',width:p.w+'%',height:p.h+'%',zIndex:p.z,
      transform:'rotate('+p.rotation+'deg)',opacity:(v.hidden ? .25 : 1)*v.opacity/100}}
    onPointerDown={editing?start:undefined} onPointerMove={move}
    onPointerUp={finish} onPointerCancel={e=>finish(e,false)} onLostPointerCapture={e=>finish(e,false)}
    onDoubleClick={editing&&['title','text','body','button'].includes(item.kind)&&!v.locked?e=>{e.stopPropagation();setInline(true)}:undefined}>
    <div className={'pt-studio-layer__visual'+(isText?' is-text':'')}
      {...(!isText&&item.kind==='shape'?{'data-pt-scroll-reveal':'body',...studioMotionAttributes(v)}:{})}
      style={{filter:v.blur?'blur('+v.blur+'px)':undefined,
        background:v.fill?v.background:'transparent',border:v.border+'px solid '+v.borderColor,borderRadius:v.radius+'px',
        boxShadow:v.shadow?'0 6px '+v.shadow+'px #0004':undefined}}>
      {isText?<div className={'pt-studio-copy '+copyClass} data-pt-authored-color={scene&&presentation.authoredColor?'true':undefined}
        style={scene?{'--pt-direct-text-color':presentation.style['--pt-direct-text-color']}:undefined}>
        <TextTag className={scene?'pt-artboard__text':undefined}
          data-studio-text-id={item.id} data-portfolio-text-frame={presentation.role}
          data-pt-scroll-reveal={presentation.role}
          data-pt-authored-font-size={presentation.authoredSize?'true':undefined}
          data-pt-authored-color={presentation.authoredColor?'true':undefined}
          {...presentation.attrs} style={presentation.style}>
          {item.kind==='button'&&!editing&&safeStudioHref(item.href)?<a href={safeStudioHref(item.href)}>{text}</a>:
            <DirectEditableText text={text} active={inline&&editing} kind={presentation.role}
              mode={presentation.mode} maxCharacters={presentation.mode==='letters'?300:1600}
              onChange={value=>studio?.patch(sectionId,item.id,{text:value})} onFinish={()=>setInline(false)}/>}
        </TextTag>
      </div>:item.kind==='image'?<PhotoReveal {...studioMotionAttributes(v)}>
        {src?<PhotoMotion asset={{...(section?.images?.find(a=>a?.path)||{}),...(v.photoMotion&&v.photoMotion!=='inherit'?{motion:v.photoMotion}:{}),...(v.photoIntensity!=null?{motionIntensity:v.photoIntensity}:{}),...(v.photoPointer!=null?{motionPointer:v.photoPointer}:{})}} paused={editing}><img src={src} alt={item.alt||''} draggable={false} style={{objectFit:v.fit}}/></PhotoMotion>:editing?<span>Chưa có ảnh</span>:null}
      </PhotoReveal>:null}
    </div>
    {selected&&!v.locked&&['nw','n','ne','e','se','s','sw','w'].map(dir=><button key={dir} className={'pt-studio-layer__resize handle-'+dir} type="button" aria-label={'Thay đổi kích thước '+dir} onPointerDown={e=>start(e,dir)}/>)}
  </div>
}
export default function StudioLayers({items,section,sectionId,device,urls,studio,scene,typography,useClassic,continuousSilk}){
  if(!items?.length)return null
  return <div className="pt-studio-layer-plane">{items.map(item=><StudioLayer key={item.id} {...{item,section,sectionId,device,urls,studio,scene,typography,useClassic,continuousSilk}}/>)}</div>
}
