import React, { useCallback, useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import './admin.css'
import AdminMediaEditor from './AdminMediaEditor'

const API_URL = (import.meta.env.VITE_SUPABASE_URL || 'https://whkqdusoowrrhtvejrie.supabase.co').replace(/\/+$/, '')
const API_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''
const ADMIN_EMAIL = import.meta.env.VITE_DORTIS_ADMIN_EMAIL || ''
const supabase = API_KEY ? createClient(API_URL, API_KEY, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
}) : null

const getReadableError = (error, fallback = 'Không thể hoàn tất thao tác') => {
  if (!error) return fallback
  if (error.message?.includes('relation') || error.code === '42P01') return 'Chưa khởi tạo bảng site_images trên Supabase Dortis.'
  if (error.message?.includes('row-level security') || error.code === '42501') return 'Phiên đăng nhập chưa có quyền ghi. Hãy đăng xuất và đăng nhập lại để cập nhật quyền admin (RLS).'
  return error.message || fallback
}

export function useSiteImages() {
  const [siteImages,setSiteImages]=useState({})
  const [siteGalleries,setSiteGalleries]=useState({})
  const [mediaReady,setMediaReady]=useState(false)

  useEffect(()=>{
    if(!supabase){setMediaReady(true);return}
    let live=true
    async function read(){
      const [primary,gallery]=await Promise.all([
        supabase.from('site_images').select('slot,image_url'),
        supabase.from('site_image_gallery').select('slot,image_url,position,created_at').order('position').order('created_at'),
      ])
      if(!live)return
      if(!primary.error){
        setSiteImages(Object.fromEntries((primary.data||[]).map(row=>[row.slot,row.image_url])))
      }
      if(!gallery.error){
        const groups={}
        for(const item of gallery.data||[]) (groups[item.slot]??=[]).push(item.image_url)
        setSiteGalleries(groups)
      }
      setMediaReady(true)
    }
    read()
    const subscription=supabase.channel('dortis-public-media-updates')
      .on('postgres_changes',{event:'*',schema:'public',table:'site_images'},read)
      .on('postgres_changes',{event:'*',schema:'public',table:'site_image_gallery'},read)
      .subscribe()
    return ()=>{live=false;supabase.removeChannel(subscription)}
  },[])
  return {siteImages,siteGalleries,mediaReady}
}


export default function AdminPage() {
  const [user, setUser] = useState(null)
  const [authorized, setAuthorized] = useState(false)
  const [checking, setChecking] = useState(!!supabase)
  const [loginName, setLoginName] = useState('admin')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const check = useCallback(async () => {
    if (!supabase) { setChecking(false); return }
    try {
      const { data, error } = await supabase.auth.getUser()
      if (error || !data?.user) {
        setUser(null)
        setAuthorized(false)
        return
      }
      setUser(data.user)
      const isAdmin = data.user.app_metadata?.role === 'admin'
      if (!isAdmin) { setAuthorized(false); return }

      // getUser() returns fresh app_metadata, but Storage RLS evaluates the
      // app_metadata embedded in the *existing JWT*, which can be stale after
      // a role grant. Refresh it before enabling the image editor.
      const jwtRole = (token) => {
        if (!token) return null
        try {
          const payload = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/')
          return JSON.parse(atob(payload)).app_metadata?.role ?? null
        } catch { return null }
      }
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError
      if (jwtRole(sessionData?.session?.access_token) !== 'admin') {
        const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession()
        if (refreshError) throw refreshError
        if (jwtRole(refreshed?.session?.access_token) !== 'admin') {
          throw new Error('JWT vẫn chưa cập nhật quyền admin.')
        }
      }
      setAuthorized(true)
      setError('')
    } catch (err) {
      setAuthorized(false)
      setError('Không thể làm mới quyền quản trị. Vui lòng đăng xuất, đăng nhập lại và thử lần nữa.')
      console.error('Dortis admin session refresh failed:', err?.message)
    } finally {
      setChecking(false)
    }
  }, [])
  useEffect(() => {
    check()
    if (!supabase) return
    const { data } = supabase.auth.onAuthStateChange(() => { queueMicrotask(check) })
    return () => data.subscription.unsubscribe()
  }, [check])

  async function signIn(event) {
    event.preventDefault()
    setError(''); setBusy(true)
    try {
      const accountEmail = loginName.trim().toLowerCase() === 'admin' ? ADMIN_EMAIL : loginName.trim()
      if (!accountEmail || !accountEmail.includes('@')) throw new Error('Admin email not configured')
      const { error } = await supabase.auth.signInWithPassword({ email: accountEmail, password })
      if (error) throw error
      setPassword('')
      await check()
    } catch (e) { setError('Đăng nhập không thành công. Kiểm tra tài khoản hoặc mật khẩu.') }
    finally { setBusy(false) }
  }
  async function signOut() {
    setAuthorized(false); setUser(null)
    await supabase?.auth.signOut()
  }

  if (checking) return <main className="admin-auth"><p>Đang xác thực quyền quản trị...</p></main>
  if (!supabase) return <main className="admin-auth"><div className="admin-login"><span>DORTIS / ADMIN</span><h1>Chưa kết nối Supabase.</h1><p>Thiếu <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> trong môi trường frontend.</p><a href="/">← Trang chủ</a></div></main>
  if (user && !authorized) return <main className="admin-auth"><div className="admin-login"><span>DORTIS / ADMIN</span><h1>Không có quyền quản trị.</h1><p>Tài khoản hiện tại chưa được cấp vai trò admin trong Supabase Auth. Không thể chỉnh sửa ảnh.</p><button onClick={signOut}>Đăng xuất</button></div></main>
  if (authorized) return <AdminMediaEditor user={user} signOut={signOut} supabase={supabase}/>
  return <main className="admin-auth"><form className="admin-login" onSubmit={signIn}>
    <a href="/" className="admin-back">← TRỞ VỀ TRANG CHỦ</a><span>DORTIS / PRIVATE ACCESS</span><h1>Quản trị<br/><em>Dortis.</em></h1>
    <p>Đăng nhập để chỉnh sửa hình ảnh trang chủ và hồ sơ dự án.</p>
    <label>TÀI KHOẢN ADMIN<input type="text" required autoComplete="username" value={loginName} placeholder="admin" onChange={e=>setLoginName(e.target.value)}/></label>
    <label>MẬT KHẨU<input type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Nhập mật khẩu"/></label>
    {error && <p role="alert" className="admin-auth-error">{error}</p>}
    <button disabled={busy || !loginName} type="submit">{busy ? 'ĐANG ĐĂNG NHẬP...' : 'ĐĂNG NHẬP →'}</button>
    <small>Tài khoản “admin” được ánh xạ sang email đã khai báo trong môi trường Supabase. Bạn cũng có thể nhập email trực tiếp. Mật khẩu không lưu trong mã nguồn.</small>
  </form></main>
}
