import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'
import { useToast } from '../shared/ToastProvider'

export function EditClientPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { notify } = useToast()

  const { data: client } = useQuery({ queryKey: ['client', id], queryFn: async () => (await axios.get(`/api/clients/${id}`)).data, enabled: !!id })
  const { data: statuses } = useQuery({ queryKey: ['client-statuses'], queryFn: async () => (await axios.get('/api/client-statuses')).data })
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: async () => (await axios.get('/api/categories')).data })
  const { data: cities } = useQuery({ queryKey: ['cities'], queryFn: async () => (await axios.get('/api/cities')).data })

  const [formData, setFormData] = useState<any | null>(null)
  useEffect(() => {
    if (client && !formData) {
      setFormData({
        firstName: client.firstName || '',
        lastName: client.lastName || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        currentProvider: client.currentProvider || '',
        notes: client.notes || '',
        statusId: client.status?.id || '',
        categoryId: client.category?.id || '',
        cityId: client.city?.id || '',
        contractEndDate: client.contractEndDate ? client.contractEndDate.substring(0, 10) : '',
      })
    }
  }, [client, formData])

  const updateMutation = useMutation({
    mutationFn: async (data: any) => (await axios.patch(`/api/clients/${id}`, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['client', id] })
      notify('Client updated')
      navigate(`/clients/${id}`)
    },
    onError: () => notify('Failed to update client', 'error'),
  })

  if (!formData) return <div>Loading...</div>

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload: any = { ...formData }
    if (!formData.email) delete payload.email
    if (!formData.phone) delete payload.phone
    if (!formData.address) delete payload.address
    if (!formData.currentProvider) delete payload.currentProvider
    if (!formData.notes) delete payload.notes
    if (!formData.statusId) delete payload.statusId
    if (!formData.categoryId) delete payload.categoryId
    if (!formData.cityId) delete payload.cityId
    if (!formData.contractEndDate) delete payload.contractEndDate
    else payload.contractEndDate = new Date(formData.contractEndDate).toISOString()
    updateMutation.mutate(payload)
  }

  return (
    <div>
      <h2>Edit Client</h2>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, maxWidth: 400 }}>
        <label>
          First Name *
          <input required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
        </label>
        <label>
          Last Name *
          <input required value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
        </label>
        <label>
          Email
          <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
        </label>
        <label>
          Phone
          <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
        </label>
        <label>
          Address
          <input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
        </label>
        <label>
          Status
          <select value={formData.statusId} onChange={(e) => setFormData({ ...formData, statusId: e.target.value })}>
            <option value="">Select Status</option>
            {(statuses || []).map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Category
          <select value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}>
            <option value="">Select Category</option>
            {(categories || []).map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          City
          <select value={formData.cityId} onChange={(e) => setFormData({ ...formData, cityId: e.target.value })}>
            <option value="">Select City</option>
            {(cities || []).map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Contract end date
          <input type="date" value={formData.contractEndDate} onChange={(e) => setFormData({ ...formData, contractEndDate: e.target.value })} />
        </label>
        <label>
          Notes
          <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save'}
          </button>
          <button type="button" onClick={() => navigate(`/clients/${id}`)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}


