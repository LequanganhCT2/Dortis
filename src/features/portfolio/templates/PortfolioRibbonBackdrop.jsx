import React,{useEffect,useId,useRef} from 'react'
import './portfolio-ribbon.css'

/**
 * The same non-interactive, animated gold-and-crimson silk language is shared by
 * all three Dortis templates. The 3 scene variants adjust intensity only; they
 * never introduce an unrelated theme or reposition an artist's photographs.
 */
const SPARKLES=Array.from({length:38},(_,i)=>({
  x:120+((i*131+Math.floor(i/3)*53)%1020),
  y:((i*173+Math.floor(i/4)*31)%800),
  radius:i%9===0?3.5:i%3===0?2.2:1.3,
  delay:(i*7%19)*-.41,
  duration:3.5+(i%5)*1.4
}))
export default function PortfolioRibbonBackdrop({index=0,variant='standard',layout='vertical',direction='right'}){
  const id=useId().replace(/:/g,'')
  const node=useRef(null)
  useEffect(()=>{
    if(typeof IntersectionObserver==='undefined'||!node.current)return
    const element=node.current
    element.classList.add('is-paused')
    const observer=new IntersectionObserver(([entry])=>{
      element.classList.toggle('is-visible',Boolean(entry?.isIntersecting))
    },{rootMargin:'160px 0px'})
    observer.observe(element)
    return ()=>observer.disconnect()
  },[])
  const type=['hero','gallery','standard'].includes(variant)?variant:'standard'
  const layouts=['vertical','diagonal','horizontal','curtain']
  const selectedLayout=layouts.includes(layout)?layout:'vertical'
  const validDirections={vertical:['left','right'],diagonal:['down-right','down-left','up-right','up-left'],
    horizontal:['to-left','to-right'],curtain:['inward','outward']}
  const selectedDirection=validDirections[selectedLayout].includes(direction)?direction:validDirections[selectedLayout][0]
  return <div ref={node} className={'pt-ribbon-backdrop pt-ribbon-backdrop--'+type+
    ' pt-ribbon-backdrop--layout-'+selectedLayout+
    ' pt-ribbon-backdrop--direction-'+selectedDirection+
    ' pt-ribbon-backdrop--phase-'+(Math.abs(index)%3)}
    aria-hidden="true">
    <div className="pt-ribbon-backdrop__glow"/>
    <svg className="pt-ribbon-backdrop__svg" viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice" focusable="false">
      <defs>
        <linearGradient id={id+'-gold'} x1="0%" y1="0%" x2="100%" y2="25%">
          <stop offset="0" stopColor="#5e1807"/>
          <stop offset=".09" stopColor="#b84713"/>
          <stop offset=".20" stopColor="#ffe398"/>
          <stop offset=".28" stopColor="#e9a844"/>
          <stop offset=".44" stopColor="#fff3b6"/>
          <stop offset=".57" stopColor="#b26121"/>
          <stop offset=".72" stopColor="#f4cb68"/>
          <stop offset=".87" stopColor="#8f3e13"/>
          <stop offset="1" stopColor="#f8d489"/>
        </linearGradient>
        <linearGradient id={id+'-scarlet'} x1="0%" y1="0%" x2="100%" y2="80%">
          <stop offset="0" stopColor="#ffb17a" stopOpacity=".04"/>
          <stop offset=".25" stopColor="#ff461c" stopOpacity=".46"/>
          <stop offset=".53" stopColor="#ffab64" stopOpacity=".16"/>
          <stop offset=".7" stopColor="#df2408" stopOpacity=".7"/>
          <stop offset="1" stopColor="#ad1207" stopOpacity=".06"/>
        </linearGradient>
        <linearGradient id={id+'-shimmer'} x1="0%" y1="0%" x2="90%" y2="60%">
          <stop offset="0" stopColor="#fff5cf" stopOpacity=".1"/>
          <stop offset=".45" stopColor="#fff8e3" stopOpacity=".98"/>
          <stop offset=".64" stopColor="#fff9cc" stopOpacity=".22"/>
          <stop offset="1" stopColor="#f1bf4e" stopOpacity=".9"/>
        </linearGradient>
        <radialGradient id={id+'-flare'}>
          <stop offset="0" stopColor="#ffdb67" stopOpacity=".83"/>
          <stop offset=".15" stopColor="#f69c1d" stopOpacity=".36"/>
          <stop offset="1" stopColor="#b00b06" stopOpacity="0"/>
        </radialGradient>
        <filter id={id+'-blur'} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="13"/>
        </filter>
        <filter id={id+'-small-blur'} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3.5"/>
        </filter>
      </defs>
      <g className="pt-ribbon-backdrop__composition">
      <g id={id+'-ribbon-shapes'}>
      <g className="pt-ribbon-backdrop__silks">
        <path d="M 810 -150 C 560 60 860 200 760 365 S 540 580 700 960"
          fill="none" stroke={'url(#'+id+'-scarlet)'} strokeWidth="205"
          opacity=".69" filter={'url(#'+id+'-blur)'}/>
        <path d="M 770 -150 C 600 50 870 210 760 368 S 555 598 714 965"
          fill="none" stroke={'url(#'+id+'-gold)'} strokeWidth="38"
          strokeLinecap="round" opacity=".89"/>
        <path d="M 785 -150 C 615 75 882 213 784 376 S 580 608 740 950"
          fill="none" stroke={'url(#'+id+'-shimmer)'} strokeWidth="7"
          strokeLinecap="round" opacity=".92"/>
        <path d="M 691 -160 C 525 88 792 214 693 364 S 474 614 637 970"
          fill="none" stroke={'url(#'+id+'-scarlet)'} strokeWidth="65"
          opacity=".76"/>
        <path d="M 686 -160 C 525 82 788 209 691 367 S 480 624 630 970"
          fill="none" stroke={'url(#'+id+'-gold)'} strokeWidth="9"
          opacity=".82"/>
        <path d="M 880 -160 C 744 85 955 222 855 383 S 677 623 850 970"
          fill="none" stroke={'url(#'+id+'-scarlet)'} strokeWidth="74"
          opacity=".55"/>
        <path d="M 879 -160 C 739 85 955 219 858 376 S 668 621 840 970"
          fill="none" stroke={'url(#'+id+'-gold)'} strokeWidth="10" opacity=".72"/>
        <path d="M 906 -170 C 770 91 980 225 885 387 S 693 621 868 968"
          fill="none" stroke={'url(#'+id+'-shimmer)'} strokeWidth="2.4"
          opacity=".79"/>
        <path d="M 653 -135 C 524 98 745 221 642 364 S 451 635 611 936"
          fill="none" stroke="#ffbc55" strokeWidth="1.7" opacity=".78"/>
        <path d="M 940 -160 C 795 80 1012 230 922 396 S 760 635 920 940"
          fill="none" stroke="#ffcf6b" strokeWidth="1.4" opacity=".52"/>
      </g>
      <g className="pt-ribbon-backdrop__shimmer">
        <path d="M 785 -150 C 615 75 882 213 784 376 S 580 608 740 950"
          stroke={'url(#'+id+'-shimmer)'} strokeWidth="3" fill="none"
          strokeDasharray="11 160 36 220" opacity=".75"/>
        <path d="M 686 -160 C 525 82 788 209 691 367 S 480 624 630 970"
          stroke="#fff3bf" strokeWidth="2" fill="none"
          strokeDasharray="8 145 14 230" opacity=".65"/>
      </g>
      </g>
      {selectedLayout==='curtain'&&<use href={'#'+id+'-ribbon-shapes'}
        transform="translate(1200 0) scale(-1 1)" opacity=".62"/>}
      </g>
      <g className="pt-ribbon-backdrop__lights" fill={'url(#'+id+'-flare)'}>
        {SPARKLES.filter((_,i)=>i%7===0).map((dot,i)=>
          <circle key={i} cx={dot.x} cy={dot.y} r={28+i%3*16}
            opacity=".45" filter={'url(#'+id+'-small-blur)'}/>)}
      </g>
      <g className="pt-ribbon-backdrop__sparkles">
        {SPARKLES.map((dot,i)=><g key={i}
          className="pt-ribbon-backdrop__spark"
          style={{animationDelay:dot.delay+'s',
            animationDuration:dot.duration+'s'}}>
          <circle cx={dot.x} cy={dot.y} r={dot.radius}
            fill={i%5===0?'#fff4d0':'#ffd56d'}/>
          {i%6===0&&<path d={'M '+(dot.x-6)+' '+dot.y+'h12 M '+dot.x+
            ' '+(dot.y-6)+'v12'} stroke="#fff2b7" strokeWidth="1.1"
            strokeLinecap="round"/>}
        </g>)}
      </g>
    </svg>
    <div className="pt-ribbon-backdrop__veil"/>
  </div>
}
