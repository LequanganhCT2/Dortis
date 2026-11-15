import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
test('OCR runs all mixed-content pages, never skips a page just because text-layer exists',()=>{
 const plan=readFileSync(new URL('../src/features/artists/domain/ocrReconciliation.js',import.meta.url),'utf8')
 assert.match(plan,/return pages\.filter\(p=>!p\.reviewed/)
 assert.doesNotMatch(plan,/pages\.filter\(p=>needsOcrPage\(p\)\)/)
})
test('OCR is lazy-loaded, retains per-page results and never uploads PDF bytes',()=>{
 const w=readFileSync(new URL('../src/features/artists/components/ArtistPdfImportWizard.jsx',import.meta.url),'utf8')
 assert.match(w,/import\('\.\.\/services\/ocrPdfPages'\)/)
 assert.match(w,/onResult:result=>/)
 assert.match(w,/setDoc\(current=>applyOcrToReview\(current\|\|review,\[result\]\)\)/)
 assert.match(w,/Quét sâu trang này/)
 assert.match(w,/Quét tiếp trang chưa OCR/)
 assert.match(w,/Đối chiếu chữ từ PDF và chữ OCR/)
 assert.doesNotMatch(w,/storage\.from\(|uploadArtistPdf\(/)
})
test('Tesseract performs multi-region OCR with one local worker',()=>{
 const code=readFileSync(new URL('../src/features/artists/services/ocrPdfPages.js',import.meta.url),'utf8')
 assert.match(code,/createWorker\(\['vie','eng'\]/)
 assert.match(code,/buildOcrPasses\(/)
 assert.match(code,/await worker\.recognize\(canvas,/)
 assert.match(code,/page\.render\(\{canvasContext:ctx,canvas,viewport\}\)/)
 assert.match(code,/onResult\(result\)/)
 assert.match(code,/await worker\.terminate\(/)
 assert.doesNotMatch(code,/supabase|storage\.from\(|fetch\(/)
})
test('Reviewed records save only verified text and OCR provenance, not original PDF',()=>{
 const model=readFileSync(new URL('../src/features/artists/domain/pdfReviewModel.js',import.meta.url),'utf8')
 assert.match(model,/ocrConfidence/)
 assert.match(model,/reviewed:true/)
 assert.match(model,/original_page_path:null/)
})
