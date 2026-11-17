import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {
  PRESET_FORMS,blueprintFor,normalizeBlueprint,resolveInstance,
  FORM_RIBBON_LAYOUTS,ribbonDirectionOptions,normalizeRibbonChoice
} from '../src/features/portfolio/templates/model.js'

const source=file=>readFileSync(new URL('../src/features/portfolio/templates/'+file,import.meta.url),'utf8')

test('Every ribbon layout exposes unique valid directions',()=>{
  assert.equal(FORM_RIBBON_LAYOUTS.length,4)
  const expected={vertical:2,diagonal:4,horizontal:2,curtain:2}
  for(const layout of FORM_RIBBON_LAYOUTS){
    const options=ribbonDirectionOptions(layout.id)
    assert.equal(options.length,expected[layout.id])
    assert.equal(new Set(options.map(x=>x.id)).size,options.length)
    for(const option of options){
      assert.deepEqual(normalizeRibbonChoice(layout.id,option.id),
        {ribbonLayout:layout.id,ribbonDirection:option.id})
    }
  }
  assert.deepEqual(normalizeRibbonChoice('unsafe','javascript:alert(1)'),
    {ribbonLayout:'vertical',ribbonDirection:'right'})
  assert.deepEqual(normalizeRibbonChoice('curtain','to-left'),
    {ribbonLayout:'curtain',ribbonDirection:'inward'})
})

test('The Silk Atelier Form retains layout + direction in normalized blueprint',()=>{
  for(const form of PRESET_FORMS){
    const preset=blueprintFor(form)
    assert.equal(preset.ribbonLayout,'diagonal')
    assert.equal(preset.ribbonDirection,'down-right')
    for(const layout of FORM_RIBBON_LAYOUTS){
      for(const option of ribbonDirectionOptions(layout.id)){
        const blueprint=normalizeBlueprint({...preset,
          ribbonLayout:layout.id,ribbonDirection:option.id})
        assert.equal(blueprint.ribbonDirection,option.id)
        assert.equal(blueprint.ribbonLayout,layout.id)
        const view=resolveInstance({id:form.slug,name:form.name,blueprint},
          {content:{sections:{},images:{}}},{name:'La Trinh'})
        assert.equal(view.ribbonLayout,layout.id)
        assert.equal(view.ribbonDirection,option.id)
        assert.equal(view.sections.length,form.sections.length)
      }
    }
  }
})

test('Admin includes paired selectors on each template and in the blueprint editor',()=>{
  const manager=source('PortfolioTemplateManager.jsx')
  assert.match(manager,/pt-template__ribbon-choice/)
  assert.match(manager,/updateRibbonChoice\(group,\{ribbonLayout:e\.target\.value\}\)/)
  assert.match(manager,/updateRibbonChoice\(group,\{ribbonDirection:e\.target\.value\}\)/)
  assert.match(manager,/ribbonDirectionOptions\(normalizeTemplateBlueprint\(group\)\.ribbonLayout\)/)
  assert.match(manager,/normalizeRibbonChoice\(e\.target\.value\)/)
  assert.match(manager,/\.eq\('version',form.version\)/)
})

test('Selected layout and direction reach all renderer variants including published sites',()=>{
  const view=source('PortfolioTemplateSite.jsx')
  const fallback=source('RibbonPortfolioSection.jsx')
  const studio=source('SectionArtboard.jsx')
  const primary=source('PortfolioRibbonBackdrop.jsx')
  const legacy=source('RibbonLuxuryBackground.jsx')
  const silk=source('RibbonSilk.jsx')
  const published=source('PublishedPortfolio.jsx')
  assert.match(view,/ribbonLayout=\{view\.ribbonLayout\|\|'vertical'\}/)
  assert.match(view,/ribbonDirection=\{view\.ribbonDirection\|\|'right'\}/)
  assert.doesNotMatch(fallback,/<PortfolioRibbonBackdrop/)
  assert.match(view,/<SilkStageBackdrop layout=\{view\.ribbonLayout\|\|'diagonal'\}/)
  assert.match(view,/continuousSilk/)
  assert.match(source('SilkStageBackdrop.jsx'),/normalizeFabricChoice/)
  assert.match(studio,/layout=\{ribbonLayout\} direction=\{ribbonDirection\}/)
  assert.match(primary,/pt-ribbon-backdrop--direction-/)
  assert.match(primary,/selectedLayout==='curtain'/)
  assert.match(legacy,/pt-luxury-ribbon--direction-/)
  assert.match(silk,/pt-ribbon__silk--direction-/)
  assert.match(published,/publishedView=\{view\} template=\{publishedTemplate\}/)
})

test('CSS supports all directional compositions without touching image geometry',()=>{
  const ribbon=source('portfolio-ribbon.css')
  const original=source('ribbon-luxury-background.css')
  assert.match(ribbon,/layout-diagonal\.pt-ribbon-backdrop--direction-down-right/)
  assert.match(ribbon,/layout-diagonal\.pt-ribbon-backdrop--direction-up-left/)
  assert.match(ribbon,/layout-horizontal\.pt-ribbon-backdrop--direction-to-left/)
  assert.match(ribbon,/layout-curtain\.pt-ribbon-backdrop--direction-outward/)
  assert.match(original,/layout-vertical\.pt-luxury-ribbon--direction-left/)
  assert.match(ribbon,/@media\(prefers-reduced-motion:reduce\)/)
  assert.match(ribbon,/\.pt-ribbon__media\{grid-area:media;display:grid/)
})
