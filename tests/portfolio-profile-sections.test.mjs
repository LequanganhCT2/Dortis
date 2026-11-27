import test from 'node:test'
import assert from 'node:assert/strict'
import {importProfileSections} from '../src/features/portfolio/templates/profileSections.js'
import {resolveArtistPortfolio,sourceBoundField} from '../src/features/portfolio/templates/resolvedPortfolio.js'
import {normalizeArtistSection} from '../src/artistLayouts.js'
import {normalizeReviewedPage} from '../src/features/artists/domain/pdfReviewModel.js'

const template={blueprint:{sections:[
  {id:'hero',label:'Hero',layout:'cover',slots:1},
  {id:'story',label:'Story',layout:'text',slots:0}
]}}
const profile={name:'Nghệ sĩ',sections:[
  {page:7,name:'Mở đầu',title:'Tên riêng',body:'Nội dung gốc',highlights:['Nội dung gốc']},
  {page:2,name:'Hành trình',title:'Tiêu đề tùy ý',body:'Đoạn thứ hai'},
  {page:9,name:'Kết nối',title:'Liên hệ',body:'Đoạn cuối'}
]}
test('Every profile part maps in explicit array order without guessing or dropping overflow',()=>{
  const before=JSON.stringify({template,profile})
  const content=importProfileSections(template,profile)
  const view=resolveArtistPortfolio(template,{content},profile)
  assert.deepEqual(view.sections.map(s=>[s.label,s.title,s.body]),profile.sections.map(s=>[s.name,s.title,s.body]))
  assert.equal(view.sections[0].layout,'cover')
  assert.equal(view.sections[2].layout,'text')
  assert.equal(sourceBoundField(profile,content,'profile-part-7','body'),'Nội dung gốc')
  assert.equal(JSON.stringify({template,profile}),before)
})
test('Reimport preserves edits and assets; fresh source values update fields without overrides',()=>{
  let content=importProfileSections(template,profile)
  content.images={'profile-part-7:0':{path:'artist/photo.jpg'}}
  content.sections['profile-part-7']={sourcePage:7,title:'Chỉnh riêng',fieldOverrides:{title:true}}
  const changed={...profile,sections:[profile.sections[2],{...profile.sections[0],body:'Nội dung mới'}]}
  const imported=importProfileSections(template,changed,content)
  const view=resolveArtistPortfolio(template,{content:imported},changed)
  assert.deepEqual(view.sections.map(s=>s.sourcePage),[9,7])
  assert.equal(view.sections[1].title,'Chỉnh riêng')
  assert.equal(view.sections[1].body,'Nội dung mới')
  assert.equal(view.sections[1].images[0]?.path,'artist/photo.jpg')
  assert.equal(imported.images['profile-part-7:0'].path,'artist/photo.jpg')
})
test('Source part names survive manual and PDF normalization',()=>{
  assert.equal(normalizeArtistSection({name:'Tên phần',contentVersion:2}).name,'Tên phần')
  assert.equal(normalizeReviewedPage({page:1,name:'Tên phần',title:'Title',body:'Body'}).name,'Tên phần')
})
test('Legacy duplicate blocks stay recoverable without leaking into the imported profile',()=>{
  const extraSections=[{id:'studio-old',label:'Nội dung cũ',layout:'text',slots:0}]
  const content=importProfileSections(template,profile,{extraSections})
  assert.equal(resolveArtistPortfolio(template,{content},profile).sections.length,3)
  assert.deepEqual(content.legacyExtraSections,extraSections)
  assert.equal(extraSections.length,1)
})
test('Reject unsupported imports before changing a draft',()=>{
  assert.throws(()=>importProfileSections(template,{sections:[]}),/chưa có phần/)
  assert.throws(()=>importProfileSections(template,profile,{studioPending:{}}),/Studio/)
  assert.throws(()=>importProfileSections(template,{sections:[{page:1},{page:1}]}),/mã phần/)
  assert.throws(()=>importProfileSections(template,{sections:Array.from({length:25},(_,i)=>({page:i+1}))}),/24/)
})
