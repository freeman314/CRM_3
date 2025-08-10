import type { FormEvent } from 'react'
import { useState } from 'react'
import { useAuth } from '../modules/auth/AuthProvider'

export function LoginPage() {
  const { login } = useAuth()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await login(username, password)
    } catch (e: any) {
      const data = e?.response?.data
      const message =
        typeof data?.message === 'string'
          ? data.message
          : Array.isArray(data?.message)
          ? data.message.join(', ')
          : typeof data === 'string'
          ? data
          : e?.message
      setError(message || 'Login failed')
    }
  }

  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, width: 300 }}>
        <h2>Sign in</h2>
        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <div style={{ color: 'crimson' }}>{error}</div>}
        <button type="submit">Login</button>
      </form>
    </div>
  )
}


