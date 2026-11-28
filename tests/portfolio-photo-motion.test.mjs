import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {
  PHOTO_MOTION_OPTIONS,DEFAULT_PHOTO_MOTION,photoMotionMode,
  photoMotionIntensity,photoMotionPointer,photoPointerOffsets,photoMotionSetting,
  POINTER_MOTION_IDS,supportsPhotoPointer
} from '../src/features/portfolio/templates/photoMotionConfig.js'
const source=file=>readFileSync(new URL('../src/features/portfolio/templates/'+file,import.meta.url),'utf8')

test('Nine photo modes with exactly three mouse-driven effects and Water Wave',()=>{
  assert.deepEqual(PHOTO_MOTION_OPTIONS.map(x=>x.id),[
    'still','float','depth','tilt','orbit','breathe','magnetic','spotlight','wave'
  ])
  assert.equal(DEFAULT_PHOTO_MOTION,'float')
  assert.equal(photoMotionMode({path:'artist/hero/cutout.png'}),'float')
  assert.equal(photoMotionMode({path:'artist/gallery/picture.webp'}),'float')
  assert.equal(photoMotionMode({motion:'still'}),'still')
  assert.equal(photoMotionMode({motion:'invalid'}),'float')
  assert.equal(photoMotionIntensity({}),45)
  assert.equal(photoMotionIntensity({motionIntensity:110}),100)
  assert.equal(photoMotionIntensity({motionIntensity:-30}),0)
  assert.equal(photoMotionIntensity({motionIntensity:NaN}),45)
  assert.deepEqual(POINTER_MOTION_IDS,['depth','tilt','magnetic'])
  assert.equal(photoMotionPointer({}),false)
  assert.equal(photoMotionPointer({motion:'float',motionPointer:true}),false)
  assert.equal(photoMotionPointer({motion:'wave',motionPointer:true}),false)
  assert.equal(photoMotionPointer({motion:'spotlight'}),false)
  assert.equal(photoMotionPointer({motion:'depth'}),true)
  assert.equal(photoMotionPointer({motion:'tilt'}),true)
  assert.equal(photoMotionPointer({motion:'magnetic'}),true)
  assert.equal(supportsPhotoPointer('orbit'),false)
  assert.equal(supportsPhotoPointer('wave'),false)
  assert.equal(photoMotionPointer({motionPointer:false}),false)
  assert.deepEqual(photoMotionSetting({motion:'depth',motionIntensity:72,motionPointer:false}),
    {mode:'depth',intensity:72,pointer:false})
})

test('Pointer offsets are bounded and modes produce distinct 3D reactions',()=>{
  const full=photoPointerOffsets('tilt',1,-1,100)
  assert.deepEqual(full,{rx:'16.00deg',ry:'16.00deg',
    x:'0.00px',y:'0.00px',lx:'100.0%',ly:'0.0%'})
  const noMotion=photoPointerOffsets('still',1,1,100)
  assert.equal(noMotion.rx,'0.00deg')
  assert.equal(noMotion.x,'0.00px')
  const magnetic=photoPointerOffsets('magnetic',1,1,100)
  assert.equal(magnetic.x,'23.00px')
  assert.equal(magnetic.y,'19.00px')
  const clamped=photoPointerOffsets('depth',999,-999,250)
  assert.equal(clamped.ry,'13.00deg')
  assert.equal(clamped.rx,'13.00deg')
  assert.equal(clamped.lx,'100.0%')
  assert.equal(clamped.ly,'0.0%')
})

test('Image wrapper uses one requestAnimationFrame, never modifies drag coordinates',()=>{
  const component=source('PhotoMotion.jsx')
  const css=source('photo-motion.css')
  assert.match(component,/requestAnimationFrame/)
  assert.match(component,/cancelAnimationFrame/)
  assert.doesNotMatch(component,/new IntersectionObserver/)
  assert.match(source('ScrollTextAtmosphere.jsx'),/photo\?\.classList\.toggle\('is-photo-visible',state==='visible'\)/)
  assert.match(component,/onPointerMove=\{pointer\?handleMove:undefined\}/)
  assert.match(component,/pointerType!=='mouse'/)
  assert.match(component,/prefers-reduced-motion: reduce/)
  assert.match(component,/photoMotionSetting\(asset\)/)
  assert.match(css,/\.pt-photo-motion__hover/)
  assert.match(css,/\.pt-photo-motion__animated/)
  assert.match(css,/animation-play-state:paused/)
  assert.match(css,/prefers-reduced-motion:reduce/)
  assert.match(css,/pt-site--motion-paused/)
  assert.match(css,/@keyframes pt-photo-float/)
  assert.match(css,/@keyframes pt-photo-orbit/)
  assert.match(css,/@keyframes pt-photo-breathe/)
  assert.match(css,/pt-photo-motion--spotlight/)
  assert.match(css,/@keyframes pt-photo-spotlight-scan/)
  assert.match(css,/pt-photo-motion--wave/)
  assert.match(css,/pt-photo-water-sway/)
  assert.match(component,/feDisplacementMap/)
  assert.match(component,/feTurbulence/)
  assert.match(component,/animate attributeName="baseFrequency"/)
  assert.match(component,/animate attributeName="scale"/)
  assert.doesNotMatch(component,/onMoveElement|setSlotImage|patchSceneLayer/)
})

test('Exactly the same photo motion renderer is used by silk Form and legacy Forms',()=>{
  const silk=source('RibbonPortfolioSection.jsx')
  const legacy=source('PortfolioTemplateSite.jsx')
  const scene=source('SectionArtboard.jsx')
  assert.match(silk,/import PhotoMotion from '.\/PhotoMotion'/)
  assert.match(silk,/<PhotoMotion asset=\{asset\} paused=\{editing\} revealOrder=\{position\}>/)
  assert.match(legacy,/import PhotoMotion from '.\/PhotoMotion'/)
  assert.match(legacy,/<PhotoMotion asset=\{asset\} paused=\{motionPaused\|\|Boolean\(onMoveElement\)\} revealOrder=\{i\}>/)
  assert.match(scene,/import PhotoMotion from '.\/PhotoMotion'/)
  assert.match(scene,/<PhotoMotion asset=\{image\} paused=\{editable\} revealOrder=\{index>=0\?index:0\}>/)
})

test('Admin lets each photo independently select effect, strength and mouse interaction',()=>{
  const editor=source('PortfolioInstanceEditor.jsx')
  assert.match(editor,/function changePhotoMotion\(section,index,patch\)/)
  assert.match(editor,/setSlotImage\(prev,slot,\{\.\.\.image,\.\.\.patch\}\)/)
  assert.match(editor,/value=\{photoMotionMode\(image\)\}/)
  assert.match(editor,/value=\{photoMotionIntensity\(image\)\}/)
  assert.match(editor,/checked=\{photoMotionPointer\(image\)\}/)
  assert.match(editor,/PHOTO_MOTION_OPTIONS\.filter/)
  assert.match(editor,/supportsPhotoPointer\(option\.id\)/)
  assert.match(editor,/supportsPhotoPointer\(photoMotionMode\(image\)\)/)
  assert.match(editor,/motionPointer:event\.target\.checked/)
  assert.match(editor,/motionIntensity:Number\(event\.target\.value\)/)
  assert.match(editor,/setDirty\(true\)/)
  // Upload replacement retains selected effects but never copies the old PNG's alpha setting.
  assert.match(editor,/previous\?\.motion\?/ )
  assert.match(editor,/previous\?\.motionIntensity!=null/)
})
