import test from 'node:test'
import assert from 'node:assert/strict'
import { designArtistPdf, identifyArtistLayout, normalizeArtistSection, ARTIST_LAYOUT_OPTIONS } from '../src/artistLayouts.js'

const cases=[
  {file:'PORFOLIO - LONG NHẬT SINGER.pdf',name:'Long Nhật',count:8,theme:'stage'},
  {file:'LUDANCE - PROFILE.pdf',name:'Ngọc Trâm',count:11,theme:'pearl'},
  {file:'CA SĨ LA TRINH - PORTFOLIO .pdf',name:'La Trinh',count:12,theme:'rose'},
]

for(const entry of cases){
  test('renders '+entry.file+' as '+entry.count+' editable HTML sections',()=>{
    const result=designArtistPdf({
      page_count:entry.count,
      sections:Array.from({length:entry.count},(_,i)=>({page:i+1,title:'Trang '+(i+1),body:''}))
    },entry.file)
    assert.equal(result.name,entry.name)
    assert.equal(result.theme,entry.theme)
    assert.equal(result.sections.length,entry.count)
    assert.deepEqual(result.sections.map(s=>s.page),Array.from({length:entry.count},(_,i)=>i+1))
    assert.ok(result.sections.every(s=>ARTIST_LAYOUT_OPTIONS.some(([id])=>id===s.layout)))
    assert.ok(result.sections.some(s=>s.photos.length))
    assert.ok(result.sections.every(s=>!s.media.length && !s.image_url))
    for(const section of result.sections)for(const photo of section.photos){
      assert.ok(photo.x>=0 && photo.x<1)
      assert.ok(photo.y>=0 && photo.y<1)
      assert.ok(photo.w>0 && photo.w<=1)
      assert.ok(photo.h>0 && photo.h<=1)
      assert.ok(photo.x+photo.w<=1.001,'Crop must stay within the PDF page width')
      assert.ok(photo.y+photo.h<=1.001,'Crop must stay within the PDF page height')
    }
  })
}
test('unknown PDF uses editable CSS and never manufactures full-page image URLs',()=>{
 const result=designArtistPdf({name:'Unknown singer',role:'Ca sĩ',page_count:2,
   sections:[{page:1,title:'Trang bìa',body:''},{page:2,title:'Intro',body:'Hello'}]},'profile-new.pdf')
 assert.equal(result.sections.length,2)
 assert.equal(result.sections[0].layout,'cover')
 assert.equal(result.sections[1].layout,'feature')
 assert.ok(result.sections.every(s=>s.photos.length===0 && !s.image_url))
})
test('legacy media paths remain removable through normalized sections',()=>{
 const section=normalizeArtistSection({page:2,title:'Tiểu sử',
   image_url:'https://example.com/old.jpg',image_storage_path:'legacy/page-2.jpg',
   media:[{url:'https://example.com/cropped.jpg',path:'photos/2.webp'}]})
 assert.equal(section.image_storage_path,'legacy/page-2.jpg')
 assert.equal(section.media[0].path,'photos/2.webp')
})
test('known PDF identifiers preserve accents and decomposition',()=>{
 assert.equal(identifyArtistLayout('LONG NHẬT singer.PDF')?.key,'long-nhat')
 assert.equal(identifyArtistLayout('LUDANCE - PROFILE.pdf')?.key,'ludance')
 assert.equal(identifyArtistLayout('LA TRINH - PORTFOLIO.pdf')?.key,'la-trinh')
})
