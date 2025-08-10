export default function formatError(e, fallback = 'Action failed') {
  const d = e?.response?.data
  if (!d) return fallback
  if (typeof d === 'string') return d
  if (Array.isArray(d)) return d.join(', ')
  try {
    const parts = []
    for (const [k, v] of Object.entries(d)) {
      const label = k === 'non_field_errors' ? '' : `${k}: `
      if (Array.isArray(v)) parts.push(label + v.join(', '))
      else if (typeof v === 'string') parts.push(label + v)
      else parts.push(label + JSON.stringify(v))
    }
    return parts.join(' • ')
  } catch {
    return fallback
  }
}
