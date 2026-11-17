import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {patchPublishedElement} from '../src/features/portfolio/templates/publicElementStyle.js'
import {getPublishedText,isEditablePortfolioText} from '../src/features/portfolio/templates/publicTextContent.js'
import {enableSectionScene,getScene,addSceneNote} from '../src/features/portfolio/templates/sectionDesign.js'
const source=name=>readFileSync(new URL('../src/features/portfolio/templates/'+name,import.meta.url),'utf8')
const section={id:'hero',title:'Tiêu đề cũ',eyebrow:'Dấu ấn',body:'Nội dung từ PDF',
  label:'01 · Giới thiệu',sourcePage:3,sourceStatus:'linked',slots:1,layout:'cover'}
const base={
  view:{sections:[section],artistName:'Nghệ sĩ'},
  sections:{hero:{sourcePage:3,title:'Tiêu đề cũ',eyebrow:'Dấu ấn',body:'Nội dung từ PDF'}},
  positions:{hero:{desktop:{title:{x:23,y:41,widthPct:70}},mobile:{title:{x:2,y:5}}}},
  typography:{hero:{desktop:{title:{size:82,motion:{effect:'flip',unit:'letters'}},
    body:{size:15}}}},
  scenes:{},imagePaths:['photo.jpg']
}
test('Direct title edit updates the publication view and draft source override',()=>{
  const draft=patchPublishedElement(base,'hero','desktop','title','content',{value:'Tiêu đề vừa sửa'})
  assert.equal(draft.view.sections[0].title,'Tiêu đề vừa sửa')
  assert.equal(draft.sections.hero.title,'Tiêu đề vừa sửa')
  assert.equal(draft.sections.hero.fieldOverrides.title,true)
  assert.equal(getPublishedText(draft,'hero','desktop','title'),'Tiêu đề vừa sửa')
  assert.equal(draft.view.sections[0].sourcePage,3)
  assert.equal(draft.sections.hero.sourcePage,3)
  assert.equal(draft.view.sections[0].eyebrow,'Dấu ấn')
  assert.equal(draft.view.sections[0].body,'Nội dung từ PDF')
  assert.deepEqual(draft.positions,base.positions)
  assert.deepEqual(draft.typography,base.typography)
  assert.deepEqual(draft.imagePaths,base.imagePaths)
  assert.equal(base.sections.hero.fieldOverrides,undefined)
})
test('Consecutive content edits preserve all other design and bound fields',()=>{
  const changed=patchPublishedElement(base,'hero','desktop','body','content',
    {value:'Dòng 1\nDòng 2'})
  assert.equal(changed.view.sections[0].body,'Dòng 1\nDòng 2')
  assert.equal(changed.sections.hero.fieldOverrides.body,true)
  assert.equal(changed.sections.hero.title,'Tiêu đề cũ')
  const blank=patchPublishedElement(changed,'hero','desktop','eyebrow','content',
    {value:''})
  assert.equal(blank.view.sections[0].eyebrow,'')
  assert.equal(blank.sections.hero.fieldOverrides.eyebrow,true)
  assert.deepEqual(blank.positions,base.positions)
  assert.equal(blank.typography.hero.desktop.title.motion.effect,'flip')
})
test('Content sanitization rejects objects and limits very long strings',()=>{
  assert.equal(patchPublishedElement(base,'hero','desktop','title','content',
    {value:{html:'<script>alert(1)</script>'}}),base)
  const updated=patchPublishedElement(base,'hero','mobile','title','content',
    {value:'a'.repeat(15000)})
  assert.equal(updated.view.sections[0].title.length,10000)
  assert.equal(isEditablePortfolioText('image:0'),false)
  assert.equal(isEditablePortfolioText('title'),true)
  assert.equal(isEditablePortfolioText('note:12345678-1234-1234-1234-123456789012'),true)
})
test('An individual scene note is changed without replacing other scene text',()=>{
  const noteId='12345678-1234-1234-1234-123456789012'
  const withScene=addSceneNote(enableSectionScene(base,section),section,'Ghi chú',noteId)
  const updated=patchPublishedElement(withScene,'hero','desktop','note:'+noteId,
    'content',{value:'Chú thích mới'})
  assert.equal(getPublishedText(updated,'hero','desktop','note:'+noteId),'Chú thích mới')
  assert.equal(getScene(updated,section,'desktop').notes[0].text,'Chú thích mới')
  assert.equal(getScene(updated,section,'mobile').notes[0].text,'Ghi chú')
  assert.equal(updated.view.sections[0].title,'Tiêu đề cũ')
})
test('Admin-only WYSIWYG editing works on scene, ribbon and classic',()=>{
  const site=source('PortfolioTemplateSite.jsx')
  const scene=source('SectionArtboard.jsx')
  const ribbon=source('RibbonPortfolioSection.jsx')
  const page=source('PublishedPortfolio.jsx')
  const menu=source('InlinePortfolioInspector.jsx')
  const editor=source('DirectEditableText.jsx')
  assert.match(site,/onDirectStartTextEdit=\{onDirectStartTextEdit\}/)
  assert.match(site,/onDirectTextChange=\{onDirectTextChange\}/)
  assert.match(scene,/onDoubleClick=\{event=>/)
  assert.match(scene,/DirectEditableText text=\{source\|\|''\}/)
  assert.match(ribbon,/onDoubleClick:event=>/)
  assert.match(ribbon,/textContent\('title'/)
  assert.match(site,/textContent\('title'/)
  assert.match(page,/const \[editingText,setEditingText\]=useState\(null\)/)
  assert.match(page,/onDirectStartTextEdit=\{editorActive\?beginInlineTextEdit:undefined\}/)
  assert.match(page,/onDirectTextChange=\{editorActive\?\(section,key,value\)=>/)
  assert.match(page,/applyPublicEdit\(section,key,'content',\{value\}\)/)
  assert.match(page,/onClose=\{\(\)=>\{setEditingText\(null\);setSelection\(null\)/)
  assert.match(menu,/Nội dung/)
  assert.match(menu,/apply\('content',\{value:event\.currentTarget\.value\}\)/)
  assert.match(menu,/Sửa trực tiếp trên chữ/)
  assert.match(editor,/onPointerDown=\{event=>event\.stopPropagation\(\)\}/)
  assert.match(editor,/onChange\?\.\(next\)/)
  assert.match(source('template-admin.css'),/pt-direct-text-input/)
})
