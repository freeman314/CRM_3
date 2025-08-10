import { Outlet } from 'react-router-dom'
import { AuthProvider } from './modules/auth/AuthProvider'

export function RootProviders() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  )
}


