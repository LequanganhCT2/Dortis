import test from 'node:test'
import assert from 'node:assert/strict'
import {buildReviewFromExtraction,uniqueSourceLines,normalizeReviewedPage,validateReviewedImport,
  suggestPageLayout} from '../src/features/artists/domain/pdfReviewModel.js'

test('Different portfolios create independent generic review records without singer-specific assumptions',()=>{
 const singer=buildReviewFromExtraction({name:'Long Nhật',role:'Ca sĩ',sections:[
  {page:1,title:'Trang bìa',rawText:'LONG NHẬT'},
  {page:2,title:'Trang 2',rawText:'Tiểu sử\nNội dung tiểu sử đầy đủ của nghệ sĩ.'},
  {page:3,title:'Trang 3',rawText:'Thông tin biểu diễn\nPop, Rock, Ballad'},
  {page:5,title:'GALA DINNER',rawText:'GALA DINNER\nẢnh sân khấu'},
  {page:8,title:'Trang 8',rawText:''}
 ]})
 const designer=buildReviewFromExtraction({name:'Hà Phương Studio',role:'Nhiếp ảnh',sections:[
  {page:1,title:'Trang bìa',rawText:'HÀ PHƯƠNG\nPHOTOGRAPHER'},
  {page:2,title:'Trang 2',rawText:'VỀ TÔI\nBộ ảnh chân dung và câu chuyện nghề nghiệp.'},
  {page:3,title:'Trang 3',rawText:'BỘ SƯU TẬP ẢNH\nNhững tác phẩm trong năm.'}
 ]})
 assert.equal(singer.pageCount,5)
 assert.equal(designer.pageCount,3)
 assert.equal(singer.pages[4].title,'')
 assert.equal(singer.quality.imageOnly,1)
 assert.equal(designer.role,'Nhiếp ảnh')
 assert.equal(designer.pages[2].layout,'gallery')
 assert.ok(singer.pages.every(p=>!p.reviewed))
 assert.ok(designer.pages.every(p=>!p.reviewed))
})
test('Unknown page content is preserved and needs review; no assumptions about page number',()=>{
 const item=buildReviewFromExtraction({name:'Studio B',sections:[
  {page:1,title:'Trang bìa',rawText:''},
  {page:2,title:'Trang 2',rawText:'Chúng tôi yêu nghề và làm các dự án mang tính sáng tạo, với những trải nghiệm phong phú, đa dạng.'}
 ]})
 assert.equal(item.pages[0].title,'Studio B')
 assert.equal(item.pages[1].title,'')
 assert.match(item.pages[1].body,/Chúng tôi yêu nghề/)
 assert.ok(validateReviewedImport(item))
})
test('Titles and body retain evidence; no automatic source cropping or storage references',()=>{
 const page=normalizeReviewedPage({page:4,title:'  Thành tích  ',body:'10 giải thưởng\nDự án 2026',layout:'awards'})
 assert.equal(page.title,'Thành tích')
 assert.equal(page.body,'10 giải thưởng\nDự án 2026')
 assert.deepEqual(page.media,[])
 assert.deepEqual(page.photos,[])
 assert.equal(page.original_page_path,null)
})
test('Repeated visible lines remain available for manual page review',()=>{
 assert.deepEqual(uniqueSourceLines('GALA DINNER\nGALA DINNER\nGala show\nGALA DINNER'),['GALA DINNER','GALA DINNER','Gala show','GALA DINNER'])
})
test('Approval of all extracted or image-only pages is required',()=>{
 const doc=buildReviewFromExtraction({name:'Portfolio A',sections:[
  {page:1,title:'Cover',rawText:''},{page:2,title:'Page 2',rawText:''}
 ]})
 assert.ok(validateReviewedImport(doc))
 doc.pages.forEach(p=>{p.title='Đã kiểm tra PDF';p.reviewed=true})
 assert.equal(validateReviewedImport(doc),null)
})
test('Layout is a hint across creative disciplines, not a fixed event list',()=>{
 assert.equal(suggestPageLayout(5,'Awards','Giải nhất'),'awards')
 assert.equal(suggestPageLayout(3,'PHOTO GALLERY','Ảnh'),'gallery')
 assert.equal(suggestPageLayout(8,'Contact','hello@example.com'),'contact')
 assert.equal(suggestPageLayout(1,'Minh','Artist'),'cover')
})
