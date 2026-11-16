import React,{useEffect,useRef} from 'react'

import {
  RIBBON_SCENE_WIDTH,RIBBON_BRANCHES,ribbonGeometryAt,
  normalizeRibbonGeometryChoice
} from './ribbonGeometry.js'

const SCENE_WIDTH=RIBBON_SCENE_WIDTH
const RIBBONS=RIBBON_BRANCHES

// Four uninterrupted paths extend across the entire document, not one path
// per page. Their central trajectories are long diagonal cuts, not vertical
// wavy lines. Canvas renders once per size/style; CSS animates each branch.
function sampleRibbon(ribbon,height,layout,direction){
  const steps=Math.ceil((height+240)/12)
  return Array.from({length:steps+1},(_,index)=>{
    const y=index/steps*(height+240)-120
    const {x,slope,fold}=ribbonGeometryAt(ribbon,y,layout,direction)
    const normal=Math.hypot(slope,1)
    return {x,y,nx:1/normal,ny:-slope/normal,width:ribbon.width*fold,
      crease:.065*Math.sin(y/155+ribbon.phase)+.019*Math.sin(y/42-ribbon.phase)}
  })
}

const point=(sample,offset)=>{
  const distance=(offset+sample.crease*(1-Math.abs(offset)*2))*sample.width
  return [sample.x+sample.nx*distance,sample.y+sample.ny*distance]
}

function band(samples,from,to){
  const shape=new Path2D()
  shape.moveTo(...point(samples[0],from))
  for(const sample of samples.slice(1))shape.lineTo(...point(sample,from))
  for(let i=samples.length-1;i>=0;i--)shape.lineTo(...point(samples[i],to))
  shape.closePath()
  return shape
}

function trace(ctx,samples,offset){
  ctx.beginPath()
  ctx.moveTo(...point(samples[0],offset))
  for(const sample of samples.slice(1))ctx.lineTo(...point(sample,offset))
  ctx.stroke()
}

function colorAt(colors,t){
  const start=Math.min(colors.length-2,Math.floor(t*(colors.length-1)))
  const amount=t*(colors.length-1)-start
  const from=parseInt(colors[start].slice(1),16),to=parseInt(colors[start+1].slice(1),16)
  const channels=[16,8,0].map(shift=>{
    const a=(from>>shift)&255,b=(to>>shift)&255
    return Math.round(a+(b-a)*amount)
  })
  return 'rgb('+channels.join(',')+')'
}

function drawRibbon(ctx,ribbon,height,layout,direction){
  const samples=sampleRibbon(ribbon,height,layout,direction)
  const outline=band(samples,-.5,.5)
  ctx.save()
  ctx.shadowColor='#58344534'
  ctx.shadowBlur=25
  ctx.shadowOffsetY=13
  ctx.fillStyle=ribbon.colors[2]
  ctx.fill(outline)
  ctx.restore()

  ctx.save()
  ctx.clip(outline)
  const layers=32
  for(let i=0;i<layers;i++){
    ctx.fillStyle=colorAt(ribbon.colors,(i+.5)/layers)
    ctx.fill(band(samples,i/layers-.505,(i+1)/layers-.495))
  }
  const reflection=ctx.createLinearGradient(0,0,SCENE_WIDTH,height)
  reflection.addColorStop(0,'#5e254630')
  reflection.addColorStop(.13,'#fff9ed6a')
  reflection.addColorStop(.31,'#8e414d38')
  reflection.addColorStop(.48,'#fff7e250')
  reflection.addColorStop(.60,'#57223e36')
  reflection.addColorStop(.79,'#fffdf378')
  reflection.addColorStop(1,'#a1535522')
  ctx.fillStyle=reflection
  ctx.fillRect(0,0,SCENE_WIDTH,height)

  const thread=ctx.createLinearGradient(0,0,0,height)
  thread.addColorStop(0,'#fff7e100')
  thread.addColorStop(.17,'#fffdf3d0')
  thread.addColorStop(.34,'#fff8ea20')
  thread.addColorStop(.53,'#fffbeabb')
  thread.addColorStop(.71,'#fff8ea15')
  thread.addColorStop(.91,'#fffbead8')
  thread.addColorStop(1,'#fff7e100')
  ctx.lineWidth=1.1
  ctx.strokeStyle=thread
  trace(ctx,samples,-.45)
  trace(ctx,samples,-.015)
  ctx.globalAlpha=.32
  ctx.lineWidth=.65
  trace(ctx,samples,-.41)
  trace(ctx,samples,.025)
  ctx.restore()
}

const LIGHT_CLUSTERS=[
  {x:'82%',y:'7%',size:'27%',delay:'-4s',duration:'12s'},
  {x:'18%',y:'22%',size:'22%',delay:'-8s',duration:'15s'},
  {x:'74%',y:'43%',size:'32%',delay:'-2s',duration:'14s'},
  {x:'90%',y:'62%',size:'24%',delay:'-11s',duration:'17s'},
  {x:'22%',y:'82%',size:'25%',delay:'-6s',duration:'13s'},
  {x:'71%',y:'95%',size:'19%',delay:'-13s',duration:'18s'}
]

export default function RibbonSilk({layout='vertical',direction='right'}){
  const layerRef=useRef(null)
  const choice=normalizeRibbonGeometryChoice(layout,direction)
  useEffect(()=>{
    const layer=layerRef.current
    if(!layer)return
    const canvases=[...layer.querySelectorAll('canvas')]
    const contexts=canvases.map(canvas=>canvas.getContext('2d'))
    function render(){
      const {clientWidth,clientHeight}=layer
      if(!clientWidth||!clientHeight)return
      // Keep the total pixel budget bounded even across all three canvases.
      const pixelRatio=Math.min(window.devicePixelRatio||1,2,8192/clientHeight,
        Math.sqrt((6_000_000/canvases.length)/(clientWidth*clientHeight)))
      const width=Math.max(1,Math.round(clientWidth*pixelRatio))
      const height=Math.max(1,Math.round(clientHeight*pixelRatio))
      const sceneHeight=clientHeight/clientWidth*SCENE_WIDTH
      canvases.forEach((canvas,index)=>{
        const ctx=contexts[index]
        if(!ctx||(canvas.width===width&&canvas.height===height&&
          canvas.dataset.rendered===choice.layout+':'+choice.direction))return
        canvas.width=width
        canvas.height=height
        ctx.setTransform(width/SCENE_WIDTH,0,0,height/sceneHeight,0,0)
        drawRibbon(ctx,RIBBONS[index],sceneHeight,choice.layout,choice.direction)
        canvas.dataset.rendered=choice.layout+':'+choice.direction
      })
    }
    render()
    const observer=new ResizeObserver(render)
    observer.observe(layer)
    return ()=>observer.disconnect()
  },[choice.layout,choice.direction])
  const safeLayout=choice.layout
  const safeDirection=choice.direction
  return <div ref={layerRef} className={'pt-ribbon__silk pt-ribbon__silk--layout-'+safeLayout+
    ' pt-ribbon__silk--direction-'+safeDirection} aria-hidden="true">
    {RIBBONS.map(({id},index)=><canvas key={id}
      className={'pt-ribbon__strand pt-ribbon__strand--'+(index+1)}/>)}
    {LIGHT_CLUSTERS.map(({x,y,size,delay,duration})=><span key={y} className="pt-ribbon__bokeh"
      style={{left:x,top:y,width:size,'--pt-bokeh-delay':delay,'--pt-bokeh-duration':duration}}/>)}
  </div>
}
