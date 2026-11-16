import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {
  clamp01,scrollRevealProgress,scrollTextPose,scrollCanvasBounds
} from '../src/features/portfolio/templates/scrollTextMotion.js'
const file=name=>readFileSync(new URL('../src/features/portfolio/templates/'+name,import.meta.url),'utf8')

test('Scroll reveal is proportional to scroll distance, never to elapsed time',()=>{
  assert.equal(scrollRevealProgress(820,0,800),0)
  assert.equal(scrollRevealProgress(720,0,800),0)
  assert.equal(scrollRevealProgress(240,0,800),1)
  assert.equal(scrollRevealProgress(100,0,800),1)
  assert.equal(scrollRevealProgress(480,0,800),.5)
  assert.equal(scrollRevealProgress(1120,400,1200),0)
  assert.equal(scrollRevealProgress(640,400,1200),1)
  assert.equal(scrollRevealProgress(880,400,1200),.5)
  assert.equal(scrollRevealProgress(480,500,500),1)
  assert.equal(clamp01(-5),0)
  assert.equal(clamp01(200),1)
  assert.equal(clamp01(NaN),0)
})

test('Text moves forward and reverses smoothly with the scroll direction',()=>{
  const halfway=scrollTextPose(.5,'title')
  const hidden=scrollTextPose(0,'title')
  const shown=scrollTextPose(1,'title')
  assert.equal(hidden.alpha,0)
  assert.equal(shown.alpha,1)
  assert.ok(halfway.alpha>0&&halfway.alpha<1)
  assert.equal(shown.rise,'0.00px')
  assert.equal(shown.tilt,'0.00deg')
  assert.equal(shown.depth,'0.00px')
  assert.equal(shown.clip,'0.00%')
  assert.equal(shown.glow,0)
  assert.ok(Number.parseFloat(halfway.rise)>0)
  assert.ok(Number.parseFloat(halfway.tilt)<0)
  assert.ok(Number.parseFloat(halfway.depth)<0)
  assert.equal(scrollTextPose(.5,'title').rise,halfway.rise)
  assert.ok(Number.parseFloat(scrollTextPose(.5,'body').rise)<
    Number.parseFloat(scrollTextPose(.5,'title').rise))
})

test('Canvas follows viewport and remains small inside long or scrollable portfolio',()=>{
  assert.deepEqual(scrollCanvasBounds(
    {top:-1200,bottom:6000},{top:0,bottom:5000},800),
    {top:0,bottom:800,height:800,localY:1200})
  assert.deepEqual(scrollCanvasBounds(
    {top:-350,bottom:6200},{top:200,bottom:780},800),
    {top:200,bottom:780,height:580,localY:550})
  assert.deepEqual(scrollCanvasBounds(
    {top:920,bottom:1600},{top:0,bottom:1100},800),
    {top:920,bottom:800,height:0,localY:0})
})

test('One Canvas highlights section-level entrance without per-text opacity updates',()=>{
  const src=file('ScrollTextAtmosphere.jsx')
  assert.match(src,/getContext\('2d',\{alpha:true\}\)/)
  assert.match(src,/new IntersectionObserver\(/)
  assert.match(src,/rootMargin:'-10% 0px -15% 0px'/)
  assert.match(src,/requestAnimationFrame\(drawGoldBurst\)/)
  assert.match(src,/root\.querySelectorAll\(':scope > section\[id\^="pt-"\]'\)/)
  assert.match(src,/dataset\.ptBlockState=state/)
  assert.match(src,/pt-site--block-reveal-active/)
  assert.doesNotMatch(src,/style\.setProperty\('--pt-scroll-alpha'/)
})
test('Block animation retains real text and image layers',()=>{
  const css=file('scroll-text-atmosphere.css')
  assert.match(css,/@keyframes pt-block-enter-bottom/)
  assert.match(css,/@keyframes pt-block-enter-top/)
  assert.match(css,/@keyframes pt-block-exit-top/)
  assert.match(css,/@keyframes pt-block-exit-bottom/)
  assert.match(css,/\.pt-ribbon__copy/)
  assert.match(css,/\.pt-ribbon__media/)
  assert.match(css,/\.pt-artboard__layer/)
  assert.match(css,/prefers-reduced-motion:reduce/)
})
test('Editing disables block reveal without touching layout or artist data',()=>{
  const editor=file('PortfolioInstanceEditor.jsx')
  const canvas=file('ScrollTextAtmosphere.jsx')
  const site=file('PortfolioTemplateSite.jsx')
  assert.match(editor,/motionPaused=\{visualEditing\}/)
  assert.match(site,/<ScrollTextAtmosphere rootRef=\{rootRef\} paused=\{motionPaused\}/)
  assert.match(canvas,/if\(!root\|\|paused\|\|!canvas\)return undefined/)
  assert.match(canvas,/delete section\.dataset\.ptBlockState/)
  assert.doesNotMatch(canvas,/fontSize|setSlotImage|setSelectedLayer/)
})
