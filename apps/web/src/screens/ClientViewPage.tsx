import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useRef, useState } from 'react'
import { useAuth } from '../modules/auth/AuthProvider'
import { useToast } from '../shared/ToastProvider'

export function ClientViewPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: client } = useQuery({ queryKey: ['client', id], queryFn: async () => (await axios.get(`/api/clients/${id}`)).data, enabled: !!id })
  const { data: calls } = useQuery({ queryKey: ['calls', id], queryFn: async () => (await axios.get(`/api/calls/client/${id}`)).data, enabled: !!id })
  const { data: documents } = useQuery({ queryKey: ['documents', id], queryFn: async () => (await axios.get(`/api/documents/client/${id}`)).data, enabled: !!id })
  const deleteClient = useMutation({
    mutationFn: async () => (await axios.delete(`/api/clients/${id}`)).data,
    onSuccess: () => {
      notify('Client deleted')
      navigate('/clients')
    },
    onError: () => notify('Failed to delete client', 'error'),
  })

  const [form, setForm] = useState({ result: 'successful', comment: '', newStatusId: '', newPotential: '', createTask: false, taskTitle: '', taskDueDate: '' })
  const { data: statuses } = useQuery({ queryKey: ['client-statuses'], queryFn: async () => (await axios.get('/api/client-statuses')).data })

  const createCall = useMutation({
    mutationFn: async (payload: any) => (await axios.post('/api/calls', payload)).data,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['calls', id] })
      await queryClient.invalidateQueries({ queryKey: ['client', id] })
      setForm({ result: 'successful', comment: '', newStatusId: '', newPotential: '', createTask: false, taskTitle: '', taskDueDate: '' })
    },
  })
  const createTask = useMutation({ mutationFn: async (payload: any) => (await axios.post('/api/tasks', payload)).data })
  const uploadRef = useRef<HTMLInputElement | null>(null)
  const uploadDoc = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return (await axios.post(`/api/documents/upload/${id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } })).data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['documents', id] })
    },
  })
  const deleteDoc = useMutation({
    mutationFn: async (docId: string) => (await axios.delete(`/api/documents/${docId}`)).data,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['documents', id] })
    },
  })

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!id || !user?.id) return
    const baseCall = {
      clientId: id,
      managerId: user.id,
      result: form.result,
      comment: form.comment || undefined,
      newStatusId: form.newStatusId || undefined,
      newPotential: form.newPotential || undefined,
    }
    await createCall.mutateAsync(baseCall)
    if (form.createTask && form.taskTitle) {
      const due = form.taskDueDate ? new Date(form.taskDueDate).toISOString() : undefined
      await createTask.mutateAsync({
        title: form.taskTitle,
        clientId: id,
        assignedToId: user.id,
        dueDate: due,
      })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    }
  }

  if (!client) return <div>Loading...</div>

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h2>
        {client.lastName} {client.firstName}
      </h2>
      <div>Email: {client.email || '-'}</div>
      <div>Phone: {client.phone || '-'}</div>
      <div>Status: {client.status?.name || '-'}</div>

      <div>
        <h3>Recent calls</h3>
        <ul>
          {(calls || []).map((c: any) => (
            <li key={c.id}>
              {new Date(c.dateTime).toLocaleString()} — {c.result} — {c.comment || ''}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <Link to={`/clients/${id}/edit`}>Edit</Link>
        {(user?.role === 'admin' || user?.role === 'chief_manager') && (
          <button
            onClick={() => {
              if (confirm('Delete this client?')) deleteClient.mutate()
            }}
            style={{ color: 'crimson' }}
          >
            Delete
          </button>
        )}
      </div>

      <div>
        <h3>Documents</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <input ref={uploadRef} type="file" style={{ display: 'none' }} onChange={(e) => {
            const f = e.target.files?.[0]
            if (f && id) uploadDoc.mutate(f)
            if (uploadRef.current) uploadRef.current.value = ''
          }} />
          <button onClick={() => uploadRef.current?.click()} disabled={uploadDoc.isPending}>Upload</button>
        </div>
        <ul>
          {(documents || []).map((d: any) => (
            <li key={d.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <a href={`/api/documents/${d.id}/download`} target="_blank" rel="noreferrer">{d.originalName}</a>
              <span style={{ color: '#666' }}>{Math.round(d.size / 1024)} KB</span>
              {(user?.role === 'admin' || user?.role === 'chief_manager') && (
                <button onClick={() => {
                  if (confirm('Delete this document?')) deleteDoc.mutate(d.id)
                }} style={{ color: 'crimson' }}>Delete</button>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ marginTop: 24 }}>
        <h3>New call</h3>
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, maxWidth: 520 }}>
          <label>
            Result
            <select value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })}>
              <option value="successful">Successful</option>
              <option value="no_answer">No answer</option>
              <option value="rescheduled">Rescheduled</option>
            </select>
          </label>
          <label>
            New status
            <select value={form.newStatusId} onChange={(e) => setForm({ ...form, newStatusId: e.target.value })}>
              <option value="">Keep current</option>
              {(statuses || []).map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            New potential
            <input value={form.newPotential} onChange={(e) => setForm({ ...form, newPotential: e.target.value })} />
          </label>
          <label>
            Comment
            <textarea value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
          </label>

          <fieldset style={{ border: '1px solid #eee', padding: 12 }}>
            <legend>Next action</legend>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={form.createTask} onChange={(e) => setForm({ ...form, createTask: e.target.checked })} />
              Create follow-up task
            </label>
            {form.createTask && (
              <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                <label>
                  Task title
                  <input value={form.taskTitle} onChange={(e) => setForm({ ...form, taskTitle: e.target.value })} />
                </label>
                <label>
                  Due date
                  <input type="date" value={form.taskDueDate} onChange={(e) => setForm({ ...form, taskDueDate: e.target.value })} />
                </label>
              </div>
            )}
          </fieldset>

          <button type="submit" disabled={createCall.isPending || createTask.isPending}>
            {createCall.isPending || createTask.isPending ? 'Saving...' : 'Save call'}
          </button>
        </form>
      </div>
    </div>
  )
}


