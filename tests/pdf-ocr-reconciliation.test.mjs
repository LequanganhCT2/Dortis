import test from 'node:test'
import assert from 'node:assert/strict'
import {needsOcrPage,selectAutomaticOcrPages,combinePdfOcrText,applyOcrToReview}
from '../src/features/artists/domain/ocrReconciliation.js'
test('Only missing or sparse text pages get automatic OCR, including mixed PDFs',()=>{
 const p=[{page:1,rawText:'Tập hợp chữ có thể chọn được ở trang đầu, gồm các thông tin đã đọc được đầy đủ và nhiều đoạn văn có ý nghĩa thực tế.'.repeat(3)},
 {page:2,rawText:''},{page:3,rawText:'DẤU ẤN NGHỆ THUẬT'},
 {page:4,rawText:'Một trang đầy đủ với những thông tin đã được đánh máy và có thể chọn trong PDF, gồm nhiều dòng mô tả chi tiết.'.repeat(3)}]
 assert.deepEqual(selectAutomaticOcrPages(p),[2,3])
 assert.equal(needsOcrPage(p[0]),false)
})
test('OCR merges raster text without repeating existing PDF headings',()=>{
 const merged=combinePdfOcrText('HÀNH TRÌNH ÂM NHẠC','HÀNH TRÌNH ÂM NHẠC\nTôi yêu âm nhạc và sân khấu.')
 assert.equal(merged,'HÀNH TRÌNH ÂM NHẠC\nTôi yêu âm nhạc và sân khấu.')
})
test('OCR augments missing pages, tags the confidence and keeps the text unapproved',()=>{
 const doc={pages:[{page:2,title:'',body:'',warnings:['Trang không có lớp chữ đọc được.'],
 pdfText:'',reviewed:false}],quality:{imageOnly:1,extracted:0}}
 const review=applyOcrToReview(doc,[{page:2,text:'HÀNH TRÌNH ÂM NHẠC\nNghệ sĩ đã hoạt động 10 năm.',confidence:82}])
 assert.equal(review.pages[0].title,'HÀNH TRÌNH ÂM NHẠC')
 assert.match(review.pages[0].body,/hoạt động 10 năm/)
 assert.equal(review.pages[0].ocrConfidence,82)
 assert.equal(review.pages[0].reviewed,false)
 assert.equal(review.quality.imageOnly,0)
})
test('Low confidence never gets treated as confirmed',()=>{
 const review=applyOcrToReview({pages:[{page:1,title:'Bìa',body:'',warnings:[],reviewed:false}],quality:{}},
 [{page:1,text:'CHỮ MƠ HỒ',confidence:35}])
 assert.ok(review.pages[0].warnings.some(w=>/thấp/.test(w)))
 assert.equal(review.pages[0].reviewed,false)
})

test('Manually edited content is not overwritten by a later OCR retry',()=>{
 const current={pages:[{page:2,title:'Tiểu sử đã sửa',body:'Nội dung tôi xác nhận.',
    pdfText:'Tiểu sử cũ',reviewed:false,editedFields:{title:true,body:true},warnings:[]}],
  quality:{extracted:1}}
 const updated=applyOcrToReview(current,[{page:2,text:'Tiểu sử máy đọc sai\nSố 123',confidence:34}])
 assert.equal(updated.pages[0].title,'Tiểu sử đã sửa')
 assert.equal(updated.pages[0].body,'Nội dung tôi xác nhận.')
 assert.equal(updated.pages[0].ocrText,'Tiểu sử máy đọc sai\nSố 123')
 assert.equal(updated.pages[0].reviewed,false)
})
