import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import api, { getToken } from '../lib/api'
import { socket, joinPollRoom, onResponseNew, offResponseNew } from '../lib/socket'
import { Card } from '../components/ui'

export const Route = createFileRoute('/polls/$id/analytics')({
  component: Analytics,
  beforeLoad: () => { if (!getToken()) throw redirect({ to: '/login' }) },
})

function Analytics() {
  const { id } = Route.useParams()
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    api.get(`/api/polls/${id}/analytics`).then((r) => setData(r.data))
    if (!socket.connected) socket.connect()
    joinPollRoom(id)
    const handler = () => { api.get(`/api/polls/${id}/analytics`).then((r) => setData(r.data)) }
    onResponseNew(handler)
    return () => { offResponseNew(handler) }
  }, [id])

  if (!data) return <p className="text-center py-20 text-text/40">Loading...</p>

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-text">{data.title || 'Analytics'}</h1>
        <p className="text-sm text-accent mt-1">Real-time poll performance</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="rounded-xl p-5 text-center">
          <p className="text-3xl font-bold text-primary">{data.totalResponses}</p>
          <p className="text-xs text-text/50 mt-1">Total Responses</p>
        </Card>
        <Card className="rounded-xl p-5 text-center">
          <p className="text-3xl font-bold text-accent">{data.completionRate ?? 100}%</p>
          <p className="text-xs text-text/50 mt-1">Completion Rate</p>
        </Card>
        <Card className="rounded-xl p-5 text-center">
          <p className="text-3xl font-bold text-text">{data.responsesOverTime?.length ?? 0}</p>
          <p className="text-xs text-text/50 mt-1">Active Days</p>
        </Card>
      </div>

      <Card className="rounded-xl">
        <h2 className="font-semibold text-text mb-4">Responses Over Time</h2>
        {data.responsesOverTime?.length === 0 ? (
          <p className="text-sm text-text/40 italic">No responses yet. Share your poll to start collecting data.</p>
        ) : (
          <div className="space-y-2">
            {data.responsesOverTime?.map((r: any) => {
              const maxCount = Math.max(...data.responsesOverTime.map((x: any) => x.count))
              return (
                <div key={r.date}>
                  <div className="flex justify-between text-sm mb-0.5">
                    <span className="text-text/60">{r.date}</span>
                    <span className="font-medium text-text">{r.count}</span>
                  </div>
                  <div className="h-3 rounded-full bg-panel-soft overflow-hidden">
                    <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(r.count / maxCount) * 100}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
