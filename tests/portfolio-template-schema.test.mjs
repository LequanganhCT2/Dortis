import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

test('Form library SQL schema includes the created_at field it queries',()=>{
  const schema=readFileSync(new URL('../supabase/dortis_portfolio_templates.sql',import.meta.url),'utf8')
  const manager=readFileSync(new URL('../src/features/portfolio/templates/PortfolioTemplateManager.jsx',import.meta.url),'utf8')
  assert.match(schema,/create table if not exists public\.artist_website_templates[\s\S]*?created_at timestamptz not null default now\(\)/)
  assert.match(schema,/alter table public\.artist_website_templates\s+add column if not exists created_at/)
  assert.match(manager,/from\('artist_website_templates'\)\.select\('\*'\)\.eq\('status','active'\)\.order\('created_at'/)
})
