import test from 'node:test'
import assert from 'node:assert/strict'
import {heroAspectRatio,heroWidthFactor,heroZoom,HERO_RATIOS} from '../src/heroImagePresentation.js'
test('Aspect ratios are saved per card and invalid ratios cannot reach CSS',()=>{
  assert.equal(heroAspectRatio({},1),'4/3')
  assert.equal(heroAspectRatio({card1AspectRatio:'16/9',card2AspectRatio:'1/1'},1),'16/9')
  assert.equal(heroAspectRatio({card1AspectRatio:'16/9',card2AspectRatio:'1/1'},2),'1/1')
  assert.equal(heroAspectRatio({card2AspectRatio:'invalid'},2),'4/3')
  assert.equal(HERO_RATIOS.length,6)
})
test('Portrait cards retain their height by adjusting width',()=>{
  assert.equal(heroWidthFactor('4/3'),1)
  assert.equal(heroWidthFactor('16/9'),1)
  assert.ok(heroWidthFactor('9/16')<.5)
})
test('Each image has an independent zoom; unsafe values are clamped',()=>{
  assert.equal(heroZoom({},1,1),100)
  assert.equal(heroZoom({card1Image1Zoom:'160',card1Image2Zoom:'85'},1,1),160)
  assert.equal(heroZoom({card1Image1Zoom:'160',card1Image2Zoom:'85'},1,2),85)
  assert.equal(heroZoom({card1Image1Zoom:'500'},1,1),250)
  assert.equal(heroZoom({card1Image1Zoom:'bad'},1,1),100)
})
