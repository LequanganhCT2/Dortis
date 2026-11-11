export const HERO_SET_LIMIT = 6
export const HERO_CARD_COUNT = 4

// Set and card numbers are 1-based, so slots are stable across editor and homepage.
export function heroImageSlot(setNumber, cardNumber) {
  if (!Number.isInteger(setNumber) || setNumber < 1 || setNumber > HERO_SET_LIMIT ||
      !Number.isInteger(cardNumber) || cardNumber < 1 || cardNumber > HERO_CARD_COUNT) {
    throw new RangeError('Invalid Dortis hero image set or card')
  }
  return 'hero-set-' + String(setNumber).padStart(2, '0') +
    '-card-' + String(cardNumber).padStart(2, '0')
}

export function completeHeroImageSets(primary = {}) {
  const sets = []
  for (let setNumber = 1; setNumber <= HERO_SET_LIMIT; setNumber++) {
    const urls = Array.from({ length: HERO_CARD_COUNT }, (_, index) =>
      primary[heroImageSlot(setNumber, index + 1)]
    )
    // Incomplete drafts stay in Admin, not on the public homepage.
    if (urls.every(url => typeof url === 'string' && url.startsWith('https://'))) {
      sets.push({ setNumber, urls })
    }
  }
  return sets
}
