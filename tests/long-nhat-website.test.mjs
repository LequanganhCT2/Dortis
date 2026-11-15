import test from 'node:test'
import assert from 'node:assert/strict'
import {websiteFromArtist,extractSectionPhotos,safeMediaUrl,templateCanGoPublic,
  LONG_NHAT_TEMPLATE_STATUS} from '../src/features/portfolio/long-nhat/websiteModel.js'

const example={id:'profile-1',slug:'long-nhat',name:'Long Nhật',status:'published',
  cover_image_url:'https://assets.example/portrait.webp',
  sections:[
    {page:1,title:'LONG NHẬT',media:[{url:'https://assets.example/portrait.webp',alt:'Portrait'}]},
    {page:2,title:'Giới thiệu',body:'Một đoạn trích từ Portfolio chưa xác minh.'},
    {page:3,title:'Thông tin biểu diễn',body:'Thông tin chờ xác thực.'},
    {page:5,title:'Gala Dinner',media:[{url:'https://assets.example/live.webp'}]},
    {page:8,title:'Hình ảnh & Video',media:[{url:'https://assets.example/live.webp'}]}
  ]}
test('Artist website preview maps actual profile content without making up booking or videos',()=>{
  const view=websiteFromArtist(example)
  assert.equal(view.name,'Long Nhật')
  assert.equal(view.bio,'Một đoạn trích từ Portfolio chưa xác minh.')
  assert.equal(view.heroPhoto,'https://assets.example/portrait.webp')
  assert.equal(view.photos.length,2)
  assert.equal(view.videos.length,0)
  assert.equal(view.booking,null)
  assert.equal(view.websitePublication,LONG_NHAT_TEMPLATE_STATUS)
  assert.equal(view.sourceReview,'IN_PORTFOLIO_UNVERIFIED')
  assert.equal(view.pageCount,5)
})
test('Untrusted media scheme is rejected and repeated image is deduplicated',()=>{
  assert.equal(safeMediaUrl('javascript:alert(1)'),null)
  assert.equal(safeMediaUrl('data:image/svg+xml;base64,x'),null)
  assert.equal(extractSectionPhotos({page:1,media:[
    {url:'https://assets.example/a.webp'},
    {url:'https://assets.example/a.webp'},
    {url:'javascript:alert(1)'}
  ]}).length,1)
})
test('Missing source data stays missing, never synthesized',()=>{
  assert.equal(websiteFromArtist(null),null)
  const item=websiteFromArtist({id:'2',slug:'long-nhat',sections:[]})
  assert.equal(item.heroPhoto,null)
  assert.equal(item.bio,'')
  assert.equal(item.performances.length,0)
  assert.equal(item.photoCount,0)
})
test('Publication gate requires all approvals in addition to artist source being published',()=>{
  assert.equal(templateCanGoPublic({}),false)
  assert.equal(templateCanGoPublic({portfolioPagesAudited:true}),false)
  assert.equal(templateCanGoPublic({portfolioPagesAudited:true,visualApproved:true,
    claimsApproved:true,mediaRightsApproved:true,bookingApproved:true,releaseApproved:true}),true)
})
