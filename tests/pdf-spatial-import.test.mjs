import test from 'node:test'
import assert from 'node:assert/strict'
import {extractTextBlocks} from '../src/artistPdf.js'
import {combinePositionedText} from '../src/features/artists/domain/spatialMerge.js'
import {selectAutomaticOcrPages,applyOcrToReview} from '../src/features/artists/domain/ocrReconciliation.js'
import {buildReviewFromExtraction,normalizeReviewedPage,validateReviewedImport}
  from '../src/features/artists/domain/pdfReviewModel.js'
import {normalizeArtistSection} from '../src/artistLayouts.js'
import {suggestSourceForLayout} from '../src/features/portfolio/templates/sourceBinding.js'

const box=(x0,y0,x1,y1)=>({x0,y0,x1,y1})
test('Mixed PDF text and raster OCR are ordered spatially without cloning a heading',()=>{
  const pdf=[{text:'HÀNH TRÌNH NGHỆ THUẬT',bbox:box(.06,.07,.42,.11)},
    {text:'Tiểu sử lấy từ lớp chữ gốc.',bbox:box(.06,.19,.45,.23)}]
  const ocr=[{text:'HANH TRINH NGHE THUAT',bbox:box(.06,.07,.42,.11),confidence:90},
    {text:'Một đoạn chữ trong ảnh được bổ sung.',bbox:box(.55,.18,.95,.31),confidence:88}]
  const result=combinePositionedText(pdf,ocr)
  assert.equal(result.added,1)
  assert.equal(result.text.match(/HÀNH TRÌNH/g).length,1)
  assert.doesNotMatch(result.text,/HANH TRINH/)
  assert.match(result.text,/Một đoạn chữ trong ảnh/)
  assert.equal(result.blocks.find(b=>b.source==='ocr').text,'Một đoạn chữ trong ảnh được bổ sung.')
})
test('Unreliable OCR fragments cannot pollute selectable PDF text',()=>{
  const out=combinePositionedText(
    [{text:'Nội dung chính xác từ PDF',bbox:box(.1,.1,.4,.2)}],
    [{text:'7/41 ca a',bbox:box(.1,.1,.3,.2),confidence:31}]
  )
  assert.equal(out.added,0)
  assert.equal(out.unverified.length,1)
  assert.equal(out.text,'Nội dung chính xác từ PDF')
})
test('Review integration preserves manually edited text during re-OCR',()=>{
  const page={page:1,title:'Trang đầu',body:'Đã sửa và duyệt đối chiếu',
    pdfText:'Chữ PDF',pdfBlocks:[{text:'Chữ PDF',bbox:box(.1,.1,.3,.2)}],
    editedFields:{body:true},reviewed:false,warnings:[]}
  const next=applyOcrToReview({pages:[page],quality:{}},[{
    page:1,text:'Chữ PDF\nĐoạn khác',confidence:90,
    paragraphs:[{text:'Đoạn khác',confidence:95,bbox:box(.7,.7,.9,.9)}]
  }])
  assert.equal(next.pages[0].body,'Đã sửa và duyệt đối chiếu')
  assert.equal(next.pages[0].sourceBlocks.length,2)
  assert.equal(next.pages[0].ocrMainSource,'manual')
})
test('Full 60 page PDF is selected automatically instead of stopping after 24',()=>{
  const pages=Array.from({length:60},(_,index)=>({
    page:index+1,rawText:'Selectable text and embedded images',reviewed:false,ocrStatus:'not_run'
  }))
  assert.equal(selectAutomaticOcrPages(pages).length,60)
})
test('Long paragraph survives extraction, review, profile save and edit normalization',()=>{
  const paragraph='Hành trình sáng tạo và biểu diễn trên nhiều sân khấu. '.repeat(340)
  assert.ok(paragraph.length>14000)
  const review=buildReviewFromExtraction({name:'Nghệ sĩ thử nghiệm',sections:[
    {page:1,title:'Giới thiệu',rawText:paragraph,
      pdfBlocks:[{text:paragraph,bbox:box(.1,.1,.9,.8)}]}
  ]})
  assert.equal(review.pages[0].body.length,paragraph.trim().length)
  review.pages[0].reviewed=true
  const section=normalizeReviewedPage(review.pages[0])
  const normalized=normalizeArtistSection(section)
  assert.equal(normalized.body.length,paragraph.trim().length)
  assert.equal(normalized.text_blocks[0].source,'pdf')
  assert.equal(validateReviewedImport(review),null)
})
test('PDF text repeats at different coordinates are not silently removed',()=>{
  const token=(str,x,y,width=125)=>({str,width,transform:[1,0,0,11,x,y]})
  const blocks=extractTextBlocks({items:[
    token('10 NĂM',40,750),token('10 NĂM',40,450)
  ]},800,1000)
  assert.equal(blocks.length,2)
  assert.ok(blocks[0].bbox.y0<blocks[1].bbox.y0)
})
test('Unrelated source content is not injected into template sections',()=>{
  const pages=[{page:1,title:'Một trang không liên quan',layout:'feature',body:'Tiểu sử'}]
  assert.equal(suggestSourceForLayout({id:'gallery',label:'Bộ sưu tập ảnh'},pages),null)
})
