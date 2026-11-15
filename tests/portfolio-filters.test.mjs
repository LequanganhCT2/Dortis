import test from 'node:test'
import assert from 'node:assert/strict'
import {filterPortfolioRows,portfolioCounts} from '../src/features/artists/domain/portfolioFilters.js'

const rows=[
  {id:'1',name:'Long Nhật',role:'Ca sĩ',slug:'long-nhat',status:'published'},
  {id:'2',name:'Nghệ sĩ thử nghiệm',role:'Ca sĩ',slug:'nghe-si-thu-nghiem',status:'draft'},
  {id:'3',name:'Ban nhạc',role:'Nhạc sĩ',slug:'ban-nhac',status:'published'}
]
test('Portfolio library lists both drafts and published records, not placeholders',()=>{
  assert.equal(filterPortfolioRows(rows).length,3)
  assert.deepEqual(portfolioCounts(rows),{total:3,published:2,drafts:1})
  assert.equal(filterPortfolioRows(rows,'','draft')[0].id,'2')
})
test('Portfolio search matches Vietnamese names, roles and slugs',()=>{
  assert.equal(filterPortfolioRows(rows,'Long Nhật')[0].id,'1')
  assert.equal(filterPortfolioRows(rows,'ca sĩ').length,2)
  assert.equal(filterPortfolioRows(rows,'BAN-NHAC')[0].id,'3')
  assert.equal(filterPortfolioRows(rows,'impossible').length,0)
})
