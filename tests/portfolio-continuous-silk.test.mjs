import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {
  RIBBON_BRANCHES,ribbonGeometryAt,ribbonCrossesWholeViewport,
  normalizeRibbonGeometryChoice
} from '../src/features/portfolio/templates/ribbonGeometry.js'

const source=file=>readFileSync(new URL('../src/features/portfolio/templates/'+file,import.meta.url),'utf8')

test('All four ribbons sweep diagonally beyond both viewport edges repeatedly',()=>{
  assert.equal(RIBBON_BRANCHES.length,4)
  const phases=new Set(RIBBON_BRANCHES.map(branch=>branch.phase))
  assert.equal(phases.size,4)
  for(const branch of RIBBON_BRANCHES){
    for(const layout of ['vertical','diagonal','horizontal']){
      const range=ribbonCrossesWholeViewport(branch,layout,undefined,7200)
      assert.ok(range.min<-190,branch.id+'/'+layout+' missing left edge: '+range.min)
      assert.ok(range.max>1180,branch.id+'/'+layout+' missing right edge: '+range.max)
    }
  }
})
test('Crossings form strong diagonal cuts instead of tiny vertical waves',()=>{
  for(const branch of RIBBON_BRANCHES){
    const readings=Array.from({length:250},(_,i)=>ribbonGeometryAt(branch,i*19,'vertical','right'))
    const strong=readings.filter(p=>Math.abs(p.slope)>1.05).length
    assert.ok(strong>120,branch.id+' diagonal slope too weak: '+strong)
  }
})
test('The four trajectories are continuous across arbitrary page boundaries',()=>{
  for(const branch of RIBBON_BRANCHES){
    for(const y of [0,730,1400,2100,3300,4700,6500]){
      const a=ribbonGeometryAt(branch,y-.0001,'diagonal','down-right')
      const b=ribbonGeometryAt(branch,y+.0001,'diagonal','down-right')
      assert.ok(Math.abs(a.x-b.x)<.05,branch.id+' broken at '+y)
      assert.ok(Number.isFinite(a.slope)&&Number.isFinite(b.slope))
    }
  }
})
test('Different directions and curtain variants retain distinct geometry',()=>{
  const branch=RIBBON_BRANCHES[0]
  const left=ribbonGeometryAt(branch,650,'diagonal','down-left').x
  const right=ribbonGeometryAt(branch,650,'diagonal','down-right').x
  assert.ok(Math.abs(left-right)>100)
  assert.deepEqual(normalizeRibbonGeometryChoice('unknown','hacked'),
    {layout:'vertical',direction:'right'})
  const stage=RIBBON_BRANCHES.map(branch=>ribbonGeometryAt(branch,500,'curtain','inward').x)
  assert.ok(stage.some(x=>x<500)&&stage.some(x=>x>500))
})
test('Exactly one global ribbon component is rendered for the entire Portfolio',()=>{
  const renderer=source('PortfolioTemplateSite.jsx')
  const standard=source('RibbonPortfolioSection.jsx')
  const scene=source('SectionArtboard.jsx')
  const css=source('portfolio-continuous-silk.css')
  const silk=source('RibbonSilk.jsx')
  assert.equal((renderer.match(/<RibbonSilk /g)||[]).length,1)
  assert.match(renderer,/pt-site--continuous-silk/)
  assert.match(renderer,/continuousSilk=\{continuousSilk\}/)
  assert.match(renderer,/publishedView\|\|resolveArtistPortfolio/)
  assert.doesNotMatch(standard,/<PortfolioRibbonBackdrop/)
  assert.match(scene,/\!continuousSilk&&hasRibbon&&<PortfolioRibbonBackdrop/)
  assert.match(scene,/\!continuousSilk&&section\.backdrop===LUXURY_RIBBON/)
  assert.match(silk,/RIBBON_BRANCHES/)
  assert.match(css,/> \.pt-ribbon__silk\{/)
  assert.match(css,/background:transparent!important/)
  assert.match(css,/\.pt-ribbon__strand--4/)
  assert.match(css,/prefers-reduced-motion:reduce/)
})
test('Motion on each branch is independently timed and pausable',()=>{
  const css=source('portfolio-continuous-silk.css')
  const effect=source('portfolio-effects.css')
  const periods=[...css.matchAll(/--pt-silk-period:(\d+)s/g)].map(m=>Number(m[1]))
  assert.equal(new Set(periods).size,4)
  for(const duration of periods)assert.ok(duration>=15&&duration<=40)
  assert.match(effect,/\.pt-site--motion-paused :is\(\.pt-ribbon__strand/)
  assert.match(css,/animation:none!important/)
})
