import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

test('New PDF import writes reviewed text only, not PDF bytes to Supabase',()=>{
  const wizard=readFileSync(new URL('../src/features/artists/components/ArtistPdfImportWizard.jsx',import.meta.url),'utf8')
  assert.match(wizard,/extractArtistPdf\(fileToRead/)
  assert.match(wizard,/validateReviewedImport\(doc\)/)
  assert.match(wizard,/from\('artist_profiles'\)\.insert/)
  assert.doesNotMatch(wizard,/storage\.from\(|uploadArtistPdf\(/)
  assert.doesNotMatch(wizard,/from\('artist_profile_sources'\)\.insert/)
  assert.match(wizard,/URL\.revokeObjectURL/)
})
test('Document parsing retains unmodified text lines for review',()=>{
  const parser=readFileSync(new URL('../src/artistPdf.js',import.meta.url),'utf8')
  assert.match(parser,/const rawText=lines\.join/)
  assert.match(parser,/body,rawText/)
  assert.doesNotMatch(parser,/role:.*\?'Biên đạo múa':'Ca sĩ'/)
})
test('Artist template management loads source sections and links them only on request',()=>{
  const manager=readFileSync(new URL('../src/features/portfolio/templates/PortfolioTemplateManager.jsx',import.meta.url),'utf8')
  assert.match(manager,/select\('id,name,role,slug,status,sections'\)/)
  const editor=readFileSync(new URL('../src/features/portfolio/templates/PortfolioInstanceEditor.jsx',import.meta.url),'utf8')
  assert.match(manager,/content:\{sections:\{\},images:\{\}\}/)
  assert.doesNotMatch(manager,/hydrateInstanceFromArtist/)
  assert.doesNotMatch(editor,/hydrateInstanceFromArtist/)
  assert.match(editor,/copySourceSection\(prev,current.id,chosen\)/)
})
