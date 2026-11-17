import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {PORTFOLIO_REVEAL_SPEEDS,scaledRevealMs} from '../src/features/portfolio/templates/blockRevealState.js'
const code=file=>readFileSync(new URL('../src/features/portfolio/templates/'+file,import.meta.url),'utf8')

test('All three layouts render word-staggered description and separate photo entrance layer',()=>{
  for(const file of ['RibbonPortfolioSection.jsx','PortfolioTemplateSite.jsx','SectionArtboard.jsx']){
    const source=code(file)
    assert.match(source,/import PhotoReveal from '.\/PhotoReveal'/)
    assert.match(source,/<PhotoReveal order=\{/)
    assert.match(source,/<PhotoMotion/)
    assert.match(source,/<\/PhotoMotion><\/PhotoReveal>/)
    assert.match(source,/motionUnit\(.+?'words'\)/)
    assert.match(source,/maxCharacters=\{|textContent\('body'/)
    assert.match(source,/1600/)
  }
  const wrapper=code('PhotoReveal.jsx')
  assert.match(wrapper,/className="pt-photo-reveal"/)
  assert.match(wrapper,/data-pt-scroll-reveal="image"/)
})
test('Description word spans preserve real text, accessibility and native edit mode',()=>{
  const burst=code('CharacterBurst.jsx')
  assert.match(burst,/mode='letters'/)
  assert.match(burst,/if\(mode==='words'\)/)
  assert.match(burst,/pt-burst-word/)
  assert.match(burst,/data-pt-burst-word="true"/)
  assert.match(burst,/aria-hidden="true"/)
  assert.match(burst,/if\(disabled\)return value/)
  assert.match(code('RibbonPortfolioSection.jsx'),/disabled=\{editing\}/)
  assert.match(code('SectionArtboard.jsx'),/disabled=\{editable\}/)
})
test('Visible description words and photo wrappers get independent WAAPI reveals',()=>{
  const motion=code('ScrollTextAtmosphere.jsx')
  assert.match(motion,/querySelectorAll\('\.pt-photo-reveal'\)/)
  assert.match(motion,/if\(node\.closest\('\.pt-photo-reveal'\)\)return/)
  assert.match(motion,/querySelectorAll\('\.pt-burst-word\[data-pt-burst-word\]'\)/)
  assert.match(motion,/kind==='body'&&words\.length/)
  assert.match(motion,/Math\.min\(650,index\*24\)/)
  assert.match(motion,/node\.classList\.contains\('pt-photo-reveal'\)/)
  assert.match(motion,/scale\(\.88\)/)
  assert.match(motion,/duration:560/)
  assert.match(motion,/const ms=value=>scaledRevealMs\(value,pace\)/)
  assert.match(motion,/duration:options\.independentTiming\?options\.duration:ms\(options\.duration\)/)
})
test('CSS fallback and reduced-motion preserve stable authored layer transforms',()=>{
  const css=code('scroll-text-atmosphere.css')
  assert.match(css,/@keyframes pt-description-word-rise/)
  assert.match(css,/\.pt-photo-reveal\{/)
  assert.match(css,/\.pt-site\.pt-site--motion-paused/)
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/)
  assert.match(css,/--pt-reveal-image-duration/)
  assert.doesNotMatch(css,/\.pt-artboard__layer\s*\{[\s\S]*?transform:\s*scale\(/)
})
test('Slow speed presets also apply to description/photo entrance timing',()=>{
  assert.ok(PORTFOLIO_REVEAL_SPEEDS.some(item=>item.value===.2))
  assert.ok(PORTFOLIO_REVEAL_SPEEDS.some(item=>item.value===.5))
  assert.equal(scaledRevealMs(560,.2),2800)
  assert.equal(scaledRevealMs(320,.4),800)
  assert.equal(scaledRevealMs(560,1),560)
})
