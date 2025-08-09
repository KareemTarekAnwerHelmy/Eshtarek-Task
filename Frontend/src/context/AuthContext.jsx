import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../api/client'
import { isAuthed } from '../auth/auth'

const AuthContext = createContext({ me: null, isAdmin: false, loading: true })

export function AuthProvider({ children }) {
  const [me, setMe] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    setLoading(true)
    try {
      if (!isAuthed()) {
        setMe(null)
        setIsAdmin(false)
        setLoading(false)
        return
      }
      const [meRes, tenantsRes] = await Promise.allSettled([
        api.get('/accounts/me/'),
        api.get('/tenants/'), // will only succeed for platform admin
      ])
      if (meRes.status === 'fulfilled') setMe(meRes.value.data)
      setIsAdmin(tenantsRes.status === 'fulfilled')
    } catch (_) {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  const value = useMemo(() => ({ me, isAdmin, loading, refresh }), [me, isAdmin, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
