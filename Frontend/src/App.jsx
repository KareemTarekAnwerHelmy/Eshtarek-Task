import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Plans from './pages/Plans'
import Subscriptions from './pages/Subscriptions'
import Invoices from './pages/Invoices'
import Dashboard from './pages/Dashboard'
import { isAuthed } from './auth/auth'
import { useAuth } from './context/AuthContext'
import PlansAdmin from './pages/admin/PlansAdmin'
import TenantsAdmin from './pages/admin/TenantsAdmin'
import NavBar from './components/NavBar'

const Private = ({ children }) => (isAuthed() ? children : <Navigate to="/login" replace />)

function AdminRoute({ children }) {
  const { isAdmin, loading } = useAuth()
  if (loading) return null
  return isAdmin ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/dashboard" element={<Private><Dashboard /></Private>} />
        <Route path="/subscriptions" element={<Private><Subscriptions /></Private>} />
        <Route path="/invoices" element={<Private><Invoices /></Private>} />
        <Route path="/admin/plans" element={<Private><AdminRoute><PlansAdmin /></AdminRoute></Private>} />
        <Route path="/admin/tenants" element={<Private><AdminRoute><TenantsAdmin /></AdminRoute></Private>} />
      </Routes>
    </BrowserRouter>
  )
}