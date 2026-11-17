import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {PRESET_FORMS,blueprintFor,resolveInstance} from '../src/features/portfolio/templates/model.js'

const src=file=>readFileSync(new URL(
  '../src/features/portfolio/templates/'+file,import.meta.url),'utf8')

test('Silk Atelier 01 and Silk Flow 02 share a single UI class and CSS file',()=>{
  const site=src('PortfolioTemplateSite.jsx')
  const css=src('portfolio-shared-ui.css')
  assert.match(site,/import '.\/portfolio-shared-ui\.css'/)
  assert.match(site,/const sharedPortfolioUI=continuousSilk&&!useClassic/)
  assert.match(site,/sharedPortfolioUI\?' pt-site--shared-ui'/)
  assert.match(css,/\.pt-site\.pt-site--shared-ui\.pt-site--ribbon\.pt-site--continuous-silk/)
  assert.match(css,/> header\.pt-site__nav\.pt-site__nav--sticky/)
  assert.match(css,/> footer\.pt-site__footer/)
  assert.match(css,/pt-ribbon__copy h2/)
  assert.match(css,/pt-ribbon__copy p/)
  assert.match(css,/\.pt-photo-reveal/)
  assert.match(css,/prefers-reduced-motion:reduce/)
})
test('Template 01 keeps its existing colors and background, Template 02 keeps blue-white',()=>{
  const [atelier,flow]=PRESET_FORMS.map(form=>
    resolveInstance({...form,blueprint:blueprintFor(form)},
      {content:{}},{name:'Demo'}))
  assert.equal(atelier.visualTheme,'ribbon-luxury')
  assert.equal(flow.visualTheme,'silk-flow')
  assert.equal(atelier.colorPalette,'red-gold')
  assert.equal(flow.colorPalette,'ice-blue')
  const css=src('portfolio-shared-ui.css')
  for(const palette of ['red-white','yellow-white','black-white',
    'seafoam-white','silver-white','navy-white']){
    assert.match(css,new RegExp('pt-palette--'+palette))
  }
  assert.match(css,/--pt-ui-nav-from:#230408ed/)
  assert.match(css,/--pt-ui-nav-from:#fbfefff5/)
  assert.match(src('silk-flow.css'),/pt-site--silk-flow/)
  assert.match(src('portfolio-continuous-silk.css'),/--pt-ink:#fff1e3/)
})
test('Both templates use one animation engine and shared UI without duplicating it per-template',()=>{
  const site=src('PortfolioTemplateSite.jsx')
  const css=src('portfolio-shared-ui.css')
  const flow=src('silk-flow.css')
  const effects=src('scroll-text-atmosphere.css')
  assert.equal((site.match(/<ScrollTextAtmosphere /g)||[]).length,1)
  assert.match(site,/speed=\{revealSpeed\}/)
  assert.match(site,/publicPage=\{publicPage\}/)
  assert.match(effects,/pt-description-word-rise/)
  assert.match(effects,/\.pt-photo-reveal/)
  assert.doesNotMatch(flow,/Silk Flow chrome: the shared Silk Atelier styles/)
  assert.doesNotMatch(css,/@keyframes pt-block-enter/)
})
test('Published route opts into window scrolling while Admin library preview retains pane scrolling',()=>{
  const pub=src('PublishedPortfolio.jsx')
  const manager=src('PortfolioTemplateManager.jsx')
  const motion=src('ScrollTextAtmosphere.jsx')
  assert.match(pub,/publishedView=\{view\} template=\{publishedTemplate\} publicPage/)
  assert.match(manager,/publishedView=\{demoView\}/)
  assert.match(motion,/const scrollingHost=!publicPage&&host&&/)
})
