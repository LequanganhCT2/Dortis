import React, { lazy, Suspense } from 'react'
import { resolveRoute } from './routes'

// Load public website, private workspace and artist profiles on demand.
// Guest visits do not need to download Admin editing screens.
const DortisHome = lazy(()=>import('../pages/DortisHome'))
const AdminPage = lazy(()=>import('../AdminPage'))
const ArtistPages = lazy(()=>import('../ArtistPages'))
const PortfolioUnpublished = lazy(()=>import('../features/portfolio/long-nhat/LongNhatPortfolio')
  .then(mod=>({default:mod.PortfolioUnpublished})))

function NotFound() {
  return <main className="ui-public-notice">
    <p>DORTIS / 404</p><h1>Trang không tồn tại.</h1>
    <a href="/">Trở về DORTIS</a>
  </main>
}
export default function AppRouter() {
  const route=resolveRoute(window.location.pathname)
  let Screen=NotFound
  if(route==='home')Screen=DortisHome
  else if(route==='admin')Screen=AdminPage
  else if(route==='artists')Screen=ArtistPages
  else if(route==='portfolio-unpublished')Screen=PortfolioUnpublished
  return <Suspense fallback={<main className="ui-public-notice" role="status">
    <p>DORTIS</p><h1>Đang tải nội dung...</h1>
  </main>}><Screen/></Suspense>
}
