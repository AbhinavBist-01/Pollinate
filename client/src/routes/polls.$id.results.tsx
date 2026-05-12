import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import api, { getToken } from '../lib/api'
import { Badge, Card } from '../components/ui'

export const Route = createFileRoute('/polls/$id/results')({
  component: Results,
  beforeLoad: () => { if (!getToken()) throw redirect({ to: '/login' }) },
})

function Results() {
  const { id } = Route.useParams()
  const [data, setData] = useState<any>(null)
  useEffect(() => { api.get(`/api/polls/${id}/results`).then((r) => setData(r.data)) }, [id])
  if (!data) return <p className="text-center py-20 text-text/40">Loading...</p>

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">{data.title || 'Results'}</h1>
          <p className="text-sm text-accent mt-1">{data.totalResponses} total response{data.totalResponses !== 1 ? 's' : ''}</p>
        </div>
        <Badge tone="primary" className="px-5 py-2 text-sm">{data.totalResponses}</Badge>
      </div>

      {data.results?.map((r: any) => {
        const winner = r.topOption
        return (
          <Card key={r.questionId}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-text">{r.questionText}</h3>
              <span className="text-xs text-text/40">{r.totalVotes} vote{r.totalVotes !== 1 ? 's' : ''}</span>
            </div>

            {r.type === 'text' ? (
              <div className="space-y-2">
                {r.answers?.length ? r.answers.map((a: string, i: number) => (
                  <p key={i} className="rounded-lg bg-panel-soft px-4 py-2 text-sm text-text/70">- {a}</p>
                )) : <p className="text-sm text-text/40 italic">No text responses yet</p>}
              </div>
            ) : (
              <>
                {winner && (
                  <div className="mb-4 rounded-lg border border-success/20 bg-success/10 p-3">
                    <p className="text-xs text-success font-medium">TOP PERFORMER</p>
                    <p className="text-sm font-semibold text-text mt-0.5">{winner.text} - {winner.count} vote{winner.count !== 1 ? 's' : ''}</p>
                  </div>
                )}

                <div className="space-y-3">
                  {(r.ranking?.length ? r.ranking : r.options)?.map((o: any, i: number) => {
                    const total = r.totalVotes || 1
                    const pct = Math.round((o.count / total) * 100)
                    const isTop = i === 0 && o.count > 0
                    return (
                      <div key={o.optionId}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="flex items-center gap-2">
                            {isTop && <Badge tone="success" className="px-2 py-0.5">Top</Badge>}
                            <span className={isTop ? 'font-semibold text-text' : 'text-text/70'}>{o.text}</span>
                          </span>
                          <span className="font-medium text-text">{o.count} ({pct}%)</span>
                        </div>
                        <div className="h-3 rounded-full bg-panel-soft overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${isTop ? 'bg-success' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </Card>
        )
      })}
    </div>
  )
}
