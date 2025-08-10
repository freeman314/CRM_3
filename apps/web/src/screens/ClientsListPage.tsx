import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

export function ClientsListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [q, setQ] = useState<string>(searchParams.get('q') || '')
  const [statusId, setStatusId] = useState<string>(searchParams.get('statusId') || '')
  const [dueInDays, setDueInDays] = useState<string>(searchParams.get('dueInDays') || '')
  const [page, setPage] = useState<number>(parseInt(searchParams.get('page') || '1', 10) || 1)

  useEffect(() => {
    const next = new URLSearchParams()
    if (q) next.set('q', q)
    if (statusId) next.set('statusId', statusId)
    if (dueInDays) next.set('dueInDays', dueInDays)
    if (page && page !== 1) next.set('page', String(page))
    setSearchParams(next)
  }, [q, statusId, dueInDays, page, setSearchParams])

  const { data, isFetching } = useQuery({
    queryKey: ['clients', q, statusId, dueInDays, page],
    queryFn: async () =>
      (
        await axios.get('/api/clients', {
          params: { q: q || undefined, statusId: statusId || undefined, dueInDays: dueInDays || undefined, page, pageSize: 20 },
        })
      ).data,
  })
  const { data: statuses } = useQuery({ queryKey: ['client-statuses'], queryFn: async () => (await axios.get('/api/client-statuses')).data })
  const items = data?.items || []
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>Clients</h2>
        <Link to="/clients/create" style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: 4 }}>
          Create Client
        </Link>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <input placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={statusId} onChange={(e) => { setStatusId(e.target.value); setPage(1) }}>
          <option value="">All statuses</option>
          {(statuses || []).map((s: any) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            style={{ padding: '4px 8px', background: dueInDays === '14' ? '#eee' : undefined }}
            onClick={() => { setDueInDays('14'); setPage(1) }}
          >
            ≤14 days
          </button>
          <button
            style={{ padding: '4px 8px', background: dueInDays === '30' ? '#eee' : undefined }}
            onClick={() => { setDueInDays('30'); setPage(1) }}
          >
            ≤30 days
          </button>
          <button
            style={{ padding: '4px 8px' }}
            onClick={() => { setDueInDays(''); setPage(1) }}
          >
            Clear
          </button>
        </div>
        {isFetching && <span>Loading...</span>}
      </div>
      <table cellPadding={8} style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Last Name</th>
            <th>First Name</th>
            <th>Status</th>
            <th>Contract End</th>
          </tr>
        </thead>
        <tbody>
          {items.map((c: any) => (
            <tr key={c.id}>
              <td>
                <Link to={`/clients/${c.id}`}>{c.lastName}</Link>
              </td>
              <td>{c.firstName}</td>
              <td>{c.status?.name || '-'}</td>
              <td>{c.contractEndDate ? new Date(c.contractEndDate).toLocaleDateString() : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
          Prev
        </button>
        <span>
          Page {data?.page ?? page} / {Math.ceil((data?.total || 0) / (data?.pageSize || 20)) || 1}
        </span>
        <button disabled={items.length < 20} onClick={() => setPage((p) => p + 1)}>
          Next
        </button>
      </div>
    </div>
  )
}


