import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getOriginalPageUrl, hasOriginalPages, defaultArtistDisplayMode,
} from '../src/artistOriginalData.js'

test('published legacy Long Nhat page images can be used without importing PDF again',()=>{
  const old=Array.from({length:8},(_,i)=>({page:i+1,image_url:'https://cdn.example.com/page-'+(i+1)+'.webp'}))
  assert.equal(hasOriginalPages(old),true)
  assert.equal(defaultArtistDisplayMode({render_mode:'original'},old),'original')
  assert.equal(getOriginalPageUrl(old[0]),'https://cdn.example.com/page-1.webp')
})

test('new original publish works with explicit page assets and retains order',()=>{
  const pages=Array.from({length:12},(_,i)=>({
    page:i+1,original_page_url:'https://cdn.example.com/artist/page-'+(i+1)+'.webp',
    original_page_path:'artist/page-'+(i+1)+'.webp',
    original_page_width:1800,original_page_height:2600,
  }))
  assert.equal(hasOriginalPages(pages),true)
  assert.equal(defaultArtistDisplayMode({render_mode:'original'},pages),'original')
  assert.equal(getOriginalPageUrl(pages[11]),'https://cdn.example.com/artist/page-12.webp')
})

test('local Admin blob preview is viewable but missing pages fall back to editorial',()=>{
  assert.equal(hasOriginalPages([{original_page_url:'blob:https://site.example/abc'}]),true)
  assert.equal(hasOriginalPages([{original_page_url:'https://cdn.example.com/1.webp'},{}]),false)
  assert.equal(defaultArtistDisplayMode({render_mode:'original'},[{page:1}]),'editorial')
  assert.equal(defaultArtistDisplayMode({render_mode:'editorial'},[{image_url:'https://cdn.example.com/1.webp'}]),'editorial')
  assert.equal(getOriginalPageUrl({image_url:'javascript:alert(1)'}),null)
})
