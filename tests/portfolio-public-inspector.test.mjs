import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {lookupPublishedLayer,patchPublishedElement,detectCurrentFont} from
  '../src/features/portfolio/templates/publicElementStyle.js'
import {enableSectionScene,getScene} from '../src/features/portfolio/templates/sectionDesign.js'

const src=file=>readFileSync(new URL('../src/features/portfolio/templates/'+file,import.meta.url),'utf8')
const section={id:'story',label:'02 · Câu chuyện nghệ thuật',title:'Âm nhạc',body:'Hành trình',slots:2,layout:'split'}
const snapshot={
  view:{sections:[section],visualTheme:'ribbon-luxury'},
  positions:{story:{desktop:{title:{x:1,y:-3,widthPct:60,rotation:4},
    'image:0':{x:2,y:6,scaleX:1.2,scaleY:1.2}},mobile:{title:{x:3,y:9}}}},
  typography:{story:{desktop:{title:{font:'condensed',size:85,align:'left'},
    body:{size:15}}}},
  scenes:{},imagePaths:['test.jpg'],templateSlug:'silk-atelier'
}
test('Inspector reads existing title size, font and saved frame instead of resetting',()=>{
  const current=lookupPublishedLayer(snapshot,'story','desktop','title')
  assert.equal(current.values.size,85)
  assert.equal(current.values.font,'condensed')
  assert.equal(current.values.widthPct,60)
  assert.equal(current.values.rotation,4)
  assert.equal(lookupPublishedLayer(snapshot,'story','mobile','title').values.y,9)
  assert.equal(detectCurrentFont('"Barlow Condensed", Impact, sans-serif'),'condensed')
  assert.equal(detectCurrentFont('"Cormorant Garamond",Georgia,serif'),'display')
  assert.equal(detectCurrentFont('"Be Vietnam Pro",sans-serif'),'sans')
})
test('Changing one text field never overwrites the sibling text, photo or device',()=>{
  const result=patchPublishedElement(snapshot,'story','desktop','title','typography',{
    size:96,font:'display',lineHeight:1.1
  })
  assert.equal(result.typography.story.desktop.title.size,96)
  assert.equal(result.typography.story.desktop.title.font,'display')
  assert.equal(result.typography.story.desktop.title.lineHeight,1.1)
  assert.equal(result.typography.story.desktop.body.size,15)
  assert.deepEqual(result.positions,snapshot.positions)
  assert.equal(result.imagePaths[0],'test.jpg')
  assert.equal(snapshot.typography.story.desktop.title.size,85)
})
test('Image frame settings preserve crop and placements of all other items',()=>{
  const a=patchPublishedElement(snapshot,'story','desktop','image:0','position',{
    scaleX:1.7,scaleY:.8,radius:18,opacity:84,fit:'contain'
  })
  assert.equal(a.positions.story.desktop['image:0'].scaleX,1.7)
  assert.equal(a.positions.story.desktop['image:0'].scaleY,.8)
  assert.equal(a.positions.story.desktop['image:0'].radius,18)
  assert.equal(a.positions.story.desktop['image:0'].opacity,84)
  assert.equal(a.positions.story.desktop['image:0'].fit,'contain')
  assert.deepEqual(a.positions.story.desktop.title,snapshot.positions.story.desktop.title)
  assert.deepEqual(a.positions.story.mobile,snapshot.positions.story.mobile)
})
test('Quick layouts update text alignment and frame without changing font size',()=>{
  const a=patchPublishedElement(snapshot,'story','desktop','title','layout',{id:'diagonal-right'})
  assert.equal(a.typography.story.desktop.title.size,85)
  assert.equal(a.typography.story.desktop.title.align,'right')
  assert.equal(a.positions.story.desktop.title.rotation,8)
  assert.equal(a.positions.story.desktop.title.widthPct,92)
  assert.deepEqual(a.positions.story.desktop['image:0'],snapshot.positions.story.desktop['image:0'])
})
test('Scene artboard layers use the actual scene model and shared sanitizer',()=>{
  const board=enableSectionScene(snapshot,section)
  const original=getScene(board,section,'desktop')
  const newer=patchPublishedElement(board,'story','desktop','title','typography',
    {font:'sans',size:112,align:'center'})
  const changed=getScene(newer,section,'desktop')
  assert.equal(changed.layers.title.font,'sans')
  assert.equal(changed.layers.title.size,112)
  assert.equal(changed.layers.title.align,'center')
  assert.equal(original.layers.title.size,95)
  const image=patchPublishedElement(newer,'story','desktop','image:0','position',
    {w:42,h:37,radius:16,fit:'contain'})
  assert.equal(getScene(image,section,'desktop').layers['image:0'].w,42)
  assert.equal(getScene(image,section,'desktop').layers['image:0'].fit,'contain')
  assert.deepEqual(getScene(image,section,'mobile'),getScene(board,section,'mobile'))
})
test('Public UI provides a floating submenu only to admins and persists using secured CAS RPC',()=>{
  const pub=src('PublishedPortfolio.jsx')
  const menu=src('InlinePortfolioInspector.jsx')
  const site=src('PortfolioTemplateSite.jsx')
  const ribbon=src('RibbonPortfolioSection.jsx')
  const scene=src('SectionArtboard.jsx')
  assert.match(pub,/admin&&selection&&publication&&<InlinePortfolioInspector/)
  assert.match(pub,/onPublicSelect=\{admin\?selectPublicElement:undefined\}/)
  assert.match(pub,/queuedEditsRef\.current\.push\(change\)/)
  assert.match(pub,/while\(queuedEditsRef\.current\.length\)/)
  assert.match(pub,/p_revision:draft\.revision/)
  assert.match(pub,/supabase\.rpc\('publish_artist_portfolio'/)
  assert.match(pub,/setPublication\(current=>patchPublishedElement/)
  assert.match(pub,/if\(data\?\.snapshot\)setPublication\(data\.snapshot\)/)
  assert.match(menu,/Kích thước đang hiển thị:/)
  assert.match(menu,/FONT_OPTIONS\.map/)
  assert.match(menu,/TEXT_QUICK_LAYOUTS\.map/)
  assert.match(menu,/Bố cục/)
  assert.match(menu,/Ảnh \/ Khung/)
  assert.match(site,/onDirectMoveElement=\{onDirectMoveElement\}/)
  assert.match(ribbon,/onPublicSelect\?\.\(section\.id,key,event\.currentTarget\)/)
  assert.match(ribbon,/data-pt-public-editable/)
  assert.match(scene,/onDirectPatchLayer\?\.\(section\.id,layerId,drag\.next\)/)
  assert.match(src('inline-portfolio-inspector.css'),/position:fixed/)
  assert.match(src('inline-portfolio-inspector.css'),/pt-published--admin-edit/)
})

test('Text and image frames keep independently saved border, opacity and typography',()=>{
  const framed=patchPublishedElement(snapshot,'story','desktop','title','position',{
    radius:12,opacity:72,borderWidth:3,borderColor:'#dca679'
  })
  assert.equal(framed.positions.story.desktop.title.radius,12)
  assert.equal(framed.positions.story.desktop.title.opacity,72)
  assert.equal(framed.positions.story.desktop.title.borderWidth,3)
  assert.equal(framed.positions.story.desktop.title.borderColor,'#dca679')
  const typed=patchPublishedElement(framed,'story','desktop','title','typography',{
    weight:700,spacing:1.5,color:'#faf1e4'
  })
  assert.equal(typed.typography.story.desktop.title.weight,700)
  assert.equal(typed.typography.story.desktop.title.spacing,1.5)
  assert.equal(typed.typography.story.desktop.title.color,'#faf1e4')
  assert.deepEqual(typed.positions.story.desktop['image:0'],
    snapshot.positions.story.desktop['image:0'])
  assert.deepEqual(typed.positions.story.mobile,snapshot.positions.story.mobile)
})
test('Scene borders are bounded and all renderer paths expose editable content',()=>{
  const board=enableSectionScene(snapshot,section)
  const edited=patchPublishedElement(board,'story','desktop','image:0','position',{
    borderWidth:60,borderColor:'#debcaa',radius:30
  })
  const image=getScene(edited,section,'desktop').layers['image:0']
  assert.equal(image.borderWidth,12)
  assert.equal(image.borderColor,'#debcaa')
  assert.equal(image.radius,30)
  const menu=src('InlinePortfolioInspector.jsx')
  const site=src('PortfolioTemplateSite.jsx')
  const pub=src('PublishedPortfolio.jsx')
  assert.match(menu,/Cỡ chữ hiện tại/)
  assert.match(menu,/Rộng ảnh/)
  assert.match(menu,/Độ dày viền/)
  assert.match(menu,/Kích thước đang hiển thị:/)
  assert.match(site,/function MotionSection/)
  assert.match(site,/onDirectMoveElement=\{onDirectMoveElement\}/)
  assert.match(site,/data-pt-public-selected/)
  assert.match(pub,/measurePublicElement/)
})
