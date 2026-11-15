import { useEffect, useState } from 'react'
import { supabase } from '../../../infrastructure/supabase/client'

/** Public read model, detached from the Admin feature. */
export function useSiteImages() {
  const [siteImages, setSiteImages] = useState({})
  const [siteGalleries, setSiteGalleries] = useState({})
  const [siteOpacities, setSiteOpacities] = useState({})
  const [mediaReady, setMediaReady] = useState(false)

  useEffect(() => {
    if (!supabase) { setMediaReady(true); return }
    let active = true
    const read = async () => {
      const [primary, gallery] = await Promise.all([
        supabase.from('site_images').select('slot,image_url,opacity_percent'),
        supabase.from('site_image_gallery')
          .select('slot,image_url,opacity_percent,position,created_at')
          .order('position').order('created_at')
      ])
      if (!active) return
      if (!primary.error) {
        setSiteImages(Object.fromEntries((primary.data || []).map(item => [item.slot, item.image_url])))
      }
      if (!gallery.error) {
        const groups = {}
        for (const item of gallery.data || []) (groups[item.slot] ??= []).push(item.image_url)
        setSiteGalleries(groups)
      }
      if (!primary.error && !gallery.error) {
        const rows = [...(primary.data || []), ...(gallery.data || [])]
        setSiteOpacities(Object.fromEntries(rows
          .filter(item => item.image_url && item.opacity_percent != null)
          .map(item => [item.image_url, Number(item.opacity_percent)])))
      }
      setMediaReady(true)
    }
    read()
    const channel = supabase.channel('dortis-public-media-updates')
      .on('postgres_changes', {event:'*',schema:'public',table:'site_images'}, read)
      .on('postgres_changes', {event:'*',schema:'public',table:'site_image_gallery'}, read)
      .subscribe()
    return () => { active = false; supabase.removeChannel(channel) }
  }, [])

  return {siteImages, siteGalleries, siteOpacities, mediaReady}
}
