import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {PRESET_FORMS,blueprintFor,normalizeBlueprint,normalizeTemplateBlueprint,resolveInstance} from '../src/features/portfolio/templates/model.js'
import {paletteOptionsForTheme,normalizePortfolioPalette} from '../src/features/portfolio/templates/portfolioPalette.js'
import {FLOW_SHEETS,buildChiffonSheets} from '../src/features/portfolio/templates/silkFlowGeometry.js'

const src=name=>readFileSync(new URL(
 '../src/features/portfolio/templates/'+name,import.meta.url),'utf8')
const sql=readFileSync(new URL(
 '../supabase/seeds/seed_silk_flow_template.sql',import.meta.url),'utf8')

test('Template 02 inherits the exact Atelier section structure without touching Template 01',()=>{
  assert.deepEqual(PRESET_FORMS.map(p=>p.slug),['silk-atelier','silk-flow'])
  assert.deepEqual(PRESET_FORMS[1].sections,PRESET_FORMS[0].sections)
  assert.equal(PRESET_FORMS[0].sections.length,8)
  assert.equal(blueprintFor(PRESET_FORMS[0]).visualTheme,'ribbon-luxury')
  assert.equal(blueprintFor(PRESET_FORMS[0]).colorPalette,'red-gold')
  assert.equal(blueprintFor(PRESET_FORMS[1]).visualTheme,'silk-flow')
  assert.equal(blueprintFor(PRESET_FORMS[1]).colorPalette,'ice-blue')
  assert.equal(normalizeBlueprint(blueprintFor(PRESET_FORMS[1])).visualTheme,'silk-flow')
})

test('Palette choices of Flow are separate from the four Atelier choices',()=>{
  assert.deepEqual(paletteOptionsForTheme('silk-flow').map(x=>x.id),[
    'ice-blue','seafoam-white','silver-white','navy-white'
  ])
  assert.deepEqual(paletteOptionsForTheme('ribbon-luxury').map(x=>x.id),[
    'red-gold','red-white','yellow-white','black-white'
  ])
  assert.equal(normalizePortfolioPalette('ice-blue'),'ice-blue')
  assert.equal(normalizePortfolioPalette('red-gold'),'red-gold')
  const template={blueprint:blueprintFor(PRESET_FORMS[1])}
  const view=resolveInstance(template,{content:{}},{name:'Nhân vật'})
  assert.equal(view.colorPalette,'ice-blue')
  assert.equal(view.sections.length,8)
  assert.equal(resolveInstance(template,{content:{colorPalette:'silver-white'}},{name:'B'}).colorPalette,'silver-white')
})

test('Chiffon is procedural, translucent, responsive to all four ribbon layouts',()=>{
  assert.equal(FLOW_SHEETS.length,3)
  const layouts=[
    ['horizontal','to-right'],['vertical','left'],
    ['diagonal','down-left'],['curtain','inward']
  ]
  for(const sheet of FLOW_SHEETS){
    for(const [layout,direction] of layouts){
      const bands=buildChiffonSheets(sheet,5800,layout,direction)
      assert.ok(bands.passes.length>=6,'should span the full document')
      for(const panel of bands.passes){
        for(const field of ['surface','underside','luminous','fold','gauze','nearEdge','farEdge']){
          assert.ok(panel[field].length>300,field+' missing')
          assert.doesNotMatch(panel[field],/NaN|Infinity/)
        }
        assert.equal(panel.threads.length,21)
        assert.match(panel.surface,/ Z$/)
        assert.ok(panel.threads.every(x=>x.length>200))
        assert.ok(panel.surface.includes('L '),'fabric must be a wide filled surface')
      }
    }
  }
})

test('Flow renderer is separate but retains editing and scroll reveal',()=>{
  const site=src('PortfolioTemplateSite.jsx')
  const flow=src('SilkFlowBackdrop.jsx')
  const css=src('silk-flow.css')
  const manager=src('PortfolioTemplateManager.jsx')
  const editor=src('PortfolioInstanceEditor.jsx')
  assert.equal((site.match(/<SilkStageBackdrop /g)||[]).length,1)
  assert.equal((site.match(/<SilkFlowBackdrop /g)||[]).length,1)
  assert.match(site,/useSilkFlow\?/)
  assert.match(site,/visibleSections\.map/)
  assert.match(site,/<ScrollTextAtmosphere /)
  assert.match(flow,/ResizeObserver/)
  assert.match(flow,/buildChiffonSheets/)
  assert.match(flow,/stopOpacity/)
  assert.match(css,/pt-site--silk-flow/)
  assert.match(css,/background:[^;]*#ffffff/)
  assert.match(css,/prefers-reduced-motion:reduce/)
  assert.match(manager,/paletteOptionsForTheme/)
  assert.match(manager,/Thư viện Template Portfolio/)
  assert.match(editor,/paletteOptionsForTheme/)
})

test('New DB seed clones the current Atelier blueprint and never edits or archives it',()=>{
  assert.match(sql,/insert into public\.artist_website_templates/i)
  assert.match(sql,/where t\.slug='silk-atelier'/)
  assert.match(sql,/on conflict \(slug\) do nothing/i)
  assert.match(sql,/silk-flow/)
  assert.doesNotMatch(sql,/delete\s+from/i)
  assert.doesNotMatch(sql,/update\s+public\.artist_website_templates/i)
  assert.doesNotMatch(sql,/insert into public\.artist_website_instances/i)
})

test('Reference-style cloth runs horizontally with raised peaks and a deep middle fold',()=>{
  const sheet=FLOW_SHEETS[1]
  const geometry=buildChiffonSheets(sheet,5200,'diagonal','down-right')
  const panel=geometry.passes[0]
  const coords=[...panel.nearEdge.matchAll(/(?:M|L) (-?\d+\.\d) (-?\d+\.\d)/g)]
    .map(match=>[Number(match[1]),Number(match[2])])
  assert.ok(coords.length>40)
  const xSpan=Math.max(...coords.map(p=>p[0]))-Math.min(...coords.map(p=>p[0]))
  const ySpan=Math.max(...coords.map(p=>p[1]))-Math.min(...coords.map(p=>p[1]))
  assert.ok(xSpan>1100,'silk must extend across the viewport instead of as a vertical strip')
  assert.ok(ySpan>200,'folds must rise and sink, not appear as a flat ribbon')
  const component=src('SilkFlowBackdrop.jsx')
  const manager=src('PortfolioTemplateManager.jsx')
  assert.match(component,/sheet\.paths\.passes\.map/)
  assert.match(component,/panel\.threads\.map/)
  assert.match(manager,/<SilkFlowBackdrop[\s\S]*?motionPaused\/>/)
  assert.match(src('silk-flow.css'),/pt-template__visual\.pt-template__visual--flow > \.pt-flow-stage/)
})

test('A corrupted persisted Silk Flow blueprint always resolves as blue-white',()=>{
  const template={
    slug:'silk-flow',
    blueprint:{...blueprintFor(PRESET_FORMS[1]),visualTheme:'ribbon-luxury',
      colorPalette:'red-gold'}
  }
  const clean=normalizeTemplateBlueprint(template)
  assert.equal(clean.visualTheme,'silk-flow')
  assert.equal(clean.colorPalette,'ice-blue')
  assert.equal(resolveInstance(template,{content:{}},{name:'Artist'}).visualTheme,'silk-flow')
  assert.equal(resolveInstance(template,{content:{colorPalette:'red-gold'}},{name:'Artist'}).colorPalette,'ice-blue')
  assert.equal(resolveInstance(template,{content:{colorPalette:'silver-white'}},{name:'Artist'}).colorPalette,'silver-white')
  assert.equal(normalizeTemplateBlueprint({
    slug:'silk-atelier',blueprint:blueprintFor(PRESET_FORMS[0])
  }).visualTheme,'ribbon-luxury')
  assert.deepEqual(template.blueprint.visualTheme,'ribbon-luxury','do not mutate input')
  const manager=src('PortfolioTemplateManager.jsx')
  const site=src('PortfolioTemplateSite.jsx')
  assert.match(manager,/normalizeTemplateBlueprint\(\{\.\.\.t,blueprint\}\)/)
  assert.match(manager,/normalizeTemplateBlueprint\(group\)/)
  assert.match(manager,/Giao diện cố định của Silk Flow/)
  assert.match(site,/const flowForm=template\?\.slug==='silk-flow'/)
  assert.match(site,/const useSilkFlow=flowForm\|\|/)
})


test('Shared chrome now styles both template themes with palette variables',()=>{
  const css=src('portfolio-shared-ui.css')
  const flow=src('silk-flow.css')
  const sticky=src('portfolio-sticky-nav.css')
  assert.match(sticky,/background:linear-gradient\(104deg,#230408ed/)
  assert.match(css,/\.pt-site\.pt-site--shared-ui\.pt-site--ribbon\.pt-site--continuous-silk/)
  assert.match(css,/\.pt-site\.pt-site--shared-ui\.pt-site--ribbon\.pt-site--continuous-silk\.pt-site--silk-flow/)
  for(const name of ['red-white','yellow-white','black-white',
    'seafoam-white','silver-white','navy-white']){
    assert.match(css,new RegExp('pt-palette--'+name))
  }
  assert.match(css,/> header\.pt-site__nav\.pt-site__nav--sticky\{/)
  assert.match(css,/background:linear-gradient\(106deg,var\(--pt-ui-nav-from\)/)
  assert.match(css,/footer\.pt-site__footer\{/)
  assert.match(css,/background:linear-gradient\(120deg,var\(--pt-ui-footer-from\)/)
  assert.match(css,/nav\.pt-site__nav-links a\.is-active\{/)
  assert.doesNotMatch(flow,/Silk Flow chrome: the shared Silk Atelier styles/)
})
