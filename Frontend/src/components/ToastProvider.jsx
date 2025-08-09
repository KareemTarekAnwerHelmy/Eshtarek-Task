import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ToastContext = createContext({ success: () => {}, error: () => {} })

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const push = useCallback((type, message) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t, { id, type, message }])
    setTimeout(() => remove(id), 3000)
  }, [remove])

  const api = useMemo(() => ({
    success: (msg) => push('success', msg),
    error: (msg) => push('error', msg),
  }), [push])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div style={{ position: 'fixed', top: 12, right: 12, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 1000 }}>
        {toasts.map((t) => (
          <div key={t.id} style={{ padding: '10px 14px', borderRadius: 6, color: '#fff', background: t.type === 'success' ? '#16a34a' : '#dc2626', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
