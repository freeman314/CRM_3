import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Link } from 'react-router-dom'

export function DashboardPage() {
  const { data } = useQuery({ queryKey: ['dashboard'], queryFn: async () => (await axios.get('/api/dashboard')).data })
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h2>Dashboard</h2>
      <div style={{ display: 'flex', gap: 16 }}>
        <Card title="Contracts ≤14 days" value={data?.contracts?.in14 ?? '-'} linkTo={data ? `/clients?dueInDays=14` : undefined} />
        <Card title="Contracts ≤30 days" value={data?.contracts?.in30 ?? '-'} linkTo={data ? `/clients?dueInDays=30` : undefined} />
        <Card title="Tasks today" value={data?.tasks?.today ?? '-'} />
        <Card title="Tasks week" value={data?.tasks?.week ?? '-'} />
      </div>
      <div>
        <h3>Recent calls</h3>
        <ul>
          {(data?.recentCalls || []).map((c: any) => (
            <li key={c.id}>
              {new Date(c.dateTime).toLocaleString()} — {c.client?.lastName} {c.client?.firstName} — {c.result}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3>Recent tasks</h3>
        <ul>
          {(data?.recentTasks || []).map((t: any) => (
            <li key={t.id}>
              {t.title} — {t.status} — {t.client ? `${t.client.lastName} ${t.client.firstName}` : ''}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function Card({ title, value, linkTo }: { title: string; value: string | number; linkTo?: string }) {
  const content = (
    <div style={{ padding: 16, border: '1px solid #eee', borderRadius: 8, minWidth: 160 }}>
      <div style={{ color: '#666' }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
    </div>
  )
  if (linkTo) return <Link to={linkTo} style={{ textDecoration: 'none', color: 'inherit' }}>{content}</Link>
  return content
}


