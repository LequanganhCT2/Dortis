import test from 'node:test'
import assert from 'node:assert/strict'
import {
 needsOcrPage,selectAutomaticOcrPages,combinePdfOcrText,mergeOcrPasses,applyOcrToReview
} from '../src/features/artists/domain/ocrReconciliation.js'
test('Mixed raster+text PDF sends every page to OCR, including substantial text layers',()=>{
 const pages=[
 {page:1,rawText:'Một trang có nhiều chữ từ PDF nhưng có thể còn một đoạn raster trong ảnh.'.repeat(6)},
 {page:2,rawText:''},{page:3,rawText:'Ảnh và chữ nhỏ'},
 {page:4,rawText:'Văn bản dài, có thể vẫn thiếu chữ raster.'.repeat(12)}]
 assert.deepEqual(selectAutomaticOcrPages(pages),[1,2,3,4])
 assert.equal(needsOcrPage(pages[0]),false)
 assert.equal(selectAutomaticOcrPages(pages,2).length,2)
})
test('OCR merged from multiple passes retains unobserved sentences',()=>{
 const text=mergeOcrPasses([
 {kind:'full',text:'HÀNH TRÌNH ÂM NHẠC\n10 NĂM HOẠT ĐỘNG'},
 {kind:'right',text:'HÀNH TRÌNH ÂM NHẠC\nMột hành trình bằng cảm xúc.'},
 {kind:'left',text:'10 NĂM HOẠT ĐỘNG\nTình yêu với nghệ thuật.'}
 ])
 assert.equal(text.split('\n').filter(l=>/HÀNH TRÌNH/.test(l)).length,1)
 assert.match(text,/hành trình bằng cảm xúc/)
 assert.match(text,/Tình yêu với nghệ thuật/)
})
test('OCR should not duplicate exact or near-duplicate PDF source lines',()=>{
 const merged=combinePdfOcrText('HÀNH TRÌNH ÂM NHẠC\nMười năm hoạt động.',
 'HANH TRINH AM NHAC\nMười năm hoạt động.\nBắt đầu từ niềm đam mê.')
 assert.match(merged,/Bắt đầu/)
 assert.equal(merged.split('\n').length,3)
})
test('Image-only pages are filled but remain unapproved',()=>{
 const review=applyOcrToReview({pages:[{page:2,title:'',body:'',pdfText:'',warnings:[],reviewed:false}],quality:{}},
 [{page:2,text:'HÀNH TRÌNH ÂM NHẠC\nMười năm hoạt động.',confidence:74,passes:[{kind:'full',text:'HÀNH TRÌNH ÂM NHẠC'}]}])
 assert.equal(review.pages[0].reviewed,false)
 assert.equal(review.pages[0].title,'HÀNH TRÌNH ÂM NHẠC')
 assert.equal(review.pages[0].ocrPasses.length,1)
 assert.equal(review.quality.imageOnly,0)
})
test('Manual changes are preserved and cancellation leaves previous pages untouched',()=>{
 const review={pages:[
 {page:1,body:'Đã sửa',title:'Tiêu đề đã sửa',editedFields:{title:true,body:true},
 warnings:[],reviewed:false,ocrText:'',pdfText:'Cũ'},
 {page:2,title:'Trang 2',body:'',warnings:[],reviewed:false}
 ],quality:{}}
 const next=applyOcrToReview(review,[{page:1,text:'Máy đọc khác',confidence:31}])
 assert.equal(next.pages[0].body,'Đã sửa')
 assert.equal(next.pages[0].title,'Tiêu đề đã sửa')
 assert.deepEqual(next.pages[1],review.pages[1])
})
test('Page-level OCR errors do not silently replace text or imply success',()=>{
 const review={pages:[{page:1,title:'A',body:'Gốc',warnings:[],reviewed:false}],quality:{}}
 const next=applyOcrToReview(review,[{page:1,error:'Không thể đọc vùng ảnh'}])
 assert.equal(next.pages[0].body,'Gốc')
 assert.equal(next.pages[0].ocrStatus,'failed')
 assert.equal(next.quality.ocrFailed,1)
})
test('Unknown OCR confidence must not be displayed as zero percent',()=>{
 const review={pages:[{page:1,title:'Trang',body:'',warnings:[],reviewed:false}],quality:{}}
 const next=applyOcrToReview(review,[{page:1,text:'Xin chào',confidence:null}])
 assert.equal(next.pages[0].ocrConfidence,null)
})
