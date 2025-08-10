import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useState } from 'react'
import { useAuth } from '../modules/auth/AuthProvider'
import { useToast } from '../shared/ToastProvider'

export function CategoriesPage() {
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ['categories'], queryFn: async () => (await axios.get('/api/categories')).data })
  const { user } = useAuth()
  const { notify } = useToast()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const createMutation = useMutation({
    mutationFn: async (payload: any) => (await axios.post('/api/categories', payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      notify('Category created')
    },
    onError: () => notify('Failed to create category', 'error'),
  })
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...payload }: any) => (await axios.patch(`/api/categories/${id}`, payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      notify('Category updated')
    },
    onError: () => notify('Failed to update category', 'error'),
  })
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => (await axios.delete(`/api/categories/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      notify('Category deleted')
    },
    onError: () => notify('Failed to delete category', 'error'),
  })
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <h2>Categories</h2>
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
              if (confirm('Delete this category?')) onDelete()
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


