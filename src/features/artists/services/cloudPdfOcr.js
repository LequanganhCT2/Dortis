/** Cloud OCR upload is opt-in. PDF is stored in private Supabase Storage only
 * while Mistral reads it, then removed on both server and browser sides.
 * No API key is ever exposed to the client bundle.
 */
export const CLOUD_TEMP_BUCKET='dortis-ocr-temp'
export const CLOUD_MAX_BYTES=50*1024*1024

async function bearerToken(supabase){
  const {data,error}=await supabase.auth.getSession()
  if(error||!data?.session?.access_token)
    throw new Error('Bạn cần đăng nhập lại để sử dụng OCR AI.')
  return data.session.access_token
}
export async function getCloudOcrAvailability(supabase) {
  const token=await bearerToken(supabase)
  const response=await fetch('/api/portfolio-ocr',{
    headers:{Authorization:'Bearer '+token},cache:'no-store'
  })
  if(!response.ok)return {mistralAvailable:false,geminiAvailable:false}
  return response.json()
}
async function deleteOldUploads(supabase,userId) {
  // Stale files may remain if a browser window was closed before finally.
  // Only remove files owned by this admin and older than one hour.
  const storage=supabase.storage.from(CLOUD_TEMP_BUCKET)
  const {data,error}=await storage.list(userId,{limit:100})
  if(error||!Array.isArray(data))return
  const old=data.filter(row=>row.name?.endsWith('.pdf') &&
    row.created_at && Date.now()-new Date(row.created_at).getTime()>60*60*1000)
    .slice(0,50).map(row=>userId+'/'+row.name)
  if(old.length)await storage.remove(old)
}
export async function processCloudPdf(file,{
  supabase,userId,pageCount,classify=false,onProgress=()=>{},signal,
  onCleanupWarning=()=>{}
}={}){
  if(!file || file.size>CLOUD_MAX_BYTES)
    throw new Error('OCR AI hỗ trợ PDF tối đa 50 MB. Hãy dùng OCR trên thiết bị cho file lớn.')
  if(!userId)throw new Error('Không xác định được tài khoản Admin.')
  if(signal?.aborted)throw new DOMException('OCR đã bị hủy.','AbortError')
  const storage=supabase.storage.from(CLOUD_TEMP_BUCKET)
  const path=userId+'/'+crypto.randomUUID()+'.pdf'
  let uploaded=false
  try{
    const token=await bearerToken(supabase)
    await deleteOldUploads(supabase,userId).catch(()=>{})
    onProgress('Đang tải PDF vào vùng lưu trữ riêng tư tạm thời…')
    const {error:uploadError}=await storage.upload(path,file,{
      contentType:'application/pdf',cacheControl:'0',upsert:false
    })
    if(uploadError)throw new Error('Không tải được PDF tạm: '+uploadError.message)
    uploaded=true
    if(signal?.aborted)throw new DOMException('OCR đã bị hủy.','AbortError')
    onProgress('Mistral AI đang nhận dạng chữ và bố cục trang…')
    const response=await fetch('/api/portfolio-ocr',{
      method:'POST',
      headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},
      body:JSON.stringify({path,pageCount,classify:Boolean(classify)}),
      cache:'no-store',signal
    })
    const data=await response.json().catch(()=>({}))
    if(!response.ok)throw new Error(data.error||'Không thể xử lý PDF bằng OCR AI.')
    if(!Array.isArray(data.pages)||!data.pages.length)
      throw new Error('OCR AI chưa trả về kết quả nào.')
    return data
  }finally{
    if(uploaded){
      const {error}=await storage.remove([path]).catch(e=>({error:e}))
      if(error)onCleanupWarning('Không xóa được PDF tạm. Vui lòng kiểm tra Storage / '+CLOUD_TEMP_BUCKET+'.')
    }
  }
}
