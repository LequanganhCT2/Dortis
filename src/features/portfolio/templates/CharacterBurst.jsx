import React from 'react'
import {allowCharacterBurst,splitBurstWords} from './characterBurstText.js'

/** Real text with short GPU-friendly character entrances. Word groups preserve
 * normal wrapping; a single accessible copy avoids screen-reader spelling.
 * Long paragraphs stay native text to prevent a heavy DOM on mobile.
 */
export default function CharacterBurst({text,disabled=false,maxCharacters=160,mode='letters'}){
  const value=String(text||'')
  if(disabled)return value
  // Block motion operates on this inner span, leaving the authored outer
  // frame's position/size/rotation completely untouched.
  if(mode==='block'||(mode!=='words'&&!allowCharacterBurst(value,maxCharacters)))
    return <span className="pt-burst-text pt-burst-text--block">
      <span className="pt-burst-visual">{value}</span>
    </span>
  if(mode==='words'){
    const tokens=splitBurstWords(value)
    if(tokens.filter(token=>token.letters).length>1200)return value
    let index=0
    return <span className="pt-burst-text pt-burst-text--words" data-pt-burst="words">
      <span className="pt-burst-sr">{value}</span>
      <span className="pt-burst-visual" aria-hidden="true">
        {tokens.map((token,i)=>token.space?
          <React.Fragment key={i}>{token.space}</React.Fragment>:
          <span className="pt-burst-word" key={i} data-pt-burst-word="true"
            style={{'--pt-word-delay':(index++*24)+'ms'}}>
            {token.letters.map(letter=>letter.text).join('')}
          </span>)}
      </span>
    </span>
  }
  return <span className="pt-burst-text" data-pt-burst="true">
    <span className="pt-burst-sr">{value}</span>
    <span className="pt-burst-visual" aria-hidden="true">
      {splitBurstWords(value).map((token,i)=>token.space?
        <React.Fragment key={i}>{token.space}</React.Fragment>:
        <span className="pt-burst-word" key={i}>
          {token.letters.map(letter=><span
            key={letter.index} className="pt-burst-letter"
            style={{'--pt-letter-delay':Math.min(380,letter.index*14)+'ms','--pt-wave-index':letter.index}}>
            {letter.text}
          </span>)}
        </span>)}
    </span>
  </span>
}
