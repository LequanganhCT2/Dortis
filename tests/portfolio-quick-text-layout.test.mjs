import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {
  TEXT_QUICK_LAYOUTS,quickTextPreset,quickSceneTextPlacement,
  quickRibbonTextPlacement,normalizeTextQuickLayout
} from '../src/features/portfolio/templates/textQuickLayouts.js'
const source=name=>readFileSync(new URL('../src/features/portfolio/templates/'+name,import.meta.url),'utf8')

test('Five quick compositions are available without changing font-size or scale',()=>{
  assert.deepEqual(TEXT_QUICK_LAYOUTS.map(x=>x.id),
    ['left','center','right','diagonal-left','diagonal-right'])
  assert.deepEqual(quickTextPreset('left'),{align:'left',rotation:0})
  assert.deepEqual(quickTextPreset('center'),{align:'center',rotation:0})
  assert.deepEqual(quickTextPreset('right'),{align:'right',rotation:0})
  assert.deepEqual(quickTextPreset('diagonal-left'),{align:'left',rotation:-8})
  assert.deepEqual(quickTextPreset('diagonal-right'),{align:'right',rotation:8})
  assert.equal(normalizeTextQuickLayout('untrusted'),'left')
})
test('Layer Studio uses safe coordinates for left, center, right and diagonals',()=>{
  const layer={x:11,y:23,w:46,h:26,size:97}
  assert.deepEqual(quickSceneTextPlacement('left',layer,'desktop'),
    {x:6,align:'left',rotation:0})
  assert.deepEqual(quickSceneTextPlacement('center',layer,'desktop'),
    {x:27,align:'center',rotation:0})
  assert.deepEqual(quickSceneTextPlacement('right',layer,'desktop'),
    {x:48,align:'right',rotation:0})
  assert.deepEqual(quickSceneTextPlacement('diagonal-left',layer,'desktop'),
    {x:6,align:'left',rotation:-8})
  assert.deepEqual(quickSceneTextPlacement('diagonal-right',layer,'desktop'),
    {x:48,align:'right',rotation:8})
  assert.equal(quickSceneTextPlacement('right',{w:86},'mobile').x,10)
  assert.ok(!('size' in quickSceneTextPlacement('center',layer,'desktop')))
  assert.ok(!('h' in quickSceneTextPlacement('center',layer,'desktop')))
})
test('Ribbon presets retain saved photo and font settings, only moving selected text',()=>{
  const original={x:44,y:19,scaleX:1.5,scaleY:1.1,size:88}
  const result=quickRibbonTextPlacement('diagonal-right',original)
  assert.equal(result.position.x,0)
  assert.equal(result.position.y,0)
  assert.equal(result.position.widthPct,92)
  assert.equal(result.position.rotation,8)
  assert.equal(result.position.scaleX,1.5)
  assert.equal(result.position.scaleY,1.1)
  assert.deepEqual(result.typography,{align:'right'})
  assert.equal(original.x,44)
})
test('Direct and legacy renderers display alignment and rotation separately from font size',()=>{
  const ribbon=source('RibbonPortfolioSection.jsx')
  const legacy=source('PortfolioTemplateSite.jsx')
  assert.match(ribbon,/textAlign:align/)
  assert.match(ribbon,/alignSelf:align==='center'/)
  assert.match(ribbon,/rotate:Number\.isFinite\(angle\)/)
  assert.match(ribbon,/fontSize:Number\.isFinite\(type\.size\)/)
  assert.match(legacy,/rotate:text&&Number\.isFinite\(angle\)/)
  assert.match(legacy,/textAlign:\['left','center','right'\]/)
})
test('Editor offers per-section and per-device quick controls in existing typography panel',()=>{
  const editor=source('PortfolioInstanceEditor.jsx')
  assert.match(editor,/function quickPlaceText\(layoutId\)/)
  assert.match(editor,/quickSceneTextPlacement\(layoutId,scene\.layers\[textLayer\],device\)/)
  assert.match(editor,/quickRibbonTextPlacement\(layoutId,original\)/)
  assert.match(editor,/moveElement\(textLayer,next\.position\)/)
  assert.match(editor,/patchTypography\(next\.typography\)/)
  assert.match(editor,/TEXT_QUICK_LAYOUTS\.map/)
  assert.match(editor,/function resetTextPlacement\(\)/)
  assert.match(editor,/Đặt lại kiểu chữ/)
  assert.match(editor,/Bố cục nhanh/)
})
test('Desktop preview frame is 1920:1080 with independent vertical scroll',()=>{
  const css=source('template-admin.css')
  assert.match(css,/\.pt-editor__preview > \.pt-device\.pt-device--desktop\{/)
  assert.match(css,/aspect-ratio:1920 \/ 1080/)
  assert.match(css,/overflow-y:auto/)
  assert.match(css,/max-height:none!important/)
  assert.match(css,/flex:none!important/)
  const editor=source('PortfolioInstanceEditor.jsx')
  assert.match(editor,/Desktop · 16:9/)
  assert.match(editor,/<PortfolioTemplateSite /)
  assert.match(editor,/onMoveElement=\{moveElement\}/)
})
