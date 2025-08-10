import { useEffect, useState } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ToastProvider'
import { isAuthed } from '../auth/auth'

export default function Home() {
  const { isAdmin } = useAuth()
  const [me, setMe] = useState(null)
  const [subs, setSubs] = useState([])
  const [plans, setPlans] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  const load = async () => {
    setLoading(true)
    try {
      const [meR, subsR, plansR, invR] = await Promise.all([
        api.get('/accounts/me/'),
        api.get('/subscriptions/'),
        api.get('/plans/'),
        api.get('/billing/'),
      ])
      setMe(meR.data)
      setSubs(subsR.data)
      setPlans(plansR.data)
      setInvoices(invR.data)
    } catch (e) {
      const status = e?.response?.status
      if (status !== 401 && status !== 403) toast.error('Failed to load home data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthed()) {
      load()
    } else {
      setLoading(false)
    }
  }, [])

  const planById = (id) => plans.find(p => p.id === id)

  // Public home (not logged in)
  if (!isAuthed()) {
    return (
      <div className="container">
        <div className="card">
          <h1 className="page">Welcome to Eshtarek</h1>
          <p className="muted">Multi-tenant subscriptions made simple. Sign in to view your dashboard.</p>
          <div className="row" style={{marginTop:8}}>
            <a className="badge" href="/plans">Browse Plans</a>
            <a className="badge" href="/login" style={{marginLeft:8}}>Login</a>
            <a className="badge" href="/register" style={{marginLeft:8}}>Register</a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="card">
        <h1 className="page">Welcome {me?.user?.username ? `· ${me.user.username}` : ''}</h1>
        <div className="muted">Tenant: {me?.tenant?.name || me?.tenant?.id || '—'}</div>
      </div>

      <div style={{height:12}} />

      <div className="card">
        <h2>Your Subscriptions</h2>
        {loading ? <div className="muted">Loading...</div> : (
          subs.length === 0 ? <div className="muted">No subscriptions yet.</div> : (
            <ul className="list">
              {subs.map(s => {
                const p = planById(s.plan)
                const price = p ? `$${(p.price_cents/100).toFixed(2)}` : '—'
                return (
                  <li key={s.id}>
                    <div>
                      <div style={{fontWeight:600}}>#{s.id} · {p?.name || `Plan ${s.plan}`}</div>
                      <div className="muted">Status: {s.status}</div>
                    </div>
                    <div className="row">
                      <span className="price">{price}</span>
                      <a className="badge" href="/subscriptions" style={{marginLeft:8}}>Manage</a>
                    </div>
                  </li>
                )
              })}
            </ul>
          )
        )}
      </div>

      <div style={{height:12}} />

      <div className="card">
        <h2>Recent Invoices</h2>
        {loading ? <div className="muted">Loading...</div> : (
          invoices.length === 0 ? <div className="muted">No invoices yet.</div> : (
            <ul className="list">
              {invoices.slice(0,5).map(inv => (
                <li key={inv.id}>
                  <div>
                    <div style={{fontWeight:600}}>#{inv.id}</div>
                    <div className="muted">{String(inv.status || '').toUpperCase()}</div>
                  </div>
                  <div className="row">
                    <span className="price">${(inv.amount_cents/100).toFixed(2)}</span>
                    <a className="badge" href="/invoices" style={{marginLeft:8}}>View</a>
                  </div>
                </li>
              ))}
            </ul>
          )
        )}
      </div>

      <div style={{height:12}} />

      <div className="card">
        <h2>Quick Actions</h2>
        <div className="row">
          <a className="badge" href="/plans">Browse Plans</a>
          <a className="badge" href="/subscriptions" style={{marginLeft:8}}>Manage Subscriptions</a>
          <a className="badge" href="/invoices" style={{marginLeft:8}}>View Invoices</a>
          {isAdmin && (
            <>
              <a className="badge" href="/admin/plans" style={{marginLeft:8}}>Admin: Plans</a>
              <a className="badge" href="/admin/subscriptions" style={{marginLeft:8}}>Admin: Subscriptions</a>
              <a className="badge" href="/admin/tenants" style={{marginLeft:8}}>Admin: Tenants</a>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
