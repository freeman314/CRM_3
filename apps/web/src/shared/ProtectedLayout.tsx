import { Outlet, Navigate, Link } from 'react-router-dom'
import { useAuth } from '../modules/auth/AuthProvider'

export function ProtectedLayout() {
  const { accessToken, user, logout } = useAuth()
  if (!accessToken) return <Navigate to="/login" replace />
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: 220, padding: 16, borderRight: '1px solid #eee' }}>
        <div style={{ fontWeight: 700, marginBottom: 16 }}>CRM_3</div>
        <nav style={{ display: 'grid', gap: 8 }}>
          <Link to="/">Dashboard</Link>
          <Link to="/clients">Clients</Link>
          <Link to="/tasks">Tasks</Link>
          <Link to="/calendar">Calendar</Link>
          <Link to="/reports">Reports</Link>
          <div style={{ marginTop: 8, fontWeight: 600 }}>Directories</div>
          {(user?.role === 'admin' || user?.role === 'chief_manager') && (
            <>
              <Link to="/directories/statuses">Client Statuses</Link>
              <Link to="/directories/categories">Categories</Link>
              <Link to="/directories/cities">Cities</Link>
            </>
          )}
          <div style={{ marginTop: 8, fontWeight: 600 }}>Profile</div>
          <Link to="/profile/change-password">Change Password</Link>
          {user?.role === 'admin' && (
            <>
              <div style={{ marginTop: 8, fontWeight: 600 }}>Admin</div>
              <Link to="/admin/users">Users</Link>
              <Link to="/admin/audit">Audit Logs</Link>
            </>
          )}
        </nav>
        <button style={{ marginTop: 'auto' }} onClick={() => logout()}>
          Logout
        </button>
      </aside>
      <main style={{ padding: 24, flex: 1 }}>
        <Outlet />
      </main>
    </div>
  )
}


