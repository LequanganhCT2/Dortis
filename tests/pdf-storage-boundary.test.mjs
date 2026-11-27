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
test('Portfolio inherits reviewed profile text only; no PDF bytes or cutout media are imported',()=>{
  const manager=readFileSync(new URL('../src/features/portfolio/templates/PortfolioTemplateManager.jsx',import.meta.url),'utf8')
  assert.match(manager,/select\('id,name,role,slug,status,sections'\)/)
  const editor=readFileSync(new URL('../src/features/portfolio/templates/PortfolioInstanceEditor.jsx',import.meta.url),'utf8')
  const source=readFileSync(new URL('../src/features/portfolio/templates/sourceBinding.js',import.meta.url),'utf8')
  assert.match(manager,/content:importProfileSections\(t,profiles\.find\(/)
  assert.match(editor,/useState\(\(\)=>hydrateInstanceFromArtist\(template,profile,instance\.content/)
  assert.match(editor,/copySourceSection\(prev,current.id,chosen\)/)
  assert.match(source,/result=copySourceSection\(result,section\.id,matched\)/)
  assert.doesNotMatch(source,/uploadArtistPdf\(|storage\.from\(|pdfBytes|pdfData/)
  assert.doesNotMatch(source,/result\.images\[|images\.push\(/)
  const ordered=readFileSync(new URL('../src/features/portfolio/templates/profileSections.js',import.meta.url),'utf8')
  assert.doesNotMatch(ordered,/uploadArtistPdf\(|storage\.from\(|pdfBytes|pdfData/)
})
