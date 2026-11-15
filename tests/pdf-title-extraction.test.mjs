import test from 'node:test'
import assert from 'node:assert/strict'
import {inferTitle} from '../src/artistPdf.js'
test('PDF heading extraction never drops a middle line of biography text',()=>{
  const lines=['Long Nhật là ca sĩ với nhiều năm kinh nghiệm tại các sân khấu chuyên nghiệp',
    'Sở hữu giọng hát truyền cảm và kỹ thuật biểu diễn đa dạng',
    'và khả năng tương tác khán giả trong các sự kiện âm nhạc.']
  const x=inferTitle(lines,2)
  assert.equal(x.title,'Trang 2')
  assert.deepEqual(x.rest,lines)
})
test('Short page heading on first line is extracted; repeated body lines remain',()=>{
  const x=inferTitle(['GALA DINNER','GALA DINNER','GALA DINNER'],5)
  assert.equal(x.title,'GALA DINNER')
  assert.deepEqual(x.rest,['GALA DINNER','GALA DINNER'])
})
test('Fragmentary numerical text is not invented into an event title',()=>{
 const x=inferTitle(['NĂM','+4','ĐỐI TÁC','+30'],4)
 assert.equal(x.title,'Trang 4')
 assert.equal(x.rest.length,4)
})
