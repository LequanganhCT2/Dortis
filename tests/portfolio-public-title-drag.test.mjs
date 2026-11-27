import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {withPublishedTitlePosition} from '../src/features/portfolio/templates/publicTitlePosition.js'

const code=file=>readFileSync(new URL('../src/features/portfolio/templates/'+file,import.meta.url),'utf8')

test('Title drag edits only its own title position while preserving other published fields',()=>{
  const before={
    view:{artistName:'La Trinh',sections:[{id:'hero',title:'La Trinh'}]},
    images:{photo:'a.jpg'},
    scenes:{},
    positions:{
      hero:{desktop:{title:{x:.3,y:-3.6,rotation:0,widthPct:57.1},
        eyebrow:{x:0,y:0},'image:0':{x:12.9,y:-6.4}},
        mobile:{title:{x:4,y:8}}},
      achievements:{desktop:{title:{x:2,y:3}}}
    }
  }
  const after=withPublishedTitlePosition(before,'hero','desktop',{x:20,y:12})
  assert.notEqual(after,before)
  assert.equal(after.positions.hero.desktop.title.x,20)
  assert.equal(after.positions.hero.desktop.title.y,12)
  assert.equal(after.positions.hero.desktop.title.widthPct,57.1)
  assert.equal(after.positions.hero.desktop.title.rotation,0)
  assert.equal(after.positions.hero.desktop['image:0'].x,12.9)
  assert.deepEqual(after.positions.hero.mobile,before.positions.hero.mobile)
  assert.deepEqual(after.positions.achievements,before.positions.achievements)
  assert.deepEqual(after.view,before.view)
  assert.deepEqual(before.positions.hero.desktop.title,{x:.3,y:-3.6,rotation:0,widthPct:57.1})
})
test('Title positions are clamped; invalid platform does not modify content',()=>{
  const before={positions:{}}
  assert.equal(withPublishedTitlePosition(before,'hero','tablet',{x:1,y:1}),before)
  assert.deepEqual(withPublishedTitlePosition(before,'hero','mobile',{x:150,y:-160})
    .positions.hero.mobile.title,{x:95,y:-95})
})
test('Public title drag is admin-only, no new navigation and does not expose editor overlays',()=>{
  const pub=code('PublishedPortfolio.jsx')
  const ribbon=code('RibbonPortfolioSection.jsx')
  const site=code('PortfolioTemplateSite.jsx')
  assert.match(pub,/if\(!admin\|\|!editMode\)return/)
  assert.match(pub,/withPublishedTitlePosition\(pair\.content,sectionId,device,position\)/)
  assert.match(pub,/withPublishedTitlePosition\(pair\.snapshot,sectionId,device,position\)/)
  assert.match(pub,/const device=studioSession\.active/)
  assert.match(pub,/onDirectMoveTitle=\{editorActive\?movePublishedTitle:undefined\}/)
  assert.match(site,/onDirectMoveTitle=\{onDirectMoveTitle\}/)
  assert.match(ribbon,/const canDirectDrag=Boolean\(onDirectMoveElement\|\|\(key==='title'&&onDirectMoveTitle\)\)/)
  assert.match(ribbon,/current\.key==='title'&&!onMoveElement&&onDirectMoveTitle/)
  assert.match(ribbon,/onDirectMoveTitle\(section\.id,current\.preview\)/)
  assert.match(ribbon,/data-pt-direct-title/)
  assert.match(ribbon,/const editing=Boolean\(onMoveElement\|\|onEditText\|\|onUploadImage\)/)
  assert.doesNotMatch(pub,/onDirectMoveTitle.*navbar/)
})
test('Title movement stays private until explicit admin CAS publication',()=>{
  const pub=code('PublishedPortfolio.jsx')
  const session=code('useStudioSession.js')
  const css=code('template-admin.css')
  assert.match(pub,/studioSession\.commit/)
  assert.match(session,/supabase\.from\('artist_website_instances'\)/)
  assert.match(session,/studioPending:pending/)
  assert.match(session,/supabase\.rpc\('publish_artist_portfolio',\{/)
  assert.match(session,/p_revision:s\.revision/)
  assert.match(session,/p_content:withoutPending\(content\)/)
  assert.match(session,/p_snapshot:snapshot/)
  assert.match(session,/p_image_paths:snapshotImagePaths\(snapshot\)/)
  assert.match(session,/window\.confirm\('Xuất bản/)
  assert.match(css,/\.pt-published--admin-edit \.pt-site \[data-pt-direct-title\]/)
  assert.match(css,/cursor:grab/)
  assert.match(css,/\.pt-published__inline-save--error/)
})
