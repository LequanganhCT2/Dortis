import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {
  TEXT_MOTION_EFFECTS,TEXT_MOTION_UNITS,normalizeTextMotion,
  textMotionAttributes,textMotionFrames,motionUnit
} from '../src/features/portfolio/templates/textLayerMotion.js'
import {getScene,enableSectionScene} from
  '../src/features/portfolio/templates/sectionDesign.js'
import {patchPublishedElement,lookupPublishedLayer} from
  '../src/features/portfolio/templates/publicElementStyle.js'
const source=name=>readFileSync(new URL('../src/features/portfolio/templates/'+name,import.meta.url),'utf8')
const section={id:'hero',label:'Giới thiệu',title:'Nghệ sĩ',body:'Bài viết',slots:1,layout:'cover'}
const snapshot={view:{sections:[section]},positions:{},typography:{},scenes:{}}

test('Motion values are constrained, backwards compatible and do not alter default text',()=>{
  assert.equal(TEXT_MOTION_EFFECTS[0].id,'auto')
  assert.ok(TEXT_MOTION_UNITS.some(x=>x.id==='letters'))
  assert.deepEqual(normalizeTextMotion({}),{
    effect:'auto',unit:'auto',direction:'up',
    duration:620,delay:0,stagger:24,distance:38
  })
  assert.deepEqual(textMotionAttributes(null),{})
  assert.equal(motionUnit(null,'words'),'words')
  assert.equal(motionUnit({unit:'letters'},'words'),'letters')
  const sanitized=normalizeTextMotion({effect:'unsafe',unit:'unknown',direction:'other',
    duration:99999,delay:-30,stagger:500,distance:-20})
  assert.equal(sanitized.effect,'auto')
  assert.equal(sanitized.unit,'auto')
  assert.equal(sanitized.direction,'up')
  assert.equal(sanitized.duration,2400)
  assert.equal(sanitized.delay,0)
  assert.equal(sanitized.stagger,150)
  assert.equal(sanitized.distance,0)
  assert.ok(textMotionFrames('rise','right',65)[0].transform.includes('translate3d(-65px,0px,0)'))
  assert.ok(textMotionFrames('flip','up',30)[0].transform.includes('rotateX'))
  assert.equal(textMotionFrames('none','up',0)[0].opacity,1)
})

test('Title and description motion is stored independently per device',()=>{
  const a=patchPublishedElement(snapshot,'hero','desktop','title','motion',{
    effect:'flip',unit:'letters',duration:950,direction:'left',stagger:35
  })
  const b=patchPublishedElement(a,'hero','desktop','body','motion',{
    effect:'fade',unit:'words',duration:420
  })
  const c=patchPublishedElement(b,'hero','mobile','title','motion',{
    effect:'zoom',unit:'block',duration:270
  })
  assert.equal(lookupPublishedLayer(c,'hero','desktop','title').values.motion.effect,'flip')
  assert.equal(lookupPublishedLayer(c,'hero','desktop','title').values.motion.unit,'letters')
  assert.equal(lookupPublishedLayer(c,'hero','desktop','body').values.motion.effect,'fade')
  assert.equal(lookupPublishedLayer(c,'hero','mobile','title').values.motion.effect,'zoom')
  assert.equal(snapshot.typography.hero,undefined)
  assert.equal(c.view.sections[0].title,'Nghệ sĩ')
  const d=patchPublishedElement(c,'hero','desktop','title','motion',{delay:250})
  assert.equal(d.typography.hero.desktop.title.motion.effect,'flip')
  assert.equal(d.typography.hero.desktop.title.motion.delay,250)
  assert.equal(d.typography.hero.desktop.body.motion.delay,0)
})

test('Layer Studio scene motion persists without changing other layers or source',()=>{
  const board=enableSectionScene(snapshot,section)
  const edited=patchPublishedElement(board,'hero','desktop','title','motion',{
    effect:'slide',direction:'right',unit:'letters',stagger:90
  })
  assert.equal(getScene(edited,section,'desktop').layers.title.motion.effect,'slide')
  assert.equal(getScene(edited,section,'desktop').layers.title.motion.stagger,90)
  assert.equal(getScene(edited,section,'desktop').layers.body.motion,undefined)
  assert.equal(getScene(edited,section,'mobile').layers.title.motion,undefined)
  assert.deepEqual(edited.view,snapshot.view)
})

test('All three portfolio renderers expose per-layer motion data and split settings',()=>{
  const scene=source('SectionArtboard.jsx')
  const ribbon=source('RibbonPortfolioSection.jsx')
  const site=source('PortfolioTemplateSite.jsx')
  const burst=source('CharacterBurst.jsx')
  assert.match(scene,/textMotionAttributes\(layer\.motion\)/)
  assert.match(scene,/motionUnit\(layer\.motion/)
  assert.match(ribbon,/textMotionAttributes\(typography\?\.\[field\]\?\.motion\)/)
  assert.match(ribbon,/mode=\{motionUnit\(typography\?\.\[field\]\?\.motion/)
  assert.match(site,/Object\.assign\(placement,textMotionAttributes\(type\?\.motion\)\)/)
  assert.match(site,/sectionsKey=\{revealKey\+'\|motions:'\+motionKey\}/)
  assert.match(burst,/mode==='block'/)
  assert.match(burst,/pt-burst-text--block/)
})

test('Motion engine runs separately from authored position and uses local timing',()=>{
  const engine=source('ScrollTextAtmosphere.jsx')
  assert.match(engine,/node\.dataset\.ptMotionEffect/)
  assert.match(engine,/textMotionFrames\(motion\.effect,motion\.direction,motion\.distance\)/)
  assert.match(engine,/delay:motion\.delay\+\(targets\.length===1\?0:index\*motion\.stagger\)/)
  assert.match(engine,/duration:options\.independentTiming\?options\.duration:ms\(options\.duration\)/)
  assert.match(engine,/node\.querySelector\('\.pt-burst-visual'\)\|\|node/)
  assert.match(engine,/motion\.effect!=='none'/)
})

test('Top-right View/Edit switch gates editing and the inspector supports replay',()=>{
  const page=source('PublishedPortfolio.jsx')
  const inspector=source('InlinePortfolioInspector.jsx')
  const css=source('template-admin.css')
  assert.match(page,/const \[editMode,setEditMode\]=useState\(false\)/)
  assert.match(page,/const editorActive=Boolean\(admin&&editMode\)/)
  assert.match(page,/onDirectMoveTitle=\{editorActive\?movePublishedTitle:undefined\}/)
  assert.match(page,/onPublicSelect=\{editorActive\?selectPublicElement:undefined\}/)
  assert.match(page,/aria-pressed=\{!editMode\}/)
  assert.match(page,/aria-pressed=\{editMode\}/)
  assert.match(page,/finishPendingPublicEdits\(\)/)
  assert.match(page,/onReplayMotion=\{\(\)=>setReplayKey\(value=>value\+1\)\}/)
  assert.match(inspector,/TEXT_MOTION_EFFECTS\.map/)
  assert.match(inspector,/TEXT_MOTION_UNITS\.map/)
  assert.match(inspector,/Giãn từng chữ/)
  assert.match(inspector,/↻ Xem thử hiệu ứng/)
  assert.match(css,/\.pt-published__toolbar\{\s*position:fixed/)
  assert.match(css,/\.pt-published__mode-switch button\.is-active/)
})
