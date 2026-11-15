import test from 'node:test'
import assert from 'node:assert/strict'
import {artistSourcePages,copySourceSection,hydrateInstanceFromArtist,suggestSourceForLayout}
from '../src/features/portfolio/templates/sourceBinding.js'
const form={blueprint:{style:'cinematic',sections:[
 {id:'hero',layout:'cover',slots:1},{id:'story',layout:'split',slots:1},
 {id:'skills',layout:'grid',slots:3},{id:'moments',layout:'mosaic',slots:3},
 {id:'gallery',layout:'grid',slots:6},{id:'booking',layout:'text',slots:0}
]}}
const singer={id:'a1',name:'Long Nhật',sections:[
 {page:1,layout:'cover',title:'LONG NHẬT',body:'Ca sĩ'},
 {page:2,layout:'biography',title:'Tiểu sử',body:'Thông tin tiểu sử'},
 {page:3,layout:'feature',title:'Thông tin biểu diễn',body:'Pop · Rock'},
 {page:4,layout:'stats',title:'Dấu ấn',metrics:[['4+','Năm']]},
 {page:5,layout:'gallery',title:'Gala Dinner',body:''},
 {page:6,layout:'gallery',title:'Year End Party',body:''}
]}
const visualDesigner={id:'a2',name:'Việt Anh',sections:[
 {page:1,layout:'cover',title:'VIỆT ANH',body:'Art Director'},
 {page:2,layout:'biography',title:'Về tôi',body:'Tiểu sử người làm hình ảnh'},
 {page:3,layout:'list',title:'Kỹ năng',body:'Motion · Graphic Design'},
 {page:4,layout:'awards',title:'Giải thưởng',body:'Giải thiết kế 2026'},
 {page:5,layout:'gallery',title:'Dự án',body:'Tác phẩm thiết kế'}
]}
test('Two different careers can hydrate the same reusable form',()=>{
 const a=hydrateInstanceFromArtist(form,singer),b=hydrateInstanceFromArtist(form,visualDesigner)
 assert.equal(a.sections.hero.title,'LONG NHẬT')
 assert.equal(b.sections.hero.title,'VIỆT ANH')
 assert.equal(a.sections.story.body,'Thông tin tiểu sử')
 assert.equal(b.sections.story.body,'Tiểu sử người làm hình ảnh')
 assert.equal(a.sections.skills.body,'Pop · Rock')
 assert.equal(b.sections.skills.body,'Motion · Graphic Design')
 assert.equal(b.sections.moments.title,'Giải thưởng')
 assert.equal(b.sections.gallery.title,'Dự án')
 assert.equal(a.sections.booking,undefined)
 assert.equal(b.sections.booking,undefined)
})
test('Per-instance overrides and uploaded photos remain isolated',()=>{
 const own={sections:{story:{title:'Tôi đã sửa',body:'Bản riêng'}},
  images:{'hero:0':{path:'private-b.webp'}}}
 const b=hydrateInstanceFromArtist(form,visualDesigner,own,true)
 assert.equal(b.sections.story.title,'Tôi đã sửa')
 assert.equal(b.images['hero:0'].path,'private-b.webp')
})
test('Manual source mapping picks the requested page, not pre-scripted content',()=>{
 const existing={sections:{story:{body:'Earlier'}},images:{'hero:0':{path:'own.webp'}}}
 const revised=copySourceSection(existing,'story',artistSourcePages(visualDesigner)[2])
 assert.equal(revised.sections.story.body,'Motion · Graphic Design')
 assert.equal(revised.sections.story.sourcePage,3)
 assert.equal(revised.images['hero:0'].path,'own.webp')
})
test('Contact source is not synthesized from an unrelated profile page',()=>{
 const pages=artistSourcePages(visualDesigner)
 assert.equal(suggestSourceForLayout({id:'booking'},pages),null)
 const p={...visualDesigner,sections:[...visualDesigner.sections,
  {page:6,layout:'contact',title:'Contact',body:'example@example.com'}]}
 assert.equal(suggestSourceForLayout({id:'booking'},artistSourcePages(p)).page,6)
})
test('Page order is determined by actual PDF page numbers not template type',()=>{
 assert.deepEqual(artistSourcePages({sections:[{page:3},{page:1},{page:2}]}).map(x=>x.page),[1,2,3])
})
