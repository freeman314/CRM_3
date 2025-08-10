import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

type CalendarItem = { id: string; date: string; type: 'contract' | 'task'; title: string; link: string }

export function CalendarPage() {
  const [monthOffset, setMonthOffset] = useState(0)
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
  const lastDay = new Date(today.getFullYear(), today.getMonth() + monthOffset + 1, 0)
  const dueFrom = firstDay.toISOString()
  const dueTo = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate(), 23, 59, 59, 999).toISOString()

  const { data: tasks } = useQuery({
    queryKey: ['tasks', dueFrom, dueTo],
    queryFn: async () => (await axios.get('/api/tasks', { params: { dueFrom, dueTo, pageSize: 500 } })).data,
  })
  const { data: clients } = useQuery({
    queryKey: ['clients', monthOffset],
    queryFn: async () =>
      (
        await axios.get('/api/clients', {
          params: { pageSize: 500, contractEndFrom: firstDay.toISOString(), contractEndTo: new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate(), 23, 59, 59, 999).toISOString() },
        })
      ).data,
  })

  const items: CalendarItem[] = useMemo(() => {
    const list: CalendarItem[] = []
    for (const t of tasks?.items || []) {
      if (t.dueDate) list.push({ id: t.id, date: t.dueDate, type: 'task', title: t.title, link: '/tasks' })
    }
    for (const c of clients?.items || []) {
      if (c.contractEndDate)
        list.push({ id: c.id, date: c.contractEndDate, type: 'contract', title: `${c.lastName} ${c.firstName}`, link: `/clients/${c.id}` })
    }
    return list
  }, [tasks, clients])

  const days = Array.from({ length: lastDay.getDate() }, (_, i) => i + 1)

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h2>
        Calendar — {firstDay.toLocaleString(undefined, { month: 'long' })} {firstDay.getFullYear()}
      </h2>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setMonthOffset((m) => m - 1)}>{'<'}</button>
        <button onClick={() => setMonthOffset(0)}>Today</button>
        <button onClick={() => setMonthOffset((m) => m + 1)}>{'>'}</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
        {days.map((d) => {
          const dayItems = items.filter((i) => new Date(i.date).getDate() === d)
          return (
            <div key={d} style={{ border: '1px solid #eee', borderRadius: 8, padding: 8, minHeight: 80 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>{d}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {dayItems.map((i) => (
                  <li key={`${i.type}-${i.id}`}>
                    <Link to={i.link} style={{ textDecoration: 'none' }}>
                      <span style={{ color: i.type === 'task' ? '#0a7' : '#a70' }}>{i.type === 'task' ? 'Task' : 'Contract'}</span>: {i.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}


