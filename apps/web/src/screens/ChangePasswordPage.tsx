import { useState } from 'react'
import axios from 'axios'
import { useAuth } from '../modules/auth/AuthProvider'

export function ChangePasswordPage() {
  const { accessToken, logout } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    setError(null)
    try {
      await axios.post(
        '/api/auth/change-password',
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      )
      setMessage('Password changed. Please log in again.')
      await logout()
    } catch (e: any) {
      const data = e?.response?.data
      const msg =
        typeof data?.message === 'string'
          ? data.message
          : Array.isArray(data?.message)
          ? data.message.join(', ')
          : typeof data === 'string'
          ? data
          : e?.message
      setError(msg || 'Failed to change password')
    }
  }

  return (
    <div>
      <h2>Change Password</h2>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, maxWidth: 360 }}>
        <label>
          Current password
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </label>
        <label>
          New password
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </label>
        <button type="submit">Change</button>
        {message && <div style={{ color: 'green' }}>{message}</div>}
        {error && <div style={{ color: 'crimson' }}>{error}</div>}
      </form>
    </div>
  )
}


