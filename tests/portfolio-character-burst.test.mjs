import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {splitBurstWords,allowCharacterBurst} from '../src/features/portfolio/templates/characterBurstText.js'
import {classifyPortfolioPart,portfolioPartDelays} from '../src/features/portfolio/templates/blockRevealState.js'

const code=name=>readFileSync(new URL('../src/features/portfolio/templates/'+name,import.meta.url),'utf8')

test('Each Vietnamese title is split by graphemes, not UTF-16 bytes',()=>{
  const groups=splitBurstWords('TÔI YÊU TIẾNG VIỆT!')
  assert.ok(groups.some(x=>x.space===' '))
  const words=groups.filter(x=>x.letters)
  assert.deepEqual(words.map(w=>w.letters.map(l=>l.text).join('')),
    ['TÔI','YÊU','TIẾNG','VIỆT!'])
  const positions=words.flatMap(x=>x.letters.map(l=>l.index))
  assert.deepEqual(positions,positions.map((_,i)=>i))
  const combined=splitBurstWords('A\u0301')
  assert.equal(combined[0].letters.length,1)
})
test('Long body text skips glyph DOM splitting to protect mobile performance',()=>{
  assert.equal(allowCharacterBurst('NGHỆ SĨ',160),true)
  assert.equal(allowCharacterBurst('a'.repeat(180),140),false)
  assert.equal(allowCharacterBurst('',160),false)
  const component=code('CharacterBurst.jsx')
  assert.match(component,/if\(disabled\|\|!allowCharacterBurst\(value,maxCharacters\)\)return value/)
  assert.match(component,/aria-hidden="true"/)
  assert.match(component,/pt-burst-sr/)
})
test('Each layout displays title and short body with glyph bursts, edits use original text',()=>{
  for(const file of ['RibbonPortfolioSection.jsx','PortfolioTemplateSite.jsx','SectionArtboard.jsx']){
    const src=code(file)
    assert.match(src,/import CharacterBurst from '.\/CharacterBurst'/)
    assert.match(src,/<CharacterBurst text=\{/)
  }
  assert.match(code('RibbonPortfolioSection.jsx'),/disabled=\{editing\}/)
  assert.match(code('PortfolioTemplateSite.jsx'),/disabled=\{Boolean\(onEditText\)\}/)
  assert.match(code('SectionArtboard.jsx'),/disabled=\{editable\}/)
})
test('Viewport entry is instant, and images do not wait for the previous section',()=>{
  assert.equal(portfolioPartDelays('title').enter,0)
  assert.equal(portfolioPartDelays('body').enter,0)
  assert.ok(portfolioPartDelays('image',8).enter<=70)
  assert.equal(classifyPortfolioPart({top:750,bottom:950},0,800),'visible')
  assert.equal(classifyPortfolioPart({top:840,bottom:1100},0,800),'hidden-bottom')
  const observer=code('ScrollTextAtmosphere.jsx')
  assert.equal((observer.match(/new IntersectionObserver\(/g)||[]).length,1)
  assert.match(observer,/revealParts\.forEach\(part=>observer\.observe\(part\)\)/)
  assert.match(observer,/markPart\(entry\.target,classifyPortfolioPart\(entry\.target\.getBoundingClientRect\(\),/)
  assert.match(observer,/delete node\.dataset\.ptRevealSeen/)
  assert.match(observer,/useLayoutEffect/)
  const css=code('scroll-text-atmosphere.css')
  assert.match(css,/animation-duration:var\(--pt-reveal-duration,410ms\)/)
  assert.match(css,/@keyframes pt-letter-pop/)
  assert.match(css,/animation-delay:var\(--pt-letter-delay,0ms\)/)
  assert.match(css,/data-pt-reveal-state="visible"/)
  assert.match(css,/prefers-reduced-motion:reduce/)
  assert.doesNotMatch(css,/1780ms|1120ms|540ms/)
})
