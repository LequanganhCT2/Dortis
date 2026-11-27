/**
 * Active section is the one occupying the reading area below the sticky
 * header, NOT necessarily the last section whose top crossed the header.
 * This prevents the navigation from lagging by one section when smooth
 * scrolling stops at a scroll-margin offset.
 */
export function portfolioNavigationLabel(section){
  return String(section.label||section.title||section.eyebrow||'Phần nội dung')
    .replace(/^\s*(?:\d+\s*\/\s*)?\d+\s*[·.:\-/]\s*/,'').trim()
}

export function portfolioReadingLine(headerBottom,viewportBottom){
  const top=Math.max(0,Number(headerBottom)||0)
  const bottom=Math.max(top+1,Number(viewportBottom)||0)
  return Math.min(bottom-1,top+Math.max(28,(bottom-top)*.32))
}
export function pickPortfolioActiveSection(sections,headerBottom,viewportBottom){
  if(!sections?.length)return ''
  const line=portfolioReadingLine(headerBottom,viewportBottom)
  let closest=null
  for(const section of sections){
    const rect=section.getBoundingClientRect()
    const top=rect.top,bottom=rect.bottom
    if(top<=line&&bottom>line)return section.id.replace(/^pt-/,'')
    const distance=top>line?top-line:line-bottom
    if(!closest||distance<closest.distance){
      closest={id:section.id.replace(/^pt-/,''),distance}
    }
  }
  return closest?.id||''
}
