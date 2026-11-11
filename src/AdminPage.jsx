import React, { useCallback, useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import './admin.css'

const API_URL = (import.meta.env.VITE_SUPABASE_URL || 'https://whkqdusoowrrhtvejrie.supabase.co').replace(/\/+$/, '')
const API_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''
const ADMIN_EMAIL = import.meta.env.VITE_DORTIS_ADMIN_EMAIL || ''
const MAX_BYTES = 5 * 1024 * 1024
const SLOTS = [
  { id: 'hero', title: 'Ảnh nền Hero', note: 'Ảnh trang đầu, ưu tiên ảnh ngang' },
  { id: 'service-cv', title: 'Dịch vụ · CV & Portfolio' },
  { id: 'service-brand', title: 'Dịch vụ · Thương hiệu cá nhân' },
  { id: 'service-visual', title: 'Dịch vụ · Thiết kế truyền thông' },
  { id: 'service-web', title: 'Dịch vụ · Website nghệ sĩ' },
  { id: 'project-approved-01', title: 'Dự án công khai · Mục 01 (chờ duyệt)' },
  { id: 'project-approved-02', title: 'Dự án công khai · Mục 02 (chờ duyệt)' },
  { id: 'project-approved-03', title: 'Dự án công khai · Mục 03 (chờ duyệt)' },
  { id: 'about', title: 'Giới thiệu · Triết lý Dortis' },
  { id: 'contact', title: 'Liên hệ · Nền cuối trang' },
]
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
  const [siteImages, setSiteImages] = useState({})
  const [mediaReady, setMediaReady] = useState(false)
  useEffect(() => {
    if (!supabase) { setMediaReady(true); return }
    let alive = true
    async function read() {
      const { data, error } = await supabase.from('site_images').select('slot,image_url')
      if (!error && alive) setSiteImages(Object.fromEntries((data || []).map(x => [x.slot, x.image_url])))
      if (alive) setMediaReady(true)
    }
    read()
    const subscription = supabase.channel('dortis-site-image-events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_images' }, read)
      .subscribe()
    return () => { alive = false; supabase.removeChannel(subscription) }
  }, [])
  return { siteImages, mediaReady }
}

function ImageEditor({ user, signOut }) {
  const [images, setImages] = useState({})
  const [pending, setPending] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const reload = useCallback(async () => {
    const { data, error } = await supabase.from('site_images').select('slot,image_url,storage_path')
    if (error) { setError(getReadableError(error)); return }
    setImages(Object.fromEntries((data || []).map(item => [item.slot, item])))
  }, [])
  useEffect(() => { reload() }, [reload, refreshKey])

  async function upload(slot, file) {
    if (!file) return
    if (!file.type.startsWith('image/') || !['image/jpeg','image/png','image/webp','image/avif'].includes(file.type)) {
      setError('Chỉ hỗ trợ JPG, PNG, WebP hoặc AVIF.'); return
    }
    if (file.size > MAX_BYTES) { setError('Ảnh tối đa 5 MB. Vui lòng nén trước khi tải lên.'); return }
    setPending(slot); setError(''); setMessage('')
    const suffix = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' }[file.type]
    const path = slot + '/' + crypto.randomUUID() + '.' + suffix
    try {
      const { error: uploadError } = await supabase.storage.from('dortis-media').upload(path, file, { contentType: file.type, cacheControl: '3600', upsert: false })
      if (uploadError) throw uploadError
      const { data: urlData } = supabase.storage.from('dortis-media').getPublicUrl(path)
      const { error: saveError } = await supabase.from('site_images').upsert({
        slot, image_url: urlData.publicUrl, storage_path: path, updated_by: user.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'slot' })
      if (saveError) {
        await supabase.storage.from('dortis-media').remove([path])
        throw saveError
      }
      const previous = images[slot]?.storage_path
      if (previous && previous !== path) {
        const { error: deleteError } = await supabase.storage.from('dortis-media').remove([previous])
        if (deleteError) console.warn('Dortis: could not remove old stored image', deleteError.message)
      }
      setMessage('Đã cập nhật ảnh: ' + (SLOTS.find(s => s.id === slot)?.title || slot))
      setRefreshKey(i => i + 1)
    } catch (e) { setError(getReadableError(e, 'Không thể tải ảnh lên.')) }
    finally { setPending('') }
  }

  async function remove(slot) {
    setPending(slot); setError(''); setMessage('')
    const previous = images[slot]?.storage_path
    const { error: dbError } = await supabase.from('site_images').upsert({ slot, image_url: null, storage_path: null, updated_by: user.id, updated_at: new Date().toISOString() }, { onConflict: 'slot' })
    if (dbError) setError(getReadableError(dbError, 'Không thể xóa ảnh'))
    else {
      if (previous) {
        const { error: storageError } = await supabase.storage.from('dortis-media').remove([previous])
        if (storageError) setError('Đã gỡ ảnh khỏi trang nhưng chưa xóa được file trong Storage.')
      }
      setMessage('Đã gỡ ảnh khỏi mục đã chọn.')
      setRefreshKey(n => n + 1)
    }
    setConfirmDelete(null); setPending('')
  }

  return <div className="admin-dashboard">
    <div className="admin-topline"><a href="/" className="admin-home">← TRANG CHỦ DORTIS</a><button type="button" onClick={signOut}>ĐĂNG XUẤT ↗</button></div>
    <header className="admin-intro"><span>DORTIS / ADMIN</span><h1>Quản lý hình ảnh.</h1><p>Thay hoặc gỡ ảnh theo từng mục. Chỉ đăng hình được phép công bố; ảnh dự án chờ duyệt không tự động xuất hiện trên Home Page.</p></header>
    {error && <p className="admin-alert error" role="alert">{error}</p>}
    {message && <p className="admin-alert success" role="status">{message}</p>}
    <div className="admin-grid">{SLOTS.map(slot => { const currentImage = images[slot.id]?.image_url || null; return <article key={slot.id} className="admin-slot">
      <div className="admin-thumb">{currentImage ?
        <img src={currentImage} alt={'Ảnh của ' + slot.title} /> :
        <span className="admin-empty"><b>DT</b><small>CHƯA CÓ ẢNH TÙY CHỈNH</small></span>}</div>
      <div className="admin-slot-body"><h2>{slot.title}</h2><p>{slot.note || 'Ảnh thay đổi riêng cho khu vực này.'}</p>
        <div className="admin-slot-actions"><label className={'admin-upload ' + (pending ? 'disabled' : '')}>
          <input type="file" accept="image/png,image/jpeg,image/webp,image/avif" disabled={!!pending} onChange={e => { const file=e.target.files?.[0];e.target.value='';upload(slot.id,file) }}/>
          {pending === slot.id ? 'ĐANG LƯU...' : 'THAY / TẢI ẢNH'}
        </label>
        <button type="button" disabled={!!pending} onClick={() => setConfirmDelete(slot.id)}>GỠ ẢNH</button></div>
      </div>
    </article> })}</div>
    {confirmDelete && <div className="admin-confirm-backdrop"><section className="admin-confirm" role="dialog" aria-modal="true" aria-label="Xác nhận gỡ ảnh"><h2>Gỡ ảnh đã chọn?</h2><p>Ảnh sẽ không còn hiển thị tại mục này. Dữ liệu gốc của các PDF dự án vẫn giữ nguyên.</p><div><button type="button" onClick={() => setConfirmDelete(null)}>HỦY</button><button type="button" onClick={() => remove(confirmDelete)}>GỠ ẢNH</button></div></section></div>}
  </div>
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
  if (authorized) return <ImageEditor user={user} signOut={signOut}/>
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
