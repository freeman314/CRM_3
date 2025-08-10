import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useState } from 'react'
import { useAuth } from '../modules/auth/AuthProvider'
import { useToast } from '../shared/ToastProvider'

export function StatusesPage() {
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ['client-statuses'], queryFn: async () => (await axios.get('/api/client-statuses')).data })
  const { user } = useAuth()
  const { notify } = useToast()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const createMutation = useMutation({
    mutationFn: async (payload: any) => (await axios.post('/api/client-statuses', payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-statuses'] })
      notify('Status created')
    },
    onError: () => notify('Failed to create status', 'error'),
  })
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...payload }: any) => (await axios.patch(`/api/client-statuses/${id}`, payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-statuses'] })
      notify('Status updated')
    },
    onError: () => notify('Failed to update status', 'error'),
  })
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => (await axios.delete(`/api/client-statuses/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-statuses'] })
      notify('Status deleted')
    },
    onError: () => notify('Failed to delete status', 'error'),
  })

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <h2>Client Statuses</h2>
      {(user?.role === 'admin' || user?.role === 'chief_manager') && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!name) return
            createMutation.mutate({ name, description: description || undefined })
            setName('')
            setDescription('')
          }}
          style={{ display: 'flex', gap: 8 }}
        >
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <button type="submit" disabled={createMutation.isPending}>
            Add
          </button>
        </form>
      )}
      <ul>
        {(data || []).map((s: any) => (
          <EditableRow
            key={s.id}
            item={s}
            canEdit={user?.role === 'admin' || user?.role === 'chief_manager'}
            canDelete={user?.role === 'admin'}
            onSave={(payload) => updateMutation.mutate({ id: s.id, ...payload })}
            onDelete={() => deleteMutation.mutate(s.id)}
          />
        ))}
      </ul>
    </div>
  )
}

function EditableRow({ item, canEdit, canDelete, onSave, onDelete }: { item: any; canEdit: boolean; canDelete: boolean; onSave: (p: any) => void; onDelete: () => void }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(item.name)
  const [description, setDescription] = useState(item.description || '')
  if (!editing)
    return (
      <li style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ minWidth: 160 }}>{item.name}</span>
        <span style={{ color: '#666' }}>{item.description}</span>
        {canEdit && (
          <button onClick={() => setEditing(true)} style={{ marginLeft: 'auto' }}>
            Edit
          </button>
        )}
        {canDelete && (
          <button
            onClick={() => {
              if (confirm('Delete this status?')) onDelete()
            }}
            style={{ color: 'crimson' }}
          >
            Delete
          </button>
        )}
      </li>
    )
  return (
    <li style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <input value={description} onChange={(e) => setDescription(e.target.value)} />
      <button
        onClick={() => {
          onSave({ name, description: description || undefined })
          setEditing(false)
        }}
      >
        Save
      </button>
      <button onClick={() => setEditing(false)}>Cancel</button>
    </li>
  )
}


