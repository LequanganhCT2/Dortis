import test from 'node:test'
import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import {
  ARTIST_PDF_BUCKET, PRIVATE_PDF_CHUNK_SIZE,
  uploadArtistPdf, downloadArtistPdf, removeArtistPdf,
  decodeArtistPdfSource, encodeArtistPdfSource,
} from '../src/artistPdfStorage.js'

function mockSupabase({ failAt = 0 } = {}) {
  const files = new Map()
  let calls = 0
  const operations = []
  const storage = {
    from(bucket) {
      assert.equal(bucket, ARTIST_PDF_BUCKET)
      return {
        async upload(path, blob, options) {
          calls++
          operations.push(['upload',path,blob.size,options.contentType])
          if(failAt && calls === failAt) return { error: new Error('Simulated failure') }
          files.set(path, new Blob([blob], { type: options.contentType }))
          return { error: null }
        },
        async download(path) {
          operations.push(['download',path])
          if(!files.has(path))return { data: null, error:new Error('Missing object: '+path) }
          return { data: files.get(path), error: null }
        },
        async remove(paths) {
          for(const path of paths)files.delete(path)
          operations.push(['remove',...paths])
          return { data: paths, error: null }
        },
      }
    },
  }
  return { storage, files, operations }
}

function fakePdf(size) {
  // Use deterministic byte patterns with realistic PDF signature.
  const buffer=Buffer.alloc(size)
  buffer.write('%PDF-1.7\n',0)
  for(let n=9;n<size;n+=73)buffer[n]=n%251
  return new Blob([buffer],{type:'application/pdf'})
}

test('small PDF is kept as a single private object',async()=>{
  const supabase=mockSupabase()
  const data=fakePdf(900_000)
  const path='artist-pdfs/test-a/original.pdf'
  const result=await uploadArtistPdf(supabase,data,path)
  assert.equal(result.storageRef,path)
  assert.equal(supabase.files.size,1)
  const restored=await downloadArtistPdf(supabase,result.storageRef)
  assert.deepEqual(Buffer.from(await restored.arrayBuffer()),Buffer.from(await data.arrayBuffer()))
  await removeArtistPdf(supabase,result.storageRef)
  assert.equal(supabase.files.size,0)
})

test('large PDF is split into small objects and reassembled without byte loss',async()=>{
  const supabase=mockSupabase()
  const data=fakePdf(50*1024*1024+37)
  const progress=[]
  const result=await uploadArtistPdf(supabase,data,'artist-pdfs/test-b/original.pdf',
    (done,total)=>progress.push([done,total]))
  const decoded=decodeArtistPdfSource(result.storageRef)
  assert.ok(decoded.multipart)
  assert.equal(decoded.size,data.size)
  assert.equal(decoded.parts.length,13)
  assert.equal(progress.at(-1)[0],13)
  assert.ok([...supabase.files.values()].every(part=>part.size<=PRIVATE_PDF_CHUNK_SIZE))
  assert.ok(supabase.operations.filter(o=>o[0]==='upload').every(o=>o[3]==='application/octet-stream'))
  const restored=await downloadArtistPdf(supabase,result.storageRef)
  assert.deepEqual(Buffer.from(await restored.arrayBuffer()),Buffer.from(await data.arrayBuffer()))
  await removeArtistPdf(supabase,result.storageRef)
  assert.equal(supabase.files.size,0)
})

test('upload errors clean up all previously uploaded partial objects',async()=>{
  const supabase=mockSupabase({failAt:3})
  const data=fakePdf(10*1024*1024)
  await assert.rejects(uploadArtistPdf(supabase,data,'artist-pdfs/test-c/document.pdf'),/Simulated failure/)
  assert.equal(supabase.files.size,0)
  assert.equal(supabase.operations.some(op=>op[0]==='remove'),true)
})

test('bad manifest is rejected and legacy references remain supported',()=>{
  assert.deepEqual(decodeArtistPdfSource('artist-pdfs/old/legacy.pdf').parts,
    ['artist-pdfs/old/legacy.pdf'])
  assert.throws(()=>decodeArtistPdfSource('dortis-pdf-parts-v1:{"parts":[],"size":1}'))
  assert.throws(()=>decodeArtistPdfSource('dortis-pdf-parts-v1:not-json'))
  assert.throws(()=>encodeArtistPdfSource(['../out-of-bucket.pdf'],3))
})
