import React, { useState } from 'react'

const chapters = [
  {
    number: '01', title: 'Tài năng', label: 'TALENT',
    description: 'Giọng hát, kỹ thuật và cá tính biểu diễn là điểm khởi đầu của mọi hình ảnh nghệ sĩ.',
  },
  {
    number: '02', title: 'Câu chuyện', label: 'STORY',
    description: 'Dortis lắng nghe những dấu mốc, cảm xúc và hành trình riêng trước khi bắt đầu thiết kế.',
  },
  {
    number: '03', title: 'Dấu ấn', label: 'IDENTITY',
    description: 'Tài năng và câu chuyện được kết nối thành một hình ảnh nhất quán, dễ nhận ra và bền vững.',
  },
]

export default function PhilosophyStoryCard({ imageUrl }) {
  const [selected, setSelected] = useState(1)
  return <aside className="dortis-philosophy-card dortis-philosophy-story" aria-label="Ba lớp câu chuyện của Dortis">
    {imageUrl ? <img className="dortis-philosophy-photo" src={imageUrl} alt="" loading="lazy" /> : null}
    <span className="dortis-philosophy-card-top">DORTIS / ARTIST IDENTITY</span>
    <div className="dortis-philosophy-symbol dortis-philosophy-watermark" aria-hidden="true"><span>D</span><span>T</span></div>
    <div className="dortis-philosophy-story-content">
      <h3>Một dấu ấn được tạo nên <em>như thế nào?</em></h3>
      <div className="dortis-philosophy-story-list" role="group" aria-label="Các yếu tố làm nên hình ảnh nghệ sĩ">
        {chapters.map((chapter, index) => {
          const active = selected === index
          return <button type="button" key={chapter.number} className={'dortis-philosophy-story-item'+(active?' is-active':'')}
            aria-expanded={active} onClick={() => setSelected(index)}>
            <span className="dortis-philosophy-story-row">
              <span className="dortis-philosophy-story-num">{chapter.number}</span>
              <span className="dortis-philosophy-story-title">{chapter.title}</span>
              <span className="dortis-philosophy-story-label">{chapter.label}</span>
              <span className="dortis-philosophy-story-icon" aria-hidden="true">{active?'−':'↗'}</span>
            </span>
            <span className="dortis-philosophy-story-answer">
              <span className="dortis-philosophy-story-answer-inner">{chapter.description}</span>
            </span>
          </button>
        })}
      </div>
    </div>
    <div className="dortis-philosophy-card-bottom"><span>ART</span><span>IDENTITY</span><span>EMOTION</span></div>
  </aside>
}
