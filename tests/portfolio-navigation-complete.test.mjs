import test from 'node:test'
import assert from 'node:assert/strict'
import {portfolioNavigationLabel} from '../src/features/portfolio/templates/sectionNavigation.js'
import {TEMPLATE_1} from '../src/features/portfolio/templates/template1.js'

test('All eleven content sections have navigation labels even without an eyebrow',()=>{
  const sections=TEMPLATE_1.blueprint.sections.slice(1).map(s=>({...s,eyebrow:''}))
  assert.equal(sections.length,11)
  assert.deepEqual(sections.map(portfolioNavigationLabel),[
    'Hành trình âm nhạc','Dấu ấn nghệ thuật','Thể loại âm nhạc','Chương trình & sự kiện',
    'Hình ảnh biểu diễn','Chương trình văn hóa','Song ca & biểu diễn phối hợp',
    'Biểu diễn đơn ca','Hình ảnh & video','Liên hệ & booking','Cảm ơn'
  ])
})
test('Navigation uses the section name independently of an edited title or eyebrow',()=>{
  assert.equal(portfolioNavigationLabel({label:'03 · Hành trình',title:'Nội dung tùy chỉnh',eyebrow:'Nhãn phụ'}),'Hành trình')
  assert.equal(portfolioNavigationLabel({title:'Liên hệ'}),'Liên hệ')
})
