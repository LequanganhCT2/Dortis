import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {PRESET_FORMS,blueprintFor,normalizeBlueprint,resolveInstance} from '../src/features/portfolio/templates/model.js'

const code=file=>readFileSync(new URL(
 '../src/features/portfolio/templates/'+file,import.meta.url),'utf8')

test('Template 02 has a different theme, while Template 01 is not overwritten',()=>{
  assert.equal(PRESET_FORMS.length,2)
  assert.equal(PRESET_FORMS[0].slug,'silk-atelier')
  assert.equal(PRESET_FORMS[1].slug,'silk-flow')
  assert.equal(normalizeBlueprint(blueprintFor(PRESET_FORMS[0])).visualTheme,'ribbon-luxury')
  assert.equal(normalizeBlueprint(blueprintFor(PRESET_FORMS[1])).visualTheme,'silk-flow')
})
test('Catalog preview is read-only and can be opened without artist assignment',()=>{
  const manager=code('PortfolioTemplateManager.jsx')
  assert.match(manager,/const \[previewTemplateId,setPreviewTemplateId\]=useState\(null\)/)
  assert.match(manager,/const demo=resolveInstance\(previewTemplate,\{content:\{\}\}/)
  assert.match(manager,/function openReadOnlyPreview\(form\)/)
  assert.match(manager,/publishedView=\{demoView\}/)
  assert.match(manager,/onClick=\{\(\)=>openReadOnlyPreview\(group\)\}/)
  assert.match(manager,/Xem trước lụa xanh · Template 02/)
  const previewSection=manager.slice(manager.indexOf('if(previewTemplate&&demoView){'),
    manager.indexOf("if(selected&&artist&&!template&&initialInstanceId)"))
  assert.ok(previewSection.length>200)
  assert.doesNotMatch(previewSection,/\.insert\(|\.update\(|assign\(/)
  assert.match(previewSection,/Chỉ xem trước/)
})
test('Artist editor explicitly identifies the assigned form and offers safe comparison',()=>{
  const editor=code('PortfolioInstanceEditor.jsx')
  const manager=code('PortfolioTemplateManager.jsx')
  assert.match(editor,/ĐANG CHỈNH SỬA · '\+template\.name/)
  assert.match(editor,/if\(confirmLeave\(\)\)onPreviewOther\(\)/)
  assert.match(editor,/Xem trước \{otherTemplateName/)
  assert.match(manager,/onPreviewOther=\{templates\.find/)
  assert.match(manager,/function openOtherTemplateFromEditor\(form\)/)
  assert.match(editor,/onBack\(\)/)
})
test('Two distinct backdrop components remain selected by the resolved form theme',()=>{
  const site=code('PortfolioTemplateSite.jsx')
  assert.match(site,/const useSilkFlow=view\.visualTheme==='silk-flow'&&!useClassic/)
  assert.match(site,/useSilkFlow\?\s*<SilkFlowBackdrop/)
  assert.match(site,/<SilkStageBackdrop/)
})
