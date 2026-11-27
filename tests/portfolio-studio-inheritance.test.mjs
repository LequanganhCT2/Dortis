import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {newStudioElement,studioLayout,resolveStudioLayout,replaceStudioElements,patchStudioElement,studioElements} from '../src/features/portfolio/templates/studioModel.js'
import {studioTextPresentation,studioTextMotion} from '../src/features/portfolio/templates/studioTextPresentation.js'
const src=name=>readFileSync(new URL('../src/features/portfolio/templates/'+name,import.meta.url),'utf8')
const section={id:'hero',layout:'split'}
test('New titles inherit CSS rather than persisting a hard-coded default font or color',()=>{
  const item=newStudioElement('title','title-a')
  const p=studioTextPresentation({v:item.desktop,kind:item.kind,section,device:'desktop'})
  assert.equal(item.desktop.effect,'inherit')
  assert.deepEqual(item.desktop.textOverrides,{})
  assert.equal(p.style.fontFamily,undefined)
  assert.equal(p.style.color,undefined)
  assert.equal(p.style.fontSize,undefined)
  assert.equal(p.role,'title')
  assert.equal(p.mode,'letters')
  assert.equal(p.attrs['data-pt-studio-reveal'],'true')
})
test('Local source typography and motion are inherited by role with independent overrides',()=>{
  const item=newStudioElement('title','title-a')
  const doc=replaceStudioElements({},'hero',[item])
  const typography={title:{font:'display',size:77,color:'#abcdef',motion:{effect:'flip',unit:'letters'}}}
  const inherited=studioTextPresentation({v:item.desktop,kind:item.kind,section,device:'desktop',typography})
  assert.equal(inherited.style.fontSize,'77px')
  assert.equal(inherited.style.color,'#abcdef')
  assert.equal(inherited.attrs['data-pt-motion-effect'],'flip')
  const edited=patchStudioElement(doc,'hero',item.id,'desktop',{color:'#123456',x:25})
  const layer=studioElements(edited,'hero')[0]
  assert.deepEqual(layer.desktop.textOverrides,{color:true})
  assert.deepEqual(layer.mobile,item.mobile)
  const p=studioTextPresentation({v:layer.desktop,kind:layer.kind,section,device:'desktop',typography})
  assert.equal(p.style.color,'#123456')
  assert.equal(p.style.fontSize,'77px')
  const reset=studioElements(patchStudioElement(edited,'hero',item.id,'desktop',{inheritTypography:true}),'hero')[0]
  assert.deepEqual(reset.desktop.textOverrides,{})
  assert.equal(reset.desktop.x,25)
  assert.equal(studioTextPresentation({v:reset.desktop,kind:reset.kind,section,device:'desktop',typography}).style.color,'#abcdef')
})
test('Existing untouched Studio defaults migrate to inherited styles; custom values remain',()=>{
  const old=studioLayout({effect:'none',size:101},'title')
  const v=resolveStudioLayout(old,'title')
  assert.deepEqual(v.textOverrides,{size:true})
  assert.equal(v.effect,'inherit')
  assert.equal(v.size,101)
  assert.equal(resolveStudioLayout({...v,effect:'none'},'title').effect,'none')
  assert.equal(studioTextMotion({...v,effect:'letters',duration:.8,delay:0}).unit,'letters')
})
test('Studio uses semantic DOM and the existing template reveal runtime, not a second observer',()=>{
  const layers=src('StudioLayers.jsx'),site=src('PortfolioTemplateSite.jsx'),runtime=src('ScrollTextAtmosphere.jsx'),css=src('studio.css')
  assert.ok(layers.includes("const TextTag=item.kind==='title'?'h2':'p'"))
  assert.ok(layers.includes("useClassic?'pt-site__copy':'pt-ribbon__copy'"))
  assert.ok(layers.includes('<DirectEditableText'))
  assert.ok(layers.includes('data-pt-scroll-reveal={presentation.role}'))
  assert.ok(!layers.includes('new IntersectionObserver'))
  assert.ok(!css.includes('pt-studio-letter'))
  assert.ok(site.includes('...studioElements(instance?.content,s.id).map'))
  assert.ok(runtime.includes("node.dataset.ptMotionReverse==='false'"))
})
