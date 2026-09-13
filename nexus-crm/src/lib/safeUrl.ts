export function externalWebUrl(value: string | null | undefined): string | null {
  if (!value?.trim()) return null
  try {
    const normalized = value.trim()
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(normalized) ? normalized : `https://${normalized}`)
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null
  } catch { return null }
}

export function sameOriginImage(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  try {
    const url = new URL(value, window.location.origin)
    return url.origin === window.location.origin && ['https:', 'http:'].includes(url.protocol) ? url.href : undefined
  } catch { return undefined }
}
