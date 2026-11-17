import React,{useEffect,useId,useMemo,useRef,useState} from 'react'
import {FLOW_SHEETS,buildChiffonSheets} from './silkFlowGeometry'
import './silk-flow.css'

const TONES={
  'ice-blue':{deep:'#3f92d2',mid:'#8bc6ee',light:'#d9f1ff',pearl:'#ffffff',shadow:'#4c7db1'},
  'seafoam-white':{deep:'#298f96',mid:'#74caca',light:'#d9f5f2',pearl:'#ffffff',shadow:'#548a99'},
  'silver-white':{deep:'#688ca8',mid:'#b5cddd',light:'#e7f1f7',pearl:'#ffffff',shadow:'#7994a7'},
  'navy-white':{deep:'#1a497f',mid:'#5c8dbb',light:'#b3d4f0',pearl:'#f5fbff',shadow:'#25456a'}
}
/**
 * Silk Flow uses a separate continuous full-document chiffon stage.
 * The original red/gold SilkStageBackdrop is intentionally not modified.
 * Fine threads, satin highlights and overlapping translucent panels form the
 * drifting fabric; this is procedural SVG, not a static or stock photograph.
 */
export default function SilkFlowBackdrop({
  layout='diagonal',direction='down-right',palette='ice-blue',motionPaused=false
}){
  const root=useRef(null)
  const id=useId().replace(/:/g,'')
  const [height,setHeight]=useState(6400)
  useEffect(()=>{
    const parent=root.current?.parentElement
    if(!parent)return undefined
    const resize=()=>{
      const width=Math.max(320,parent.clientWidth)
      const sceneHeight=Math.max(700,parent.scrollHeight)
      const next=Math.min(28000,Math.max(900,Math.round(sceneHeight/width*1000)))
      setHeight(prev=>Math.abs(prev-next)>10?next:prev)
    }
    resize()
    if(typeof ResizeObserver==='undefined')return undefined
    const observer=new ResizeObserver(resize)
    observer.observe(parent)
    return ()=>observer.disconnect()
  },[])
  const sheets=useMemo(()=>FLOW_SHEETS.map(sheet=>({
    ...sheet,paths:buildChiffonSheets(sheet,height,layout,direction)
  })),[height,layout,direction])
  const tone=TONES[palette]||TONES['ice-blue']
  const link=key=>'url(#'+id+'-'+key+')'
  return <div ref={root} className={'pt-flow-stage'+(motionPaused?' is-paused':'')}
    aria-hidden="true">
    <svg className="pt-flow-stage__svg" focusable="false"
      viewBox={'0 0 1000 '+height} preserveAspectRatio="none">
      <defs>
        <linearGradient id={id+'-chiffon'} x1="0%" y1="0%" x2="10%" y2="100%">
          <stop offset="0%" stopColor={tone.light} stopOpacity=".08"/>
          <stop offset="11%" stopColor={tone.mid} stopOpacity=".25"/>
          <stop offset="28%" stopColor={tone.deep} stopOpacity=".5"/>
          <stop offset="44%" stopColor={tone.mid} stopOpacity=".34"/>
          <stop offset="55%" stopColor={tone.pearl} stopOpacity=".64"/>
          <stop offset="73%" stopColor={tone.mid} stopOpacity=".36"/>
          <stop offset="86%" stopColor={tone.deep} stopOpacity=".24"/>
          <stop offset="100%" stopColor={tone.light} stopOpacity=".04"/>
        </linearGradient>
        <linearGradient id={id+'-underside'} x1="0%" y1="0%" x2="100%" y2="17%">
          <stop offset="0%" stopColor={tone.deep} stopOpacity=".02"/>
          <stop offset="49%" stopColor={tone.shadow} stopOpacity=".38"/>
          <stop offset="100%" stopColor={tone.light} stopOpacity=".05"/>
        </linearGradient>
        <linearGradient id={id+'-sheen'} x1="0%" y1="0%" x2="100%" y2="12%">
          <stop offset="0%" stopColor={tone.light} stopOpacity="0"/>
          <stop offset="43%" stopColor={tone.pearl} stopOpacity=".83"/>
          <stop offset="56%" stopColor={tone.pearl} stopOpacity=".4"/>
          <stop offset="100%" stopColor={tone.mid} stopOpacity="0"/>
        </linearGradient>
        <linearGradient id={id+'-fold'} x1="0%" y1="0%" x2="95%" y2="20%">
          <stop offset="0%" stopColor={tone.light} stopOpacity=".02"/>
          <stop offset="54%" stopColor={tone.deep} stopOpacity=".45"/>
          <stop offset="100%" stopColor={tone.pearl} stopOpacity=".07"/>
        </linearGradient>
        <linearGradient id={id+'-gauze'} x1="0%" y1="0%" x2="10%" y2="100%">
          <stop offset="0%" stopColor={tone.pearl} stopOpacity=".03"/>
          <stop offset="38%" stopColor={tone.light} stopOpacity=".34"/>
          <stop offset="72%" stopColor={tone.mid} stopOpacity=".14"/>
          <stop offset="100%" stopColor={tone.pearl} stopOpacity="0"/>
        </linearGradient>
        <linearGradient id={id+'-thread'} x1="0%" y1="0%" x2="100%" y2="10%">
          <stop offset="0%" stopColor={tone.light} stopOpacity="0"/>
          <stop offset="36%" stopColor={tone.pearl} stopOpacity=".69"/>
          <stop offset="62%" stopColor={tone.deep} stopOpacity=".38"/>
          <stop offset="100%" stopColor={tone.light} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {sheets.map((sheet,i)=><g key={sheet.id}
        className={'pt-flow-stage__sheet pt-flow-stage__sheet--'+(i+1)}
        opacity={sheet.opacity}>
        {sheet.paths.passes.map((panel,k)=><g key={k}
          className="pt-flow-stage__billow" style={{'--flow-pass':k}}>
          <path d={panel.surface} fill={link('chiffon')}/>
          <path d={panel.underside} fill={link('underside')} opacity=".58"/>
          <path d={panel.luminous} fill={link('sheen')} opacity=".8"/>
          <path d={panel.fold} fill={link('fold')} opacity=".52"/>
          <path d={panel.gauze} fill={link('gauze')} opacity=".8"/>
          <path d={panel.nearEdge} fill="none" stroke={tone.deep}
            strokeWidth=".9" opacity=".17"/>
          <path d={panel.farEdge} fill="none" stroke={tone.light}
            strokeWidth="1.6" opacity=".54"/>
          {panel.threads.map((thread,j)=><path key={j} d={thread}
            fill="none" stroke={j%4===0?tone.pearl:link('thread')}
            strokeWidth={j%5===0?.8:.42} opacity={j%4===0?.26:.17}/>)}
        </g>)}
      </g>)}
    </svg>
    <span className="pt-flow-stage__softlight"/>
  </div>
}
