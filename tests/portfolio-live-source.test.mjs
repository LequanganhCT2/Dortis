import test from 'node:test'
import assert from 'node:assert/strict'
import {resolveArtistPortfolio,sourceBoundField,restoreLinkedFields} from '../src/features/portfolio/templates/resolvedPortfolio.js'
import {copySourceSection} from '../src/features/portfolio/templates/sourceBinding.js'
import {setSectionField} from '../src/features/portfolio/templates/model.js'

const template={name:'Studio',blueprint:{style:'editorial',sections:[
  {id:'hero',label:'Hero',layout:'split',slots:1},{id:'story',label:'Story',layout:'text',slots:0}
]}}
const person={id:'artist-a',name:'Nghệ sĩ A',sections:[
 {page:1,title:'A gốc',body:'Giới thiệu A'},
 {page:2,title:'Tiểu sử',body:'Tiểu sử gốc'}]}
test('Portfolio text always follows latest approved PDF profile when linked',()=>{
 const original=copySourceSection({sections:{}},'story',person.sections[1])
 const edited={...person,sections:[person.sections[0],{...person.sections[1],body:'Tiểu sử đã cập nhật'}]}
 const view=resolveArtistPortfolio(template,{content:original},edited)
 assert.equal(view.sections[1].body,'Tiểu sử đã cập nhật')
 assert.equal(view.sections[1].sourceStatus,'linked')
})
test('Per-field overrides do not modify or leak original artist profile',()=>{
 const source=copySourceSection({sections:{}},'story',person.sections[1])
 const own=setSectionField(source,'story','body','Lời giới thiệu phiên bản riêng')
 const updated=resolveArtistPortfolio(template,{content:own},person)
 assert.equal(updated.sections[1].title,'Tiểu sử')
 assert.equal(updated.sections[1].body,'Lời giới thiệu phiên bản riêng')
 assert.equal(person.sections[1].body,'Tiểu sử gốc')
 assert.equal(own.sections.story.fieldOverrides.body,true)
})
test('Restoring linked text recovers the latest source value without erasing image paths',()=>{
 const c=copySourceSection({images:{'hero:0':{path:'a/private.jpg'}}},'story',person.sections[1])
 const changed=setSectionField(c,'story','body','Tùy biến')
 const restored=restoreLinkedFields(changed,'story',['body'])
 assert.equal(sourceBoundField(person,restored,'story','body'),'Tiểu sử gốc')
 assert.equal(restored.images['hero:0'].path,'a/private.jpg')
})
test('Missing linked page never silently renders an outdated claim',()=>{
 const c=copySourceSection({sections:{}},'story',person.sections[1])
 const updated={...person,sections:[person.sections[0]]}
 const view=resolveArtistPortfolio(template,{content:c},updated)
 assert.equal(view.sections[1].body,'')
 assert.equal(view.sections[1].sourceStatus,'missing')
})
test('Each artist and template remain isolated even when instance IDs coincide',()=>{
 const c=copySourceSection({sections:{}},'story',person.sections[1])
 const other={id:'artist-b',name:'Nghệ sĩ B',sections:[
   {page:1,title:'B mới',body:'Khác'},
   {page:2,title:'B bio',body:'Nội dung của B'}]}
 assert.equal(resolveArtistPortfolio(template,{content:c},other).sections[1].body,'Nội dung của B')
 assert.equal(resolveArtistPortfolio(template,{content:c},person).sections[1].body,'Tiểu sử gốc')
})
