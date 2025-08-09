import { useEffect, useState } from 'react'
import api from '../api/client'

export default function Subscriptions() {
  const [items, setItems] = useState([])
  const [plans, setPlans] = useState([])

  useEffect(() => {
    // fetch subscriptions (tenant-scoped)
    api.get('/subscriptions/').then(r => setItems(r.data))
    // fetch plans to map id -> name
    api.get('/plans/').then(r => setPlans(r.data))
  }, [])

  const planName = (planId) => plans.find(p => p.id === planId)?.name || planId

  const [updating, setUpdating] = useState(null) // subscription id being updated
  const changePlan = async (subId, newPlanId) => {
    if (!newPlanId) return
    setUpdating(subId)
    try {
      await api.post(`/subscriptions/${subId}/change_plan/`, { plan: newPlanId })
      // reload subscriptions
      const [s, p] = await Promise.all([
        api.get('/subscriptions/'),
        api.get('/plans/'),
      ])
      setItems(s.data)
      setPlans(p.data)
    } catch (e) {
      console.error(e)
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h1 className="page">Subscriptions</h1>
        <ul className="list">
          {items.map(s => (
            <li key={s.id}>
              <div>
                <div style={{fontWeight:600}}>{planName(s.plan)}</div>
                <div className="muted">ID: {s.id}</div>
              </div>
              <div className="row">
                <span className="status">{s.status}</span>
                <select
                  value={s.plan}
                  onChange={(e)=>changePlan(s.id, e.target.value)}
                  disabled={updating === s.id}
                >
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}