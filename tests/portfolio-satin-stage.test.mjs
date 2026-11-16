import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {
  FABRIC_BRANCHES,fabricCenter,buildFabricBands,scatterGlitter,
  normalizeFabricChoice
} from '../src/features/portfolio/templates/silkFabricGeometry.js'

const src=name=>readFileSync(new URL(
  '../src/features/portfolio/templates/'+name,import.meta.url),'utf8')
test('Satin panels are substantial cloth with independently varying folds',()=>{
  assert.equal(FABRIC_BRANCHES.length,3)
  const weights=new Set(FABRIC_BRANCHES.map(branch=>branch.width))
  assert.equal(weights.size,3)
  for(const branch of FABRIC_BRANCHES){
    const bands=buildFabricBands(branch,6500,'diagonal','down-right')
    for(const key of ['full','underfold','shadow','satin','high','fringe']){
      assert.ok(bands[key].startsWith('M'),key+' is missing')
      assert.ok(bands[key].length>1200,key+' should span the document')
      assert.doesNotMatch(bands[key],/NaN|Infinity/)
    }
    assert.match(bands.full,/ Z$/)
    const centers=[0,300,600,1000,1600,2400,3600,5800]
      .map(y=>fabricCenter(branch,y,'diagonal','down-right').x)
    assert.ok(Math.max(...centers)-Math.min(...centers)>600,
      branch.id+' should cross the viewport')
  }
})
test('Silk supports each Form layout and directional choice without invalid coordinates',()=>{
  const cases={
    vertical:['right','left'],
    diagonal:['down-right','down-left','up-right','up-left'],
    horizontal:['to-right','to-left'],
    curtain:['inward','outward']
  }
  const branch=FABRIC_BRANCHES[0]
  for(const [layout,dirs] of Object.entries(cases)){
    for(const direction of dirs){
      const choice=normalizeFabricChoice(layout,direction)
      assert.deepEqual(choice,{layout,direction})
      const sample=fabricCenter(branch,910,layout,direction)
      assert.ok(Number.isFinite(sample.x)&&Number.isFinite(sample.dx))
      assert.ok(buildFabricBands(branch,1200,layout,direction).full.length>500)
    }
  }
  assert.deepEqual(normalizeFabricChoice('unknown','bad'),
    {layout:'diagonal',direction:'down-right'})
})
test('Gold halo, light dust and soft red silk are one unbroken document-level scene',()=>{
  const component=src('SilkStageBackdrop.jsx')
  const styles=src('silk-stage-backdrop.css')
  const renderer=src('PortfolioTemplateSite.jsx')
  assert.match(component,/viewBox=\{'0 0 1000 '\+height\}/)
  assert.match(component,/ResizeObserver/)
  assert.match(component,/pt-silk-stage__lightfield/)
  assert.match(component,/feGaussianBlur/)
  assert.match(component,/buildFabricBands/)
  assert.match(component,/pt-silk-stage__fabric--/)
  assert.match(renderer,/<SilkStageBackdrop /)
  assert.doesNotMatch(renderer,/<RibbonSilk /)
  assert.match(styles,/pt-silk-stage__light-veil/)
  assert.match(styles,/\.pt-site\.pt-site--continuous-silk > \.pt-silk-stage/)
  assert.match(styles,/prefers-reduced-motion:reduce/)
  assert.match(styles,/pointer-events:none/)
})
test('Sparkle positions are deterministic and limited to a fixed DOM budget',()=>{
  const sample=scatterGlitter(8200)
  assert.equal(sample.length,115)
  assert.deepEqual(sample,scatterGlitter(8200))
  assert.ok(sample.every(p=>p.y>=0&&p.y<=8200&&p.x>=90&&p.x<=920))
})
test('Unfilled photos are only visible inside the direct editor',()=>{
  const section=src('RibbonPortfolioSection.jsx')
  assert.match(section,/const tiles=editing\?allTiles:allTiles\.filter\(tile=>tile\.url\)/)
  assert.match(section,/onUploadImage/)
  assert.match(section,/pt-ribbon__media/)
})
