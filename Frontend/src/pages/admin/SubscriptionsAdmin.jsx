import { useEffect, useState } from 'react'
import api from '../../api/client'
import { useToast } from '../../components/ToastProvider.jsx'
import formatError from '../../utils/formatError'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'trialing', label: 'Trialing' },
  { value: 'incomplete', label: 'Incomplete' },
  { value: 'past_due', label: 'Past Due' },
  { value: 'canceled', label: 'Canceled' },
]

 

export default function SubscriptionsAdmin() {
  const [tenants, setTenants] = useState([])
  const [plans, setPlans] = useState([])
  const [subs, setSubs] = useState([])
  const [form, setForm] = useState({ tenant: '', plan: '', status: 'active' })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const toast = useToast()
  const [changing, setChanging] = useState(null) // subId being plan-changed
  const [changingStatus, setChangingStatus] = useState(null) // subId being status-changed

  const loadAll = async () => {
    setLoading(true)
    try {
      const [t, p, s] = await Promise.all([
        api.get('/tenants/'),
        api.get('/plans/'),
        api.get('/subscriptions/'),
      ])
      setTenants(t.data)
      setPlans(p.data)
      setSubs(s.data)
      if (!form.tenant && t.data.length) setForm(f => ({ ...f, tenant: t.data[0].id }))
      if (!form.plan && p.data.length) setForm(f => ({ ...f, plan: p.data[0].id }))
      if (!form.status) setForm(f => ({ ...f, status: STATUS_OPTIONS[0].value }))
    } catch (e) {
      console.error(e)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const changeStatus = async (id, newStatus) => {
    if (!newStatus) return
    setChangingStatus(id)
    try {
      await api.post(`/subscriptions/${id}/change-status/`, { status: newStatus })
      toast.success('Status changed')
      setSubs(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s))
    } catch (e) {
      console.error(e)
      toast.error(formatError(e, 'Failed to change status'))
    } finally {
      setChangingStatus(null)
    }
  }

  const changePlan = async (id, newPlanId) => {
    if (!newPlanId) return
    setChanging(id)
    try {
      await api.post(`/subscriptions/${id}/change-plan/`, { plan: newPlanId })
      toast.success('Plan changed')
      // update locally
      setSubs(prev => prev.map(s => s.id === id ? { ...s, plan: newPlanId } : s))
    } catch (e) {
      console.error(e)
      toast.error(formatError(e, 'Failed to change plan'))
    } finally {
      setChanging(null)
    }
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const createSubscription = async (e) => {
    e.preventDefault()
    if (!form.tenant || !form.plan) return toast.error('Please select tenant and plan')
    setSubmitting(true)
    try {
      const payload = { tenant: form.tenant, plan: form.plan }
      if (form.status) payload.status = form.status
      await api.post('/subscriptions/', payload)
      toast.success('Subscription created')
      setForm({ tenant: form.tenant, plan: form.plan, status: form.status || 'active' })
      await loadAll()
    } catch (e) {
      console.error(e)
      toast.error(formatError(e, 'Failed to create subscription'))
    } finally {
      setSubmitting(false)
    }
  }

  const deleteSubscription = async (id) => {
    if (!confirm('Delete this subscription?')) return
    try {
      await api.delete(`/subscriptions/${id}/`)
      toast.success('Subscription deleted')
      setSubs(prev => prev.filter(x => x.id !== id))
    } catch (e) {
      console.error(e)
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h2>Admin: Subscriptions</h2>
        {loading ? (
          <div className="muted">Loading...</div>
        ) : (
          <>
            <form onSubmit={createSubscription} className="row" style={{gap:8, alignItems:'center', marginBottom:16}}>
              <label>
                <span className="muted" style={{display:'block'}}>Tenant</span>
                <select value={form.tenant} onChange={e=>setForm({...form, tenant:e.target.value})}>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.name || t.id}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="muted" style={{display:'block'}}>Plan</span>
                <select value={form.plan} onChange={e=>setForm({...form, plan:e.target.value})}>
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="muted" style={{display:'block'}}>Initial Status</span>
                <select value={form.status} onChange={e=>setForm({...form, status:e.target.value})}>
                  {STATUS_OPTIONS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </label>
              <button type="submit" disabled={submitting}>Create Subscription</button>
            </form>

            <h3 style={{marginTop:8}}>Existing Subscriptions</h3>
            <ul className="list">
              {subs.map(s => (
                <li key={s.id}>
                  <div>
                    <div style={{fontWeight:600}}>ID: {s.id}</div>
                    <div className="muted">Plan: {plans.find(p => p.id === s.plan)?.name || s.plan}</div>
                    <div className="muted">Tenant: {tenants.find(t => t.id === s.tenant)?.name || s.tenant}</div>
                  </div>
                  <div className="row">
                    <select
                      value={s.status}
                      onChange={(e)=>changeStatus(s.id, e.target.value)}
                      disabled={changingStatus === s.id}
                    >
                      {STATUS_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <select
                      value={s.plan}
                      onChange={(e)=>changePlan(s.id, e.target.value)}
                      disabled={changing === s.id}
                      style={{marginLeft:8}}
                    >
                      {plans.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <button onClick={()=>deleteSubscription(s.id)} style={{marginLeft:8}}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
