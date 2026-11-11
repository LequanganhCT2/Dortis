import React, { useEffect, useRef, useState } from 'react'

const showcases = [
  { code:'01', label:'CV & Portfolio', lines:['CV &','Portfolio'], kind:'HỒ SƠ NGHỆ SĨ' },
  { code:'02', label:'Artist Branding', lines:['Artist','Branding'], kind:'THƯƠNG HIỆU NGHỆ SĨ' },
  { code:'03', label:'Thiết kế truyền thông', lines:['Visual','Campaign'], kind:'THỊ GIÁC TRUYỀN THÔNG' },
  { code:'04', label:'Website nghệ sĩ', lines:['Artist','Website'], kind:'KHÔNG GIAN SỐ' },
]
const values = [
  ['D','Design','Thiết kế: Chuyển hóa ý tưởng thành sản phẩm thiết kế nghệ thuật chuyên nghiệp.','Thiết kế luôn có mục đích, không chỉ có hình thức.'],
  ['O','Originality','Tính nguyên bản: Tôn trọng cá tính khác biệt, tránh rập khuôn.','Tôn trọng tiếng nói và thế giới riêng của nghệ sĩ.'],
  ['R','Reach','Sự lan tỏa: Giúp hình ảnh nghệ sĩ kết nối tốt hơn với khán giả.','Kết nối tài năng với cộng đồng và những cơ hội mới.'],
  ['T','Talent','Tài năng: Lấy năng lực biểu diễn làm trọng tâm.','Sáng tạo hình ảnh nhưng không che khuất năng lực thật.'],
  ['I','Identity','Bản sắc: Hình ảnh cá nhân rõ ràng, nhất quán và dễ nhận diện.','Nhất quán từ hồ sơ đến mọi điểm chạm công chúng.'],
  ['S','Storytelling','Nghệ thuật kể chuyện: Truyền tải câu chuyện của nghệ sĩ qua thiết kế và hình ảnh.','Kể hành trình bằng những chương có cảm xúc.'],
]
const chapters = [
  ['STORY','Đằng sau ánh đèn.','Câu chuyện, cá tính và cảm hứng tạo nên hành trình nghệ thuật.'],
  ['WORKS','Từng tác phẩm. Một dấu ấn.','Showreel, tác phẩm và cột mốc được tổ chức thành các chương dễ khám phá.'],
  ['BOOKING','Câu chuyện còn tiếp.','Thông tin hợp tác không bị che bởi hoạt ảnh hay lớp giao diện phức tạp.'],
]
function useReducedMotion(){
  const [reduce,setReduce]=useState(()=>typeof window!=='undefined'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(()=>{const q=window.matchMedia('(prefers-reduced-motion: reduce)');const f=()=>setReduce(q.matches);q.addEventListener?.('change',f);return()=>q.removeEventListener?.('change',f)},[])
  return reduce
}
function useTouchSwipe(left,right){
  const start=useRef(null)
  return {
    onTouchStart:e=>{start.current=[e.touches[0].clientX,e.touches[0].clientY]},
    onTouchEnd:e=>{if(!start.current)return;const dx=e.changedTouches[0].clientX-start.current[0],dy=e.changedTouches[0].clientY-start.current[1];start.current=null;if(Math.abs(dx)<45||Math.abs(dx)<Math.abs(dy)*1.3)return;dx<0?left():right()},
  }
}
export function CaxHeroDeck({images={}}){
  const [selected,setSelected]=useState(0)
  const [expanded,setExpanded]=useState(false)
  const reduce=useReducedMotion()
  const drag=useRef(null)
  const ignoreClickUntil=useRef(0)
  const stageRef=useRef(null)
  const shift=step=>{setExpanded(true);setSelected(i=>(i+step+showcases.length)%showcases.length)}
  const toggleCard=i=>{
    if(Date.now()<ignoreClickUntil.current)return
    if(!expanded){setSelected(i);setExpanded(true)}
    else if(i===selected)setExpanded(false)
    else setSelected(i)
  }
  const pointerDown=e=>{
    if(e.pointerType==='mouse'&&e.button!==0)return
    drag.current={x:e.clientX,y:e.clientY,pointerId:e.pointerId}
  }
  const pointerUp=e=>{
    const start=drag.current
    drag.current=null
    stageRef.current?.style.setProperty('--cax-drag-shift','0px')
    stageRef.current?.classList.remove('is-dragging')
    if(!start||start.pointerId!==e.pointerId)return
    const dx=e.clientX-start.x,dy=e.clientY-start.y
    if(Math.abs(dx)>42&&Math.abs(dx)>Math.abs(dy)*1.25){
      ignoreClickUntil.current=Date.now()+380
      shift(dx<0?1:-1)
    }
  }
  const pointerMove=e=>{
    if(drag.current&&drag.current.pointerId===e.pointerId){
      const dx=e.clientX-drag.current.x,dy=e.clientY-drag.current.y
      if(Math.abs(dx)>8&&Math.abs(dx)>Math.abs(dy)*1.1){
        stageRef.current?.style.setProperty('--cax-drag-shift',Math.max(-48,Math.min(48,dx*.32)).toFixed(1)+'px')
        stageRef.current?.classList.add('is-dragging')
      }
      return
    }
    if(!stageRef.current||reduce||expanded||e.pointerType==='touch')return
    const r=e.currentTarget.getBoundingClientRect()
    const x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5
    stageRef.current.style.setProperty('--cax-look-x',(-y*3).toFixed(2)+'deg')
    stageRef.current.style.setProperty('--cax-look-y',(x*4).toFixed(2)+'deg')
  }
  const pointerLeave=()=>{
    if(stageRef.current){
      stageRef.current.style.setProperty('--cax-look-x','0deg')
      stageRef.current.style.setProperty('--cax-look-y','0deg')
    }
    drag.current=null
    stageRef.current?.style.setProperty('--cax-drag-shift','0px')
    stageRef.current?.classList.remove('is-dragging')
  }
  const current=showcases[selected]
  return <div className={'cax-hero-deck tone-'+selected+(expanded?' cax-deck-expanded':'')} aria-label="Giới thiệu bốn nhóm dịch vụ Dortis">
    <div className="cax-deck-top"><span>DORTIS / SERVICE SHOWCASE</span><span aria-live="polite">{String(selected+1).padStart(2,'0')} / 04</span></div>
    <div className="cax-deck-stage" ref={stageRef} tabIndex={0} aria-roledescription="carousel"
      aria-label={expanded?'Bốn thẻ dịch vụ đã mở. Kéo trái phải hoặc chọn thẻ để xem':'Các thẻ dịch vụ đang xếp chồng. Nhấn thẻ để mở'}
      onPointerDown={pointerDown} onPointerUp={pointerUp} onPointerCancel={()=>{drag.current=null}}
      onPointerMove={pointerMove} onPointerLeave={pointerLeave}
      onKeyDown={e=>{
        if(e.key==='ArrowRight'){e.preventDefault();shift(1)}
        if(e.key==='ArrowLeft'){e.preventDefault();shift(-1)}
        if(e.key==='Escape'&&expanded){e.preventDefault();setExpanded(false)}
      }}>
      <span className="cax-deck-glow" aria-hidden="true"/>
      <span className="cax-deck-ambient-text" aria-hidden="true">DORTIS / CREATIVE MOTION</span>
      {showcases.map((s,i)=>{
        const active=i===selected
        const behind=(i-selected+showcases.length)%showcases.length
        const collapsedX=[0,-8,9,3][behind]
        const collapsedY=[0,3,2,-7][behind]
        const collapsedAngle=[2,-12,13,6][behind]
        const collapsedScale=[1.18,1.08,1.05,.99][behind]
        const fanX=[-62,-21,21,62][i]
        const fanAngle=[-12,-5,5,12][i]
        const cssVars={
          '--cax-fan-x':fanX+'%',
          '--cax-fan-angle':fanAngle+'deg',
          '--cax-stack-x':collapsedX+'%',
          '--cax-stack-y':collapsedY+'%',
          '--cax-stack-angle':collapsedAngle+'deg',
          '--cax-stack-scale':collapsedScale,
          zIndex:active?10:1+(showcases.length-behind),
        }
        return <button type="button" className={'cax-deck-card cax-card-'+i+(active?' is-active':'')}
          key={s.code} style={cssVars} aria-pressed={active}
          aria-label={s.label+(active&&expanded?' – nhấn lại để thu gọn':' – chọn thẻ')}
          onClick={()=>toggleCard(i)}>
          {images.hero&&<img src={images.hero} alt="" className="cax-deck-custom-image" loading="eager"/>}
          <span className="cax-sheet-eyebrow">DORTIS STUDIO / {s.code}</span>
          <strong className="cax-sheet-headline">{s.lines[0]}<span>{s.lines[1]}</span></strong>
          <span className="cax-sheet-footer">{s.kind}<span aria-hidden="true">↗</span></span>
        </button>
      })}
      <span className="cax-deck-interaction-hint">{expanded?'CHỌN THẺ · KÉO TRÁI/PHẢI':'NHẤN THẺ ĐỂ BUNG MỞ'} <span aria-hidden="true">↗</span></span>
    </div>
    <div className="cax-deck-controls">
      <span className="cax-deck-dots" aria-label={'Đang chọn '+current.label}>{showcases.map((s,i)=><button type="button" key={s.code} aria-label={'Chọn '+s.label}
        aria-current={i===selected?'true':undefined} className={i===selected?'active':''}
        onClick={()=>{setExpanded(true);setSelected(i)}}/>)}</span>
      <span className="cax-deck-arrows">
        {expanded&&<button className="cax-deck-collapse" type="button" onClick={()=>setExpanded(false)} aria-label="Thu gọn bốn thẻ">×</button>}
        <button type="button" onClick={()=>shift(-1)} aria-label="Dịch vụ trước">←</button>
        <button type="button" onClick={()=>shift(1)} aria-label="Dịch vụ tiếp theo">→</button>
      </span>
    </div>
    <div className="cax-deck-bottom-row"><span className="cax-deck-status" aria-live="polite">{expanded?'04 THẺ ĐANG MỞ · NHẤN THẺ ĐƯỢC CHỌN ĐỂ THU GỌN':'MỞ THẺ ĐỂ KHÁM PHÁ 4 DỊCH VỤ'}</span>
      <a className="cax-deck-link" href="#dich-vu">KHÁM PHÁ DỊCH VỤ {current.code} ↗</a>
    </div>
  </div>
}
export function CaxServicePanels({services,images={}}){
  const [selected,setSelected]=useState(0),reduce=useReducedMotion()
  const move=e=>{if(reduce||e.pointerType!=='mouse'||!window.matchMedia('(hover:hover) and (pointer:fine)').matches)return;const node=e.currentTarget,rect=node.getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width-.5,y=(e.clientY-rect.top)/rect.height-.5;node.style.setProperty('--cax-rx',(-y*6).toFixed(2)+'deg');node.style.setProperty('--cax-ry',(x*6).toFixed(2)+'deg')}
  const reset=e=>{e.currentTarget.style.setProperty('--cax-rx','0deg');e.currentTarget.style.setProperty('--cax-ry','0deg')}
  return <div className={'cax-service-grid selected-'+selected} role="group" aria-label="Bốn dịch vụ sáng tạo">
    {services.map((s,i)=><button key={s.number} className={'cax-service-card cax-service-'+s.style+(i===selected?' active':'')} type="button" aria-pressed={i===selected} onClick={()=>setSelected(i)} onPointerMove={move} onPointerLeave={reset}>
      <span className="cax-service-card-top"><span>{s.number} / SERVICE</span><span>↗</span></span>
      <span className="cax-service-media">
        {images['service-'+s.style]?<img className="cax-service-upload" src={images['service-'+s.style]} alt="" loading="lazy" onError={e=>{e.currentTarget.style.visibility='hidden'}}/>:
          <span className="cax-service-paper" aria-hidden="true"><span>DORTIS / {s.number}</span><strong>{showcases[i].lines[0]}<span>{showcases[i].lines[1]}</span></strong><small>CREATIVE SERVICE</small></span>}
        <span className="cax-service-corner">{showcases[i].kind}</span>
      </span>
      <span className="cax-service-copy"><small>{s.english}</small><strong>{s.title}</strong><span>{s.description}</span></span>
      <span className="cax-service-detail">{['Hồ sơ biểu diễn · Media kit · Portfolio','Visual identity · Bộ nhận diện · Ứng dụng','Key visual · Poster · Campaign','Creative website · Mobile EPK · Story'][i]}</span>
    </button>)}
  </div>
}
export function CaxArtistExperience(){
  const [mode,setMode]=useState('quick'),[index,setIndex]=useState(0)
  const shift=n=>setIndex(x=>(x+n+3)%3),chapter=chapters[index]
  const touch=useTouchSwipe(()=>shift(1),()=>shift(-1))
  return <section className="cax-artist-experience scene-section" id="trai-nghiem"><div className="section-shell">
    <div className="cax-artist-heading"><div><p className="cax-kicker">04 / CREATIVE ARTIST EXPERIENCE</p><h2>Một nghệ sĩ.<br/><em>Hai cách khám phá.</em></h2><p>Quick EPK để xem thông tin ngay. Explore Mode để bước vào một câu chuyện theo chương.</p></div>
    <div className="cax-mode-toggle" role="group" aria-label="Chọn chế độ trải nghiệm">
      <button type="button" className={mode==='quick'?'active':''} aria-pressed={mode==='quick'} onClick={()=>setMode('quick')}>QUICK EPK</button>
      <button type="button" className={mode==='explore'?'active':''} aria-pressed={mode==='explore'} onClick={()=>setMode('explore')}>EXPLORE</button>
    </div></div>
    <div className="cax-artist-frame"><div className="cax-artist-frame-label"><span>DORTIS / BẢN MẪU MINH HỌA</span><span>{mode==='quick'?'QUICK PORTFOLIO':'IMMERSIVE JOURNEY'}</span></div>
      {mode==='quick'?<div className="cax-quick">
        <div className="cax-quick-cover"><small>FICTIONAL ARTIST / DEMO</small><strong>HẠ<br/>LAM.</strong><span>CONTEMPORARY POP</span></div>
        <div className="cax-quick-info"><p className="cax-kicker">ARTIST / QUICK VIEW</p><h3>Hạ Lam <small>— nghệ sĩ giả lập</small></h3><p>Giới thiệu, video nổi bật, cột mốc và thông tin hợp tác luôn dễ tìm, không cần chờ 3D hay chuyển cảnh.</p>
        <div className="cax-quick-stats"><span><b>BIO</b>Giới thiệu</span><span><b>SHOWREEL</b>Video</span><span><b>CREDITS</b>Dấu mốc</span></div>
        <a href="#dich-vu">KHÁM PHÁ WEBSITE NGHỆ SĨ ↗</a></div>
      </div>:<div className="cax-explore">
        <div className={'cax-explore-screen chapter-'+index} {...touch} tabIndex={0}
          onKeyDown={e=>{if(e.key==='ArrowRight'){e.preventDefault();shift(1)}if(e.key==='ArrowLeft'){e.preventDefault();shift(-1)}}}>
          <span>CHAPTER 0{index+1} / 03 — {chapter[0]}</span><div><strong>{chapter[1]}</strong><p>{chapter[2]}</p></div><small>HẠ LAM / FICTIONAL ARTIST DEMO</small>
        </div>
        <div className="cax-explore-chapters">{chapters.map((c,i)=><button key={c[0]} type="button" className={i===index?'active':''} aria-current={i===index?'step':undefined} onClick={()=>setIndex(i)}><b>0{i+1}</b>{c[0]}</button>)}</div>
        <div className="cax-explore-arrows"><button type="button" aria-label="Chương trước" onClick={()=>shift(-1)}>←</button><button type="button" aria-label="Chương tiếp theo" onClick={()=>shift(1)}>→</button></div>
      </div>}
    </div>
  </div></section>
}
export function CaxBrandValues(){
  const [flips,setFlips]=useState([])
  const toggle=x=>setFlips(curr=>curr.includes(x)?curr.filter(y=>y!==x):[...curr,x])
  return <section id="gia-tri" className="cax-values section-shell scene-section">
    <header className="cax-values-heading"><div><p className="cax-kicker">06 / WHAT MAKES DORTIS</p><h2>Điều tạo nên<br/><em>DORTIS.</em></h2></div><p>Sáu chữ cái. Sáu giá trị tạo nên bản sắc và cách Dortis sáng tạo.</p></header>
    <div className="cax-values-grid">{values.map(([initial,name,meaning,extra],i)=><button key={initial} type="button" aria-pressed={flips.includes(initial)} className={'cax-value-card tone-'+i+(flips.includes(initial)?' flipped':'')} onClick={()=>toggle(initial)}>
      <span className="cax-value-inner"><span className="cax-value-face front"><span className="cax-value-initial">{initial}</span><span className="cax-value-summary"><strong>{name}</strong><span>{meaning}</span></span><small>CHẠM ĐỂ XEM THÊM ↗</small></span><span className="cax-value-face back"><b>{initial} / {name.toUpperCase()}</b><span>{extra}</span><small>↶ TRỞ LẠI</small></span></span>
    </button>)}</div>
  </section>
}
export function CaxFinalFan({imageUrl}){
  const [front,setFront]=useState(0)
  const cards=[['PORTFOLIO','CREATIVE IDENTITY.'],['ARTIST BRAND','YOUR STORY.'],['DIGITAL','BEYOND THE STAGE.']]
  return <div className="cax-fan-deck" aria-label="Giới thiệu ba hướng sáng tạo">
    <div className="cax-fan-stack">{cards.map(([type,title],i)=><div key={type} className={'cax-fan-card position-'+((i-front+3)%3)}>
      {imageUrl&&<img src={imageUrl} alt="" loading="lazy"/>}<span>0{i+1} / {type}</span><strong>{title}</strong><small>DORTIS CREATIVE CONCEPT</small>
    </div>)}</div>
    <div className="cax-fan-controls"><span>CREATIVE PRODUCT DECK</span><button type="button" onClick={()=>setFront(i=>(i+1)%3)}>XEM THẺ TIẾP ↗</button></div>
  </div>
}
