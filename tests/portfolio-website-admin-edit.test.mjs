import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {resolveRoute,resolveAdminView,ROUTES} from '../src/app/routes.js'

const src=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8')
const publicFile=src('src/features/portfolio/templates/PublishedPortfolio.jsx')
const manager=src('src/features/portfolio/templates/PortfolioTemplateManager.jsx')
const workspace=src('src/features/admin/AdminWorkspace.jsx')

test('Published website edit button navigates to the Admin template editor by instance UUID',()=>{
  assert.match(publicFile,/clientNavigate\('\/admin\/templates\?edit='\+encodeURIComponent\(id\)\)/)
  assert.match(publicFile,/if\(!admin\)return/)
  assert.match(publicFile,/onClick=\{editWebsite\}/)
  assert.doesNotMatch(publicFile,/import PortfolioInstanceEditor/)
  assert.doesNotMatch(publicFile,/<PortfolioInstanceEditor/)
  assert.equal(resolveRoute('/admin/templates'),'admin')
  assert.equal(resolveAdminView(ROUTES.templates),'templates')
})

test('Admin workspace reads deep link and passes the ID to template manager',()=>{
  assert.match(workspace,/new URLSearchParams\(url\.search\)\.get\('edit'\)/)
  assert.match(workspace,/initialInstanceId=/)
  assert.match(manager,/initialInstanceId=''/)
})

test('Admin template manager opens matching instance, without creating duplicate draft',()=>{
  assert.match(manager,/const record=instances\.find\(instance=>instance\.id===initialInstanceId\)/)
  assert.match(manager,/setSelection\(record\.id\)/)
  assert.match(manager,/const selected=instances\.find\(i=>i\.id===selection\)/)
  assert.match(manager,/<PortfolioInstanceEditor key=\{selected\.id\}/)
  assert.match(manager,/if\(selected&&artist&&template\)/)
  assert.doesNotMatch(publicFile,/\.insert\(/)
})

test('Existing archived Form can be loaded only for deep linked website edits',()=>{
  assert.match(manager,/artist_website_templates'\)\.select\('\*'\)\.eq\('status','active'\)/)
  assert.match(manager,/\.eq\('id',record\.template_id\)\.single\(\)/)
  assert.match(manager,/linkedTemplate\?\.id===selected\.template_id/)
  assert.match(manager,/if\(templates\.some\(t=>t\.id===record\.template_id\)/)
  assert.match(manager,/Không tải được Form gốc của Portfolio này/)
})

test('Exit clears edit query, so browser navigation does not reopen the editor',()=>{
  assert.match(manager,/function closeInstanceEditor\(\)/)
  assert.match(manager,/clientNavigate\('\/admin\/templates',\{replace:true\}\)/)
  assert.match(manager,/onBack=\{closeInstanceEditor\}/)
})
