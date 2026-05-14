import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import api, { getToken } from '../lib/api'
import { Badge } from '#/components/ui/badge'
import { Card, CardContent } from '#/components/ui/card'

export const Route = createFileRoute('/polls/$id/results')({
  component: Results,
  beforeLoad: () => { if (!getToken()) throw redirect({ to: '/login' }) },
})

function Results() {
  const { id } = Route.useParams()
  const [data, setData] = useState<any>(null)
  useEffect(() => { api.get(`/api/polls/${id}/results`).then((r) => setData(r.data)) }, [id])
  if (!data) return <p className="py-20 text-center text-muted-foreground">Loading...</p>

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">{data.title || 'Results'}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{data.totalResponses} total response{data.totalResponses !== 1 ? 's' : ''}</p>
        </div>
        <Badge>{data.totalResponses}</Badge>
      </div>

      {data.results?.map((r: any) => {
        const winner = r.topOption
        return (
          <Card key={r.questionId} className="border-white/10 bg-card/90">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-foreground">{r.questionText}</h3>
                <span className="text-xs text-muted-foreground">{r.totalVotes} vote{r.totalVotes !== 1 ? 's' : ''}</span>
              </div>

              {r.type === 'text' ? (
                <div className="space-y-2">
                  {r.answers?.length ? r.answers.map((a: string, i: number) => (
                    <p key={i} className="rounded-lg border border-white/10 bg-secondary/40 px-4 py-2 text-sm text-muted-foreground">- {a}</p>
                  )) : <p className="text-sm italic text-muted-foreground">No text responses yet</p>}
                </div>
              ) : (
                <>
                  {winner && (
                    <div className="mb-4 rounded-lg border border-primary/20 bg-primary/10 p-3">
                      <p className="text-xs font-semibold text-primary">TOP PERFORMER</p>
                      <p className="mt-0.5 text-sm font-semibold text-foreground">{winner.text} - {winner.count} vote{winner.count !== 1 ? 's' : ''}</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    {(r.ranking?.length ? r.ranking : r.options)?.map((o: any, i: number) => {
                      const total = r.totalVotes || 1
                      const pct = Math.round((o.count / total) * 100)
                      const isTop = i === 0 && o.count > 0
                      return (
                        <div key={o.optionId}>
                          <div className="mb-1 flex justify-between text-sm">
                            <span className="flex items-center gap-2">
                              {isTop && <span className="text-xs font-semibold text-primary">*</span>}
                              <span className={isTop ? 'font-semibold text-foreground' : 'text-muted-foreground'}>{o.text}</span>
                            </span>
                            <span className="font-medium text-foreground">{o.count} ({pct}%)</span>
                          </div>
                          <div className="h-3 overflow-hidden rounded-full bg-secondary">
                            <div className={`h-full rounded-full transition-all ${isTop ? 'bg-primary' : 'bg-orange/50'}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
