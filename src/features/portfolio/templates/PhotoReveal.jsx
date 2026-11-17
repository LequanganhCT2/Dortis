import React from 'react'

/**
 * Independent photo entrance layer. The existing PhotoMotion runs its hover/
 * floating movement inside, and saved placement stays on the outer tile.
 * This dedicated element can move, fade and scale without moving crop handles.
 */
export default function PhotoReveal({children,order=0}){
  return <div className="pt-photo-reveal"
    data-pt-scroll-reveal="image"
    data-pt-reveal-order={order}>
    {children}
  </div>
}
