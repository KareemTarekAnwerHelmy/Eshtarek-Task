import { useEffect, useState } from 'react'
import api from '../api/client'
import { useToast } from '../components/ToastProvider.jsx'
import { isAuthed } from '../auth/auth'

export default function Register() {
  const [form, setForm] = useState({ username:'', email:'', password:'', tenant_id:'', role:'TENANT_USER' })
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  const [tenants, setTenants] = useState([])
  const [useTenantDropdown, setUseTenantDropdown] = useState(false)

  useEffect(() => {
    // If already authenticated (platform admin), try to load tenants.
    // Tenants endpoint is admin-only; if unauthorized/forbidden, silently fallback to UUID field.
    async function loadTenants() {
      if (!isAuthed()) return
      try {
        const res = await api.get('/tenants/')
        if (Array.isArray(res.data) && res.data.length > 0) {
          setTenants(res.data)
          setUseTenantDropdown(true)
          setForm(f => ({ ...f, tenant_id: res.data[0].id }))
        }
      } catch (_) {
        // ignore; non-admin or not allowed
      }
    }
    loadTenants()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isUuid = (v) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(v)

  const submit = async (e) => {
    e.preventDefault()
    setMsg('')
    if (!form.username || !form.email || !form.password) {
      toast.error('Please fill all fields')
      return
    }
    if (!useTenantDropdown) {
      if (!form.tenant_id) {
        toast.error('Please enter Tenant UUID')
        return
      }
      if (!isUuid(form.tenant_id)) {
        toast.error('Invalid Tenant UUID format')
        return
      }
    }
    setLoading(true)
    try {
      await api.post('/accounts/register/', form)
      setMsg('Registered. You can login now.')
      toast.success('Registration successful')
      setTimeout(() => { window.location.href = '/login' }, 500)
    } catch (err) {
      const data = err?.response?.data
      let detail = 'Registration failed'
      if (typeof data === 'string') detail = data
      else if (data?.detail) detail = data.detail
      else if (data) {
        // collect DRF serializer field errors
        const parts = []
        Object.entries(data).forEach(([k, v]) => {
          if (Array.isArray(v)) parts.push(`${k}: ${v.join(', ')}`)
          else if (typeof v === 'string') parts.push(`${k}: ${v}`)
        })
        if (parts.length) detail = parts.join(' | ')
      }
      toast.error(detail)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h1 className="page">Create your account</h1>
        <form className="form" onSubmit={submit}>
          <input placeholder="Username" value={form.username} onChange={e=>setForm({...form, username:e.target.value})}/>
          <input placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})}/>
          <input type="password" placeholder="Password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})}/>
          {useTenantDropdown ? (
            <select value={form.tenant_id} onChange={e=>setForm({...form, tenant_id:e.target.value})}>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
              ))}
            </select>
          ) : (
            <input placeholder="Tenant UUID" value={form.tenant_id} onChange={e=>setForm({...form, tenant_id:e.target.value})}/>
          )}
          <select value={form.role} onChange={e=>setForm({...form, role:e.target.value})}>
            <option>TENANT_USER</option>
            <option>TENANT_ADMIN</option>
          </select>
          <div className="actions">
            <button type="submit" disabled={loading}>Register</button>
          </div>
          {msg && <div className="muted">{msg}</div>}
        </form>
      </div>
    </div>
  )
}