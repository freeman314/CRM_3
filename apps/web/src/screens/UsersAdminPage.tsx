import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useState } from 'react'
import { useAuth } from '../modules/auth/AuthProvider'
import { useToast } from '../shared/ToastProvider'

export function UsersAdminPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const { notify } = useToast()
  const { data } = useQuery({ queryKey: ['users'], queryFn: async () => (await axios.get('/api/users')).data, enabled: user?.role === 'admin' })

  const createUser = useMutation({
    mutationFn: async (payload: any) => (await axios.post('/api/users', payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      notify('User created')
    },
    onError: () => notify('Failed to create user', 'error'),
  })
  const updateUser = useMutation({
    mutationFn: async ({ id, ...payload }: any) => (await axios.patch(`/api/users/${id}`, payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      notify('User updated')
    },
    onError: () => notify('Failed to update user', 'error'),
  })
  const resetPassword = useMutation({
    mutationFn: async ({ id, newPassword }: { id: string; newPassword: string }) => (await axios.post(`/api/users/${id}/reset-password`, { newPassword })).data,
    onSuccess: () => notify('Password reset'),
    onError: () => notify('Failed to reset password', 'error'),
  })
  const removeUser = useMutation({
    mutationFn: async (id: string) => (await axios.delete(`/api/users/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      notify('User deleted')
    },
    onError: () => notify('Failed to delete user', 'error'),
  })

  const [form, setForm] = useState({ username: '', email: '', role: 'manager', password: '' })

  if (user?.role !== 'admin') return <div>Access denied</div>

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h2>Users</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!form.username || !form.email || !form.password) return
          createUser.mutate(form)
          setForm({ username: '', email: '', role: 'manager', password: '' })
        }}
        style={{ display: 'grid', gap: 8, maxWidth: 540 }}
      >
        <div style={{ fontWeight: 600 }}>Create new user</div>
        <label>
          Username
          <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        </label>
        <label>
          Email
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label>
          Role
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="manager">Manager</option>
            <option value="chief_manager">Chief manager</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <label>
          Password
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </label>
        <button type="submit" disabled={createUser.isPending}>Create</button>
      </form>

      <div>
        <h3>All users</h3>
        <table cellPadding={8} style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Active</th>
              <th>First login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data || []).map((u: any) => (
              <UserRow
                key={u.id}
                u={u}
                onSave={(payload) => updateUser.mutate({ id: u.id, ...payload })}
                onReset={(newPassword) => resetPassword.mutate({ id: u.id, newPassword })}
                onDelete={() => removeUser.mutate(u.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function UserRow({ u, onSave, onReset, onDelete }: { u: any; onSave: (p: any) => void; onReset: (p: string) => void; onDelete: () => void }) {
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState(u.username)
  const [email, setEmail] = useState(u.email)
  const [role, setRole] = useState(u.role)
  const [active, setActive] = useState(!!u.active)
  const [firstLogin, setFirstLogin] = useState(!!u.firstLogin)
  const [newPassword, setNewPassword] = useState('')

  if (!editing)
    return (
      <tr>
        <td>{u.username}</td>
        <td>{u.email}</td>
        <td>{u.role}</td>
        <td>{u.active ? 'Yes' : 'No'}</td>
        <td>{u.firstLogin ? 'Yes' : 'No'}</td>
        <td style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setEditing(true)}>Edit</button>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!newPassword) return
              onReset(newPassword)
              setNewPassword('')
            }}
            style={{ display: 'inline-flex', gap: 4 }}
          >
            <input placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <button type="submit">Reset password</button>
          </form>
          <button
            onClick={() => {
              if (confirm('Delete this user?')) onDelete()
            }}
            style={{ color: 'crimson' }}
          >
            Delete
          </button>
        </td>
      </tr>
    )

  return (
    <tr>
      <td>
        <input value={username} onChange={(e) => setUsername(e.target.value)} />
      </td>
      <td>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </td>
      <td>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="manager">Manager</option>
          <option value="chief_manager">Chief manager</option>
          <option value="admin">Admin</option>
        </select>
      </td>
      <td>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Active
        </label>
      </td>
      <td>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={firstLogin} onChange={(e) => setFirstLogin(e.target.checked)} /> Require password change
        </label>
      </td>
      <td style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => {
            onSave({ username, email, role, active, firstLogin })
            setEditing(false)
          }}
        >
          Save
        </button>
        <button onClick={() => setEditing(false)}>Cancel</button>
      </td>
    </tr>
  )
}


