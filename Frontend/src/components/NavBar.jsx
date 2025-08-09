import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useEffect, useState } from 'react'
import { isAuthed, logout } from '../auth/auth'
import api from '../api/client'
import { useToast } from './ToastProvider.jsx'

export default function NavBar() {
  const { isAdmin } = useAuth()
  const [me, setMe] = useState(null)
  const toast = useToast()

  useEffect(() => {
    let active = true
    if (isAuthed()) {
      api.get('/accounts/me/')
        .then(r => { if (active) setMe(r.data) })
        .catch(() => { /* silent */ })
    } else {
      setMe(null)
    }
    return () => { active = false }
  }, [isAuthed()])

  return (
    <div className="nav">
      <div className="inner">
        <Link to="/">Home</Link>
        <Link to="/plans">Plans</Link>
        {isAuthed() && (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/subscriptions">Subscriptions</Link>
            <Link to="/invoices">Invoices</Link>
            {isAdmin && (
              <>
                <Link to="/admin/plans">Admin: Plans</Link>
                <Link to="/admin/tenants">Admin: Tenants</Link>
              </>
            )}
            <div className="spacer" />
            <span className="badge">
              {me ? `User: ${me.user?.username || ''} · Tenant: ${me.tenant?.name || me.tenant?.id || ''}` : '...'}
            </span>
            <button onClick={logout} style={{ marginLeft: 12 }}>Logout</button>
          </>
        )}
        {!isAuthed() && (
          <span className="spacer" />
        )}
        {!isAuthed() && (
          <>
            <Link to="/login">Login</Link>
            <span style={{opacity:.6}}>&nbsp;|&nbsp;</span>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </div>
  )
}
