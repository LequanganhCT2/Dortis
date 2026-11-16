import React,{useEffect,useId,useMemo,useRef,useState} from 'react'
import {
  FABRIC_BRANCHES,buildFabricBands,scatterGlitter,normalizeFabricChoice
} from './silkFabricGeometry'
import './silk-stage-backdrop.css'

/**
 * One continuous, full-document silk stage.
 *
 * The active Silk Atelier Form renders this once behind ALL sections. Unlike
 * the old tube extrusion, these wide satin panels have asymmetric boundaries,
 * dark folded undersides, soft highlights, and irregular independent motion.
 * The gold orbit and floating light dust are part of the same continuous field.
 */
const MAX_SCENE=26000
export default function SilkStageBackdrop({
  layout='diagonal',direction='down-right',motionPaused=false
}){
  const root=useRef(null)
  const id=useId().replace(/:/g,'')
  const [height,setHeight]=useState(6400)
  const choice=normalizeFabricChoice(layout,direction)
  useEffect(()=>{
    const el=root.current
    const parent=el?.parentElement
    if(!el||!parent)return undefined
    const update=()=>{
      const width=Math.max(320,parent.clientWidth)
      const visualHeight=Math.max(500,parent.scrollHeight)
      const next=Math.min(MAX_SCENE,Math.max(900,Math.round(visualHeight/width*1000)))
      setHeight(old=>Math.abs(old-next)>8?next:old)
    }
    update()
    if(typeof ResizeObserver==='undefined')return undefined
    const ro=new ResizeObserver(update)
    ro.observe(parent)
    return ()=>ro.disconnect()
  },[])
  const fabric=useMemo(()=>FABRIC_BRANCHES.map(branch=>({
    ...branch,bands:buildFabricBands(branch,height,choice.layout,choice.direction)
  })),[height,choice.layout,choice.direction])
  const glitter=useMemo(()=>scatterGlitter(height),[height])
  return <div ref={root} className={'pt-silk-stage'+(motionPaused?' is-paused':'')}
    aria-hidden="true">
    <svg className="pt-silk-stage__scene"
      viewBox={'0 0 1000 '+height}
      preserveAspectRatio="none" focusable="false">
      <defs>
        <linearGradient id={id+'-ruby'} x1="0%" y1="17%" x2="100%" y2="80%">
          <stop offset="0%" stopColor="#370007"/>
          <stop offset="13%" stopColor="#7d0413"/>
          <stop offset="30%" stopColor="#dd1527"/>
          <stop offset="47%" stopColor="#ff755e"/>
          <stop offset="58%" stopColor="#feab7d"/>
          <stop offset="71%" stopColor="#bb1227"/>
          <stop offset="100%" stopColor="#36000d"/>
        </linearGradient>
        <linearGradient id={id+'-scarlet'} x1="10%" y1="0%" x2="95%" y2="100%">
          <stop offset="0%" stopColor="#510009"/>
          <stop offset="19%" stopColor="#d4101b"/>
          <stop offset="35%" stopColor="#ff5241"/>
          <stop offset="48%" stopColor="#ffc49a"/>
          <stop offset="62%" stopColor="#e93626"/>
          <stop offset="83%" stopColor="#a20a18"/>
          <stop offset="100%" stopColor="#31000b"/>
        </linearGradient>
        <linearGradient id={id+'-champagne'} x1="0%" y1="10%" x2="100%" y2="90%">
          <stop offset="0%" stopColor="#640c14"/>
          <stop offset="24%" stopColor="#e34d33"/>
          <stop offset="39%" stopColor="#ef9a53"/>
          <stop offset="52%" stopColor="#ffe2a3"/>
          <stop offset="64%" stopColor="#e85d3d"/>
          <stop offset="100%" stopColor="#680c18"/>
        </linearGradient>
        <linearGradient id={id+'-crease'} x1="0%" y1="0%" x2="100%" y2="60%">
          <stop offset="0%" stopColor="#240008" stopOpacity=".76"/>
          <stop offset="55%" stopColor="#620311" stopOpacity=".5"/>
          <stop offset="100%" stopColor="#ff6d46" stopOpacity=".05"/>
        </linearGradient>
        <linearGradient id={id+'-shadow'} x1="100%" y1="20%" x2="0%" y2="85%">
          <stop offset="0%" stopColor="#2b000a" stopOpacity=".82"/>
          <stop offset="60%" stopColor="#650313" stopOpacity=".48"/>
          <stop offset="100%" stopColor="#140006" stopOpacity=".76"/>
        </linearGradient>
        <linearGradient id={id+'-satin'} x1="0%" y1="10%" x2="100%" y2="70%">
          <stop offset="0%" stopColor="#f73f38" stopOpacity="0"/>
          <stop offset="20%" stopColor="#ffb89a" stopOpacity=".39"/>
          <stop offset="48%" stopColor="#fff4ce" stopOpacity=".65"/>
          <stop offset="72%" stopColor="#f89b74" stopOpacity=".24"/>
          <stop offset="100%" stopColor="#f32b38" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id={id+'-edge'} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffd0a2" stopOpacity=".02"/>
          <stop offset="51%" stopColor="#ffe3b6" stopOpacity=".68"/>
          <stop offset="100%" stopColor="#e74131" stopOpacity=".1"/>
        </linearGradient>
        <radialGradient id={id+'-aura'}>
          <stop offset="0%" stopColor="#fffaf2" stopOpacity=".96"/>
          <stop offset="13%" stopColor="#fff6c8" stopOpacity=".91"/>
          <stop offset="28%" stopColor="#ffda71" stopOpacity=".68"/>
          <stop offset="48%" stopColor="#ffab3f" stopOpacity=".4"/>
          <stop offset="72%" stopColor="#ff6b24" stopOpacity=".13"/>
          <stop offset="100%" stopColor="#e4411c" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id={id+'-dust'}>
          <stop offset="0%" stopColor="#fffbea" stopOpacity="1"/>
          <stop offset="28%" stopColor="#ffe5a1" stopOpacity=".7"/>
          <stop offset="100%" stopColor="#e38d25" stopOpacity="0"/>
        </radialGradient>
        <filter id={id+'-cloud'} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="24"/>
        </filter>
        <filter id={id+'-glimmer'} x="-70%" y="-70%" width="240%" height="240%">
          <feGaussianBlur stdDeviation="4.5"/>
        </filter>
      </defs>
      <g className="pt-silk-stage__lightfield">
        <ellipse cx="505" cy="380" rx="410" ry="350" fill={'url(#'+id+'-aura)'}
          opacity=".94" filter={'url(#'+id+'-cloud)'}/>
        <ellipse cx="510" cy="390" rx="258" ry="245" fill={'url(#'+id+'-aura)'}
          opacity=".85"/>
        <circle cx="505" cy="382" r="177"
          fill={'url(#'+id+'-aura)'} opacity=".93"/>
        <circle cx="505" cy="382" r="188"
          fill="none" stroke="#ffdc82" strokeWidth="2.5" opacity=".65"/>
        <circle cx="505" cy="382" r="203"
          fill="none" stroke="#ffe49b" strokeWidth="9" opacity=".45"
          filter={'url(#'+id+'-glimmer)'}/>
        <ellipse cx="505" cy="382" rx="225" ry="179"
          fill="none" stroke="#fff1b4" strokeWidth="4" opacity=".68"
          transform="rotate(-23 505 382)"/>
        <ellipse cx="505" cy="382" rx="235" ry="175"
          fill="none" stroke="#e9a64d" strokeWidth="1.8" opacity=".66"
          transform="rotate(31 505 382)"/>
        <path d="M 300 465 C 380 580 598 616 705 442"
          fill="none" stroke="#ffecad" strokeWidth="3.7" opacity=".84"
          strokeLinecap="round"/>
        <path d="M 308 473 C 424 613 596 587 686 481"
          fill="none" stroke="#ffbe60" strokeWidth="15" opacity=".55"
          filter={'url(#'+id+'-glimmer)'}/>
        {Array.from({length:11},(_,i)=><circle key={'aura-'+i}
          cx={505+Math.cos(i*2.399)*220}
          cy={382+Math.sin(i*2.399)*183}
          r={2+i%4*1.3} fill="#ffeaaa" opacity=".83"/>)}
      </g>
      {fabric.map((branch,index)=>{
        const d=branch.bands
        return <g key={branch.id}
          className={'pt-silk-stage__fabric pt-silk-stage__fabric--'+(index+1)}>
          <path d={d.full} fill={'url(#'+id+'-'+branch.shade+')'}
            opacity={index===2?.76:.95}/>
          <path d={d.underfold} fill={'url(#'+id+'-crease)'} opacity=".84"/>
          <path d={d.shadow} fill={'url(#'+id+'-shadow)'} opacity=".79"/>
          <path d={d.satin} fill={'url(#'+id+'-satin)'} opacity=".76"/>
          <path d={d.high} fill="#ffe1b3" opacity=".23"/>
          <path d={d.fringe} fill="none" stroke={'url(#'+id+'-edge)'}
            strokeWidth="2.7" opacity=".64"/>
        </g>
      })}
      <g className="pt-silk-stage__dust">
        {glitter.map(p=><g key={p.id}
          className="pt-silk-stage__spark"
          style={{animationDuration:p.dur+'s',animationDelay:p.delay+'s'}}>
          {p.glow&&<circle cx={p.x} cy={p.y} r={p.r*6}
            fill={'url(#'+id+'-dust)'} opacity=".63"/>}
          <circle cx={p.x} cy={p.y} r={p.r} fill="#fff0ad" opacity=".9"/>
          {p.id%13===0&&<path d={'M '+(p.x-7)+' '+p.y+'h14 M '+p.x+
            ' '+(p.y-7)+'v14'} stroke="#fff4c8"
            strokeWidth="1.2" opacity=".76"/>}
        </g>)}
      </g>
    </svg>
    <div className="pt-silk-stage__light-veil"/>
  </div>
}
