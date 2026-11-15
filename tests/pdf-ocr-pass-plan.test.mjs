import test from 'node:test'
import assert from 'node:assert/strict'
import {buildOcrPasses,renderScale} from '../src/features/artists/domain/ocrPassPlan.js'
test('Landscape portfolio always scans both portrait and text columns',()=>{
 const passes=buildOcrPasses(2800,1580,{quality:'standard',layerChars:1800})
 assert.deepEqual(passes.map(p=>p.kind),['full','left','right'])
 assert.ok(passes[2].rectangle.left<1400)
})
test('Portrait portfolios with sparse text use column passes',()=>{
 assert.deepEqual(buildOcrPasses(1200,1800,{layerChars:10}).map(x=>x.kind),['full','left','right'])
 assert.equal(buildOcrPasses(1200,1800,{layerChars:900}).length,1)
})
test('Deep scan adds horizontal bands for complex visual documents',()=>{
 const passes=buildOcrPasses(2200,1400,{quality:'deep',layerChars:5000})
 assert.deepEqual(passes.map(p=>p.kind),['full','left','right','top','bottom'])
 assert.ok(passes.every(p=>!p.rectangle||p.rectangle.width>0))
})
test('Render scaling caps memory for very large pages',()=>{
 const scale=renderScale(3000,2000,{quality:'deep'})
 assert.ok(3000*2000*scale*scale<=5_500_000+1)
 assert.ok(scale>0)
})
