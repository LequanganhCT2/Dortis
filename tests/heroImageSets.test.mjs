import test from 'node:test'
import assert from 'node:assert/strict'
import {HERO_CARD_COUNT,HERO_IMAGES_PER_CARD,heroImageSlot,getHeroCardPhotos,getHeroCardImages} from '../src/heroImageSets.js'

test('Hero has four isolated cards and six image slots each',()=>{
  assert.equal(HERO_CARD_COUNT,4)
  assert.equal(HERO_IMAGES_PER_CARD,6)
  assert.equal(heroImageSlot(1,1),'hero-set-01-card-01')
  assert.equal(heroImageSlot(6,4),'hero-set-06-card-04')
  assert.notEqual(heroImageSlot(1,1),heroImageSlot(1,2))
  assert.throws(()=>heroImageSlot(7,1),RangeError)
  assert.throws(()=>heroImageSlot(1,5),RangeError)
})

test('Each card reads its own ordered collection, with no image shared',()=>{
  const rows={}
  for(let image=1;image<=6;image++){
    rows[heroImageSlot(image,1)]='https://example.com/card1-'+image+'.png'
    rows[heroImageSlot(image,3)]='https://example.com/card3-'+image+'.png'
  }
  const cards=getHeroCardImages(rows)
  assert.equal(cards.length,4)
  assert.equal(cards[0].length,6)
  assert.equal(cards[1].length,0)
  assert.equal(cards[2].length,6)
  assert.equal(cards[3].length,0)
  assert.notEqual(cards[0][0],cards[2][0])
  assert.equal(cards[0][5],'https://example.com/card1-6.png')
})

test('Old shared hero image is displayed only on card one',()=>{
  const cards=getHeroCardImages({hero:'https://example.com/legacy.png'})
  assert.deepEqual(cards.map(x=>x.length),[1,0,0,0])
  assert.equal(cards[0][0],'https://example.com/legacy.png')
})

test('Overlay text stays with its own image when earlier slots are deleted',()=>{
  const rows={
    [heroImageSlot(2,1)]:'https://example.com/photo-2.png',
    [heroImageSlot(5,1)]:'https://example.com/photo-5.png'
  }
  assert.deepEqual(getHeroCardPhotos(rows)[0],[
    {imageNumber:2,url:'https://example.com/photo-2.png'},
    {imageNumber:5,url:'https://example.com/photo-5.png'}
  ])
})
