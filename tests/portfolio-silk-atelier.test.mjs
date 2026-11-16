import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {PRESET_FORMS,blueprintFor,normalizeBlueprint,resolveInstance} from '../src/features/portfolio/templates/model.js'
import {resolveArtistPortfolio} from '../src/features/portfolio/templates/resolvedPortfolio.js'
import {FORM_COLOR_PALETTES,normalizePortfolioPalette,tintSilkColor} from '../src/features/portfolio/templates/portfolioPalette.js'

const code=name=>readFileSync(new URL('../src/features/portfolio/templates/'+name,import.meta.url),'utf8')
const migration=readFileSync(new URL(
  '../supabase/migrations/20261116074500_silk_atelier_single_form.sql',
  import.meta.url),'utf8')

test('Only Silk Atelier is exposed as a new Form; eight sections are inherited',()=>{
  assert.equal(PRESET_FORMS.length,1)
  const item=PRESET_FORMS[0]
  assert.equal(item.slug,'silk-atelier')
  assert.equal(item.sections.length,8)
  assert.deepEqual(item.sections.map(section=>section.id),[
    'hero','story','journey','skills','achievements','performance','gallery','contact'
  ])
  assert.equal(blueprintFor(item).ribbonLayout,'diagonal')
  assert.equal(blueprintFor(item).ribbonDirection,'down-right')
  assert.equal(normalizeBlueprint(blueprintFor(item)).glowOpacity,.28)
})
test('Glow opacity has a safe ceiling and survives blueprint to artist resolution',()=>{
  const blueprint=normalizeBlueprint({...blueprintFor(PRESET_FORMS[0]),glowOpacity:0.45})
  const result=resolveInstance({id:'t',name:'Silk Atelier',blueprint},
    {content:{sections:{hero:{title:'Ca sĩ'}},images:{}}},
    {name:'La Trinh',role:'Ca sĩ'})
  assert.equal(result.glowOpacity,.45)
  assert.equal(result.sections[0].title,'Ca sĩ')
  assert.equal(result.sections[0].images.length,1)
  assert.equal(normalizeBlueprint({glowOpacity:1}).glowOpacity,.55)
  assert.equal(normalizeBlueprint({glowOpacity:-1}).glowOpacity,0)
  assert.equal(normalizeBlueprint({glowOpacity:'invalid'}).glowOpacity,.28)
})
test('Unlinked sections remain visible/editable; artist data is independent',()=>{
  const template={id:'silk',name:'Silk Atelier',blueprint:blueprintFor(PRESET_FORMS[0])}
  const view=resolveArtistPortfolio(template,{content:{sections:{},images:{}}},
    {id:'a',name:'La Trinh',role:'Ca sĩ',sections:[]})
  assert.equal(view.sections.length,8)
  assert.equal(view.sections[0].title,'La Trinh')
  assert.equal(view.sections[1].sourceStatus,'unlinked')
  assert.equal(view.sections[6].images.length,6)
})
test('Direct editing uses the exact same Ribbon component as live preview',()=>{
  const site=code('PortfolioTemplateSite.jsx')
  const editor=code('PortfolioInstanceEditor.jsx')
  const ribbon=code('RibbonPortfolioSection.jsx')
  assert.match(site,/useClassic\?/)
  assert.doesNotMatch(site,/useClassic\|\|section\.backdrop\|\|editSectionId===section\.id/)
  assert.match(site,/onMoveElement=\{editSectionId===section\.id\?onMoveElement:undefined\}/)
  assert.match(site,/onEditText=\{editSectionId===section\.id\?onEditText:undefined\}/)
  assert.match(site,/onUploadImage=\{editSectionId===section\.id\?onUploadImage:undefined\}/)
  assert.match(ribbon,/onPointerDown/)
  assert.match(ribbon,/onPointerMove/)
  assert.match(ribbon,/onPointerUp/)
  assert.match(ribbon,/pt-ribbon__media/)
  assert.match(editor,/setVisualEditing\(true\)/)
  assert.doesNotMatch(editor,/selectSection\(current\)\s*setSelectedLayer/)
})
test('One continuous silk background and one translucent top glow layer',()=>{
  const renderer=code('PortfolioTemplateSite.jsx')
  const glow=code('PortfolioGlowOverlay.jsx')
  const css=code('portfolio-glow-overlay.css')
  assert.equal((renderer.match(/<SilkStageBackdrop /g)||[]).length,1)
  assert.equal((renderer.match(/<PortfolioGlowOverlay /g)||[]).length,1)
  assert.match(renderer,/opacity=\{view\.glowOpacity\?\?\.28\}/)
  assert.match(css,/z-index:90!important/)
  assert.match(css,/pointer-events:none!important/)
  assert.match(css,/mix-blend-mode:screen/)
  assert.match(css,/prefers-reduced-motion:reduce/)
  assert.match(glow,/Math\.min\(\.55/)
  assert.match(glow,/aria-hidden="true"/)
})
test('Old Forms are archived, not cascaded/deleted; one new draft binds approved PDF pages',()=>{
  assert.match(migration,/status='archived'/)
  assert.match(migration,/on conflict \(slug\) do nothing/)
  assert.match(migration,/where slug<>'silk-atelier'/)
  assert.doesNotMatch(migration,/delete from public\.artist_website_templates/i)
  assert.match(migration,/p\.slug='la-trinh'/)
  assert.match(migration,/jsonb_build_object\('sourcePage',11\)/)
  const manager=code('PortfolioTemplateManager.jsx')
  assert.match(manager,/\.eq\('status','active'\)/)
  assert.doesNotMatch(manager,/<section className="pt-create"/)
  assert.match(manager,/Quầng sáng trên cùng/)
  assert.match(manager,/glowOpacity/)
})

test('New palettes are selectable per artist without changing the source form',()=>{
  assert.deepEqual(FORM_COLOR_PALETTES.map(p=>p.id),[
    'red-gold','red-white','yellow-white','black-white'
  ])
  assert.equal(normalizePortfolioPalette('bad-id'),'red-gold')
  const template={blueprint:normalizeBlueprint({
    ...blueprintFor(PRESET_FORMS[0]),colorPalette:'yellow-white'
  })}
  assert.equal(resolveInstance(template,{content:{}},{name:'A'}).colorPalette,'yellow-white')
  assert.equal(resolveInstance(template,{content:{colorPalette:'black-white'}},{name:'B'}).colorPalette,'black-white')
  assert.equal(tintSilkColor('#ef9a53','red-gold'),'#ef9a53')
  assert.notEqual(tintSilkColor('#ef9a53','black-white'),'#ef9a53')
  assert.ok(code('PortfolioInstanceEditor.jsx').includes('Bảng màu Portfolio'))
  assert.ok(code('PortfolioTemplateManager.jsx').includes('Bảng màu mặc định'))
  assert.ok(code('PortfolioTemplateSite.jsx').includes('pt-palette--'))
})

test('Color selection is visible before the long artist section list',()=>{
  const editor=code('PortfolioInstanceEditor.jsx')
  const manager=code('PortfolioTemplateManager.jsx')
  const picker=code('PortfolioPalettePicker.jsx')
  const styles=code('template-admin.css')
  assert.match(editor,/<PortfolioPalettePicker[\s\S]*?<div className="pt-editor__layout">/)
  assert.match(editor,/setContent\(previous=>\(\{\.\.\.previous,colorPalette:palette\}\)\)/)
  assert.match(editor,/setDirty\(true\);setNotice\(''\)/)
  assert.match(manager,/<PortfolioPalettePicker[\s\S]*?Bảng màu mặc định của Form/)
  assert.match(picker,/FORM_COLOR_PALETTES\.map/)
  assert.match(picker,/aria-pressed=\{active===option\.id\}/)
  assert.match(styles,/\.pt-palette-picker__options/)
})
