import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const text=readFileSync(new URL('../src/features/portfolio/templates/ScrollTextAtmosphere.jsx',import.meta.url),'utf8')

test('Public first mount uses its own canvas ancestor when parent DOM ref is not yet attached',()=>{
  // React child layout effects can run before the parent's attached ref.
  // On the real published URL this formerly produced zero tracked parts.
  assert.match(text,/const canvas=canvasRef\.current/)
  assert.match(text,/const root=canvas\?\.closest\('main\.pt-site'\)\|\|rootRef\.current/)
  assert.match(text,/if\(!root\|\|paused\|\|!canvas\)return undefined/)
  assert.ok(text.indexOf("const root=canvas?.closest('main.pt-site')")>
    text.indexOf('const canvas=canvasRef.current'))
})
test('The first mount discovers all text layers before the initial reveal frame',()=>{
  assert.match(text,/root\.querySelectorAll\(':scope > section\[id\^="pt-"\]'\)/)
  assert.match(text,/section\.querySelectorAll\('\[data-pt-scroll-reveal\]'\)/)
  assert.match(text,/register\(node,kind,kind==='body'\?bodyIndex\+\+:0\)/)
  assert.match(text,/root\.classList\.add\('pt-site--block-reveal-active'\)/)
  assert.match(text,/initialFrame=requestAnimationFrame/)
  assert.match(text,/revealParts\.forEach\(part=>observer\.observe\(part\)\)/)
  assert.match(text,/if\(!fallbackFrame\)fallbackFrame=requestAnimationFrame\(scan\)/)
})
