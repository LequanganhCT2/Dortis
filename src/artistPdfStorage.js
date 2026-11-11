/**
 * DORTIS private PDF Storage.
 *
 * Supabase's project-wide file size limit applies even to resumable TUS
 * uploads. Store large originals byte-for-byte as private 4 MiB objects,
 * and reassemble in the admin browser for rendering/export. No compression,
 * public URL, or schema change is required.
 *
 * Legacy references are plain Storage object paths; new multipart references
 * use an explicit versioned manifest in artist_profile_sources.pdf_storage_path.
 */
export const ARTIST_PDF_BUCKET = 'dortis-artist-pdfs'
export const PRIVATE_PDF_CHUNK_SIZE = 4 * 1024 * 1024
const PARTS_PREFIX = 'dortis-pdf-parts-v1:'
const MAX_PARTS = 32

function assertPath(value) {
  if (typeof value !== 'string' ||
      !value.startsWith('artist-pdfs/') ||
      value.includes('..') ||
      value.length > 500) {
    throw new Error('Tham chiếu tệp PDF trong Storage không hợp lệ.')
  }
  return value
}

export function decodeArtistPdfSource(reference) {
  if (typeof reference !== 'string' || !reference) {
    throw new Error('Không tìm thấy tệp PDF nguồn.')
  }
  if (!reference.startsWith(PARTS_PREFIX)) {
    return { parts: [assertPath(reference)], size: null, multipart: false }
  }

  let manifest
  try {
    manifest = JSON.parse(reference.slice(PARTS_PREFIX.length))
  } catch {
    throw new Error('Thông tin các phần PDF nguồn bị lỗi.')
  }
  if (!Array.isArray(manifest?.parts) ||
      !manifest.parts.length ||
      manifest.parts.length > MAX_PARTS ||
      !Number.isSafeInteger(manifest.size) ||
      manifest.size <= 0 ||
      manifest.size > 100 * 1024 * 1024) {
    throw new Error('Thông tin PDF được chia phần không hợp lệ.')
  }
  return {
    parts: manifest.parts.map(assertPath),
    size: manifest.size,
    multipart: true,
  }
}

export function encodeArtistPdfSource(parts, byteSize) {
  if (!Array.isArray(parts) || !parts.length || parts.length > MAX_PARTS) {
    throw new Error('Số phần PDF vượt giới hạn.')
  }
  if (parts.length === 1) return assertPath(parts[0])
  if (!Number.isSafeInteger(byteSize) || byteSize <= 0) throw new Error('Dung lượng PDF không hợp lệ.')
  return PARTS_PREFIX + JSON.stringify({ size: byteSize, parts: parts.map(assertPath) })
}

/**
 * Upload parts sequentially: failures clean up already uploaded objects.
 * The pieces are deliberately octet-stream, not fabricated standalone PDFs.
 */
export async function uploadArtistPdf(supabase, file, basePath, onProgress = () => {}) {
  assertPath(basePath)
  if (!file || !Number.isSafeInteger(file.size) || file.size <= 0 ||
      file.size > 100 * 1024 * 1024) {
    throw new Error('Chỉ hỗ trợ PDF tối đa 100 MB.')
  }

  const count = Math.ceil(file.size / PRIVATE_PDF_CHUNK_SIZE)
  if (count > MAX_PARTS) throw new Error('PDF có quá nhiều phần dữ liệu.')
  const uploaded = []
  try {
    for (let index = 0; index < count; index++) {
      const start = index * PRIVATE_PDF_CHUNK_SIZE
      const stop = Math.min(file.size, start + PRIVATE_PDF_CHUNK_SIZE)
      const multipart = count > 1
      const path = multipart
        ? basePath + '.part-' + String(index + 1).padStart(3, '0') + '.bin'
        : basePath
      const contentType = multipart ? 'application/octet-stream' : 'application/pdf'
      const bytes = multipart
        ? file.slice(start, stop, contentType)
        : file
      const { error } = await supabase.storage.from(ARTIST_PDF_BUCKET).upload(path, bytes, {
        contentType,
        cacheControl: '3600',
        upsert: false,
      })
      if (error) throw error
      uploaded.push(path)
      onProgress(index + 1, count)
    }
    return {
      storageRef: encodeArtistPdfSource(uploaded, file.size),
      uploadedPaths: uploaded,
    }
  } catch (error) {
    if (uploaded.length) {
      // A failed upload should never leave incomplete private PDFs behind.
      try { await supabase.storage.from(ARTIST_PDF_BUCKET).remove(uploaded) } catch {}
    }
    throw error
  }
}

export async function downloadArtistPdf(supabase, storageRef, onProgress = () => {}) {
  const { parts, size } = decodeArtistPdfSource(storageRef)
  const chunks = []
  for (let index = 0; index < parts.length; index++) {
    const { data, error } = await supabase.storage.from(ARTIST_PDF_BUCKET).download(parts[index])
    if (error) throw error
    if (!data) throw new Error('Không đọc được phần PDF ' + (index + 1) + '.')
    chunks.push(data)
    onProgress(index + 1, parts.length)
  }
  const result = new Blob(chunks, { type: 'application/pdf' })
  if (size !== null && result.size !== size) {
    throw new Error('PDF nguồn chưa tải đủ dữ liệu. Vui lòng thử lại.')
  }
  return result
}

export async function removeArtistPdf(supabase, storageRef) {
  const { parts } = decodeArtistPdfSource(storageRef)
  return supabase.storage.from(ARTIST_PDF_BUCKET).remove(parts)
}
