import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {PRESET_FORMS,blueprintFor,normalizeBlueprint,resolveInstance} from '../src/features/portfolio/templates/model.js'
import {automaticImageGeometry,makeScene,getScene,enableSectionScene,
  arrangeSceneImages,patchSceneLayer} from '../src/features/portfolio/templates/sectionDesign.js'
import {ribbonGridColumns,ribbonVariant} from '../src/features/portfolio/templates/ribbonLayout.js'

function text(path){return readFileSync(new URL('../src/features/portfolio/templates/'+path,import.meta.url),'utf8')}
function overlaps(a,b){
  const horizontal=a.x<b.x+b.w-.00001&&b.x<a.x+a.w-.00001
  const vertical=a.y<b.y+b.h-.00001&&b.y<a.y+a.h-.00001
  return horizontal&&vertical
}
test('Every shared template inherits the same animated ribbon background by default',()=>{
  assert.equal(PRESET_FORMS.length,3)
  for(const form of PRESET_FORMS){
    const b=normalizeBlueprint(blueprintFor(form))
    assert.equal(b.visualTheme,'ribbon-luxury')
    assert.ok(b.sections.length>=5)
    assert.equal(resolveInstance({name:form.name,blueprint:b},{content:{}},
      {id:'artist',name:'Nghệ sĩ'}).visualTheme,'ribbon-luxury')
  }
  const legacy=normalizeBlueprint({style:'minimal',visualTheme:'classic'})
  assert.equal(legacy.visualTheme,'classic')
  assert.equal(normalizeBlueprint({visualTheme:'unknown'}).visualTheme,'ribbon-luxury')
})
test('One photo per slot; every grid fits without overlap or overflow (1–10 photos, both devices)',()=>{
  for(const device of ['desktop','mobile']){
    for(let count=1;count<=10;count++){
      const boxes=Array.from({length:count},(_,index)=>automaticImageGeometry(index,count,device))
      for(const box of boxes){
        assert.ok(box.x>=0&&box.y>=0)
        assert.ok(box.x+box.w<=100.001&&box.y+box.h<=100.001)
      }
      for(let i=0;i<boxes.length;i++){
        for(let j=i+1;j<boxes.length;j++){
          assert.equal(overlaps(boxes[i],boxes[j]),false,
            device+': image '+i+' overlaps image '+j+' with count '+count)
        }
      }
    }
  }
})
test('Automatic photos stay separate from default title and body zones',()=>{
  for(const device of ['desktop','mobile']){
    for(let count=1;count<=10;count++){
      const section={id:'hero',layout:'split',slots:count}
      const scene=makeScene(section,device)
      assert.equal(scene.background,'ribbon-luxury')
      for(let i=0;i<count;i++){
        const img=scene.layers['image:'+i]
        assert.equal(overlaps(img,scene.layers.title),false,
          device+' photo '+i+' conflicts with title')
        assert.equal(overlaps(img,scene.layers.body),false,
          device+' photo '+i+' conflicts with body')
      }
    }
  }
})
test('Rearrange only photos, keep per-artist text positions & image paths unchanged',()=>{
  const section={id:'gallery',layout:'grid',slots:4}
  let content=enableSectionScene({
    images:{'gallery:0':{path:'artist-A/photo-1.webp'},
      'gallery:1':{path:'artist-A/photo-2.webp'}},
    sections:{gallery:{sourcePage:6,title:'Bộ sưu tập'}}
  },section)
  content=patchSceneLayer(content,section,'mobile','title',{x:24,w:70})
  content=patchSceneLayer(content,section,'mobile','image:0',{x:7,y:7,w:46,h:60})
  content=arrangeSceneImages(content,section,'mobile')
  assert.equal(getScene(content,section,'mobile').layers.title.x,24)
  assert.equal(getScene(content,section,'desktop').layers.title.x,7)
  assert.equal(getScene(content,section,'mobile').layers['image:0'].x,
    automaticImageGeometry(0,4,'mobile').x)
  assert.equal(content.images['gallery:0'].path,'artist-A/photo-1.webp')
  assert.equal(content.sections.gallery.sourcePage,6)
})
test('Gallery grids use explicit slots with no absolute stacking',()=>{
  for(let n=1;n<=10;n++){
    for(const layout of ['cover','split','split-reverse','grid','mosaic','wide','text']){
      const cols=ribbonGridColumns(layout,n)
      assert.ok(cols>=1&&cols<=3&&cols<=n)
    }
  }
  assert.equal(ribbonVariant({layout:'cover'},3),'hero')
  assert.equal(ribbonVariant({layout:'grid'},3),'gallery')
  assert.equal(ribbonVariant({layout:'split'},3),'standard')
  const component=text('RibbonPortfolioSection.jsx')
  const styles=text('portfolio-ribbon.css')
  assert.match(component,/tiles\.map\(/)
  assert.match(component,/pt-ribbon__media/)
  assert.match(styles,/\.pt-ribbon__media\{grid-area:media;display:grid/)
  assert.match(styles,/\.pt-ribbon__tile\{position:relative/)
  assert.match(styles,/object-fit:cover/)
  assert.doesNotMatch(styles,/\.pt-ribbon__tile\{position:absolute/)
})
test('Animated SVG backdrop and reduced-motion/performance fallbacks are shared',()=>{
  const svg=text('PortfolioRibbonBackdrop.jsx')
  const css=text('portfolio-ribbon.css')
  const site=text('PortfolioTemplateSite.jsx')
  const artboard=text('SectionArtboard.jsx')
  assert.match(svg,/<svg/)
  assert.match(svg,/feGaussianBlur/)
  assert.match(svg,/IntersectionObserver/)
  assert.match(css,/@keyframes pt-ribbon-breathe/)
  assert.match(css,/@keyframes pt-ribbon-sparkle/)
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/)
  assert.match(site,/<RibbonPortfolioSection/)
  assert.match(site,/useClassic/)
  assert.match(artboard,/<PortfolioRibbonBackdrop/)
  assert.match(css,/\.pt-site\.pt-site--ribbon \.pt-site__nav/)
})
