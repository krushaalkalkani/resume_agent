/** Match backend `src/pdf_filename.py` for client-side download hints. */
export function resumePdfFilename(profile = {}) {
  const slug = (s) =>
    (s || '')
      .trim()
      .replace(/[^\w\-]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')

  const first = slug(profile.first_name)
  const last = slug(profile.last_name)
  if (first && last) return `${first}_${last}_Resume.pdf`
  if (first) return `${first}_Resume.pdf`
  if (last) return `${last}_Resume.pdf`
  return 'Resume.pdf'
}
