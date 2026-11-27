import test from 'node:test'
import assert from 'node:assert/strict'
import {newStyledImage} from '../src/features/portfolio/templates/newImageAppearance.js'
import {newStudioElement,patchStudioElement} from '../src/features/portfolio/templates/studioModel.js'

test('Appearance is applied to a new image on both devices without changing legacy defaults',()=>{
  const existing=newStudioElement('image','old',{path:'old.jpg'}),before=JSON.stringify(existing)
  const image=newStyledImage('new','new.png','Chân dung',{
    radius:32,shadow:40,fit:'contain',photoMotion:'tilt',photoIntensity:60
  },{width:800,height:1200,orientation:'portrait',transparencyDetected:true})
  for(const device of ['desktop','mobile']){
    assert.equal(image[device].radius,32)
    assert.equal(image[device].shadow,40)
    assert.equal(image[device].photoMotion,'tilt')
    assert.equal(image[device].photoIntensity,60)
    assert.equal(image[device].fit,'contain')
    assert.equal(image[device].effect,'inherit')
  }
  assert.equal(image.imageInfo.orientation,'portrait')
  assert.equal(JSON.stringify(existing),before)
  assert.equal(existing.desktop.radius,0)
})
test('Editing image geometry preserves its saved photo effect and image recognition',()=>{
  const image=newStyledImage('new','new.jpg','Ảnh',{photoMotion:'breathe',photoIntensity:70},{width:800,height:600})
  const changed=patchStudioElement({studioElements:{hero:[image]}},'hero','new','desktop',{x:30})
  const saved=changed.studioElements.hero[0]
  assert.equal(saved.desktop.photoMotion,'breathe')
  assert.equal(saved.desktop.photoIntensity,70)
  assert.equal(saved.imageInfo.width,800)
})
