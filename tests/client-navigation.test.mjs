import test from 'node:test'
import assert from 'node:assert/strict'
import {internalUrl,navigationPath} from '../src/app/navigation.js'

test('Internal links preserve native SPA routes, hashes and queries',()=>{
  const origin='https://dortis.vercel.app/'
  assert.equal(navigationPath(internalUrl('/admin/media?section=hero',origin)),'/admin/media?section=hero')
  assert.equal(navigationPath(internalUrl('/#lien-he','https://dortis.vercel.app/artists')),'/#lien-he')
  assert.equal(navigationPath(internalUrl('#dich-vu',origin)),'/#dich-vu')
})
test('External protocols and origins never enter the SPA router',()=>{
  const base='https://dortis.vercel.app/'
  assert.equal(internalUrl('https://example.com/',base),null)
  assert.equal(internalUrl('mailto:artist@example.com',base),null)
  assert.equal(internalUrl('javascript:alert(1)',base),null)
  assert.equal(internalUrl('https://dortis.vercel.app.evil.test/admin',base),null)
})
