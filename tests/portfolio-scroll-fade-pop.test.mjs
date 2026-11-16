import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {
  scrollRevealEnvelope,scrollImagePose,scrollTextPose
} from '../src/features/portfolio/templates/scrollTextMotion.js'
const source=name=>readFileSync(new URL('../src/features/portfolio/templates/'+name,import.meta.url),'utf8')

test('Fade-in during entrance, fade-out near top exit, fully visible while reading',()=>{
  const atEntry=scrollRevealEnvelope(740,940,0,800,'image')
  const inView=scrollRevealEnvelope(300,600,0,800,'image')
  const atExit=scrollRevealEnvelope(-500,60,0,800,'image')
  const gone=scrollRevealEnvelope(-800,-10,0,800,'image')
  assert.ok(atEntry.progress>0&&atEntry.progress<.2)
  assert.equal(inView.progress,1)
  assert.ok(atExit.progress>0&&atExit.progress<.2)
  assert.equal(gone.progress,0)
  assert.equal(scrollRevealEnvelope(300,600,0,0,'image').progress,1)
  // Scrolling up through the same positions reverses exactly the progression.
  assert.deepEqual(scrollRevealEnvelope(740,940,0,800,'image'),atEntry)
})
test('Images unfold with a gentle overshoot instead of resizing saved photo slots',()=>{
  const hidden=scrollImagePose(0)
  const halfway=scrollImagePose(.5)
  const visible=scrollImagePose(1)
  assert.equal(hidden.alpha,0)
  assert.equal(hidden.scale,'0.8600')
  assert.equal(visible.alpha,1)
  assert.equal(visible.scale,'1.0000')
  assert.equal(visible.rise,'0.00px')
  assert.equal(visible.tilt,'0.00deg')
  assert.equal(visible.blur,'0.00px')
  assert.ok(Number(halfway.scale)>1)
  assert.ok(halfway.alpha>0&&halfway.alpha<1)
  assert.ok(Number.parseFloat(halfway.blur)>0)
  assert.ok(scrollTextPose(.5,'title').alpha>0)
})
test('Stagger makes later gallery images appear after the first',()=>{
  const first=scrollRevealEnvelope(680,1040,0,800,'image',0).progress
  const fourth=scrollRevealEnvelope(680,1040,0,800,'image',3).progress
  assert.ok(first>fourth)
  assert.equal(scrollRevealEnvelope(300,700,0,800,'image',4).progress,1)
})
test('A single Canvas now reveals complete sections, not individual letters and photos',()=>{
  const canvas=source('ScrollTextAtmosphere.jsx')
  const image=source('PhotoMotion.jsx')
  const ribbon=source('RibbonPortfolioSection.jsx')
  const board=source('SectionArtboard.jsx')
  const site=source('PortfolioTemplateSite.jsx')
  assert.match(canvas,/new IntersectionObserver\(/)
  assert.match(canvas,/sections\.forEach\(section=>observer\.observe\(section\)\)/)
  assert.match(canvas,/classifyPortfolioBlock\(/)
  assert.match(canvas,/function mark\(section,state/)
  assert.equal((site.match(/<ScrollTextAtmosphere /g)||[]).length,1)
  assert.match(image,/data-pt-scroll-reveal="image"/)
  assert.match(ribbon,/revealOrder=\{position\}/)
  assert.match(board,/revealOrder=\{index>=0\?index:0\}/)
  assert.doesNotMatch(image,/<canvas/)
})
test('Whole block fade and scale preserves per-photo motion and editing',()=>{
  const css=source('scroll-text-atmosphere.css')
  assert.match(css,/pt-block-enter-bottom/)
  assert.match(css,/pt-block-enter-top/)
  assert.match(css,/pt-block-exit-bottom/)
  assert.match(css,/pt-block-exit-top/)
  assert.match(css,/scale:1\.025/)
  assert.match(css,/pt-site--motion-paused/)
  assert.match(css,/\.pt-scene-section\.is-editing/)
  assert.match(css,/prefers-reduced-motion:reduce/)
})
