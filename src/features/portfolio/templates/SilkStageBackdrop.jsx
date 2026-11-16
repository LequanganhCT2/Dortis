import React,{useEffect,useId,useMemo,useRef,useState} from 'react'
import {
  FABRIC_BRANCHES,buildFabricBands,scatterGlitter,normalizeFabricChoice
} from './silkFabricGeometry'
import './silk-stage-backdrop.css'
import {tintSilkColor} from './portfolioPalette'

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
  layout='diagonal',direction='down-right',motionPaused=false,palette='red-gold'
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
          <stop offset="0%" stopColor={tintSilkColor('#370007',palette)}/>
          <stop offset="13%" stopColor={tintSilkColor('#7d0413',palette)}/>
          <stop offset="30%" stopColor={tintSilkColor('#dd1527',palette)}/>
          <stop offset="47%" stopColor={tintSilkColor('#ff755e',palette)}/>
          <stop offset="58%" stopColor={tintSilkColor('#feab7d',palette)}/>
          <stop offset="71%" stopColor={tintSilkColor('#bb1227',palette)}/>
          <stop offset="100%" stopColor={tintSilkColor('#36000d',palette)}/>
        </linearGradient>
        <linearGradient id={id+'-scarlet'} x1="10%" y1="0%" x2="95%" y2="100%">
          <stop offset="0%" stopColor={tintSilkColor('#510009',palette)}/>
          <stop offset="19%" stopColor={tintSilkColor('#d4101b',palette)}/>
          <stop offset="35%" stopColor={tintSilkColor('#ff5241',palette)}/>
          <stop offset="48%" stopColor={tintSilkColor('#ffc49a',palette)}/>
          <stop offset="62%" stopColor={tintSilkColor('#e93626',palette)}/>
          <stop offset="83%" stopColor={tintSilkColor('#a20a18',palette)}/>
          <stop offset="100%" stopColor={tintSilkColor('#31000b',palette)}/>
        </linearGradient>
        <linearGradient id={id+'-champagne'} x1="0%" y1="10%" x2="100%" y2="90%">
          <stop offset="0%" stopColor={tintSilkColor('#640c14',palette)}/>
          <stop offset="24%" stopColor={tintSilkColor('#e34d33',palette)}/>
          <stop offset="39%" stopColor={tintSilkColor('#ef9a53',palette)}/>
          <stop offset="52%" stopColor={tintSilkColor('#ffe2a3',palette)}/>
          <stop offset="64%" stopColor={tintSilkColor('#e85d3d',palette)}/>
          <stop offset="100%" stopColor={tintSilkColor('#680c18',palette)}/>
        </linearGradient>
        <linearGradient id={id+'-crease'} x1="0%" y1="0%" x2="100%" y2="60%">
          <stop offset="0%" stopColor={tintSilkColor('#240008',palette)} stopOpacity=".76"/>
          <stop offset="55%" stopColor={tintSilkColor('#620311',palette)} stopOpacity=".5"/>
          <stop offset="100%" stopColor={tintSilkColor('#ff6d46',palette)} stopOpacity=".05"/>
        </linearGradient>
        <linearGradient id={id+'-shadow'} x1="100%" y1="20%" x2="0%" y2="85%">
          <stop offset="0%" stopColor={tintSilkColor('#2b000a',palette)} stopOpacity=".82"/>
          <stop offset="60%" stopColor={tintSilkColor('#650313',palette)} stopOpacity=".48"/>
          <stop offset="100%" stopColor={tintSilkColor('#140006',palette)} stopOpacity=".76"/>
        </linearGradient>
        <linearGradient id={id+'-satin'} x1="0%" y1="10%" x2="100%" y2="70%">
          <stop offset="0%" stopColor={tintSilkColor('#f73f38',palette)} stopOpacity="0"/>
          <stop offset="20%" stopColor={tintSilkColor('#ffb89a',palette)} stopOpacity=".39"/>
          <stop offset="48%" stopColor={tintSilkColor('#fff4ce',palette)} stopOpacity=".65"/>
          <stop offset="72%" stopColor={tintSilkColor('#f89b74',palette)} stopOpacity=".24"/>
          <stop offset="100%" stopColor={tintSilkColor('#f32b38',palette)} stopOpacity="0"/>
        </linearGradient>
        <linearGradient id={id+'-edge'} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={tintSilkColor('#ffd0a2',palette)} stopOpacity=".02"/>
          <stop offset="51%" stopColor={tintSilkColor('#ffe3b6',palette)} stopOpacity=".68"/>
          <stop offset="100%" stopColor={tintSilkColor('#e74131',palette)} stopOpacity=".1"/>
        </linearGradient>
        <radialGradient id={id+'-aura'}>
          <stop offset="0%" stopColor={tintSilkColor('#fffaf2',palette)} stopOpacity=".96"/>
          <stop offset="13%" stopColor={tintSilkColor('#fff6c8',palette)} stopOpacity=".91"/>
          <stop offset="28%" stopColor={tintSilkColor('#ffda71',palette)} stopOpacity=".68"/>
          <stop offset="48%" stopColor={tintSilkColor('#ffab3f',palette)} stopOpacity=".4"/>
          <stop offset="72%" stopColor={tintSilkColor('#ff6b24',palette)} stopOpacity=".13"/>
          <stop offset="100%" stopColor={tintSilkColor('#e4411c',palette)} stopOpacity="0"/>
        </radialGradient>
        <radialGradient id={id+'-dust'}>
          <stop offset="0%" stopColor={tintSilkColor('#fffbea',palette)} stopOpacity="1"/>
          <stop offset="28%" stopColor={tintSilkColor('#ffe5a1',palette)} stopOpacity=".7"/>
          <stop offset="100%" stopColor={tintSilkColor('#e38d25',palette)} stopOpacity="0"/>
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
          fill="none" stroke={tintSilkColor('#ffdc82',palette)} strokeWidth="2.5" opacity=".65"/>
        <circle cx="505" cy="382" r="203"
          fill="none" stroke={tintSilkColor('#ffe49b',palette)} strokeWidth="9" opacity=".45"
          filter={'url(#'+id+'-glimmer)'}/>
        <ellipse cx="505" cy="382" rx="225" ry="179"
          fill="none" stroke={tintSilkColor('#fff1b4',palette)} strokeWidth="4" opacity=".68"
          transform="rotate(-23 505 382)"/>
        <ellipse cx="505" cy="382" rx="235" ry="175"
          fill="none" stroke={tintSilkColor('#e9a64d',palette)} strokeWidth="1.8" opacity=".66"
          transform="rotate(31 505 382)"/>
        <path d="M 300 465 C 380 580 598 616 705 442"
          fill="none" stroke={tintSilkColor('#ffecad',palette)} strokeWidth="3.7" opacity=".84"
          strokeLinecap="round"/>
        <path d="M 308 473 C 424 613 596 587 686 481"
          fill="none" stroke={tintSilkColor('#ffbe60',palette)} strokeWidth="15" opacity=".55"
          filter={'url(#'+id+'-glimmer)'}/>
        {Array.from({length:11},(_,i)=><circle key={'aura-'+i}
          cx={505+Math.cos(i*2.399)*220}
          cy={382+Math.sin(i*2.399)*183}
          r={2+i%4*1.3} fill={tintSilkColor('#ffeaaa',palette)} opacity=".83"/>)}
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
          <path d={d.high} fill={tintSilkColor('#ffe1b3',palette)} opacity=".23"/>
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
          <circle cx={p.x} cy={p.y} r={p.r} fill={tintSilkColor('#fff0ad',palette)} opacity=".9"/>
          {p.id%13===0&&<path d={'M '+(p.x-7)+' '+p.y+'h14 M '+p.x+
            ' '+(p.y-7)+'v14'} stroke={tintSilkColor('#fff4c8',palette)}
            strokeWidth="1.2" opacity=".76"/>}
        </g>)}
      </g>
    </svg>
    <div className="pt-silk-stage__light-veil"/>
  </div>
}
