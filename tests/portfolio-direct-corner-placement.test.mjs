import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {enableSectionScene,getScene,patchSceneLayer,sanitizeSceneLayer} from
  '../src/features/portfolio/templates/sectionDesign.js'
import {patchPublishedElement} from '../src/features/portfolio/templates/publicElementStyle.js'
import {SCENE_MOVE_LIMIT,OFFSET_MOVE_LIMIT,hasOverflowPlacement,
  hasSceneOverflowPlacement} from '../src/features/portfolio/templates/freePlacement.js'

const source=name=>readFileSync(new URL(
  '../src/features/portfolio/templates/'+name,import.meta.url),'utf8')
const section={id:'hero',label:'Giới thiệu',title:'Nghệ sĩ',body:'Tiểu sử',
  slots:1,layout:'cover'}
const initial={view:{sections:[section]},scenes:{},positions:{},typography:{}}

test('Full artboard positioning remains persistent beyond the original column and image grid',()=>{
  const board=enableSectionScene(initial,section)
  const moved=patchSceneLayer(board,section,'desktop','title',{x:-120,y:175})
  const movedImage=patchSceneLayer(moved,section,'desktop','image:0',{x:225,y:-110})
  assert.equal(getScene(movedImage,section,'desktop').layers.title.x,-120)
  assert.equal(getScene(movedImage,section,'desktop').layers.title.y,175)
  assert.equal(getScene(movedImage,section,'desktop').layers['image:0'].x,225)
  assert.equal(getScene(movedImage,section,'desktop').layers['image:0'].y,-110)
  assert.deepEqual(getScene(movedImage,section,'mobile'),getScene(board,section,'mobile'))
  assert.equal(hasSceneOverflowPlacement(getScene(movedImage,section,'desktop')),true)
  assert.equal(hasSceneOverflowPlacement(getScene(board,section,'mobile')),false)
  const bounded=sanitizeSceneLayer('title',{x:9999,y:-9999},section,'desktop')
  assert.equal(bounded.x,SCENE_MOVE_LIMIT)
  assert.equal(bounded.y,-SCENE_MOVE_LIMIT)
})

test('All published non-scene text and images move well beyond a 95% slot offset',()=>{
  const a=patchPublishedElement(initial,'hero','desktop','title','position',
    {x:425,y:-380,widthPct:48})
  const b=patchPublishedElement(a,'hero','desktop','image:0','position',
    {x:1200,y:-850,scaleX:1.4})
  assert.equal(b.positions.hero.desktop.title.x,425)
  assert.equal(b.positions.hero.desktop.title.y,-380)
  assert.equal(b.positions.hero.desktop['image:0'].x,1200)
  assert.equal(b.positions.hero.desktop['image:0'].y,-850)
  assert.equal(b.positions.hero.desktop.title.widthPct,48)
  assert.equal(hasOverflowPlacement(b.positions.hero.desktop),true)
  const bounded=patchPublishedElement(b,'hero','desktop','title','position',
    {x:90000,y:-90000})
  assert.equal(bounded.positions.hero.desktop.title.x,OFFSET_MOVE_LIMIT)
  assert.equal(bounded.positions.hero.desktop.title.y,-OFFSET_MOVE_LIMIT)
})

test('Corner handle persists changed dimensions independently from font settings',()=>{
  const board=enableSectionScene(initial,section)
  const a=patchPublishedElement(board,'hero','desktop','image:0','position',
    {w:45,h:54})
  const b=patchPublishedElement(a,'hero','desktop','title','position',
    {w:70,h:22})
  assert.equal(getScene(b,section,'desktop').layers['image:0'].w,45)
  assert.equal(getScene(b,section,'desktop').layers['image:0'].h,54)
  assert.equal(getScene(b,section,'desktop').layers.title.w,70)
  assert.equal(getScene(b,section,'desktop').layers.title.h,22)
  assert.equal(getScene(b,section,'desktop').layers.title.size,
    getScene(board,section,'desktop').layers.title.size)
})

test('On-page scene, ribbon and classic renderers show the selected corner handle',()=>{
  const scene=source('SectionArtboard.jsx')
  const ribbon=source('RibbonPortfolioSection.jsx')
  const classic=source('PortfolioTemplateSite.jsx')
  const css=source('inline-portfolio-inspector.css')
  assert.match(scene,/\|\|publicSelected\)\&\&<div className="pt-artboard__selection"/)
  assert.match(scene,/onPointerDown=\{event=>startDrag\(event,'resize'\)\}/)
  assert.match(scene,/if\(d\.mode==='resize'\)/)
  assert.match(scene,/d\.element\.style\.width=w\+'%'/)
  assert.match(scene,/d\.element\.style\.height=h\+'%'/)
  assert.match(scene,/onDirectPatchLayer\?\.\(section\.id,layerId,drag\.next\)/)
  assert.match(ribbon,/const directSelected=!onMoveElement&&Boolean\(onDirectMoveElement\)/)
  assert.match(ribbon,/onPointerDown=\{event=>startDrag\(event,key,true,locked\)\}/)
  assert.match(classic,/const commitResize=next=>/)
  assert.match(classic,/if\(save&&current\.next\)commitResize\(current\.next\)/)
  assert.match(classic,/const directSelected=!onMoveElement&&Boolean\(onDirectMoveElement\)/)
  assert.match(css,/pt-ribbon__resize/)
  assert.match(css,/right:4px;bottom:4px/)
})

test('Free movement is consistently clamped and represented in menu and overflow CSS',()=>{
  const scene=source('SectionArtboard.jsx')
  const classic=source('PortfolioTemplateSite.jsx')
  const ribbon=source('RibbonPortfolioSection.jsx')
  const inspector=source('InlinePortfolioInspector.jsx')
  const css=source('inline-portfolio-inspector.css')
  assert.match(scene,/SCENE_MOVE_LIMIT/)
  assert.match(scene,/hasSceneOverflowPlacement\(scene\)/)
  assert.match(classic,/OFFSET_MOVE_LIMIT/)
  assert.match(classic,/hasOverflowPlacement\(positions\)/)
  assert.match(ribbon,/const clampPosition=value=>Math\.round\(clamp\(value,-OFFSET_MOVE_LIMIT,OFFSET_MOVE_LIMIT\)/)
  assert.match(inspector,/scene\?-SCENE_MOVE_LIMIT:-OFFSET_MOVE_LIMIT/)
  assert.match(css,/pt-scene-section--free-position/)
  assert.match(css,/pt-ribbon-section--free-position/)
  assert.match(css,/pt-fx-section--free-position/)
})
