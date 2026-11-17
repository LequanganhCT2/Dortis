import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const src=name=>readFileSync(new URL('../src/features/portfolio/templates/'+name,import.meta.url),'utf8')

test('Published page can explicitly replay existing scroll effects without republishing',()=>{
  const published=src('PublishedPortfolio.jsx')
  const editor=src('PortfolioInstanceEditor.jsx')
  const site=src('PortfolioTemplateSite.jsx')
  assert.match(published,/const \[replayKey,setReplayKey\]=useState\(0\)/)
  assert.match(published,/onClick=\{\(\)=>setReplayKey\(value=>value\+1\)\}/)
  assert.match(published,/↻ Phát hiệu ứng/)
  assert.match(published,/revealReplayKey=\{replayKey\} forceMotion=\{replayKey>0\}/)
  assert.match(editor,/forceMotion=\{revealReplayKey>0\}/)
  assert.match(site,/forceMotion=\{forceMotion\}/)
  assert.match(site,/pt-site--motion-opt-in/)
})
test('System reduced motion is respected until the user chooses to replay',()=>{
  const published=src('PublishedPortfolio.jsx')
  const motion=src('ScrollTextAtmosphere.jsx')
  const css=src('scroll-text-atmosphere.css')
  assert.match(published,/prefers-reduced-motion: reduce/)
  assert.match(published,/Thiết bị đang bật Giảm chuyển động/)
  assert.match(motion,/if\(motion\?\.matches&&!forceMotion\)return undefined/)
  assert.match(motion,/publicPage=false,\s*forceMotion=false/)
  assert.match(css,/\.pt-site:not\(\.pt-site--motion-opt-in\) > section/)
  assert.match(css,/\.pt-site:not\(\.pt-site--motion-opt-in\) \.pt-photo-reveal/)
})
test('Template 02 blue-silver palette overrides default Atelier crimson CSS specificity',()=>{
  const css=src('portfolio-shared-ui.css')
  const base='.pt-site.pt-site--shared-ui.pt-site--ribbon.pt-site--continuous-silk'
  const flow=base+'.pt-site--silk-flow'
  const silver=flow+'.pt-palette--silver-white'
  assert.ok(css.includes(base+'{'))
  assert.ok(css.includes(flow+'{'))
  assert.ok(css.includes(silver+'{'))
  assert.ok((silver.match(/\./g)||[]).length>(base.match(/\./g)||[]).length)
  assert.ok(css.includes('--pt-ui-nav-from:#fbfefff5'))
  assert.ok(css.includes('--pt-ui-footer-from:#ffffffed'))
})
