/** Portfolio list selectors are pure; shared by dashboard and library UI. */
export function filterPortfolioRows(rows=[],query='',filter='all'){
  const needle=String(query||'').trim().toLocaleLowerCase('vi-VN')
  return rows.filter(row=>{
    const matches=filter==='all'||row.status===filter
    const haystack=[row.name,row.role,row.slug].filter(Boolean).join(' ').toLocaleLowerCase('vi-VN')
    return matches&&haystack.includes(needle)
  })
}
export function portfolioCounts(rows=[]){
  const published=rows.filter(row=>row.status==='published').length
  return {total:rows.length,published,drafts:rows.length-published}
}
