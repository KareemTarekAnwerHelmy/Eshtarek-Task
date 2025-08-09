import { useState } from 'react'
import api from '../api/client'
import { setTokens } from '../auth/auth'
import { useToast } from '../components/ToastProvider.jsx'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const toast = useToast()

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await api.post('/auth/token/', { username, password })

      setTokens(res.data.access, res.data.refresh)
      toast.success('Logged in')
      window.location.href = '/dashboard'
    } catch (err) {
      setError('Invalid credentials')
      toast.error('Login failed')
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h1 className="page">Welcome back</h1>
        <form className="form" onSubmit={onSubmit}>
          {error && <div style={{color:'var(--danger)'}}>{error}</div>}
          <input placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} />
          <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
          <div className="actions">
            <button type="submit">Login</button>
          </div>
        </form>
      </div>
    </div>
  )
}