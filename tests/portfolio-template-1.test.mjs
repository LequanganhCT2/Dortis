import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {TEMPLATE_1,createTemplate1Profile} from '../src/features/portfolio/templates/template1.js'
import {importProfileSections} from '../src/features/portfolio/templates/profileSections.js'
import {resolveArtistPortfolio} from '../src/features/portfolio/templates/resolvedPortfolio.js'
import {normalizeArtistSection} from '../src/artistLayouts.js'

const sample=JSON.parse(readFileSync(new URL('../docs/template-1/la-trinh-pages.json',import.meta.url),'utf8'))
test('Template 1 has 12 independent editable pages, with artist data absent from the reusable definition',()=>{
  const a=createTemplate1Profile(),b=createTemplate1Profile()
  assert.equal(TEMPLATE_1.name,'Template 1')
  assert.equal(TEMPLATE_1.blueprint.sections.length,12)
  assert.equal(a.sections.length,12)
  assert.deepEqual(a.sections.map(s=>s.page),Array.from({length:12},(_,i)=>i+1))
  assert.doesNotMatch(JSON.stringify(TEMPLATE_1),/0788|latrinh111|1\.000\+/)
  assert.equal(a.name,'')
  assert.ok(a.sections.every(s=>s.body===''&&s.links.length===0))
  a.sections[0].body='Người A'
  assert.equal(b.sections[0].body,'')
})
test('PDF page data retains biography, numbers, four events, media URL, QR URL and contacts on their own pages',()=>{
  assert.equal(sample.sections.length,12)
  assert.match(sample.sections[1].body,/người kể chuyện bằng cả trái tim/)
  assert.match(sample.sections[2].body,/10 NĂM/)
  assert.match(sample.sections[2].body,/1\.000\+/)
  assert.equal(sample.sections[4].body.split('\n').length,4)
  assert.deepEqual(sample.sections[9].links,[
    'https://drive.google.com/drive/folders/11vw4JRnh1bmoYHRrbkCBcO8N5r-b_ZPE',
    'https://q.me-qr.com/j5fx2147'
  ])
  assert.match(sample.sections[10].body,/0788-699-241/)
  assert.match(sample.sections[10].body,/latrinh111@gmail\.com/)
  assert.ok([5,6,7,8].every(i=>sample.sections[i].body===''))
  assert.doesNotMatch(JSON.stringify(sample),/Long Nhật/)
})
test('Normalizing and mapping the filled example keeps all page boundaries and hyperlinks',()=>{
  const profile={...sample,sections:sample.sections.map(normalizeArtistSection)}
  const content=importProfileSections(TEMPLATE_1,profile)
  const view=resolveArtistPortfolio(TEMPLATE_1,{content},profile)
  assert.equal(view.sections.length,12)
  view.sections.forEach((section,i)=>{
    assert.equal(section.sourcePage,i+1)
    assert.equal(section.title,profile.sections[i].title)
    assert.equal(section.body,profile.sections[i].body)
    assert.deepEqual(section.links,profile.sections[i].links)
    assert.equal(section.images.length,TEMPLATE_1.blueprint.sections[i].slots)
  })
})
