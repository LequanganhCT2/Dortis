import test from 'node:test'
import assert from 'node:assert/strict'
import { HERO_SET_LIMIT, HERO_CARD_COUNT, heroImageSlot, completeHeroImageSets } from '../src/heroImageSets.js'

test('Hero has six independent four-card image sets', () => {
  assert.equal(HERO_SET_LIMIT, 6)
  assert.equal(HERO_CARD_COUNT, 4)
  assert.equal(heroImageSlot(1, 1), 'hero-set-01-card-01')
  assert.equal(heroImageSlot(6, 4), 'hero-set-06-card-04')
  assert.notEqual(heroImageSlot(2, 1), heroImageSlot(1, 1))
  assert.throws(() => heroImageSlot(7, 1), RangeError)
  assert.throws(() => heroImageSlot(1, 5), RangeError)
})

test('Only complete four-image sets are exposed to the homepage', () => {
  const primary = {}
  for (let card = 1; card <= 4; card++) primary[heroImageSlot(2, card)] = 'https://example.com/set2-' + card + '.jpg'
  for (let card = 1; card <= 3; card++) primary[heroImageSlot(1, card)] = 'https://example.com/set1-' + card + '.jpg'
  assert.deepEqual(completeHeroImageSets(primary).map(set => set.setNumber), [2])
  assert.deepEqual(completeHeroImageSets(primary)[0].urls, Array.from({length:4},(_,i)=>'https://example.com/set2-'+(i+1)+'.jpg'))
  primary[heroImageSlot(1, 4)] = 'https://example.com/set1-4.jpg'
  assert.deepEqual(completeHeroImageSets(primary).map(set => set.setNumber), [1, 2])
})
