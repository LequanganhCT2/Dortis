import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
test('OCR is imported only when user loads a PDF and server upload is absent',()=>{
 const w=readFileSync(new URL('../src/features/artists/components/ArtistPdfImportWizard.jsx',import.meta.url),'utf8')
 assert.match(w,/import\('\.\.\/services\/ocrPdfPages'\)/)
 assert.match(w,/selectAutomaticOcrPages\(review\.pages\)/)
 assert.match(w,/Đối chiếu chữ từ PDF và chữ OCR/)
 assert.match(w,/OCR trang này/)
 assert.match(w,/OCR lại các trang chưa duyệt/)
 assert.doesNotMatch(w,/storage\.from\(|uploadArtistPdf\(/)
})
test('OCR uses one local Tesseract worker and renders PDF page canvas only',()=>{
 const code=readFileSync(new URL('../src/features/artists/services/ocrPdfPages.js',import.meta.url),'utf8')
 assert.match(code,/createWorker\(\['vie','eng'\]/)
 assert.match(code,/await worker\.recognize\(canvas\)/)
 assert.match(code,/page\.render\(\{canvasContext:ctx,canvas,viewport\}\)/)
 assert.match(code,/await worker\.terminate\(/)
 assert.match(code,/Math\.sqrt\(MAX_PIXELS/)
 assert.doesNotMatch(code,/fetch\(|supabase|storage\.from\(/)
})
test('Reviewed profile records OCR provenance but no screenshots or original PDF',()=>{
 const model=readFileSync(new URL('../src/features/artists/domain/pdfReviewModel.js',import.meta.url),'utf8')
 assert.match(model,/ocrConfidence/)
 assert.match(model,/reviewed:true/)
 assert.match(model,/original_page_path:null/)
})
