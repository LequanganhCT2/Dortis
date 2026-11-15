import test from 'node:test'
import assert from 'node:assert/strict'
import {
  MAX_CLOUD_PDF_BYTES,isOwnedTempPdfPath,cleanOcrMarkdown,normalizeMistralPages,
  verifiedClassification
} from '../api/lib/portfolioOcr.js'
import {applyCloudOcrToReview} from '../src/features/artists/domain/cloudOcrReview.js'
import {buildReviewFromExtraction,normalizeReviewedPage} from '../src/features/artists/domain/pdfReviewModel.js'
import {normalizeArtistSection} from '../src/artistLayouts.js'
import {readFileSync} from 'node:fs'
const user='e4b3c97a-fc5c-41dc-9cb7-f16323f1b711'
test('Cloud upload paths must belong to current authenticated admin',()=>{
  const own=user+'/164c61a4-abdb-4445-85bc-575a665dcedf.pdf'
  assert.equal(isOwnedTempPdfPath(own,user),true)
  assert.equal(isOwnedTempPdfPath('other/'+own,user),false)
  assert.equal(isOwnedTempPdfPath(user+'/../private.pdf',user),false)
  assert.equal(isOwnedTempPdfPath(user+'/bad.pdf',user),false)
  assert.equal(MAX_CLOUD_PDF_BYTES,50*1024*1024)
})
test('Mistral pages are normalized in reading order, without losing layout labels',()=>{
  const result=normalizeMistralPages({pages:[{
    index:0,markdown:'# HÀNH TRÌNH NGHỆ THUẬT\n\nXin chào.<br>Đi tiếp.\n\n![x](image.jpeg)',
    dimensions:{width:1000,height:2000},
    confidence_scores:{average_page_confidence_score:.92},
    blocks:[
      {type:'title',top_left_x:80,top_left_y:100,bottom_right_x:800,
        bottom_right_y:190,content:'HÀNH TRÌNH NGHỆ THUẬT',
        confidence_scores:{average_content_confidence_score:.96}},
      {type:'text',top_left_x:90,top_left_y:340,bottom_right_x:760,
        bottom_right_y:540,content:'Xin chào. Đi tiếp.',
        confidence_scores:{average_content_confidence_score:.84}}
    ]
  }]},1)
  assert.equal(result[0].page,1)
  assert.equal(result[0].confidence,92)
  assert.equal(result[0].suggestedTitle,'HÀNH TRÌNH NGHỆ THUẬT')
  assert.deepEqual(result[0].paragraphs[0].bbox,{x0:.08,y0:.05,x1:.8,y1:.095})
  assert.equal(result[0].paragraphs[0].confidence,96)
  assert.match(result[0].text,/Xin chào\.\nĐi tiếp\./)
  assert.doesNotMatch(result[0].text,/image.jpeg/)
})
test('Mistral output pages must be unique and in declared range',()=>{
  const page=index=>({index,markdown:'Đoạn văn',dimensions:{width:100,height:100}})
  assert.deepEqual(normalizeMistralPages({pages:[page(1),page(0)]},2).map(p=>p.page),[1,2])
  assert.throws(()=>normalizeMistralPages({pages:[page(0),page(0)]},2))
  assert.throws(()=>normalizeMistralPages({pages:[page(2)]},2))
})
test('AI classification cannot invent titles, reword content, or assign arbitrary layout',()=>{
  const pages=[{page:1,text:'HÀNH TRÌNH ÂM NHẠC\nTôi học hát từ nhỏ.'}]
  const suggestions=verifiedClassification({pages:[
    {page:1,layout:'biography',title:'HÀNH TRÌNH ÂM NHẠC'},
    {page:2,layout:'awards',title:'Giải nhất'},
    {page:1,layout:'feature',title:'Tiêu đề đã bị bịa'}
  ]},pages)
  assert.deepEqual(suggestions,[{page:1,layout:'biography',title:'HÀNH TRÌNH ÂM NHẠC'}])
  assert.equal(verifiedClassification({pages:[{page:1,layout:'contact',
    title:'Email không nằm trong PDF'}]},pages)[0].title,'')
})
test('Cloud OCR preserves manual edits and keeps provenance through profile editing',()=>{
  const review=buildReviewFromExtraction({name:'Nhà thiết kế A',sections:[
    {page:1,title:'Trang bìa',rawText:'Gốc PDF'},
    {page:2,title:'Trang 2',rawText:'Nội dung PDF cũ'}
  ]})
  review.pages[1].body='Tôi đã sửa tay'
  review.pages[1].editedFields={body:true,title:true,layout:true}
  review.pages[1].title='Đã sửa tiêu đề'
  review.pages[1].layout='gallery'
  const output=applyCloudOcrToReview(review,{
    pages:[
      {page:1,text:'BÌA NGHỆ SĨ',confidence:null,paragraphs:[{
        type:'title',text:'BÌA NGHỆ SĨ',bbox:{x0:.1,y0:.1,x1:.8,y1:.2},confidence:99
      }],suggestedTitle:'BÌA NGHỆ SĨ'},
      {page:2,text:'Nội dung mới',confidence:88,paragraphs:[{
        type:'text',text:'Nội dung mới',bbox:{x0:.1,y0:.3,x1:.8,y1:.5},confidence:87
      }],suggestedTitle:'TIỂU SỬ'}
    ],suggestions:[{page:2,layout:'biography',title:'TIỂU SỬ'}]
  })
  assert.equal(output.pages[0].body,'BÌA NGHỆ SĨ')
  assert.equal(output.pages[0].ocrMainSource,'cloud')
  assert.equal(output.pages[0].ocrConfidence,null)
  assert.equal(output.pages[1].body,'Tôi đã sửa tay')
  assert.equal(output.pages[1].title,'Đã sửa tiêu đề')
  assert.equal(output.pages[1].layout,'gallery')
  assert.equal(output.pages[1].reviewed,false)
  assert.equal(output.quality.ocrProvider,'mistral')
  output.pages[0].reviewed=true
  const persisted=normalizeArtistSection(normalizeReviewedPage(output.pages[0]))
  assert.equal(persisted.extraction.source,'mistral_cloud_ocr')
  assert.equal(persisted.text_blocks[0].source,'mistral')
  assert.equal(persisted.text_blocks[0].type,'title')
})
test('Cloud mode needs consent and never includes server secrets in frontend bundle',()=>{
  const code=readFileSync(new URL('../src/features/artists/components/ArtistPdfImportWizard.jsx',import.meta.url),'utf8')
  const api=readFileSync(new URL('../api/portfolio-ocr.js',import.meta.url),'utf8')
  const vercel=JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url),'utf8'))
  assert.match(code,/cloudConsent/)
  assert.match(code,/processCloudPdf/)
  assert.match(code,/getCloudOcrAvailability/)
  assert.match(api,/user\.app_metadata\?\.role!=='admin'/)
  assert.match(api,/MISTRAL_API_KEY/)
  assert.doesNotMatch(code,/process\.env\.MISTRAL_API_KEY/)
  assert.deepEqual(vercel.functions['api/portfolio-ocr.js'],{maxDuration:300})
  assert.match(vercel.rewrites[0].source,/api/)
})
test('Markdown conversion retains actual paragraphs and strips image placeholders',()=>{
  const result=cleanOcrMarkdown('# HEADING\n\nA paragraph\n\n![img](a.png)\n\n**bold**')
  assert.match(result,/HEADING\n\nA paragraph/)
  assert.doesNotMatch(result,/a\.png/)
})
