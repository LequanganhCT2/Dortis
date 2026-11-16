import React,{useId} from 'react'
import './ribbon-luxury-background.css'

const ribbons=[
  {name:'silk',opacity:.66,shape:'M-80 720C170 440 500 780 780 510S920 130 1300 18L1300 88C982 137 1055 349 818 545S270 530-80 800Z',
    seam:'M-80 754C196 482 511 787 799 524S960 136 1300 49'},
  {name:'crimson',opacity:.86,shape:'M-80 535C209 405 220 724 616 674S1034 379 1300 408L1300 489C1020 424 984 676 617 714S184 492-80 639Z',
    seam:'M-80 575C202 444 217 745 616 698S1016 392 1300 450'},
  {name:'gold',opacity:.76,shape:'M-80 690C252 519 480 849 811 620S1030 230 1300 250L1300 273C1032 259 1060 471 814 633S266 557-80 716Z',
    seam:'M-80 700C252 532 480 857 811 625S1030 241 1300 260'}
]
const palettes={
  silk:['#270410','#750e27','#de5263','#79132b','#27040c'],
  crimson:['#420512','#b41932','#ff7373','#78091f','#390510'],
  gold:['#512218','#b27138','#ffe6a8','#bf803c','#502016']
}
const sparks=Array.from({length:48},(_,i)=>{
  const x=(i*197+83)%1200
  const y=x>730?125+(i*89)%520:495+(i*47)%230
  return {x,y,r:i%11===0?2.1: .55+i%4*.27,opacity:.16+i%7*.085}
})

export default function RibbonLuxuryBackground(){
  const id=useId()
  return <div className="pt-luxury-ribbon" aria-hidden="true">
    <svg viewBox="0 0 1200 760" preserveAspectRatio="xMidYMid slice" focusable="false">
      <defs>
        {Object.entries(palettes).map(([name,colors])=><linearGradient key={name}
          id={id+name} x1="12%" y1="6%" x2="81%" y2="95%">
          {colors.map((color,i)=><stop key={color} offset={[0,.32,.52,.71,1][i]} stopColor={color}/>)}
        </linearGradient>)}
        <linearGradient id={id+'edge'}>
          <stop stopColor="#fdbf86" stopOpacity="0"/>
          <stop offset=".52" stopColor="#ffd39f" stopOpacity=".74"/>
          <stop offset="1" stopColor="#fff0c0" stopOpacity=".18"/>
        </linearGradient>
      </defs>
      {ribbons.map(({name,shape,seam,opacity})=><g key={name} opacity={opacity}>
        <path d={shape} fill={'url(#'+id+name+')'}/>
        <path d={seam} fill="none" stroke={'url(#'+id+'edge)'} strokeWidth={name==='gold'?1.25:.85}/>
      </g>)}
      <g fill="#ffe6aa">{sparks.map(({x,y,r,opacity})=><circle key={x} cx={x} cy={y} r={r} opacity={opacity}/>)}</g>
    </svg>
  </div>
}
