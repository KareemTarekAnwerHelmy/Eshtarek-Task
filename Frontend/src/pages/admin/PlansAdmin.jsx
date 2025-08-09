import { useEffect, useState } from 'react'
import api from '../../api/client'
import { useToast } from '../../components/ToastProvider'

export default function PlansAdmin(){
  const [plans, setPlans] = useState([])
  const [form, setForm] = useState({ name:'', price_cents: '', interval:'monthly', max_users:'' })
  const toast = useToast()

  const load = async () => {
    try{ const r = await api.get('/plans/'); setPlans(r.data) }catch(e){ toast.error('Failed to load plans') }
  }
  useEffect(()=>{ load() },[])

  const createPlan = async (e)=>{
    e.preventDefault()
    try{
      const payload = { ...form, price_cents: Number(form.price_cents||0), max_users: Number(form.max_users||0) }
      await api.post('/plans/', payload)
      toast.success('Plan created')
      setForm({ name:'', price_cents:'', interval:'monthly', max_users:'' })
      load()
    }catch(err){ toast.error('Create failed') }
  }

  const updatePlan = async (id, patch)=>{
    try{ await api.put(`/plans/${id}/`, patch); toast.success('Updated'); load() }catch(e){ toast.error('Update failed') }
  }

  const deletePlan = async (id)=>{
    if(!confirm('Delete this plan?')) return
    try{ await api.delete(`/plans/${id}/`); toast.success('Deleted'); load() }catch(e){ toast.error('Delete failed') }
  }

  return (
    <div className="container">
      <div className="card">
        <h1 className="page">Admin · Plans</h1>
        <form className="form" onSubmit={createPlan}>
          <div className="row">
            <input placeholder="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
            <input placeholder="Price (cents)" value={form.price_cents} onChange={e=>setForm({...form, price_cents:e.target.value})}/>
          </div>
          <div className="row">
            <select value={form.interval} onChange={e=>setForm({...form, interval:e.target.value})}>
              <option value="monthly">monthly</option>
              <option value="yearly">yearly</option>
            </select>
            <input placeholder="Max Users" value={form.max_users} onChange={e=>setForm({...form, max_users:e.target.value})}/>
          </div>
          <div className="actions"><button type="submit">Create Plan</button></div>
        </form>
      </div>

      <div style={{height:12}} />

      <div className="card">
        <h2>Existing Plans</h2>
        <ul className="list">
          {plans.map(p=> (
            <li key={p.id}>
              <div>
                <div style={{fontWeight:600}}>{p.name}</div>
                <div className="muted">{p.interval} · Max users: {p.max_users ?? '—'}</div>
              </div>
              <div className="row">
                <span className="price">${(p.price_cents/100).toFixed(2)}</span>
                <button onClick={()=>updatePlan(p.id, {...p, price_cents: p.price_cents})}>Save</button>
                <button onClick={()=>deletePlan(p.id)} style={{background:'linear-gradient(180deg, var(--danger), #7f1d1d)'}}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
