/** Vietnamese-safe, word-preserving grapheme segmentation for letter bursts.
 * No DOM or animation here, so it can be tested without React.
 */
export function splitBurstWords(text){
  const normalized=String(text||'')
  const segmenter=typeof Intl!=='undefined'&&Intl.Segmenter?
    new Intl.Segmenter('vi',{granularity:'grapheme'}):null
  let index=0
  return normalized.split(/(\s+)/u).filter(Boolean).map(token=>{
    if(/^\s+$/u.test(token))return {space:token}
    const pieces=segmenter?
      Array.from(segmenter.segment(token),item=>item.segment):Array.from(token)
    return {letters:pieces.map(letter=>({text:letter,index:index++}))}
  })
}
export function allowCharacterBurst(text,maxCharacters=160){
  return Boolean(text)&&Array.from(String(text)).length<=maxCharacters
}
