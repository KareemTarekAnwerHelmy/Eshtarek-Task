import { useEffect, useState } from 'react'
import api from '../api/client'
import { useToast } from '../components/ToastProvider'
import formatError from '../utils/formatError'

export default function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [subs, setSubs] = useState([])
  const [plans, setPlans] = useState([])
  const [selectedSub, setSelectedSub] = useState('')
  const toast = useToast()

  const load = async () => {
    try {
      const [i, s, p] = await Promise.all([
        api.get('/billing/'),
        api.get('/subscriptions/'),
        api.get('/plans/'),
      ])
      setInvoices(i.data)
      setSubs(s.data)
      setPlans(p.data)
      if (!selectedSub && s.data.length > 0) setSelectedSub(s.data[0].id)
    } catch (e) {
      toast.error(formatError(e, 'Failed to load invoices'))
    }
  }
  useEffect(() => { load() }, [])

  const createInvoice = async () => {
    if (!selectedSub) return
    try {
      await api.post('/billing/', { subscription: selectedSub })
      toast.success('Invoice created')
      load()
    } catch (e) { toast.error(formatError(e, 'Create failed')) }
  }

  const payInvoice = async (id) => {
    try {
      await api.post(`/billing/${id}/pay/`)
      toast.success('Payment completed')
      load()
    } catch(e) { toast.error(formatError(e, 'Payment failed')) }
  }

  return (
    <div className="container">
      <div className="card">
        <h1 className="page">Invoices</h1>
        <div className="row">
          <select value={selectedSub} onChange={e=>setSelectedSub(e.target.value)}>
            {subs.map(s => {
              const plan = plans.find(p=>p.id===s.plan)
              const label = plan ? `${s.id} · ${plan.name} · $${(plan.price_cents/100).toFixed(2)} (${s.status})` : `${s.id} · plan ${s.plan} (${s.status})`
              return <option key={s.id} value={s.id}>{label}</option>
            })}
          </select>
          <button onClick={createInvoice} disabled={!selectedSub}>Create Invoice</button>
        </div>
      </div>

      <div style={{height:12}} />

      <div className="card">
        <h2>All Invoices</h2>
        <ul className="list">
          {invoices.map(inv => (
            <li key={inv.id}>
              <div>
                <div style={{fontWeight:600}}>#{inv.id}</div>
                <div className="muted">{inv.status.toUpperCase()}</div>
              </div>
              <div className="row">
                <span className="price">${(inv.amount_cents/100).toFixed(2)}</span>
                {String(inv.status).toLowerCase() !== 'paid' && (
                  <button onClick={()=>payInvoice(inv.id)} style={{marginLeft:8}}>Pay</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}