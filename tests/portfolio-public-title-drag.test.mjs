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
  assert.match(pub,/onDirectMoveTitle=\{admin\?movePublishedTitle:undefined\}/)
  assert.match(pub,/if\(!admin\|\|!publication\|\|!supabase\|\|savingRef\.current\)return/)
  assert.match(pub,/withPublishedTitlePosition\(current,sectionId,device,position\)/)
  assert.match(pub,/const device=mobile\?'mobile':'desktop'/)
  assert.match(site,/onDirectMoveTitle=\{onDirectMoveTitle\}/)
  assert.match(ribbon,/key==='title'&&Boolean\(onDirectMoveTitle\)/)
  assert.match(ribbon,/current\.key==='title'&&!onMoveElement&&onDirectMoveTitle/)
  assert.match(ribbon,/onDirectMoveTitle\(section\.id,current\.preview\)/)
  assert.match(ribbon,/data-pt-direct-title/)
  assert.match(ribbon,/const editing=Boolean\(onMoveElement\|\|onEditText\|\|onUploadImage\)/)
  assert.doesNotMatch(pub,/onDirectMoveTitle.*navbar/)
})
test('Moving a title republishes and saves atomically using existing admin-guarded RPC',()=>{
  const pub=code('PublishedPortfolio.jsx')
  assert.match(pub,/supabase\.from\('artist_website_instances'\)/)
  assert.match(pub,/select\('id,revision,content'\)/)
  assert.match(pub,/supabase\.from\('artist_portfolio_publications'\)/)
  assert.match(pub,/select\('snapshot,image_paths'\)/)
  assert.match(pub,/const nextDraft=withPublishedTitlePosition\(draft\.content/)
  assert.match(pub,/const nextSnapshot=withPublishedTitlePosition\(live\.snapshot/)
  assert.match(pub,/supabase\.rpc\('publish_artist_portfolio',\{/)
  assert.match(pub,/p_revision:draft\.revision/)
  assert.match(pub,/p_content:nextDraft/)
  assert.match(pub,/p_snapshot:nextSnapshot/)
  assert.match(pub,/p_image_paths:Array\.isArray\(live\.image_paths\)/)
  assert.match(pub,/setPublication\(previous\)/)
  assert.match(pub,/savingRef\.current=false/)
  const css=code('template-admin.css')
  assert.match(css,/\.pt-published--admin-edit \.pt-site \[data-pt-direct-title\]/)
  assert.match(css,/cursor:grab/)
  assert.match(css,/\.pt-published__inline-save--error/)
})
