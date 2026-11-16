import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {PRESET_FORMS,blueprintFor,resolveInstance} from '../src/features/portfolio/templates/model.js'
const src=name=>readFileSync(new URL('../src/features/portfolio/templates/'+name,import.meta.url),'utf8')

test('All eight Silk Atelier section labels, not editable headings, appear in the header',()=>{
  const form=PRESET_FORMS[0]
  assert.equal(form.sections.length,8)
  const template={id:'form',name:form.name,blueprint:blueprintFor(form)}
  const view=resolveInstance(template,{content:{sections:{story:{title:'Tiêu đề sáng tạo riêng'}}}},
    {name:'Nghệ sĩ'})
  assert.equal(view.sections.length,8)
  assert.equal(view.sections[1].label,'02 · Câu chuyện nghệ thuật')
  const site=src('PortfolioTemplateSite.jsx')
  assert.match(site,/const navSections=view\.sections/)
  assert.match(site,/navSections\.map\(s=>/)
  assert.match(site,/s\.label\.replace\(/)
  assert.doesNotMatch(site,/pt-site__nav-number/)
  assert.equal(view.sections[1].label.replace(/^\s*(?:\d+\s*\/\s*)?\d+\s*[·.:\-/]\s*/,''),'Câu chuyện nghệ thuật')
  assert.equal('07 / 07 · Thư viện nghệ thuật'.replace(/^\s*(?:\d+\s*\/\s*)?\d+\s*[·.:\-/]\s*/,''),'Thư viện nghệ thuật')
  assert.doesNotMatch(site,/activeSections\.slice\(0,4\)/)
  assert.doesNotMatch(site,/s\.title\?s\.title\.slice\(0,27\):s\.label/)
})

test('Portfolio header sticks on published website and scrollable Admin preview',()=>{
  const site=src('PortfolioTemplateSite.jsx')
  const css=src('portfolio-sticky-nav.css')
  const silk=src('silk-stage-backdrop.css')
  assert.match(site,/className="pt-site__nav pt-site__nav--sticky"/)
  assert.match(site,/document\.addEventListener\('scroll',schedule,\{capture:true,passive:true\}\)/)
  assert.match(site,/pickPortfolioActiveSection\(sections,navBottom,viewportBottom\)/)
  assert.match(site,/section\.scrollIntoView/)
  assert.match(site,/pendingNavigationRef\.current=id/)
  assert.match(site,/nav\.scrollTo/)
  assert.match(site,/setActiveSectionId\(/)
  assert.match(site,/aria-current=\{activeSectionId===s\.id\?'location':undefined\}/)
  assert.match(site,/--pt-nav-progress/)
  assert.match(css,/position:sticky!important/)
  assert.match(css,/top:0/)
  assert.match(css,/overflow:clip!important/)
  assert.match(css,/grid-column:1\/-1/)
  assert.match(css,/grid-template-columns:minmax\(0,1fr\)/)
  assert.doesNotMatch(site,/className="pt-site__brand"/)
  assert.doesNotMatch(site,/className="pt-site__nav-meta"/)
  assert.doesNotMatch(css,/grid-template-columns:minmax\(108px,max-content\)/)
  assert.match(css,/nav\.pt-site__nav-links\{[\s\S]*?display:flex!important/)
  assert.match(css,/prefers-reduced-motion:reduce/)
  assert.match(silk,/pt-site--continuous-silk/)
})

test('Header has subtle motion and highlights active section without hiding mobile entries',()=>{
  const css=src('portfolio-sticky-nav.css')
  assert.match(css,/@keyframes pt-nav-appear/)
  assert.match(css,/@keyframes pt-nav-sheen/)
  assert.match(css,/\.pt-site__nav-links a\.is-active/)
  assert.match(css,/scrollbar-width:none/)
  assert.match(css,/overflow-x:auto/)
  assert.match(css,/--pt-nav-height/)
  assert.match(site,/ResizeObserver\(resizeHeader\)/)
  assert.match(css,/backdrop-filter:blur\(16px\)/)
  assert.match(css,/\.pt-site__nav-progress/)
})
