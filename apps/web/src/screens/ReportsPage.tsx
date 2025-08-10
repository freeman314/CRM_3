import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export function ReportsPage() {
  const [range, setRange] = useState<{ from: string; to: string }>({ from: '', to: '' })
  const enabled = !!range.from && !!range.to
  const { data, isFetching } = useQuery({
    queryKey: ['reports', range.from, range.to],
    enabled,
    queryFn: async () => {
      const [tasks, clients, calls] = await Promise.all([
        axios.get('/api/tasks', { params: { dueFrom: range.from, dueTo: range.to, pageSize: 1000 } }).then((r) => r.data),
        axios.get('/api/clients', { params: { pageSize: 1000 } }).then((r) => r.data),
        axios.get('/api/calls', { params: { from: range.from, to: range.to, pageSize: 1000 } }).then((r) => r.data),
      ])
      return { tasks, clients, calls }
    },
  })

  const csv = useMemo(() => {
    function toCsv(rows: any[], columns: string[]): string {
      const escape = (v: any) => {
        const s = v == null ? '' : String(v)
        return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
      }
      return [columns.join(','), ...rows.map((r) => columns.map((c) => escape(r[c])).join(','))].join('\n')
    }
    const tasks = toCsv(
      (data?.tasks?.items || []).map((t: any) => ({ id: t.id, title: t.title, status: t.status, dueDate: t.dueDate, clientId: t.clientId, assignedToId: t.assignedToId })),
      ['id', 'title', 'status', 'dueDate', 'clientId', 'assignedToId'],
    )
    const calls = toCsv(
      (data?.calls?.items || []).map((c: any) => ({ id: c.id, clientId: c.clientId, managerId: c.managerId, dateTime: c.dateTime, result: c.result })),
      ['id', 'clientId', 'managerId', 'dateTime', 'result'],
    )
    const clients = toCsv(
      (data?.clients?.items || []).map((c: any) => ({ id: c.id, firstName: c.firstName, lastName: c.lastName, email: c.email, phone: c.phone, contractEndDate: c.contractEndDate })),
      ['id', 'firstName', 'lastName', 'email', 'phone', 'contractEndDate'],
    )
    return { tasks, calls, clients }
  }, [data])

  function downloadCsv(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <h2>Reports</h2>
      <div style={{ display: 'flex', gap: 8 }}>
        <label>
          From
          <input type="date" value={range.from} onChange={(e) => setRange({ ...range, from: new Date(e.target.value).toISOString() })} />
        </label>
        <label>
          To
          <input type="date" value={range.to} onChange={(e) => setRange({ ...range, to: new Date(e.target.value).toISOString() })} />
        </label>
      </div>

      {enabled && (
        <div style={{ display: 'grid', gap: 8 }}>
          <div><strong>Tasks due in range:</strong> {data?.tasks?.total ?? '-'}</div>
          <div><strong>Total clients:</strong> {data?.clients?.total ?? '-'}</div>
          <div><strong>Calls in range:</strong> {data?.calls?.total ?? '-'}</div>
          {isFetching ? (
            <div>Loading...</div>
          ) : (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={() => downloadCsv(csv.tasks, 'tasks.csv')}>Export Tasks CSV</button>
              <button onClick={() => downloadCsv(csv.calls, 'calls.csv')}>Export Calls CSV</button>
              <button onClick={() => downloadCsv(csv.clients, 'clients.csv')}>Export Clients CSV</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}


