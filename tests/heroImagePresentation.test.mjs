import test from 'node:test'
import assert from 'node:assert/strict'
import {heroAspectRatio,heroWidthFactor,heroZoom,heroCardSize,heroStageRatio,heroCardSpacing,HERO_RATIOS} from '../src/heroImagePresentation.js'
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

test('Homepage card size can shrink separately from image zoom and card ratio',()=>{
  assert.equal(heroCardSize({},1),100)
  assert.equal(heroCardSize({card1HomeSize:'65',card2HomeSize:'90'},1),65)
  assert.equal(heroCardSize({card1HomeSize:'65',card2HomeSize:'90'},2),90)
  assert.equal(heroCardSize({card1HomeSize:'5'},1),40)
  assert.equal(heroCardSize({card1HomeSize:'200'},1),100)
  assert.equal(heroCardSize({card1HomeSize:'bad'},1),100)
  assert.equal(heroZoom({card1Image1Zoom:'120'},1,1),120)
})

test('Whole Hero stage aspect ratio is independently persisted',()=>{
  assert.equal(heroStageRatio({}),'4/3')
  assert.equal(heroStageRatio({heroStageAspectRatio:'16/9'}),'16/9')
  assert.equal(heroStageRatio({heroStageAspectRatio:'1/1'}),'1/1')
  assert.equal(heroStageRatio({heroStageAspectRatio:'untrusted-string'}),'4/3')
})
test('Card spacing changes without changing card size and photo zoom',()=>{
  const data={heroCardSpacing:'145',card2HomeSize:'70',card2Image1Zoom:'130'}
  assert.equal(heroCardSpacing(data),145)
  assert.equal(heroCardSize(data,2),70)
  assert.equal(heroZoom(data,2,1),130)
  assert.equal(heroCardSpacing({heroCardSpacing:'5'}),50)
  assert.equal(heroCardSpacing({heroCardSpacing:'300'}),160)
  assert.equal(heroCardSpacing({heroCardSpacing:'bad'}),100)
})
