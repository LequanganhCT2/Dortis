import React from 'react'
import { resolveRoute } from './routes'
import DortisHome from '../pages/DortisHome'
import AdminPage from '../AdminPage'
import ArtistPages from '../ArtistPages'
import { PortfolioUnpublished } from '../features/portfolio/long-nhat/LongNhatPortfolio'

function NotFound() {
  return <main className="ui-public-notice">
    <p>DORTIS / 404</p><h1>Trang không tồn tại.</h1>
    <a href="/">Trở về DORTIS</a>
  </main>
}
export default function AppRouter() {
  switch (resolveRoute(window.location.pathname)) {
    case 'home': return <DortisHome/>
    case 'admin': return <AdminPage/>
    case 'artists': return <ArtistPages/>
    case 'portfolio-unpublished': return <PortfolioUnpublished/>
    default: return <NotFound/>
  }
}
