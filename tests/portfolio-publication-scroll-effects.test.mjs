import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {normalizeRevealSpeed} from '../src/features/portfolio/templates/blockRevealState.js'

const code=name=>readFileSync(new URL(
  '../src/features/portfolio/templates/'+name,import.meta.url),'utf8')

test('Published website rehydrates snapshot on focus and pageshow after Admin updates',()=>{
  const pub=code('PublishedPortfolio.jsx')
  assert.match(pub,/select\('snapshot,image_paths,published_at'\)/)
  assert.match(pub,/function refreshOnReturn\(\)/)
  assert.match(pub,/window\.addEventListener\('focus',refreshOnReturn\)/)
  assert.match(pub,/window\.addEventListener\('pageshow',refreshOnReturn\)/)
  assert.match(pub,/document\.addEventListener\('visibilitychange',refreshOnReturn\)/)
  assert.match(pub,/window\.removeEventListener\('focus',refreshOnReturn\)/)
  assert.match(pub,/key=\{id\+':'\+publishedAt\}/)
})
test('Public renderer uses published snapshot identity, content and reveal speed',()=>{
  const pub=code('PublishedPortfolio.jsx')
  const editor=code('PortfolioInstanceEditor.jsx')
  assert.match(pub,/const publishedTemplate=templateSlug\?\{slug:templateSlug\}:undefined/)
  assert.match(pub,/revealSpeed:view\?\.revealSpeed/)
  assert.match(pub,/publishedView=\{view\} template=\{publishedTemplate\} publicPage/)
  assert.match(editor,/templateSlug:template\.slug/)
  assert.match(editor,/view:\{\.\.\.view,revealSpeed:normalizeRevealSpeed\(content\.revealSpeed\)/)
  assert.equal(normalizeRevealSpeed(.3),.3)
})
test('Published website always observes the browser window; editor observes the preview pane',()=>{
  const site=code('PortfolioTemplateSite.jsx')
  const motion=code('ScrollTextAtmosphere.jsx')
  assert.match(site,/publicPage=\{publicPage\}/)
  assert.match(motion,/rootRef,paused=false,sectionsKey='',device='desktop',speed=\.8,publicPage=false/)
  assert.match(motion,/const scrollingHost=!publicPage&&host&&/)
  assert.match(motion,/window\.addEventListener\('scroll',onScroll,\{passive:true\}\)/)
  assert.match(motion,/window\.removeEventListener\('scroll',onScroll\)/)
  assert.match(motion,/window\.addEventListener\('pageshow',onResize\)/)
  assert.match(motion,/document\.addEventListener\('visibilitychange',onResize\)/)
  assert.match(motion,/\[rootRef,paused,sectionsKey,device,speed,publicPage,forceMotion\]/)
  assert.match(motion,/revealParts\.forEach\(part=>observer\.observe\(part\)\)/)
})
test('Publicly available content shows only uploaded images; no fake photo data is generated',()=>{
  const pub=code('PublishedPortfolio.jsx')
  assert.match(pub,/const imagePaths=Array\.isArray\(data\.image_paths\)\?data\.image_paths:\[\]/)
  assert.match(pub,/if\(imagePaths\.length\)/)
  assert.match(pub,/createSignedUrls\(imagePaths,3600\)/)
  const ribbon=code('RibbonPortfolioSection.jsx')
  assert.match(ribbon,/<PhotoReveal order=\{position\}>/)
})
