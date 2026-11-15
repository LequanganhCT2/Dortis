import test from 'node:test'
import assert from 'node:assert/strict'
import {chooseSectionEffect,sectionHasRealImage} from '../src/features/portfolio/templates/visualEffects.js'
import {normalizeBlueprint,FORM_EFFECT_IDS} from '../src/features/portfolio/templates/model.js'
test('Auto variations produce multiple compositions for one reusable form',()=>{
 const effects=[
  chooseSectionEffect({layout:'split',index:0,style:'editorial',imageCount:1}),
  chooseSectionEffect({layout:'split-reverse',index:1,style:'editorial',imageCount:1}),
  chooseSectionEffect({layout:'mosaic',index:2,style:'editorial',imageCount:4}),
  chooseSectionEffect({layout:'text',index:3,style:'editorial',imageCount:0})
 ]
 assert.ok(new Set(effects).size>=3)
 assert.equal(effects[0],'overlap')
 assert.equal(chooseSectionEffect({layout:'cover',effect:'spotlight',imageCount:4}),'orbit')
 assert.equal(chooseSectionEffect({layout:'cover',effect:'spotlight',imageCount:1}),'spotlight')
})
test('Effects normalize safely and no-image compositions do not render fake photos',()=>{
 assert.ok(FORM_EFFECT_IDS.length>=7)
 assert.equal(normalizeBlueprint({sections:[{id:'hero',layout:'split',effect:'orbit',slots:1}]}).sections[0].effect,'orbit')
 assert.equal(normalizeBlueprint({sections:[{id:'hero',layout:'split',effect:'unsafe',slots:1}]}).sections[0].effect,'auto')
 assert.equal(chooseSectionEffect({effect:'glass',imageCount:0}),'typography')
 assert.equal(sectionHasRealImage({images:[{path:'a'}]},{}),false)
 assert.equal(sectionHasRealImage({images:[{path:'a'}]},{a:'https://assets.test/photo.jpg'}),true)
})
test('Explicit effect selections survive layout changes',()=>{
 const first=normalizeBlueprint({sections:[{id:'gallery',effect:'glass',layout:'grid',slots:3}]})
 const next=normalizeBlueprint({...first,sections:first.sections.map(s=>({...s,layout:'wide'}))})
 assert.equal(next.sections[0].effect,'glass')
})
