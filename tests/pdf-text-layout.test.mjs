import test from 'node:test'
import assert from 'node:assert/strict'
import {extractLines} from '../src/artistPdf.js'
const token=(str,x,y,width=150)=>({str,width,transform:[1,0,0,11,x,y]})
test('Text layer does not join independent editorial columns on the same row',()=>{
 const content={items:[
  token('10 NĂM HOẠT ĐỘNG',40,800,200),
  token('1.000+ CHƯƠNG TRÌNH',455,800,220),
  token('NGHỆ THUẬT',40,760,120),
  token('BIỂU DIỄN',455,760,150)
 ]}
 assert.deepEqual(extractLines(content,800),[
  '10 NĂM HOẠT ĐỘNG','NGHỆ THUẬT','1.000+ CHƯƠNG TRÌNH','BIỂU DIỄN'
 ])
})
test('Nearby PDF text spans from the same line retain word spacing',()=>{
 const content={items:[token('HÀNH TRÌNH',40,740,85),token('ÂM NHẠC',130,740,70)]}
 assert.deepEqual(extractLines(content,800),['HÀNH TRÌNH ÂM NHẠC'])
})
test('Non-text PDF objects are never interpreted as words',()=>{
 assert.deepEqual(extractLines({items:[{foo:3}]},800),[])
})
