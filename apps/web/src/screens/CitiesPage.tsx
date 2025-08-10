import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useState } from 'react'
import { useAuth } from '../modules/auth/AuthProvider'
import { useToast } from '../shared/ToastProvider'

export function CitiesPage() {
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ['cities'], queryFn: async () => (await axios.get('/api/cities')).data })
  const { user } = useAuth()
  const { notify } = useToast()
  const [name, setName] = useState('')
  const [region, setRegion] = useState('')
  const createMutation = useMutation({
    mutationFn: async (payload: any) => (await axios.post('/api/cities', payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cities'] })
      notify('City created')
    },
    onError: () => notify('Failed to create city', 'error'),
  })
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...payload }: any) => (await axios.patch(`/api/cities/${id}`, payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cities'] })
      notify('City updated')
    },
    onError: () => notify('Failed to update city', 'error'),
  })
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => (await axios.delete(`/api/cities/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cities'] })
      notify('City deleted')
    },
    onError: () => notify('Failed to delete city', 'error'),
  })
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <h2>Cities</h2>
      {(user?.role === 'admin' || user?.role === 'chief_manager') && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!name) return
            createMutation.mutate({ name, region: region || undefined })
            setName('')
            setRegion('')
          }}
          style={{ display: 'flex', gap: 8 }}
        >
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder="Region" value={region} onChange={(e) => setRegion(e.target.value)} />
          <button type="submit" disabled={createMutation.isPending}>Add</button>
        </form>
      )}
      <ul>
        {(data || []).map((c: any) => (
          <EditableRow
            key={c.id}
            item={c}
            canEdit={user?.role === 'admin' || user?.role === 'chief_manager'}
            canDelete={user?.role === 'admin'}
            onSave={(payload) => updateMutation.mutate({ id: c.id, ...payload })}
            onDelete={() => deleteMutation.mutate(c.id)}
          />
        ))}
      </ul>
    </div>
  )
}

function EditableRow({ item, canEdit, canDelete, onSave, onDelete }: { item: any; canEdit: boolean; canDelete: boolean; onSave: (p: any) => void; onDelete: () => void }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(item.name)
  const [region, setRegion] = useState(item.region || '')
  if (!editing)
    return (
      <li style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ minWidth: 160 }}>{item.name}{item.region ? `, ${item.region}` : ''}</span>
        {canEdit && (
          <button onClick={() => setEditing(true)} style={{ marginLeft: 'auto' }}>
            Edit
          </button>
        )}
        {canDelete && (
          <button
            onClick={() => {
              if (confirm('Delete this city?')) onDelete()
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
      <input value={region} onChange={(e) => setRegion(e.target.value)} />
      <button
        onClick={() => {
          onSave({ name, region: region || undefined })
          setEditing(false)
        }}
      >
        Save
      </button>
      <button onClick={() => setEditing(false)}>Cancel</button>
    </li>
  )
}


