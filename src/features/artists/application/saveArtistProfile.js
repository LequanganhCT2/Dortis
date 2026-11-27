import {slugifyArtist} from '../../../artistPdf.js'
import {normalizeArtistSection} from '../../../artistLayouts.js'

export async function saveArtistProfile({supabase,userId,profile}){
  const name=String(profile.name||'').trim()
  if(name.length<2)throw new Error('Tên nghệ sĩ cần ít nhất 2 ký tự.')
  if(!Array.isArray(profile.sections)||!profile.sections.length)
    throw new Error('Hồ sơ cần có ít nhất một phần nội dung.')
  if(!userId)throw new Error('Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại trước khi lưu.')
  let slug=String(profile.slug||'').trim()||slugifyArtist(name)
  if(!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug))
    throw new Error('Đường dẫn chỉ gồm chữ thường không dấu, số và dấu gạch ngang.')
  if(!profile.id){
    const {data,error}=await supabase.from('artist_profiles').select('slug').like('slug',slug+'%')
    if(error)throw error
    const used=new Set((data||[]).map(row=>row.slug)),base=slug
    let suffix=2
    while(used.has(slug))slug=base+'-'+suffix++
  }
  const payload={name,slug,role:String(profile.role||'').trim()||'Nghệ sĩ',
    tagline:String(profile.tagline||'').trim(),intro:String(profile.intro||''),
    render_mode:profile.render_mode||'editorial',sections:profile.sections.map(normalizeArtistSection),
    updated_at:new Date().toISOString()}
  const table=supabase.from('artist_profiles')
  const query=profile.id?table.update(payload).eq('id',profile.id):
    table.insert({...payload,status:'draft',created_by:userId})
  const {data,error}=await query.select().single()
  if(error){
    if(error.code==='23505')throw new Error('Đường dẫn này đã được sử dụng. Đổi đường dẫn hoặc bấm lưu lại để tạo đường dẫn mới cho hồ sơ mới.')
    if(error.code==='42501'||error.status===403)
      throw new Error('Phiên đăng nhập chưa có quyền lưu hồ sơ. Hãy đăng nhập lại bằng tài khoản Admin.')
    throw error
  }
  if(!data?.id)throw new Error('Chưa nhận được xác nhận lưu hồ sơ. Nội dung đang nhập vẫn được giữ nguyên.')
  return data
}
