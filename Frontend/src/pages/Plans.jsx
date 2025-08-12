import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useToast } from '../components/ToastProvider'
import formatError from '../utils/formatError'

export default function Plans() {
  const [plans, setPlans] = useState([])
  const [subs, setSubs] = useState([])
  const toast = useToast()
  const navigate = useNavigate()
  const [payIdemKey, setPayIdemKey] = useState('')
  const [paySimulateFail, setPaySimulateFail] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [p, s] = await Promise.all([
          api.get('/plans/'),
          api.get('/subscriptions/'),
        ])
        setPlans(p.data)
        setSubs(s.data)
      } catch (e) {
        // plans is public; subscriptions require auth
        setPlans([])
      }

  const subscribeAndPay = async (planId) => {
    try {
      let subId
      if (activeSub) {
        await api.post(`/subscriptions/${activeSub.id}/change-plan/`, { plan: planId })
        toast.success('Plan changed successfully')
        subId = activeSub.id
      } else {
        const r = await api.post('/subscriptions/', { plan: planId })
        toast.success('Subscription created successfully')
        subId = r?.data?.id
      }
      if (!subId) { navigate('/subscriptions'); return }
      // Create first invoice
      const invRes = await api.post('/billing/', { subscription: subId })
      const invoiceId = invRes?.data?.id
      if (invoiceId) {
        // Pay it immediately (mock). Add an idempotency key to be safe.
        const idemHeader = payIdemKey && payIdemKey.trim().length > 0 ? payIdemKey.trim() : `subpay-${Date.now()}-${Math.random().toString(16).slice(2)}`
        const body = paySimulateFail ? { simulate: 'fail' } : {}
        await api.post(`/billing/${invoiceId}/pay/`, body, { headers: { 'Idempotency-Key': idemHeader } })
        toast.success('Invoice paid')
      } else {
        toast.error('Could not determine invoice id to pay')
      }
      navigate('/invoices')
    } catch (e) {
      toast.error(formatError(e, 'Subscribe & Pay failed'))
    }
  }
    }
    load()
  }, [])

  const activeSub = subs.find(x => String(x.status).toLowerCase() === 'active')

  const subscribeNow = async (planId) => {
    try {
      let subId
      if (activeSub) {
        await api.post(`/subscriptions/${activeSub.id}/change-plan/`, { plan: planId })
        toast.success('Plan changed successfully')
        subId = activeSub.id
      } else {
        const r = await api.post('/subscriptions/', { plan: planId })
        toast.success('Subscription created successfully')
        subId = r?.data?.id
      }
      if (subId) {
        // create first invoice for this subscription
        await api.post('/billing/', { subscription: subId })
        toast.success('First invoice created')
        navigate('/invoices')
      } else {
        navigate('/subscriptions')
      }
    } catch (e) {
      toast.error(formatError(e, 'Subscription action failed'))
    }
  }
  return (
    <div className="container">
      <div className="card">
        <h1 className="page">Plans</h1>
        <div className="row" style={{marginBottom:8}}>
          <input
            placeholder="Pay Idempotency-Key (optional)"
            value={payIdemKey}
            onChange={e=>setPayIdemKey(e.target.value)}
            style={{minWidth:280}}
          />
          <label style={{display:'flex',alignItems:'center',gap:6}}>
            <input type="checkbox" checked={paySimulateFail} onChange={e=>setPaySimulateFail(e.target.checked)} />
            Simulate failure on Subscribe & Pay
          </label>
        </div>
        <ul className="list">
          {plans.map(p => (
            <li key={p.id}>
              <div>
                <div style={{fontWeight:600}}>{p.name}</div>
                <div className="muted">{p.interval}</div>
              </div>
              <div className="row">
                <div className="price">${(p.price_cents/100).toFixed(2)}</div>
                <button style={{marginLeft:8}} onClick={() => subscribeNow(p.id)}>
                  {activeSub && activeSub.plan === p.id ? 'Current Plan' : 'Subscribe Now'}
                </button>
                {!(activeSub && activeSub.plan === p.id) && (
                  <button style={{marginLeft:8}} onClick={() => subscribeAndPay(p.id)}>
                    Subscribe & Pay
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}