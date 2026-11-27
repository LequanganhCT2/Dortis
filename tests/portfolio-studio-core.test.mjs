import test from 'node:test'
import assert from 'node:assert/strict'
import {newStudioElement,studioLayout,patchStudioElement,replaceStudioElements,studioElements,snapshotImagePaths,addStudioSection,withoutPending,safeStudioHref} from '../src/features/portfolio/templates/studioModel.js'
test('New independent layers preserve other artist content and separate mobile styles',()=>{
  const element=newStudioElement('title','a')
  const doc=replaceStudioElements({sections:{hero:{title:'Original'}}},'hero',[element,newStudioElement('body','b')])
  const next=patchStudioElement(doc,'hero','a','mobile',{text:'New title',x:45,rotation:90,size:36})
  assert.equal(studioElements(next,'hero')[0].text,'New title')
  assert.equal(studioElements(next,'hero')[0].mobile.x,45)
  assert.deepEqual(studioElements(next,'hero')[0].desktop,element.desktop)
  assert.equal(studioElements(next,'hero')[1],studioElements(doc,'hero')[1])
  assert.deepEqual(next.sections,doc.sections)
  assert.equal(studioElements(doc,'hero')[0].text,element.text)
})
test('Image publication includes template and independent media without duplicates',()=>{
  const image=newStudioElement('image','image1',{path:'new.jpg'})
  const doc=replaceStudioElements({view:{sections:[{id:'hero',images:[{path:'old.jpg'},{path:'old.jpg'}]}]}},'hero',[image])
  assert.deepEqual(snapshotImagePaths(doc),['old.jpg','new.jpg'])
})
test('Section is local to instance; unpublished metadata removed before publish',()=>{
  const pair={content:{sections:{old:{title:'Source'}}},snapshot:{view:{sections:[{id:'old',title:'Source'}]}}}
  const next=addStudioSection(pair,'studio-a','Extra')
  assert.equal(next.content.extraSections[0].id,'studio-a')
  assert.equal(next.snapshot.view.sections[1].label,'Extra')
  assert.equal(next.content.sections.old.title,'Source')
  assert.equal(pair.snapshot.view.sections.length,1)
  assert.deepEqual(withoutPending({...next.content,studioPending:{snapshot:{}}}),next.content)
})
test('Style ranges and links are sanitized; shapes can disable fill',()=>{
  const v=studioLayout({w:1000,rotation:-999,opacity:-5,fill:false,color:'bad',font:'bad'},'shape')
  assert.equal(v.w,180);assert.equal(v.rotation,-180);assert.equal(v.opacity,0);assert.equal(v.fill,false)
  assert.equal(v.color,'#233950')
  assert.equal(safeStudioHref('javascript:alert(1)'),undefined)
  assert.equal(safeStudioHref('https://example.com'),'https://example.com/')
})
