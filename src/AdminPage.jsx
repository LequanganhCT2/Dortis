import React, { useCallback, useEffect, useState } from 'react'
import { supabase, adminLoginEmail as ADMIN_EMAIL } from './infrastructure/supabase/client'
import { canManageContent } from './core/auth/roles'
import {clientNavigate} from './app/navigation'
import AdminWorkspace from './features/admin/AdminWorkspace'
import './admin.css'

const getReadableError = (error, fallback = 'Không thể hoàn tất thao tác') => {
  if (!error) return fallback
  if (error.message?.includes('relation') || error.code === '42P01') return 'Chưa khởi tạo bảng site_images trên Supabase Dortis.'
  if (error.message?.includes('row-level security') || error.code === '42501') return 'Phiên đăng nhập chưa có quyền ghi. Hãy đăng xuất và đăng nhập lại để cập nhật quyền admin (RLS).'
  return error.message || fallback
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
      const isAdmin = canManageContent(data.user)
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
    if (busy) return
    setBusy(true)
    try {
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) throw signOutError
      setAuthorized(false)
      setUser(null)
      // Replace the private route so Back does not reopen the admin screen.
      clientNavigate('/',{replace:true})
    } catch (err) {
      setError('Không thể đăng xuất. Vui lòng thử lại.')
      setBusy(false)
    }
  }

  // Admin is a dedicated workspace. Its Media tabs provide the only top navigation,
  // so there is no fixed public header or reserved empty space above the editor.
  const withHeader = content => <div className="dortis-admin-shell">{content}</div>

  if (checking) return withHeader(<main className="admin-auth"><p>Đang xác thực quyền quản trị...</p></main>)
  if (!supabase) return withHeader(<main className="admin-auth"><div className="admin-login"><span>DORTIS / ADMIN</span><h1>Chưa kết nối Supabase.</h1><p>Thiếu <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> trong môi trường frontend.</p><a href="/">← Trang chủ</a></div></main>)
  if (user && !authorized) return withHeader(<main className="admin-auth"><div className="admin-login"><span>DORTIS / ADMIN</span><h1>Không có quyền quản trị.</h1><p>Tài khoản hiện tại chưa được cấp vai trò admin trong Supabase Auth. Không thể chỉnh sửa ảnh.</p><button onClick={signOut}>Đăng xuất</button></div></main>)
  if (authorized) return withHeader(<AdminWorkspace user={user} supabase={supabase} onSignOut={signOut}/>)
  return withHeader(<main className="admin-auth"><form className="admin-login" onSubmit={signIn}>
    <a href="/" className="admin-back">← TRỞ VỀ TRANG CHỦ</a><span>DORTIS / PRIVATE ACCESS</span><h1>Quản trị<br/><em>Dortis.</em></h1>
    <p>Đăng nhập để chỉnh sửa hình ảnh trang chủ và hồ sơ dự án.</p>
    <label>TÀI KHOẢN ADMIN<input type="text" required autoComplete="username" value={loginName} placeholder="admin" onChange={e=>setLoginName(e.target.value)}/></label>
    <label>MẬT KHẨU<input type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Nhập mật khẩu"/></label>
    {error && <p role="alert" className="admin-auth-error">{error}</p>}
    <button disabled={busy || !loginName} type="submit">{busy ? 'ĐANG ĐĂNG NHẬP...' : 'ĐĂNG NHẬP →'}</button>
    <small>Tài khoản “admin” được ánh xạ sang email đã khai báo trong môi trường Supabase. Bạn cũng có thể nhập email trực tiếp. Mật khẩu không lưu trong mã nguồn.</small>
  </form></main>)
}
