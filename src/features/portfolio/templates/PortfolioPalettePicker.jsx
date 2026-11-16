import React from 'react'
import {FORM_COLOR_PALETTES,normalizePortfolioPalette} from './portfolioPalette'

/** Clearly visible color choices shared by the artist editor and Form editor.
 * This is presentational only: the parent owns preview, save and publish state.
 */
export default function PortfolioPalettePicker({
  value='red-gold',onChange,disabled=false,onReset=null,
  heading='Bảng màu Portfolio',hint='Chọn màu để xem ngay trên Portfolio.'
}){
  const active=normalizePortfolioPalette(value)
  return <section className="pt-palette-picker" aria-label={heading}>
    <div className="pt-palette-picker__head">
      <div>
        <strong>{heading}</strong>
        <p>{hint}</p>
      </div>
      {onReset&&<button type="button" className="pt-palette-picker__reset"
        disabled={disabled} onClick={onReset}>Theo màu Form gốc ↺</button>}
    </div>
    <div className="pt-palette-picker__options" role="group" aria-label="Chọn bảng màu">
      {FORM_COLOR_PALETTES.map(option=><button
        key={option.id} type="button"
        className={'pt-palette-picker__option'+(active===option.id?' is-selected':'')}
        aria-pressed={active===option.id} disabled={disabled}
        onClick={()=>onChange(option.id)}>
        <span className="pt-palette-picker__swatch" aria-hidden="true"
          style={{background:'linear-gradient(90deg,'+option.swatches[0]+' 0 50%,'+
            option.swatches[1]+' 50% 100%)'}}/>
        <span className="pt-palette-picker__name">{option.label}</span>
        <span className="pt-palette-picker__mark" aria-hidden="true">
          {active===option.id?'✓':''}
        </span>
      </button>)}
    </div>
  </section>
}
