import test from 'node:test'
import assert from 'node:assert/strict'
import {portfolioReadingLine,pickPortfolioActiveSection} from '../src/features/portfolio/templates/sectionNavigation.js'
import {readFileSync} from 'node:fs'
const src=name=>readFileSync(new URL('../src/features/portfolio/templates/'+name,import.meta.url),'utf8')
const page=(id,top,bottom)=>({id:'pt-'+id,getBoundingClientRect:()=>({top,bottom})})

test('Reading line is below sticky header, inside visible content',()=>{
  assert.ok(portfolioReadingLine(78,900)>200)
  assert.ok(portfolioReadingLine(78,900)<900)
  assert.equal(portfolioReadingLine(100,105),104)
})
test('Selecting third section immediately highlights third, not second',()=>{
  const pages=[
    page('hero',-1550,-760),
    page('story',-760,95),
    page('journey',95,850),
    page('skills',850,1650)
  ]
  assert.equal(pickPortfolioActiveSection(pages,78,900),'journey')
})
test('Correct tab tracks each section as the Portfolio scrolls',()=>{
  const ids=['hero','story','journey','skills','achievements','performance','gallery','contact']
  for(let i=0;i<ids.length;i++){
    const positions=ids.map((id,j)=>page(id,98+(j-i)*780,878+(j-i)*780))
    assert.equal(pickPortfolioActiveSection(positions,78,900),ids[i])
  }
})
test('Works with taller mobile header and different viewport sizes',()=>{
  const areas=[page('story',-600,129),page('journey',129,800),page('skills',800,1400)]
  assert.equal(pickPortfolioActiveSection(areas,110,740),'journey')
  assert.equal(pickPortfolioActiveSection(areas,110,280),'journey')
})
test('Falls back to closest section if reading line lies in gap',()=>{
  const areas=[page('story',-100,200),page('journey',270,650)]
  assert.equal(pickPortfolioActiveSection(areas,70,620),'journey')
  assert.equal(pickPortfolioActiveSection([],70,620),'')
})
test('Scroll listener handles preview and window; selected click is locked until arrival',()=>{
  const site=src('PortfolioTemplateSite.jsx')
  const css=src('portfolio-sticky-nav.css')
  assert.match(site,/document\.addEventListener\('scroll',schedule,\{capture:true,passive:true\}\)/)
  assert.match(site,/window\.addEventListener\('scroll',schedule/)
  assert.match(site,/pendingNavigationRef\.current=id/)
  assert.match(site,/if\(!pending\|\|pending===next\)/)
  assert.match(site,/pendingNavigationRef\.current=null/)
  assert.match(site,/pickPortfolioActiveSection\(sections,navBottom,viewportBottom\)/)
  assert.match(css,/scroll-margin-top:calc\(var\(--pt-nav-height/)
})
test('First menu option is fully available: no logo and no role on either end',()=>{
  const site=src('PortfolioTemplateSite.jsx')
  const css=src('portfolio-sticky-nav.css')
  const header=site.split('!focusedSectionId&&<header')[1]?.split('</header>')[0]
  assert.ok(header)
  assert.doesNotMatch(header,/pt-site__brand|pt-site__nav-meta/)
  assert.match(header,/navSections\.map\(s=>/)
  assert.match(css,/grid-template-columns:minmax\(0,1fr\)/)
  assert.match(css,/overflow-x:auto/)
})
