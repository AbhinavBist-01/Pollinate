import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import api, { getToken } from '../lib/api'
import { socket, joinPollRoom, onResponseNew, offResponseNew } from '../lib/socket'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'

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

  if (!data) return <p className="py-20 text-center text-muted-foreground">Loading...</p>

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">{data.title || 'Analytics'}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Real-time poll performance</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ['Total Responses', data.totalResponses, 'text-primary'],
          ['Completion Rate', `${data.completionRate ?? 100}%`, 'text-orange'],
          ['Active Days', data.responsesOverTime?.length ?? 0, 'text-foreground'],
        ].map(([label, value, color]) => (
          <Card key={label} className="border-white/10 bg-card/90">
            <CardContent className="p-5 text-center">
              <p className={`text-3xl font-black ${color}`}>{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-white/10 bg-card/90">
        <CardHeader>
          <CardTitle>Responses Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {data.responsesOverTime?.length === 0 ? (
            <p className="text-sm italic text-muted-foreground">No responses yet. Share your poll to start collecting data.</p>
          ) : (
            <div className="space-y-3">
              {data.responsesOverTime?.map((r: any) => {
                const maxCount = Math.max(...data.responsesOverTime.map((x: any) => x.count), 1)
                return (
                  <div key={r.date}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-muted-foreground">{r.date}</span>
                      <span className="font-medium text-foreground">{r.count}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(r.count / maxCount) * 100}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
