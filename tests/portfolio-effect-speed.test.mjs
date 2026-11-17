import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {PORTFOLIO_REVEAL_SPEEDS,normalizeRevealSpeed,scaledRevealMs} from
  '../src/features/portfolio/templates/blockRevealState.js'
import {PRESET_FORMS,blueprintFor,resolveInstance} from
  '../src/features/portfolio/templates/model.js'

const src=name=>readFileSync(new URL(
  '../src/features/portfolio/templates/'+name,import.meta.url),'utf8')

test('Slower by default; nine adjustable speed presets including 0.2–0.5x',()=>{
  assert.deepEqual(PORTFOLIO_REVEAL_SPEEDS.map(item=>item.value),
    [.2,.3,.4,.5,.6,.8,1,1.25,1.5])
  assert.equal(normalizeRevealSpeed(undefined),.8)
  assert.equal(normalizeRevealSpeed('0.8'),.8)
  assert.equal(normalizeRevealSpeed('not-a-speed'),.8)
  assert.equal(normalizeRevealSpeed(1.25),1.25)
  for(const speed of [.2,.3,.4,.5])assert.equal(normalizeRevealSpeed(String(speed)),speed)
  assert.equal(scaledRevealMs(380,.8),475)
  assert.equal(scaledRevealMs(300,.6),500)
  assert.equal(scaledRevealMs(300,.2),1500)
  assert.equal(scaledRevealMs(300,.3),1000)
  assert.equal(scaledRevealMs(300,.4),750)
  assert.equal(scaledRevealMs(300,.5),600)
  assert.equal(scaledRevealMs(300,1.5),200)
  assert.ok(scaledRevealMs(300,.6)>scaledRevealMs(300,1.5))
})
test('Animation speed is a per-artist setting persisted in the content snapshot',()=>{
  for(const form of PRESET_FORMS){
    const template={...form,blueprint:blueprintFor(form)}
    assert.equal(resolveInstance(template,{content:{}},{name:'Artist'}).revealSpeed,.8)
    assert.equal(resolveInstance(template,{content:{revealSpeed:.6}},{name:'Artist'}).revealSpeed,.6)
  }
  const model=src('model.js')
  const editor=src('PortfolioInstanceEditor.jsx')
  assert.match(model,/revealSpeed:normalizeRevealSpeed\(content\.revealSpeed\)/)
  assert.match(editor,/value=\{revealSpeed\}/)
  assert.match(editor,/PORTFOLIO_REVEAL_SPEEDS\.map/)
  assert.match(editor,/setContent\(previous=>\(\{\.\.\.previous,revealSpeed:speed\}\)\)/)
  assert.match(editor,/setDirty\(true\)/)
  assert.match(editor,/p_content:content,p_snapshot:snapshot/)
  assert.match(editor,/Đã lưu/)
})
test('Web Animations and fallback CSS use the same speed multiplier',()=>{
  const motion=src('ScrollTextAtmosphere.jsx')
  const css=src('scroll-text-atmosphere.css')
  const site=src('PortfolioTemplateSite.jsx')
  assert.match(site,/const revealSpeed=normalizeRevealSpeed\(view\.revealSpeed\?\?instance\?\.content\?\.revealSpeed\)/)
  assert.match(site,/device=\{device\} speed=\{revealSpeed\}/)
  assert.match(motion,/const pace=normalizeRevealSpeed\(speed\)/)
  assert.match(motion,/const ms=value=>scaledRevealMs\(value,pace\)/)
  assert.match(motion,/duration:ms\(options\.duration\)/)
  assert.match(motion,/delay:ms\(options\.delay\|\|0\)/)
  assert.match(motion,/\[rootRef,paused,sectionsKey,device,speed,publicPage\]/)
  assert.match(css,/--pt-reveal-duration/)
  assert.match(css,/--pt-reveal-image-duration/)
  assert.match(css,/--pt-reveal-letter-duration/)
  assert.match(motion,/root\.style\.removeProperty\('--pt-reveal-duration'\)/)
})
test('Replay applies the new speed without jumping the current scroll position',()=>{
  const editor=src('PortfolioInstanceEditor.jsx')
  assert.match(editor,/Phát lại hiệu ứng chữ và ảnh ngay tại vị trí đang xem/)
  assert.match(editor,/setRevealReplayKey\(value=>value\+1\)/)
  assert.doesNotMatch(editor,/scrollBox\?\.scrollTo\(\{top:0/)
  assert.match(editor,/Tốc độ hiệu ứng/)
})
