/** Four independent Hero cards. Each card has six image slots, in display order. */
export const HERO_CARD_COUNT=4
export const HERO_CARD_LIMIT=6
export const HERO_IMAGES_PER_CARD=6

// Historical storage slot names are retained so previously uploaded photos survive.
export function heroImageSlot(imageNumber,cardNumber){
  if(!Number.isInteger(imageNumber)||imageNumber<1||imageNumber>HERO_IMAGES_PER_CARD||
     !Number.isInteger(cardNumber)||cardNumber<1||cardNumber>HERO_CARD_LIMIT)
    throw new RangeError('Invalid Dortis Hero image/card number')
  return 'hero-set-'+String(imageNumber).padStart(2,'0')+'-card-'+String(cardNumber).padStart(2,'0')
}

export function getHeroCardPhotos(primary={}){
  return Array.from({length:HERO_CARD_LIMIT},(_,cardIndex)=>{
    const cardNumber=cardIndex+1
    const photos=Array.from({length:HERO_IMAGES_PER_CARD},(_,index)=>({
      imageNumber:index+1,url:primary[heroImageSlot(index+1,cardNumber)]
    })).filter(photo=>typeof photo.url==='string'&&photo.url.startsWith('https://'))
    // Legacy shared 'hero' is shown on first card only, never replicated.
    if(!photos.length&&cardNumber===1&&typeof primary.hero==='string'&&primary.hero.startsWith('https://'))
      photos.push({imageNumber:1,url:primary.hero})
    return photos.filter((photo,index,all)=>all.findIndex(other=>other.url===photo.url)===index)
  })
}
export function getHeroCardImages(primary={}){
  return getHeroCardPhotos(primary).map(photos=>photos.map(photo=>photo.url))
}

export function getActiveHeroCardCount(content={}){
  const requested=Number.parseInt(content.cardCount,10)
  return Number.isInteger(requested)?Math.max(HERO_CARD_COUNT,Math.min(HERO_CARD_LIMIT,requested)):HERO_CARD_COUNT
}
