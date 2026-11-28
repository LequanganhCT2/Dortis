import React,{useEffect,useRef,useState} from 'react'
import {getScene,sceneFont,automaticImageGeometry,SCENE_BACKGROUNDS} from '../templates/sectionDesign.js'
import {studioElements,resolveStudioLayout,isStudioText,safeStudioHref} from '../templates/studioModel.js'
import {normalizeTextMotion,textMotionFrames} from '../templates/textLayerMotion.js'
import {FORM_COLOR_PALETTES,SILK_FLOW_COLOR_PALETTES} from '../templates/portfolioPalette.js'
import {safeSourceLinks} from '../templates/PortfolioSourceLinks.jsx'
import './portfolio-v2.css'

function geometry(key,section,device){
  const mobile=device==='mobile', photos=(section.images||[]).filter(a=>a?.path).length
  if(key.startsWith('image:'))return automaticImageGeometry(Number(key.slice(6)),Math.max(section.images?.length||0,1),device)
  const w=mobile?86:photos?45:82
  return key==='eyebrow'?{x:7,y:mobile?6:13,w,h:6}:key==='title'?{x:7,y:mobile?13:24,w,h:24}:{x:7,y:mobile?(photos?73:41):55,w,h:35}
}
const pct=v=>Number(v||0)+'%'
function Layer({item,section,device,urls,content,scene,editor,paused}){
  const custom=Boolean(item.kind),key=item.id,kind=custom?item.kind:key.startsWith('image:')?'image':key==='title'?'title':key==='eyebrow'?'eyebrow':'body'
  const raw=custom?item[device]||{}:scene?.layers?.[key]||content.positions?.[section.id]?.[device]?.[key]||{}
  const type=custom?resolveStudioLayout(raw,kind,device):scene?.layers?.[key]||content.typography?.[section.id]?.[device]?.[key]||{}
  const abs=custom||Boolean(scene),base=geometry(key,section,device)
  const g=abs?{...base,...raw}:{...base,x:base.x+base.w*(raw.x||0)/100,y:base.y+base.h*(raw.y||0)/100,w:raw.widthPct??base.w*(raw.scaleX||1),h:base.h*(raw.scaleY||1)}
  if(custom)Object.assign(g,type)
  const ref=useRef(null),drag=useRef(null),[preview,setPreview]=useState(null),[inline,setInline]=useState(false)
  const active=custom?editor.studio?.selection?.sectionId===section.id&&editor.studio?.selection?.id===key:editor.publicSelection?.sectionId===section.id&&editor.publicSelection?.layerId===key
  const editing=custom?Boolean(editor.studio):Boolean(editor.onPublicSelect)
  const textEditing=custom?inline&&editing:editor.editingText?.sectionId===section.id&&editor.editingText?.layerId===key
  useEffect(()=>{if(!active||!editing)setInline(false)},[active,editing])
  const text=custom?item.text||'':item.text
  const asset=custom?item:item.asset
  const src=urls[asset?.path]
  const inherited=scene?.layers?.[kind==='title'?'title':'body']||content.typography?.[section.id]?.[device]?.[kind==='title'?'title':'body']||{}
  const authored=k=>!custom||type.textOverrides?.[k]
  const value=k=>authored(k)?type[k]:inherited[k]
  const motion=normalizeTextMotion(custom?type.motion||{...inherited.motion,effect:type.effect==='inherit'?inherited.motion?.effect:type.effect==='letters'?'rise':type.effect,duration:type.effect==='inherit'?inherited.motion?.duration:type.duration*1000,delay:type.delay*1000}:type.motion)
  const effect=motion.effect==='auto'?'rise':motion.effect
  useEffect(()=>{
    const el=ref.current?.querySelector('[data-dv2-visual]')
    if(!el||paused||effect==='none'||typeof IntersectionObserver==='undefined'||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return
    let animation,seen=false
    const observer=new IntersectionObserver(([entry])=>{
      animation?.cancel()
      if(entry.isIntersecting){seen=true;animation=el.animate?.(textMotionFrames(effect,motion.direction,motion.distance),{duration:motion.duration,delay:motion.delay,fill:'backwards',easing:'cubic-bezier(.22,1,.36,1)'})}
      else if(seen&&type.reverse!==false){animation=el.animate?.([...textMotionFrames(effect,motion.direction,motion.distance)].reverse(),{duration:motion.duration,fill:'none'})}
    },{threshold:0})
    observer.observe(el)
    return()=>{observer.disconnect();animation?.cancel()}
  },[paused,effect,motion.direction,motion.distance,motion.duration,motion.delay,type.reverse,editor.revealReplayKey])
  if((raw.hidden||type.hidden)&&!editing)return null
  if(kind==='image'&&!src&&!editing)return null
  if(!custom&&kind!=='image'&&!text&&!editing)return null
  function select(){if(custom)editor.studio?.select(section.id,key);else editor.onPublicSelect?.(section.id,key,ref.current)}
  function start(e,resize=false){
    if(!editing||e.button!==0||textEditing||type.locked||(!resize&&e.detail>1))return
    e.stopPropagation();select()
    const box=ref.current.parentElement.getBoundingClientRect()
    drag.current={id:e.pointerId,x:e.clientX,y:e.clientY,box,resize,next:null}
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function move(e){
    const d=drag.current;if(!d||d.id!==e.pointerId)return
    const dx=(e.clientX-d.x)*100/d.box.width,dy=(e.clientY-d.y)*100/d.box.height
    if(!d.next&&Math.abs(dx)+Math.abs(dy)<.3)return
    d.next=d.resize?{w:Math.max(8,g.w+dx),h:kind==='image'||kind==='shape'?Math.max(3,g.h+dy):g.h}:{x:g.x+dx,y:g.y+dy}
    setPreview(d.next)
  }
  function finish(e,commit){
    const d=drag.current;if(!d||d.id!==e.pointerId)return
    drag.current=null;setPreview(null)
    if(!commit||!d.next)return
    if(custom)editor.studio.patch(section.id,key,d.next)
    else if(abs)editor.onDirectPatchLayer?.(section.id,key,d.next)
    else editor.onDirectMoveElement?.(section.id,key,d.resize?(kind==='image'?{scaleX:d.next.w/base.w,scaleY:d.next.h/base.h}:{widthPct:d.next.w}):{x:(d.next.x-base.x)*100/base.w,y:(d.next.y-base.y)*100/base.h})
  }
  function begin(e){if(!editing||kind==='image'||kind==='shape'||type.locked)return;e.stopPropagation();select();if(custom)setInline(true);else editor.onDirectStartTextEdit?.(section.id,key,ref.current)}
  const p={...g,...preview},Tag=kind==='title'?'h2':kind==='eyebrow'?'small':'p'
  const font=value('font')
  const style={left:pct(p.x),top:pct(p.y),width:pct(p.w),height:kind==='image'||kind==='shape'?pct(p.h):undefined,zIndex:p.z??(kind==='image'?3:10),rotate:(raw.rotation||0)+'deg',opacity:(type.hidden?.25:1)*(raw.opacity??100)/100,fontFamily:font?(custom&&authored('font')?font:sceneFont(font)):undefined,fontSize:value('size')!=null?value('size')+'px':undefined,fontWeight:value('weight'),textAlign:value('align'),color:value('color'),letterSpacing:value('spacing')!=null?value('spacing')+'px':undefined,lineHeight:value('lineHeight'),borderRadius:raw.radius,background:custom&&type.fill?type.background:undefined,border:(raw.borderWidth||raw.border)?(raw.borderWidth||raw.border)+'px solid '+(raw.borderColor||'currentColor'):undefined}
  return <div ref={ref} className="dv2-layer" data-kind={kind} data-selected={active||undefined} data-editable={editing||undefined} data-pt-public-selected={!custom&&active?'true':undefined} data-studio-text-id={custom&&isStudioText(kind)?key:undefined} style={style}
    onClick={editing?select:undefined} onDoubleClick={begin} onPointerDown={start} onPointerMove={move} onPointerUp={e=>finish(e,true)} onPointerCancel={e=>finish(e,false)} onLostPointerCapture={e=>finish(e,false)}>
    <div data-dv2-visual="">
      {kind==='image'?(src?<img src={src} alt={asset.alt||''} draggable={false} loading="lazy" decoding="async" style={{objectFit:raw.fit||'cover'}}/>:<span>Chưa có ảnh</span>):kind==='shape'?null:textEditing?<textarea autoFocus aria-label="Nội dung" defaultValue={text} onPointerDown={e=>e.stopPropagation()} onBlur={e=>{if(custom){editor.studio.patch(section.id,key,{text:e.target.value});setInline(false)}else{editor.onDirectTextChange?.(section.id,key,e.target.value);editor.onDirectTextFinish?.()}}}/>:kind==='button'&&!editing&&safeStudioHref(item.href)?<a href={safeStudioHref(item.href)}>{text}</a>:<Tag>{text||'＋ Thêm nội dung'}</Tag>}
    </div>
    {active&&editing&&!type.locked&&<button className="dv2-resize" type="button" aria-label="Đổi kích thước" onPointerDown={e=>start(e,true)}>↘</button>}
  </div>
}
export default function PortfolioV2({publishedView:view,instance,device='desktop',urls={},motionPaused=false,template,...editor}){
  const content=instance?.content||{},order=content.contentBlockOrder||[]
  const sections=[...(view?.sections||[])].filter(s=>!content.contentBlockHidden?.[s.id]).sort((a,b)=>(order.indexOf(a.id)<0?999:order.indexOf(a.id))-(order.indexOf(b.id)<0?999:order.indexOf(b.id)))
  const flow=template?.slug==='silk-flow'||view?.visualTheme==='silk-flow'
  const palettes=flow?SILK_FLOW_COLOR_PALETTES:FORM_COLOR_PALETTES
  const palette=palettes.find(p=>p.id===view?.colorPalette)||palettes[0]
  const root=useRef(null),[active,setActive]=useState('')
  const sectionKey=sections.map(s=>s.id).join('|')
  useEffect(()=>{
    const nodes=root.current?.querySelectorAll('.dv2-page')
    if(!nodes?.length||typeof IntersectionObserver==='undefined')return
    const ob=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting)setActive(entry.target.id.slice(3))},{rootMargin:'-30% 0px -55% 0px'})
    nodes.forEach(n=>ob.observe(n));return()=>ob.disconnect()
  },[sectionKey])
  return <main ref={root} className="dv2" data-device={device} data-theme={flow?'flow':'atelier'} style={{'--dv2-accent':palette.swatches[0],'--dv2-paper':palette.swatches[1]}}>
    <nav className="dv2-nav" aria-label="Các khu vực Portfolio">{sections.map((s,i)=><a key={s.id} href={'#pt-'+s.id} aria-current={(active||sections[0]?.id)===s.id?'location':undefined} onClick={e=>{e.preventDefault();setActive(s.id);document.getElementById('pt-'+s.id)?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'})}}><span>{String(i+1).padStart(2,'0')}</span>{s.label||s.title}</a>)}</nav>
    {sections.map((s,i)=>{
      const scene=getScene(content,s,device)
      const items=[...['eyebrow','title','body'].map(id=>({id,text:s[id]||''})),...(s.images||[]).map((asset,j)=>({id:'image:'+j,asset})),...(scene?.notes||[]).map(n=>({id:'note:'+n.id,text:n.text})),...studioElements(content,s.id)]
      const links=safeSourceLinks(s.links)
      return <section className="dv2-page" key={s.id} id={'pt-'+s.id} aria-label={s.label||s.title} style={scene?{background:SCENE_BACKGROUNDS.find(b=>b.id===scene.background)?.css}:undefined}>
        <div className="dv2-decoration" aria-hidden="true"/><span className="dv2-index" aria-hidden="true">{String(i+1).padStart(2,'0')}</span>
        {items.map(item=><Layer key={item.id} {...{item,section:s,device,urls,content,scene,editor}} paused={motionPaused}/>)}
        {links.length>0&&<div className="dv2-links">{links.map(link=><a key={link} href={link} target="_blank" rel="noopener noreferrer">{link}</a>)}</div>}
      </section>
    })}
    <footer className="dv2-footer">{view?.artistName}</footer>
  </main>
}
