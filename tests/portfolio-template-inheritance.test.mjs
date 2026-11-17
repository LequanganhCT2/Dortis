import test from 'node:test'
import assert from 'node:assert/strict'
import {PRESET_FORMS,blueprintFor,normalizeBlueprint,resolveInstance,
  setSectionField,setSlotImage,templateAssignments} from '../src/features/portfolio/templates/model.js'

test('Two reusable Silk Forms, no artist data or imported PDF photos',()=>{
  assert.equal(PRESET_FORMS.length,2)
  assert.equal(new Set(PRESET_FORMS.map(p=>p.slug)).size,1)
  assert.ok(PRESET_FORMS.every(p=>p.sections.length===8))
  assert.ok(PRESET_FORMS.every(p=>p.sections.every(s=>Number.isInteger(s.slots))))
  assert.ok(PRESET_FORMS.every(p=>!JSON.stringify(p).includes('Long Nhật')))
})
test('One form inherited by many artists while content remains isolated',()=>{
  const t={id:'form1',name:'Editorial',version:2,blueprint:blueprintFor(PRESET_FORMS[0])}
  const a={id:'artistA',name:'Artist A'},b={id:'artistB',name:'Artist B'}
  const ca=setSlotImage(setSectionField({},'hero','title','Xin chào A'),'hero:0',{path:'a/a.webp'})
  const cb=setSlotImage(setSectionField({},'hero','title','Hello B'),'hero:0',{path:'b/b.webp'})
  const va=resolveInstance(t,{content:ca},a),vb=resolveInstance(t,{content:cb},b)
  assert.equal(va.sections[0].title,'Xin chào A')
  assert.equal(vb.sections[0].title,'Hello B')
  assert.equal(va.sections[0].images[0].path,'a/a.webp')
  assert.equal(vb.sections[0].images[0].path,'b/b.webp')
  t.blueprint.sections[0].layout='cover'
  assert.equal(resolveInstance(t,{content:ca},a).sections[0].layout,'cover')
  assert.equal(resolveInstance(t,{content:cb},b).sections[0].layout,'cover')
})
test('Assigned artists are nested under each shared template',()=>{
  const templates=[{id:'T1'},{id:'T2'}]
  const assignments=[{id:'I1',template_id:'T1',profile_id:'A'},
    {id:'I2',template_id:'T1',profile_id:'B'},{id:'I3',template_id:'T2',profile_id:'A'}]
  const items=templateAssignments(templates,assignments,[{id:'A',name:'An'},{id:'B',name:'Binh'}])
  assert.deepEqual(items.map(t=>t.people.length),[2,1])
})
test('Blueprint sanitization clamps image slots and drops duplicate section IDs',()=>{
  const b=normalizeBlueprint({style:'invalid',sections:[
    {id:'hero',slots:90,layout:'bad'},{id:'hero',slots:1},{id:'bad/code',slots:1}
  ]})
  assert.equal(b.style,'editorial')
  assert.equal(b.sections.length,1)
  assert.equal(b.sections[0].slots,10)
  assert.equal(b.sections[0].layout,'split')
})
