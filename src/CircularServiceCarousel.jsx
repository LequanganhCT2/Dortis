import { getMediaUrls, RotatingImage } from './SiteMedia'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import './circular-services.css'

const MAX_ITEMS = 10
const SHOWCASE_LABELS = ['HỒ SƠ NGHỆ SĨ', 'THƯƠNG HIỆU NGHỆ SĨ', 'THỊ GIÁC TRUYỀN THÔNG', 'KHÔNG GIAN SỐ']
const SHOWCASE_TITLES = [['CV &', 'Portfolio'], ['Artist', 'Branding'], ['Visual', 'Campaign'], ['Artist', 'Website']]
const GALLERY_NUMBERS = [5, 6, 7, 8, 9, 10]
const details = [
  'Hồ sơ biểu diễn · Media kit · Portfolio',
  'Visual identity · Bộ nhận diện · Ứng dụng',
  'Key visual · Poster · Campaign',
  'Creative website · Mobile EPK · Story',
]

function wrappedDistance(index, active, length) {
  let distance = (index - active + length) % length
  if (distance > Math.floor(length / 2)) distance -= length
  return distance
}

export default function CircularServiceCarousel({ services = [], images = {}, galleries = {} }) {
  const stageRef = useRef(null)
  const pointerStart = useRef(null)
  const suppressClick = useRef(false)
  const [active, setActive] = useState(0)
  const [stageWidth, setStageWidth] = useState(1200)
  const [dragging, setDragging] = useState(false)

  const items = useMemo(() => {
    const core = services.slice(0, 4).map((service, index) => ({
      key: 'service-' + service.style,
      number: service.number,
      title: service.title,
      subtitle: service.english,
      description: service.description,
      category: SHOWCASE_LABELS[index],
      lines: SHOWCASE_TITLES[index],
      imageUrls: getMediaUrls(images,galleries,'service-' + service.style),
      image: getMediaUrls(images,galleries,'service-' + service.style)[0] || null,
      details: details[index],
      className: 'cax-service-' + service.style,
    }))
    const extra = GALLERY_NUMBERS.map(number => {
      const label = String(number).padStart(2, '0')
      const media = getMediaUrls(images,galleries,'service-gallery-' + label)
      const image = media[0]
      return image ? {
        key: 'service-gallery-' + label,
        number: label,
        title: 'Thư viện thiết kế ' + label,
        subtitle: 'DORTIS CREATIVE SHOWCASE',
        description: 'Hình ảnh thiết kế được chọn và đăng bởi quản trị viên Dortis.',
        category: 'CREATIVE GALLERY',
        lines: ['Creative', 'Showcase'],
        image,
        imageUrls: media,
        details: 'Tài sản hình ảnh đã được cho phép giới thiệu công khai',
        className: 'cax-service-gallery',
      } : null
    }).filter(Boolean)
    return [...core, ...extra].slice(0, MAX_ITEMS)
  }, [services, images, galleries])

  const total = items.length
  const current = items[Math.min(active, Math.max(total - 1, 0))]
  const visibleRadius = stageWidth < 700 ? 1 : 2

  useEffect(() => {
    const element = stageRef.current
    if (!element) return
    const update = () => setStageWidth(Math.round(element.getBoundingClientRect().width))
    update()
    if (!('ResizeObserver' in window)) {
      window.addEventListener('resize', update)
      return () => window.removeEventListener('resize', update)
    }
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (active >= total && total) setActive(0)
  }, [active, total])

  const go = step => setActive(index => (index + step + total) % total)
  const select = index => {
    if (suppressClick.current) return
    setActive(index)
  }
  const resetDrag = () => {
    pointerStart.current = null
    setDragging(false)
    stageRef.current?.style.setProperty('--cax-circle-drag', '0px')
  }
  const onPointerDown = event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    pointerStart.current = { x: event.clientX, y: event.clientY, id: event.pointerId }
    suppressClick.current = false
  }
  const onPointerMove = event => {
    const start = pointerStart.current
    if (!start || start.id !== event.pointerId) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.abs(dx) < 9 || Math.abs(dx) < Math.abs(dy) * 1.2) return
    if (!dragging) setDragging(true)
    stageRef.current?.style.setProperty('--cax-circle-drag', Math.max(-65, Math.min(65, dx * .32)).toFixed(1) + 'px')
  }
  const onPointerUp = event => {
    const start = pointerStart.current
    if (!start || start.id !== event.pointerId) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      suppressClick.current = true
      go(dx < 0 ? 1 : -1)
      // React dispatches click after pointerup; clear suppression on next task.
      window.setTimeout(() => { suppressClick.current = false }, 0)
    }
    resetDrag()
  }

  if (!total) return null

  return <div className="cax-circle-carousel" aria-label="Vòng xoay dịch vụ Dortis">
    <div className="cax-circle-topline">
      <span>DORTIS / INTERACTIVE SERVICE ORBIT</span>
      <span aria-live="polite">{String(active + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
    </div>
    <div ref={stageRef} className={'cax-circle-stage' + (dragging ? ' is-dragging' : '')}
      tabIndex={0} role="group" aria-roledescription="carousel" aria-label="Kéo sang trái hoặc phải để xoay vòng dịch vụ"
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
      onPointerCancel={resetDrag} onPointerLeave={resetDrag}
      onKeyDown={event => {
        if (event.target !== event.currentTarget) return
        if (event.key === 'ArrowRight') { event.preventDefault(); go(1) }
        if (event.key === 'ArrowLeft') { event.preventDefault(); go(-1) }
      }}>
      <div className="cax-circle-orbit-line" aria-hidden="true" />
      {items.map((item, index) => {
        const difference = wrappedDistance(index, active, total)
        const abs = Math.abs(difference)
        const visible = abs <= visibleRadius
        const slide = Math.max(-(visibleRadius + 1), Math.min(visibleRadius + 1, difference))
        const radius = Math.min(stageWidth * .405, 505)
        const x = Math.sin(slide * .58) * radius
        const y = (1 - Math.cos(slide * .58)) * (stageWidth < 700 ? 84 : 115)
        const rotation = -slide * 10
        const scale = Math.max(.66, 1 - abs * .12)
        const style = {
          transform: 'translate3d(calc(-50% + ' + x.toFixed(1) + 'px + var(--cax-circle-drag, 0px)), calc(-50% + ' + y.toFixed(1) + 'px), 0) rotateY(' + rotation + 'deg) rotateZ(' + (slide * 1.8) + 'deg) scale(' + scale + ')',
          opacity: visible ? 1 : 0,
          zIndex: 30 - abs,
          pointerEvents: visible ? 'auto' : 'none',
        }
        return <button type="button" key={item.key} style={style}
          tabIndex={visible ? 0 : -1}
          aria-hidden={!visible}
          aria-pressed={index === active}
          aria-label={'Chọn ' + item.title}
          className={'cax-circle-card ' + item.className + (index === active ? ' is-active' : '')}
          onClick={() => select(index)}>
          <span className="cax-circle-card-top"><span>{item.number} / {index < 4 ? 'SERVICE' : 'GALLERY'}</span><span aria-hidden="true">↗</span></span>
          <span className="cax-circle-media">
            {item.image ? <RotatingImage urls={item.imageUrls} className="cax-circle-photo" loading={abs <= 1 ? 'eager' : 'lazy'}/> :
              <span className="cax-circle-paper" aria-hidden="true">
                <small>DORTIS / {item.number}</small>
                <strong>{item.lines[0]}<span>{item.lines[1]}</span></strong>
                <small>CREATIVE SERVICE</small>
              </span>}
            <span className="cax-circle-category">{item.category}</span>
          </span>
          <span className="cax-circle-copy">
            <small>{item.subtitle}</small>
            <strong>{item.title}</strong>
            <span>{item.description}</span>
          </span>
          <span className="cax-circle-detail">{item.details}</span>
        </button>
      })}
      <span className="cax-circle-stage-hint" aria-hidden="true">← KÉO ĐỂ XOAY VÒNG →</span>
    </div>
    <div className="cax-circle-bottom">
      <div className="cax-circle-arrows">
        <button type="button" onClick={() => go(-1)} aria-label="Dịch vụ trước">←</button>
        <button type="button" onClick={() => go(1)} aria-label="Dịch vụ tiếp theo">→</button>
      </div>
      <div className="cax-circle-dots" aria-label="Chọn thẻ trong vòng xoay">
        {items.map((item, index) => <button key={item.key} type="button"
          className={index === active ? 'active' : ''}
          aria-label={'Chọn thẻ ' + String(index + 1)}
          aria-current={index === active ? 'true' : undefined}
          onClick={() => setActive(index)} />)}
      </div>
      <div className="cax-circle-count">HIỂN THỊ TỐI ĐA 5 / TỐI ĐA 10 ẢNH</div>
    </div>
    <p className="cax-circle-caption" aria-live="polite"><strong>{current.title}</strong> · {current.details}</p>
  </div>
}
