import test from 'node:test'
import assert from 'node:assert/strict'
import {paragraphsFromBlocks,readableParagraphText,guessOcrHeading,selectPrimaryOcr,validRegionProposal}
 from '../src/features/artists/domain/ocrLayout.js'
const block=(x0,y0,text,confidence=87)=>({
 bbox:{x0,y0,x1:x0+350,y1:y0+70},
 paragraphs:[{text,confidence,bbox:{x0,y0,x1:x0+350,y1:y0+70},
   lines:[{text}]}]
})
test('OCR paragraphs are ordered spatially, not by random block insertion order',()=>{
 const result=paragraphsFromBlocks([
  block(60,500,'Một hành trình nghệ thuật nhiều cảm xúc.'),
  block(60,100,'DẤU ẤN NGHỆ THUẬT'),
  block(60,340,'1.000+ CHƯƠNG TRÌNH BIỂU DIỄN'),
  block(60,210,'10 NĂM HOẠT ĐỘNG NGHỆ THUẬT')
 ],1300)
 assert.deepEqual(result.map(p=>p.text),[
  'DẤU ẤN NGHỆ THUẬT','10 NĂM HOẠT ĐỘNG NGHỆ THUẬT',
  '1.000+ CHƯƠNG TRÌNH BIỂU DIỄN','Một hành trình nghệ thuật nhiều cảm xúc.'])
 assert.equal(guessOcrHeading(result,900),'DẤU ẤN NGHỆ THUẬT')
 assert.match(readableParagraphText(result),/10 NĂM HOẠT ĐỘNG NGHỆ THUẬT\n\n1\.000\+/)
})
test('Block line fragments become a single coherent paragraph',()=>{
 const result=paragraphsFromBlocks([{
  bbox:{x0:10,y0:30,x1:320,y1:120},paragraphs:[{
   confidence:81,bbox:{x0:10,y0:30,x1:320,y1:120},
   lines:[{text:'Một hành trình bền bỉ với âm nhạc,'},
          {text:'từ các chương trình văn hóa nghệ thuật.'}]
  }]
 }],450)
 assert.equal(result[0].text,'Một hành trình bền bỉ với âm nhạc, từ các chương trình văn hóa nghệ thuật.')
})
test('Primary OCR does not append 3 overlapping crops and garbage fragments',()=>{
 const primary=selectPrimaryOcr([
 {kind:'full',text:'DẤU ẤN NGHỆ THUẬT\n10 NĂM HOẠT ĐỘNG',confidence:85},
 {kind:'left',text:'NAM HOAT PONG\nca a\n7/41',confidence:91},
 {kind:'right',text:'ngệ thuật\nMƠ HỔ',confidence:90}
 ])
 assert.equal(primary.kind,'full')
 assert.doesNotMatch(primary.text,/PONG|7\/41/)
 assert.equal(validRegionProposal({kind:'left',text:'ca a 7/41'}),false)
})
test('No empty or incoherent OCR heading is invented from scraps',()=>{
 const ps=paragraphsFromBlocks([block(10,20,'ca a',52),block(10,120,'7/41',70)],600)
 assert.equal(guessOcrHeading(ps,500),'')
})
test('Fallback supports region pass when full page contains no text',()=>{
 const result=selectPrimaryOcr([{kind:'full',text:''},{kind:'right',text:'VỀ HÀNH TRÌNH ÂM NHẠC',confidence:79}])
 assert.equal(result.kind,'right')
 assert.equal(result.text,'VỀ HÀNH TRÌNH ÂM NHẠC')
})
