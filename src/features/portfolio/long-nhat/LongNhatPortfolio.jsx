import React, { useState } from 'react'
import { LONG_NHAT_PORTFOLIO, PORTFOLIO_REQUIREMENTS, canPublishPortfolio } from './data'
import { UiPanel, UiStatus, UiButton } from '../../../shared/ui'

const MODULES = [
  {id:'hero',name:'01 / Nhận diện',detail:'Hero, ảnh được duyệt, CTA xem/nghe ngay',type:'ASSET_PENDING'},
  {id:'bio',name:'02 / Hồ sơ ngắn',detail:'Thông tin nghệ sĩ và điểm khác biệt có nguồn',type:'DATA_PENDING'},
  {id:'performance',name:'03 / Khả năng biểu diễn',detail:'Thể loại, format show, thế mạnh cần xác thực',type:'DATA_PENDING'},
  {id:'media',name:'04 / Xem và nghe',detail:'Showreel, video, âm nhạc từ kênh chính thức',type:'ASSET_PENDING'},
  {id:'credits',name:'05 / Dấu mốc',detail:'Sự kiện, thành tích, chứng thực có tài liệu đối chiếu',type:'VERIFICATION_PENDING'},
  {id:'gallery',name:'06 / Hình ảnh',detail:'Ảnh chất lượng cao và quyền sử dụng',type:'ASSET_PENDING'},
  {id:'booking',name:'07 / Liên hệ booking',detail:'Kênh liên hệ được phép công khai',type:'PUBLIC_APPROVAL_PENDING'}
]

export function PortfolioUnpublished() {
  return <main className="ui-public-notice">
    <p>DORTIS / PORTFOLIO</p>
    <h1>Trang Portfolio chưa được phát hành.</h1>
    <p>Phiên bản đang trong giai đoạn chuẩn bị nội dung và phê duyệt. Không có thông tin booking giả hoặc hình ảnh chưa được cấp phép.</p>
    <a href="/">Trở về trang chủ</a>
  </main>
}

export default function LongNhatPortfolio() {
  const [mode, setMode] = useState('quick')
  return <div className="ui-portfolio-workspace">
    <header className="ui-portfolio-heading">
      <p>DORTIS / ARTIST WEBSITE TEMPLATE <UiStatus>INTERNAL DRAFT</UiStatus></p>
      <h1>{LONG_NHAT_PORTFOLIO.artistDisplayName}</h1>
      <p>Khung kỹ thuật trước khi nhận Portfolio. Giao diện nghệ sĩ chưa khóa màu sắc, font hay art direction.</p>
    </header>
    <div className="ui-segment" role="group" aria-label="Chế độ xem Portfolio">
      <UiButton variant={mode==='quick'?'primary':'secondary'} onClick={()=>setMode('quick')}>Quick Portfolio / EPK</UiButton>
      <UiButton variant={mode==='journey'?'primary':'secondary'} onClick={()=>setMode('journey')}>Immersive Journey</UiButton>
    </div>
    <UiPanel title={mode==='quick'?'Khung Quick Portfolio / EPK':'Khung hành trình nghệ thuật'}
      subtitle={mode==='quick'?'Ưu tiên xem nhanh thông tin và booking trên mobile.':'Phân chương sáng tạo, chỉ thiết kế motion khi được duyệt DNA.'}>
      <div className="ui-portfolio-modules">
        {MODULES.map((item,index)=><article className="ui-portfolio-module" key={item.id}>
          <div className="ui-portfolio-module__visual" aria-label="Placeholder chờ tư liệu">
            <span>{String(index+1).padStart(2,'0')}</span>
            <small>{item.type}</small>
          </div>
          <div><h3>{item.name}</h3><p>{item.detail}</p></div>
        </article>)}
      </div>
    </UiPanel>
    <UiPanel title="Điều kiện khóa thiết kế và phát hành"
      subtitle="Các mục dưới đây chưa có nguồn được duyệt. Không giả định Portfolio đã được phân tích.">
      <div className="ui-input-list">{PORTFOLIO_REQUIREMENTS.map(item=><div key={item.id}>
        <strong>{item.id} · {item.title}</strong>
        <p>{item.detail}</p><UiStatus>{item.state}</UiStatus>
      </div>)}</div>
      <p className="ui-portfolio-note">Trạng thái phát hành: {canPublishPortfolio()?'SẴN SÀNG':'CHƯA ĐỦ ĐIỀU KIỆN'}.
        Tài liệu phân tích, wireframe và danh sách đầu vào nằm trong thư mục docs/ và design/ của dự án.</p>
    </UiPanel>
  </div>
}
