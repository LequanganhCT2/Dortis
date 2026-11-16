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

test('One 2D Canvas is used site-wide and recomputed only on scrolling or resize',()=>{
  const src=file('ScrollTextAtmosphere.jsx')
  assert.match(src,/getContext\('2d',\{alpha:true\}\)/)
  assert.match(src,/requestAnimationFrame\(update\)/)
  assert.match(src,/document\.addEventListener\('scroll',schedule,\{capture:true,passive:true\}\)/)
  assert.match(src,/ResizeObserver/)
  assert.match(src,/devicePixelRatio\|\|1,1\.5/)
  assert.match(src,/canvas\.style\.transform='translate3d\(0,'/)
  assert.match(src,/root\.querySelectorAll\('\[data-pt-scroll-reveal\]'\)/)
  assert.match(src,/const measurements=fields\.map\(element=>/)
  assert.match(src,/for\(const \{element,kind,rect\} of measurements\)/)
  assert.match(src,/scrollRevealEnvelope\(/)
  assert.match(src,/scrollTextPose\(progress,kind,envelope\)/)
  assert.match(src,/style\.setProperty\('--pt-scroll-rise'/)
  assert.match(src,/role="presentation"/)
  assert.doesNotMatch(src,/setState|setContent|setSelectedLayer|onMoveElement/)
})

test('3D headings remain semantic text and existing typography does not get replaced',()=>{
  const styles=file('scroll-text-atmosphere.css')
  assert.match(styles,/perspective\(960px\)/)
  assert.match(styles,/rotateX\(var\(--pt-scroll-tilt,0deg\)\)/)
  assert.match(styles,/translate3d\(0,var\(--pt-scroll-rise,0px\),var\(--pt-scroll-depth,0px\)\)/)
  assert.match(styles,/opacity:var\(--pt-scroll-alpha,1\)/)
  assert.match(styles,/clip-path:inset\(var\(--pt-scroll-clip-top,0%\) 0 var\(--pt-scroll-clip-bottom,0%\) 0\)/)
  assert.match(styles,/pointer-events:none!important/)
  assert.match(styles,/prefers-reduced-motion:reduce/)
  assert.match(styles,/pt-site--motion-paused/)
})

test('Hero, standard editorial sections and scene artboards all reveal real text',()=>{
  const site=file('PortfolioTemplateSite.jsx')
  const ribbon=file('RibbonPortfolioSection.jsx')
  const board=file('SectionArtboard.jsx')
  assert.match(site,/import ScrollTextAtmosphere from '.\/ScrollTextAtmosphere'/)
  assert.match(site,/<ScrollTextAtmosphere rootRef=\{rootRef\} paused=\{motionPaused\}/)
  assert.equal((site.match(/<ScrollTextAtmosphere /g)||[]).length,1)
  assert.match(site,/placement\['data-pt-scroll-reveal'\]=field/)
  assert.match(ribbon,/'data-pt-scroll-reveal':field/)
  assert.match(board,/data-pt-scroll-reveal=\{layerId==='title'/)
})

test('Direct editing and reduced motion disable all reveals without touching layout',()=>{
  const editor=file('PortfolioInstanceEditor.jsx')
  const canvas=file('ScrollTextAtmosphere.jsx')
  const styles=file('scroll-text-atmosphere.css')
  assert.match(editor,/motionPaused=\{visualEditing\}/)
  assert.match(canvas,/if\(!root\|\|!canvas\|\|paused\)return undefined/)
  assert.match(canvas,/prefers-reduced-motion: reduce/)
  assert.match(canvas,/removeProperty\(property\)/)
  assert.match(styles,/\.pt-site\.pt-site--motion-paused/)
  assert.doesNotMatch(canvas,/fontSize|setSlotImage|typography:/)
})
