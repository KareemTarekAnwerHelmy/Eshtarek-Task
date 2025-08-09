import { useEffect, useState } from 'react'
import api from '../api/client'
import { useToast } from '../components/ToastProvider'

export default function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [subs, setSubs] = useState([])
  const [selectedSub, setSelectedSub] = useState('')
  const toast = useToast()

  const load = async () => {
    try {
      const [i, s] = await Promise.all([
        api.get('/billing/'),
        api.get('/subscriptions/'),
      ])
      setInvoices(i.data)
      setSubs(s.data)
      if (!selectedSub && s.data.length > 0) setSelectedSub(s.data[0].id)
    } catch (e) {
      toast.error('Failed to load invoices')
    }
  }
  useEffect(() => { load() }, [])

  const createInvoice = async () => {
    if (!selectedSub) return
    try {
      await api.post('/billing/', { subscription: selectedSub })
      toast.success('Invoice created')
      load()
    } catch (e) { toast.error('Create failed') }
  }

  const payInvoice = async (id) => {
    try {
      await api.post(`/billing/${id}/pay/`)
      toast.success('Payment completed')
      load()
    } catch(e) { toast.error('Payment failed') }
  }

  return (
    <div className="container">
      <div className="card">
        <h1 className="page">Invoices</h1>
        <div className="row">
          <select value={selectedSub} onChange={e=>setSelectedSub(e.target.value)}>
            {subs.map(s => <option key={s.id} value={s.id}>{s.id} - {s.plan} ({s.status})</option>)}
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