import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import api, { getToken } from '../lib/api'
import { socket, joinPollRoom, onResponseNew, offResponseNew } from '../lib/socket'

export const Route = createFileRoute('/polls/$id/analytics')({
  component: Analytics,
  beforeLoad: () => {
    if (!getToken()) throw redirect({ to: '/login' })
  },
})

function Analytics() {
  const { id } = Route.useParams()
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    api.get(`/api/polls/${id}/analytics`).then((res) => setData(res.data))
    if (!socket.connected) socket.connect()
    joinPollRoom(id)
    const handler = () => { api.get(`/api/polls/${id}/analytics`).then((res) => setData(res.data)) }
    onResponseNew(handler)
    return () => { offResponseNew(handler) }
  }, [id])

  if (!data) return <p>Loading...</p>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: '#18181B' }}>Analytics</h1>
      <p className="text-lg">Total responses: <strong>{data.totalResponses}</strong></p>

      <div className="rounded p-4" style={{ border: '1px solid #F59E0B' }}>
        <h2 className="font-semibold mb-2">Responses Over Time</h2>
        {data.responsesOverTime?.length === 0 && <p className="text-sm" style={{ color: '#FB923C' }}>No responses yet</p>}
        <div className="space-y-1">
          {data.responsesOverTime?.map((r: any) => (
            <div key={r.date} className="flex items-center gap-2 text-sm">
              <span className="w-24">{r.date}</span>
              <div className="flex-1 rounded h-4" style={{ background: '#FFF7ED' }}>
                <div className="h-4 rounded" style={{ width: `${Math.min((r.count / data.totalResponses) * 100, 100)}%`, background: '#FB923C' }} />
              </div>
              <span>{r.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {data.questionBreakdown?.map((q: any) => (
          <div key={q.questionId} className="rounded p-4" style={{ border: '1px solid #F59E0B', background: '#FFF7ED' }}>
            <p className="font-medium mb-2">
              {q.questionText} <span className="text-sm" style={{ color: '#FB923C' }}>({q.responseCount ?? q.options?.reduce((a: number, o: any) => a + o.count, 0)} responses)</span>
            </p>
            {q.type === 'text' ? (
              q.answers?.map((a: string, i: number) => <p key={i} className="text-sm p-1 rounded">- {a}</p>)
            ) : (
              q.options?.map((o: any) => (
                <div key={o.optionId} className="flex items-center gap-2 text-sm ml-2">
                  <span className="w-40 truncate">{o.text}</span>
                  <div className="flex-1 rounded h-4" style={{ background: '#FFF7ED' }}>
                    <div className="h-4 rounded" style={{
                      width: `${(o.count / Math.max(1, q.options?.reduce((a: number, o2: any) => a + o2.count, 0))) * 100}%`,
                      background: '#F59E0B'
                    }} />
                  </div>
                  <span className="w-8 text-right">{o.count}</span>
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
