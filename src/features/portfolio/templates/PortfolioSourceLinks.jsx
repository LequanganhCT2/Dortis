import React from 'react'

export function safeSourceLinks(links){
  return [...new Set((Array.isArray(links)?links:[]).filter(link=>{
    if(typeof link!=='string')return false
    try{return ['https:','http:'].includes(new URL(link).protocol)}catch{return false}
  }))]
}

export default function PortfolioSourceLinks({section}){
  const links=safeSourceLinks(section.links)
  if(!links.length)return null
  return <p className="pt-source-links" aria-label={'Liên kết · '+section.label}>
    {links.map(link=><a key={link} href={link} target="_blank" rel="noopener noreferrer">{link}</a>)}
  </p>
}
