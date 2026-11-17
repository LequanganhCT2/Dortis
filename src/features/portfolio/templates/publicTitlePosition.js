/** Change only the selected title's authored position, preserving all
 * image, typography, scene and PDF-derived fields in draft/public snapshots. */
const clamp=value=>Math.round(Math.max(-95,Math.min(95,Number(value)||0))*10)/10

export function withPublishedTitlePosition(document,sectionId,device,position){
  if(!document||!sectionId||!['desktop','mobile'].includes(device))return document
  const positions=document.positions||{}
  const section=positions[sectionId]||{}
  const platform=section[device]||{}
  const title=platform.title||{}
  return {...document,positions:{...positions,[sectionId]:{
    ...section,[device]:{...platform,title:{
      ...title,...position,x:clamp(position.x),y:clamp(position.y)
    }}
  }}}
}
