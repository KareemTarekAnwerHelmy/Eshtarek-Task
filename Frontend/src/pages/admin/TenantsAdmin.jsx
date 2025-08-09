import { useEffect, useState } from 'react'
import api from '../../api/client'
import { useToast } from '../../components/ToastProvider'

export default function TenantsAdmin(){
  const [tenants, setTenants] = useState([])
  const [form, setForm] = useState({ name:'' })
  const toast = useToast()

  const load = async ()=>{
    try{ const r = await api.get('/tenants/'); setTenants(r.data) }catch(e){ toast.error('Failed to load tenants') }
  }
  useEffect(()=>{ load() },[])

  const createTenant = async (e)=>{
    e.preventDefault()
    try{ await api.post('/tenants/', form); toast.success('Tenant created'); setForm({name:''}); load() }catch(e){ toast.error('Create failed') }
  }

  return (
    <div className="container">
      <div className="card">
        <h1 className="page">Admin · Tenants</h1>
        <form className="form" onSubmit={createTenant}>
          <input placeholder="Tenant name" value={form.name} onChange={e=>setForm({name:e.target.value})} />
          <div className="actions"><button type="submit">Create Tenant</button></div>
        </form>
      </div>

      <div style={{height:12}} />

      <div className="card">
        <h2>Existing Tenants</h2>
        <ul className="list">
          {tenants.map(t => (
            <li key={t.id}>
              <div>
                <div style={{fontWeight:600}}>{t.name}</div>
                <div className="muted">{t.id}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
