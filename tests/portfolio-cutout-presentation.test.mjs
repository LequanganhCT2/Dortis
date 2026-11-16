import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {isCutoutArtwork} from '../src/features/portfolio/templates/imagePresentation.js'

const source=name=>readFileSync(new URL('../src/features/portfolio/templates/'+name,import.meta.url),'utf8')

test('Existing uploaded PNGs without flags display frameless automatically',()=>{
  assert.equal(isCutoutArtwork({path:'artist/form/hero/0-abc.png'}),true)
  assert.equal(isCutoutArtwork({path:'artist/form/hero/0-abc.PNG'}),true)
  assert.equal(isCutoutArtwork({path:'artist/form/hero/0-abc.png?token=123'}),true)
  assert.equal(isCutoutArtwork({path:'artist/form/hero/0-abc.jpg'}),false)
  assert.equal(isCutoutArtwork({path:'artist/form/hero/0-abc.webp'}),false)
  assert.equal(isCutoutArtwork({path:'artist/form/hero/0-abc.webp',cutout:true}),true)
  assert.equal(isCutoutArtwork({path:'artist/form/hero/0-abc.png',cutout:false}),false)
  assert.equal(isCutoutArtwork({path:''}),false)
  assert.equal(isCutoutArtwork(null),false)
})

test('Default Ribbon renderer keeps cutouts in grid slots but drops frames',()=>{
  const comp=source('RibbonPortfolioSection.jsx')
  const css=source('portfolio-ribbon.css')
  const stage=source('silk-stage-backdrop.css')
  assert.match(comp,/isCutoutArtwork\(asset\)\?' pt-ribbon__tile--cutout'/)
  assert.match(css,/\.pt-ribbon__tile\.pt-ribbon__tile--cutout\{/)
  assert.match(css,/box-shadow:none!important/)
  assert.match(css,/background:transparent!important/)
  assert.match(css,/object-fit:contain!important/)
  assert.match(stage,/\.pt-site\.pt-site--continuous-silk \.pt-ribbon-section\{border-bottom:0!important\}/)
  assert.match(stage,/\.pt-ribbon__tile\.pt-ribbon__tile--cutout/)
  assert.doesNotMatch(stage,/\.pt-site\.pt-site--continuous-silk \.pt-ribbon-section\{border-bottom:1px/)
})

test('Layer Studio and legacy renderer recognize cutouts consistently',()=>{
  const board=source('SectionArtboard.jsx')
  const boardCss=source('section-artboard.css')
  const site=source('PortfolioTemplateSite.jsx')
  assert.match(board,/isCutoutArtwork\(image\)/)
  assert.match(boardCss,/\.pt-artboard__layer\.is-image\.is-cutout/)
  assert.match(boardCss,/overflow:visible!important/)
  assert.match(site,/isCutoutArtwork\(asset\)/)
})

test('Admin supports explicit frameless toggle even for opaque PNG and WebP',()=>{
  const editor=source('PortfolioInstanceEditor.jsx')
  assert.match(editor,/function changeCutout\(/)
  assert.match(editor,/cutout:value/)
  assert.match(editor,/checked=\{isCutoutArtwork\(image\)\}/)
  assert.match(editor,/Ảnh tách nền — không khung, không bóng đổ/)
  assert.match(editor,/setDirty\(true\)/)
})
