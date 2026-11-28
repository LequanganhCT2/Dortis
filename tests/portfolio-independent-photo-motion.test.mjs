import test from 'node:test'
import assert from 'node:assert/strict'
import {photoMotionPhase} from '../src/features/portfolio/templates/photoMotionConfig.js'

test('Independent images retain stable distinct phases after reordering',()=>{
  const ids=['portrait-a','portrait-b','portrait-c','portrait-d']
  const phases=ids.map(photoMotionPhase)
  assert.equal(new Set(phases).size,ids.length)
  assert.ok(phases.every(value=>value<=0&&value>-12))
  assert.equal(photoMotionPhase('portrait-a'),photoMotionPhase([...ids].reverse().find(id=>id==='portrait-a')))
})
