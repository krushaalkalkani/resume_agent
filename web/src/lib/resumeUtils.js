/** True when the user has no meaningful resume content yet. */
export function isResumeEmpty(resume) {
  if (!resume) return true

  const sections = ['education', 'experience', 'projects', 'skills', 'certifications', 'leadership']
  const hasSections = sections.some((key) => (resume[key] || []).length > 0)

  const profile = resume.profile || {}
  const hasProfile = Boolean(
    profile.first_name?.trim()
    || profile.last_name?.trim()
    || profile.email?.trim()
    || profile.summary?.trim(),
  )

  return !hasSections && !hasProfile
}
