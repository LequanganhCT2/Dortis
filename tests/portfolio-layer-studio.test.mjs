import test from 'node:test'
import assert from 'node:assert/strict'
import {
  enableSectionScene,getScene,patchSceneLayer,patchSceneBackground,
  sceneLayerIds,addSceneNote,patchSceneNote,removeSceneNote,
  resetSectionScene,disableSectionScene,sanitizeSceneLayer
} from '../src/features/portfolio/templates/sectionDesign.js'
import {PRESET_FORMS,blueprintFor,resolveInstance} from '../src/features/portfolio/templates/model.js'
import {resolveArtistPortfolio} from '../src/features/portfolio/templates/resolvedPortfolio.js'
import {hydrateInstanceFromArtist} from '../src/features/portfolio/templates/sourceBinding.js'
import {readFileSync} from 'node:fs'

const template={id:'shared-template',name:'Editorial Story',version:1,
  blueprint:blueprintFor(PRESET_FORMS[0])}
const hero=template.blueprint.sections[0]
const artistA={id:'artist-A',name:'La Trinh',role:'Ca sĩ',sections:[
  {page:1,layout:'cover',title:'LA TRINH',body:'Âm nhạc kết nối cảm xúc.'}
]}
const artistB={id:'artist-B',name:'Họa sĩ B',role:'Họa sĩ',sections:[
  {page:1,layout:'cover',title:'HỌA SĨ B',body:'Tác phẩm hội họa.'}
]}
test('Layer artboard is per instance, not part of the shared blueprint',()=>{
  const originalBlueprint=JSON.stringify(template.blueprint)
  let a=hydrateInstanceFromArtist(template,artistA)
  let b=hydrateInstanceFromArtist(template,artistB)
  a=enableSectionScene(a,hero)
  a=patchSceneLayer(a,hero,'desktop','title',{x:23,y:40,size:120,z:31})
  b=enableSectionScene(b,hero)
  assert.equal(getScene(a,hero,'desktop').layers.title.x,23)
  assert.equal(getScene(b,hero,'desktop').layers.title.x,7)
  assert.equal(JSON.stringify(template.blueprint),originalBlueprint)
  assert.equal(resolveArtistPortfolio(template,{content:a},artistA).sections[0].title,'LA TRINH')
  assert.equal(resolveArtistPortfolio(template,{content:b},artistB).sections[0].title,'HỌA SĨ B')
  assert.equal(resolveInstance(template,{content:a},artistB).artistName,'Họa sĩ B')
})
test('Each form section and device has distinct layer positions and photos',()=>{
  const story=template.blueprint.sections[1]
  let content=enableSectionScene({},hero)
  content=enableSectionScene(content,story)
  content=patchSceneLayer(content,hero,'mobile','image:0',{x:5,y:12,w:80,h:47})
  content=patchSceneLayer(content,hero,'desktop','title',{x:20})
  assert.equal(getScene(content,hero,'mobile').layers['image:0'].x,5)
  assert.equal(getScene(content,hero,'desktop').layers['image:0'].x,57)
  assert.equal(getScene(content,story,'mobile').layers['image:0'].x,17)
  assert.equal(getScene(content,story,'desktop').layers.title.x,7)
  content=patchSceneBackground(content,hero,'desktop','noir')
  assert.equal(getScene(content,story,'desktop').background,'ribbon-luxury')
  assert.equal(getScene(content,hero,'desktop').background,'noir')
  assert.equal(sceneLayerIds(hero).includes('image:0'),true)
  assert.equal(sceneLayerIds(hero).includes('image:1'),false)
})
test('Layer input is clamped and protected against unsafe CSS values',()=>{
  const result=sanitizeSceneLayer('title',{
    x:500,y:-200,w:95,h:90,size:99999,z:999,color:'url(javascript:evil)',
    font:'unknown',align:'center',hidden:true,opacity:-3
  },hero,'desktop')
  assert.equal(result.x,5)
  assert.equal(result.y,0)
  assert.equal(result.size,240)
  assert.equal(result.z,99)
  assert.match(result.color,/^#[0-9a-f]{6}$/i)
  assert.equal(result.opacity,0)
  assert.equal(result.hidden,true)
  assert.equal(result.align,'center')
})
test('Add, edit and remove text sticker without touching linked artist fields',()=>{
  const noteId='2467c8dd-124d-447c-8535-42186c66a18f'
  let v=addSceneNote({},hero,'Ký ức âm nhạc',noteId)
  assert.equal(getScene(v,hero,'desktop').notes[0].text,'Ký ức âm nhạc')
  assert.equal(getScene(v,hero,'mobile').notes[0].text,'Ký ức âm nhạc')
  v=patchSceneNote(v,hero,'desktop',noteId,'SÂN KHẤU')
  assert.equal(getScene(v,hero,'desktop').notes[0].text,'SÂN KHẤU')
  assert.equal(getScene(v,hero,'mobile').notes[0].text,'Ký ức âm nhạc')
  v=removeSceneNote(v,hero,noteId)
  assert.equal(getScene(v,hero,'mobile').notes.length,0)
  assert.equal(getScene(v,hero,'desktop').notes.length,0)
  assert.equal(v.sections,undefined)
})
test('Resetting scene desktop does not discard artist mobile design or source',()=>{
  let a=enableSectionScene({},hero)
  a=patchSceneLayer(a,hero,'mobile','title',{w:60,x:30})
  a=patchSceneLayer(a,hero,'desktop','title',{x:44})
  a=resetSectionScene(a,hero,'desktop')
  assert.equal(getScene(a,hero,'desktop').layers.title.x,7)
  assert.equal(getScene(a,hero,'mobile').layers.title.x,30)
  a=disableSectionScene(a,hero.id)
  assert.equal(getScene(a,hero,'mobile'),null)
})
test('Editor and published render path use the same visual artboard component',()=>{
  const editor=readFileSync(new URL('../src/features/portfolio/templates/PortfolioInstanceEditor.jsx',import.meta.url),'utf8')
  const site=readFileSync(new URL('../src/features/portfolio/templates/PortfolioTemplateSite.jsx',import.meta.url),'utf8')
  const board=readFileSync(new URL('../src/features/portfolio/templates/SectionArtboard.jsx',import.meta.url),'utf8')
  assert.match(editor,/SceneLayerInspector/)
  assert.match(editor,/focusedSectionId=/)
  assert.match(site,/getScene\(instance\?\.content/)
  assert.match(site,/SectionArtboard/)
  assert.match(board,/onPointerDown=/)
  assert.match(board,/onPointerMove=/)
  assert.match(board,/onPointerUp=/)
  assert.match(board,/onKeyDown=/)
})
