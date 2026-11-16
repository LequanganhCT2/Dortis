import React from 'react'
import './portfolio-glow-overlay.css'

/**
 * A single, document-spanning translucent lighting layer, above every text
 * block and image but unable to intercept clicks, drags, scrolling or links.
 * The lights are not regenerated per section, so scrolling has no seams.
 */
const HALOS=[
  {x:'62%',y:'8%',size:'47vw',tone:'gold',delay:'-4s',duration:'23s'},
  {x:'5%',y:'23%',size:'37vw',tone:'rose',delay:'-16s',duration:'29s'},
  {x:'73%',y:'41%',size:'43vw',tone:'amber',delay:'-8s',duration:'31s'},
  {x:'11%',y:'58%',size:'45vw',tone:'gold',delay:'-22s',duration:'27s'},
  {x:'68%',y:'77%',size:'40vw',tone:'rose',delay:'-12s',duration:'34s'},
  {x:'20%',y:'94%',size:'38vw',tone:'amber',delay:'-26s',duration:'30s'}
]
export default function PortfolioGlowOverlay({opacity=.28}){
  const amount=Number.isFinite(Number(opacity))?
    Math.max(0,Math.min(.55,Number(opacity))):.28
  if(!amount)return null
  return <div className="pt-portfolio-halos" aria-hidden="true"
    style={{'--pt-halo-opacity':amount}}>
    {HALOS.map((halo,index)=><span key={index}
      className={'pt-portfolio-halos__orb pt-portfolio-halos__orb--'+halo.tone}
      style={{left:halo.x,top:halo.y,width:halo.size,height:halo.size,
        animationDelay:halo.delay,animationDuration:halo.duration}}/>)}
  </div>
}
