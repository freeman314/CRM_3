import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useState } from 'react'
import { useAuth } from '../modules/auth/AuthProvider'
import { useToast } from '../shared/ToastProvider'

export function TasksListPage() {
  const qc = useQueryClient()
  const { user } = useAuth()
  const { notify } = useToast()
  const [status, setStatus] = useState('')
  const [dueFrom, setDueFrom] = useState('')
  const [dueTo, setDueTo] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ title: '', clientId: '', assignedToId: '', dueDate: '' })
  const [page, setPage] = useState(1)
  const pageSize = 20
  const { data, isFetching } = useQuery({
    queryKey: ['tasks', status, dueFrom, dueTo, page],
    queryFn: async () => (await axios.get('/api/tasks', { params: { status: status || undefined, dueFrom: dueFrom || undefined, dueTo: dueTo || undefined, page, pageSize } })).data,
  })
  const { data: clients } = useQuery({ queryKey: ['clients', 'forTasks'], queryFn: async () => (await axios.get('/api/clients', { params: { pageSize: 500 } })).data })
  const updateTask = useMutation({
    mutationFn: async ({ id, ...payload }: any) => (await axios.patch(`/api/tasks/${id}`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
  const createTask = useMutation({
    mutationFn: async (payload: any) => (await axios.post('/api/tasks', payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      setShowCreate(false)
      setCreateForm({ title: '', clientId: '', assignedToId: '', dueDate: '' })
      notify('Task created')
    },
    onError: () => notify('Failed to create task', 'error'),
  })
  const items = data?.items || []
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <h2>Tasks</h2>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option>
          <option value="new">New</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
        </select>
        <label>
          From
          <input type="date" value={dueFrom} onChange={(e) => setDueFrom(e.target.value ? new Date(e.target.value).toISOString() : '')} />
        </label>
        <label>
          To
          <input type="date" value={dueTo} onChange={(e) => setDueTo(e.target.value ? new Date(e.target.value).toISOString() : '')} />
        </label>
        {isFetching && <span>Loading...</span>}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Tasks</h3>
        <button onClick={() => {
          setShowCreate((v) => !v)
          if (user?.id) setCreateForm((f) => ({ ...f, assignedToId: user.id }))
        }}>
          {showCreate ? 'Close' : 'New Task'}
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const payload: any = { ...createForm }
            if (!payload.title || !payload.clientId || !(payload.assignedToId || user?.id)) return
            if (!payload.assignedToId && user?.id) payload.assignedToId = user.id
            if (payload.dueDate) payload.dueDate = new Date(payload.dueDate).toISOString()
            else delete payload.dueDate
            createTask.mutate(payload)
          }}
          style={{ display: 'grid', gap: 8, padding: 12, border: '1px solid #eee', borderRadius: 8, marginBottom: 12 }}
        >
          <label>
            Title
            <input value={createForm.title} onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })} />
          </label>
          <label>
            Client
            <select value={createForm.clientId} onChange={(e) => setCreateForm({ ...createForm, clientId: e.target.value })}>
              <option value="">Select client</option>
              {(clients?.items || []).map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.lastName} {c.firstName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Due date
            <input type="date" value={createForm.dueDate} onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })} />
          </label>
          <div>
            <button type="submit" disabled={createTask.isPending}>{createTask.isPending ? 'Creating...' : 'Create'}</button>
          </div>
        </form>
      )}

      <table cellPadding={8} style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Title</th>
            <th>Client</th>
            <th>Assignee</th>
            <th>Status</th>
            <th>Due</th>
          </tr>
        </thead>
        <tbody>
          {items.map((t: any) => (
            <tr key={t.id}>
              <td>{t.title}</td>
              <td>{t.client ? `${t.client.lastName} ${t.client.firstName}` : t.clientId}</td>
              <td>{t.assignedTo ? t.assignedTo.username : t.assignedToId}</td>
              <td>
                <select
                  value={t.status}
                  onChange={(e) => updateTask.mutate({ id: t.id, status: e.target.value })}
                >
                  <option value="new">New</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                </select>
              </td>
              <td>{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
        <span>
          Page {data?.page ?? page} / {Math.ceil((data?.total || 0) / (data?.pageSize || pageSize)) || 1}
        </span>
        <button disabled={(data?.items || []).length < pageSize} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </div>
  )
}


