import React from 'react'
import {allowCharacterBurst,splitBurstWords} from './characterBurstText.js'

/** Real text with short GPU-friendly character entrances. Word groups preserve
 * normal wrapping; a single accessible copy avoids screen-reader spelling.
 * Long paragraphs stay native text to prevent a heavy DOM on mobile.
 */
export default function CharacterBurst({text,disabled=false,maxCharacters=160}){
  const value=String(text||'')
  if(disabled||!allowCharacterBurst(value,maxCharacters))return value
  return <span className="pt-burst-text" data-pt-burst="true">
    <span className="pt-burst-sr">{value}</span>
    <span className="pt-burst-visual" aria-hidden="true">
      {splitBurstWords(value).map((token,i)=>token.space?
        <React.Fragment key={i}>{token.space}</React.Fragment>:
        <span className="pt-burst-word" key={i}>
          {token.letters.map(letter=><span
            key={letter.index} className="pt-burst-letter"
            style={{'--pt-letter-delay':Math.min(380,letter.index*14)+'ms'}}>
            {letter.text}
          </span>)}
        </span>)}
    </span>
  </span>
}
