import React, { useState } from 'react'
import './dortis-faq.css'

export default function DortisFAQ({ items = [] }) {
  const [activeIndex, setActiveIndex] = useState(0)

  const tilt = event => {
    if (event.pointerType !== 'mouse' || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const node = event.currentTarget
    const rect = node.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width - 0.5
    const y = (event.clientY - rect.top) / rect.height - 0.5
    node.style.setProperty('--faq-rotate-x', (-y * 2.5).toFixed(2) + 'deg')
    node.style.setProperty('--faq-rotate-y', (x * 3.5).toFixed(2) + 'deg')
  }
  const resetTilt = event => {
    event.currentTarget.style.setProperty('--faq-rotate-x', '0deg')
    event.currentTarget.style.setProperty('--faq-rotate-y', '0deg')
  }

  return <section id="cau-hoi" className="dortis-faq scene-section" aria-labelledby="dortis-faq-title">
    <div className="section-shell dortis-faq-layout">
      <header className="dortis-faq-editorial">
        <div className="dortis-faq-section-mark">
          <span>07</span><i aria-hidden="true" /><span>FREQUENTLY ASKED QUESTIONS</span>
        </div>
        <h2 id="dortis-faq-title">Một vài điều <em>bạn muốn biết.</em></h2>
        <p className="dortis-faq-intro">Mỗi câu hỏi là điểm khởi đầu cho một câu chuyện sáng tạo. Khám phá cách Dortis đồng hành cùng nghệ sĩ.</p>
        <div className="dortis-faq-orbit" aria-hidden="true">
          <span className="dortis-faq-orbit-ring ring-first" />
          <span className="dortis-faq-orbit-ring ring-second" />
          <strong>?</strong><span className="dortis-faq-orbit-sign">DORTIS / CURIOSITY IS CREATIVE</span>
        </div>
        <a className="dortis-faq-discover" href="#dich-vu">KHÁM PHÁ DỊCH VỤ <span aria-hidden="true">↗</span></a>
      </header>
      <div className="dortis-faq-content">
        <div className="dortis-faq-content-top"><span>HỎI ĐÁP / DORTIS STUDIO</span><span>{String(items.length).padStart(2, '0')} CÂU HỎI</span></div>
        <div className="dortis-faq-items">
          {items.map(([question, answer], index) => {
            const expanded = activeIndex === index
            const answerId = 'dortis-faq-answer-' + index
            return <div key={question} className={'dortis-faq-item' + (expanded ? ' is-open' : '')}
              style={{ '--faq-delay': (index * 65) + 'ms' }} onPointerMove={tilt} onPointerLeave={resetTilt}>
              <button type="button" className="dortis-faq-question" aria-expanded={expanded}
                aria-controls={answerId} onClick={() => setActiveIndex(expanded ? -1 : index)}>
                <span className="dortis-faq-number">{String(index + 1).padStart(2, '0')}</span>
                <span className="dortis-faq-question-text">{question}</span>
                <span className="dortis-faq-toggle" aria-hidden="true"><span /></span>
              </button>
              <div className="dortis-faq-answer-wrap" id={answerId} aria-hidden={!expanded}>
                <div className="dortis-faq-answer-inner"><p>{answer}</p>
                  <span className="dortis-faq-answer-foot">DORTIS / YOUR CREATIVE PARTNER</span>
                </div>
              </div>
            </div>
          })}
        </div>
        <div className="dortis-faq-bottom">
          <span>OPEN CONVERSATION / OPEN POSSIBILITIES</span>
          <span className="dortis-faq-progress" aria-label={'Đang mở câu ' + (activeIndex < 0 ? 'không có' : activeIndex + 1)}>
            {items.map((_, index) => <i key={index} className={index === activeIndex ? 'active' : ''} />)}
          </span>
        </div>
      </div>
    </div>
  </section>
}
