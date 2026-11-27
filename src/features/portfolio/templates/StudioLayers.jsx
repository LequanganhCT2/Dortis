import React,{useEffect,useRef,useState} from 'react'
import {studioLayout,safeStudioHref} from './studioModel.js'
import './studio.css'

function StudioLayer({item,sectionId,device,urls,studio,paused}){
  const v=studioLayout(item[device],item.kind,device)
  const ref=useRef(null),drag=useRef(null)
  const [preview,setPreview]=useState(null)
  const [visible,setVisible]=useState(true)
  const [inline,setInline]=useState(false)
  const editing=Boolean(studio),selected=studio?.selection?.sectionId===sectionId&&studio?.selection?.id===item.id
  useEffect(()=>{
    if(v.hidden&&!editing)return
    if(editing||paused||v.effect==='none'||typeof IntersectionObserver==='undefined'||window.matchMedia('(prefers-reduced-motion: reduce)').matches){setVisible(true);return}
    const node=ref.current
    if(!node)return
    const io=new IntersectionObserver(([entry])=>setVisible(old=>entry.isIntersecting||(!v.reverse&&old)),{threshold:.12})
    setVisible(false);io.observe(node);return ()=>io.disconnect()
  },[editing,paused,v.effect,v.reverse,v.hidden])
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
  return <div ref={ref} className={'pt-studio-layer'+(editing?' is-editable':'')+(selected?' is-selected':'')+(v.hidden?' is-hidden':'')}
    style={{left:p.x+'%',top:p.y+'%',width:p.w+'%',height:p.h+'%',zIndex:p.z,
      transform:'rotate('+p.rotation+'deg)',opacity:v.hidden ? .25 : 1}}
    onPointerDown={editing?start:undefined} onPointerMove={move}
    onPointerUp={finish} onPointerCancel={e=>finish(e,false)} onLostPointerCapture={e=>finish(e,false)}
    onDoubleClick={editing&&['title','text','body','button'].includes(item.kind)&&!v.locked?e=>{e.stopPropagation();setInline(true)}:undefined}>
    <div className={'pt-studio-layer__visual'+(visible?' is-visible':'')+' fx-'+v.effect}
      style={{'--studio-duration':v.duration+'s','--studio-delay':v.delay+'s','--studio-opacity':v.opacity/100,
        '--studio-blur':v.blur+'px',fontFamily:v.font,fontWeight:v.weight,fontSize:'clamp(8px,'+(v.size/(device==='mobile'?7.2:19.2))+'cqw,240px)',
        letterSpacing:v.spacing+'px',lineHeight:v.lineHeight,textAlign:v.align,color:v.color,
        background:v.fill?v.background:'transparent',border:v.border+'px solid '+v.borderColor,borderRadius:v.radius+'px',
        boxShadow:v.shadow?'0 6px '+v.shadow+'px #0004':undefined}}>
      {item.kind==='image'?(src?<img src={src} alt={item.alt||''} draggable={false} style={{objectFit:v.fit}}/>:editing?<span>Chưa có ảnh</span>:null):
        item.kind==='shape'?null:inline&&editing?<textarea autoFocus value={text} onPointerDown={e=>e.stopPropagation()} onChange={e=>studio.patch(sectionId,item.id,{text:e.target.value})} onBlur={()=>setInline(false)}/>:
        item.kind==='button'&&!editing&&safeStudioHref(item.href)?<a href={safeStudioHref(item.href)}>{text}</a>:
        v.effect==='letters'&&!editing?Array.from(text).map((ch,i)=><span key={i} className="pt-studio-letter" style={{transitionDelay:(v.delay+Math.min(i,60)*.025)+'s'}}>{ch}</span>):<span>{text}</span>}
    </div>
    {selected&&!v.locked&&['nw','n','ne','e','se','s','sw','w'].map(dir=><button key={dir} className={'pt-studio-layer__resize handle-'+dir} type="button" aria-label={'Thay đổi kích thước '+dir} onPointerDown={e=>start(e,dir)}/>)}
  </div>
}
export default function StudioLayers({items,sectionId,device,urls,studio,paused}){
  if(!items?.length)return null
  return <div className="pt-studio-layer-plane">{items.map(item=><StudioLayer key={item.id} {...{item,sectionId,device,urls,studio,paused}}/>)}</div>
}
