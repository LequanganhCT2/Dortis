import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {wheelStepValue} from '../src/features/portfolio/templates/inlineInspectorWheel.js'

const source=file=>readFileSync(new URL('../src/features/portfolio/templates/'+file,import.meta.url),'utf8')

test('Mouse wheel uses native precision, Shift accelerates, Alt fine-tunes and clamps',()=>{
  assert.equal(wheelStepValue(36,-100,{step:1,min:8,max:180}),37)
  assert.equal(wheelStepValue(36,100,{step:1,min:8,max:180}),35)
  assert.equal(wheelStepValue(.9,-100,{step:.05,min:.25,max:3}),.95)
  assert.equal(wheelStepValue(90,-100,{step:1,min:0,max:100,shiftKey:true}),100)
  assert.equal(wheelStepValue(40,100,{step:1,min:0,max:100,shiftKey:true}),30)
  assert.equal(wheelStepValue(40,-100,{step:1,min:0,max:100,altKey:true}),40.2)
  assert.equal(wheelStepValue(.25,100,{step:.05,min:.25,max:3}),.25)
  assert.equal(wheelStepValue(2,-100,{step:.5,min:0,max:2}),2)
  assert.equal(wheelStepValue(2,0,{step:.5,min:0,max:10}),2)
})

test('Inspector previews typing, wheel and colors without waiting for blur',()=>{
  const component=source('InlinePortfolioInspector.jsx')
  assert.match(component,/function LiveNumberField/)
  assert.match(component,/addEventListener\('wheel',wheel,\{passive:false\}\)/)
  assert.match(component,/event\.preventDefault\(\)/)
  assert.match(component,/onChange=\{event=>change\(event\.currentTarget\.value\)\}/)
  assert.match(component,/applyRef\.current\(next\)/)
  assert.match(component,/type="color" value=\{hex\(value\)\}/)
  assert.match(component,/onChange=\{event=>\{\s*const next=event\.currentTarget\.value/)
  assert.match(component,/Shift: nhanh ×10/)
})

test('Rapid edits are optimistic, merged and debounced before secured publish',()=>{
  const pub=source('PublishedPortfolio.jsx')
  assert.match(pub,/setPublication\(current=>patchPublishedElement\(/)
  assert.match(pub,/queuedEditsRef\.current\.push\(change\)/)
  assert.match(pub,/last\.patch=\{\.\.\.last\.patch,\.\.\.patch\}/)
  assert.match(pub,/flushTimerRef\.current=setTimeout/)
  assert.match(pub,/\},320\)/)
  assert.match(pub,/while\(queuedEditsRef\.current\.length\)/)
  assert.match(pub,/supabase\.rpc\('publish_artist_portfolio'/)
  assert.match(pub,/finishPendingPublicEdits\(\)/)
})
