import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {
  scrollRevealEnvelope,scrollEdgeOffsets,scrollTextPose,scrollImagePose
} from '../src/features/portfolio/templates/scrollTextMotion.js'

const file=name=>readFileSync(
  new URL('../src/features/portfolio/templates/'+name,import.meta.url),'utf8')

test('At lower edge, elements fade in/out from below with positive travel',()=>{
  const envelope=scrollRevealEnvelope(740,940,0,800,'image')
  assert.ok(envelope.progress>0&&envelope.progress<.2)
  assert.equal(envelope.exit,1)
  assert.ok(scrollEdgeOffsets(envelope).travel>0)
  const image=scrollImagePose(envelope.progress,envelope)
  const text=scrollTextPose(envelope.progress,'title',envelope)
  assert.ok(parseFloat(image.rise)>0)
  assert.ok(parseFloat(text.rise)>0)
  assert.ok(parseFloat(text.clipBottom)>0)
  assert.equal(text.clipTop,'0.00%')
  assert.ok(Number(image.scale)<1)
})

test('At upper edge, reverse scrolling fades text and images from above',()=>{
  const envelope=scrollRevealEnvelope(-500,60,0,800,'image')
  assert.ok(envelope.progress>0&&envelope.progress<.2)
  assert.equal(envelope.enter,1)
  assert.ok(scrollEdgeOffsets(envelope).travel<0)
  const image=scrollImagePose(envelope.progress,envelope)
  const text=scrollTextPose(envelope.progress,'title',envelope)
  assert.ok(parseFloat(image.rise)<0)
  assert.ok(parseFloat(text.rise)<0)
  assert.ok(parseFloat(text.clipTop)>0)
  assert.equal(text.clipBottom,'0.00%')
  assert.ok(Number(image.scale)>1)
})

test('In central reading zone, photos and typography are unmasked and steady',()=>{
  const envelope=scrollRevealEnvelope(320,610,0,800,'image')
  assert.equal(envelope.progress,1)
  const image=scrollImagePose(envelope.progress,envelope)
  const text=scrollTextPose(envelope.progress,'body',envelope)
  assert.equal(image.alpha,1)
  assert.equal(image.rise,'0.00px')
  assert.equal(image.scale,'1.0000')
  assert.equal(text.alpha,1)
  assert.equal(text.clipTop,'0.00%')
  assert.equal(text.clipBottom,'0.00%')
})

test('Reversing direction at the exact same scroll position cannot jump',()=>{
  const bounds=[0,800]
  const positions=[
    [740,940],[660,860],[580,780],[450,650],[320,610],
    [190,470],[0,250],[-280,130],[-500,60]
  ]
  const descending=positions.map(([top,bottom])=>{
    const envelope=scrollRevealEnvelope(top,bottom,...bounds,'image')
    return {
      envelope,
      image:scrollImagePose(envelope.progress,envelope),
      text:scrollTextPose(envelope.progress,'title',envelope)
    }
  })
  const ascending=[...positions].reverse().map(([top,bottom])=>{
    const envelope=scrollRevealEnvelope(top,bottom,...bounds,'image')
    return {
      envelope,
      image:scrollImagePose(envelope.progress,envelope),
      text:scrollTextPose(envelope.progress,'title',envelope)
    }
  }).reverse()
  assert.deepEqual(descending,ascending)
})

test('One geometry-driven RAF updates both masks and directions, not a timer',()=>{
  const canvas=file('ScrollTextAtmosphere.jsx')
  const css=file('scroll-text-atmosphere.css')
  assert.match(canvas,/scrollTextPose\(progress,kind,envelope\)/)
  assert.match(canvas,/scrollImagePose\(progress,envelope\)/)
  assert.match(canvas,/--pt-scroll-clip-top/)
  assert.match(canvas,/--pt-scroll-clip-bottom/)
  assert.match(css,/clip-path:inset\(var\(--pt-scroll-clip-top,0%\) 0 var\(--pt-scroll-clip-bottom,0%\) 0\)/)
  assert.match(canvas,/requestAnimationFrame\(update\)/)
  assert.match(css,/pt-site--motion-paused/)
  assert.match(css,/prefers-reduced-motion:reduce/)
})
