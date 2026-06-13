import { useCallback, useEffect, useRef, useState } from 'react'
import { pdfObjectUrl, previewObjectUrl } from '../api'

/**
 * Loads the generated PDF + preview image through authenticated fetches and
 * exposes them as object URLs (browsers can't attach the auth header to plain
 * <img>/<a> requests). Revokes the URLs on replacement and unmount.
 */
export function useResumeArtifacts() {
  const [previewSrc, setPreviewSrc] = useState(null)
  const [pdfHref, setPdfHref] = useState(null)
  const urls = useRef([])

  const remember = (url) => {
    urls.current.push(url)
    return url
  }

  useEffect(
    () => () => {
      urls.current.forEach(URL.revokeObjectURL)
      urls.current = []
    },
    [],
  )

  const load = useCallback(async (variant = 'master') => {
    const [preview, pdf] = await Promise.all([
      previewObjectUrl(variant),
      pdfObjectUrl(variant),
    ])
    setPreviewSrc(remember(preview))
    setPdfHref(remember(pdf))
  }, [])

  const reset = useCallback(() => {
    setPreviewSrc(null)
    setPdfHref(null)
  }, [])

  return { previewSrc, pdfHref, load, reset }
}
