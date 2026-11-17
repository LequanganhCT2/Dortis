import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {PRESET_FORMS,blueprintFor,normalizeBlueprint,resolveInstance} from '../src/features/portfolio/templates/model.js'
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
