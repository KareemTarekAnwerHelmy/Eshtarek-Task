import { useEffect, useState } from 'react'
import api from '../api/client'

export default function Plans() {
  const [plans, setPlans] = useState([])
  useEffect(() => { api.get('/plans/').then(r=>setPlans(r.data)) }, [])
  return (
    <div className="container">
      <div className="card">
        <h1 className="page">Plans</h1>
        <ul className="list">
          {plans.map(p => (
            <li key={p.id}>
              <div>
                <div style={{fontWeight:600}}>{p.name}</div>
                <div className="muted">{p.interval}</div>
              </div>
              <div className="price">${(p.price_cents/100).toFixed(2)}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}