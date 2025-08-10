import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export function AuditLogsPage() {
  const { data } = useQuery({ queryKey: ['audit-logs'], queryFn: async () => (await axios.get('/api/audit/logs', { params: { pageSize: 100 } })).data })
  const items = data?.items || []
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <h2>Audit Logs</h2>
      <table cellPadding={6} style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Time</th>
            <th>User</th>
            <th>Action</th>
            <th>Method</th>
            <th>Path</th>
            <th>Entity</th>
            <th>EntityId</th>
          </tr>
        </thead>
        <tbody>
          {items.map((l: any) => (
            <tr key={l.id}>
              <td>{new Date(l.createdAt).toLocaleString()}</td>
              <td>{l.userId || '-'}</td>
              <td>{l.action}</td>
              <td>{l.method}</td>
              <td>{l.path}</td>
              <td>{l.entity || '-'}</td>
              <td>{l.entityId || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}


