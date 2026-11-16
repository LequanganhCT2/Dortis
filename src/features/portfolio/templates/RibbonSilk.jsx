import React,{useEffect,useRef} from 'react'

const SCENE_WIDTH=1000
const RIBBONS=[
  {
    width:125,phase:.45,
    // Rose silk opens wide near the hero, folds in, then crosses back at the gallery.
    path:[[0,925,.92],[.11,485,1.37],[.23,80,.46],[.39,846,1.13],
      [.55,584,.62],[.67,91,1.24],[.81,780,.52],[1,962,1.26]],
    colors:['#673745','#a64e6c','#d67f9d','#fedce6','#fff3ed','#e7a4b8','#a65574','#773f57']
  },
  {
    width:164,phase:2.1,
    path:[[0,114,.70],[.14,770,1.19],[.28,582,.45],[.42,118,.94],
      [.59,878,1.18],[.73,478,.42],[.91,35,.90],[1,315,.58]],
    colors:['#b99581','#dabeaa','#f5e8db','#fffefa','#fff7e3','#f0d9c7','#bc968b','#967370']
  },
  {
    width:73,phase:3.4,
    path:[[0,1025,.61],[.19,677,.76],[.29,916,1.48],[.46,437,.48],
      [.58,235,.85],[.76,904,1.27],[.87,805,.49],[1,147,.7]],
    colors:['#78502b','#ae773e','#e8b774','#ffeac1','#fff4d9','#ebc07d','#b78348','#8d5d33']
  }
]

// Smooth curves with different positions and widths at each art-directed fold.
function sampleRibbon({path,width,phase},height){
  const steps=Math.ceil((height+240)/12)
  let segment=0
  return Array.from({length:steps+1},(_,index)=>{
    const y=index/steps*(height+240)-120
    const t=Math.max(0,Math.min(1,y/height))
    while(segment<path.length-2&&t>path[segment+1][0])segment++
    const [start,left,wide]=path[segment]
    const [end,right,narrow]=path[segment+1]
    const local=(t-start)/(end-start)
    const ease=local*local*(3-2*local)
    const x=left+(right-left)*ease+Math.sin(y/131+phase)*27
    const slope=(right-left)*6*local*(1-local)/((end-start)*height)+Math.cos(y/131+phase)*27/131
    const normal=Math.hypot(slope,1)
    const fold=(wide+(narrow-wide)*ease)*(1+.16*Math.sin(y/97+phase))
    return {x,y,nx:1/normal,ny:-slope/normal,width:width*fold,
      crease:.089*Math.sin(y/155+phase)+.031*Math.sin(y/42-phase)}
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

function drawRibbon(ctx,ribbon,height){
  const samples=sampleRibbon(ribbon,height)
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

export default function RibbonSilk(){
  const layerRef=useRef(null)
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
        if(!ctx||(canvas.width===width&&canvas.height===height&&canvas.dataset.rendered))return
        canvas.width=width
        canvas.height=height
        ctx.setTransform(width/SCENE_WIDTH,0,0,height/sceneHeight,0,0)
        drawRibbon(ctx,RIBBONS[index],sceneHeight)
        canvas.dataset.rendered='true'
      })
    }
    render()
    const observer=new ResizeObserver(render)
    observer.observe(layer)
    return ()=>observer.disconnect()
  },[])
  return <div ref={layerRef} className="pt-ribbon__silk" aria-hidden="true">
    {RIBBONS.map(({phase},index)=><canvas key={phase}
      className={'pt-ribbon__strand pt-ribbon__strand--'+(index+1)}/>)}
    {LIGHT_CLUSTERS.map(({x,y,size,delay,duration})=><span key={y} className="pt-ribbon__bokeh"
      style={{left:x,top:y,width:size,'--pt-bokeh-delay':delay,'--pt-bokeh-duration':duration}}/>)}
  </div>
}
