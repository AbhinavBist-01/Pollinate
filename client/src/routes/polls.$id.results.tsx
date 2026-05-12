import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import api, { getToken } from '../lib/api'

export const Route = createFileRoute('/polls/$id/results')({
  component: Results,
  beforeLoad: () => {
    if (!getToken()) throw redirect({ to: '/login' })
  },
})

function Results() {
  const { id } = Route.useParams()
  const [data, setData] = useState<any>(null)

  useEffect(() => { api.get(`/api/polls/${id}/results`).then((res) => setData(res.data)) }, [id])

  if (!data) return <p>Loading...</p>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: '#18181B' }}>Results</h1>
      <p className="text-sm" style={{ color: '#FB923C' }}>Total responses: {data.totalResponses}</p>
      {data.results?.map((r: any) => (
        <div key={r.questionId} className="rounded p-4" style={{ border: '1px solid #F59E0B', background: '#FFF7ED' }}>
          <p className="font-medium mb-2">{r.questionText}</p>
          {r.type === 'text' ? (
            <div className="space-y-1">
              {r.answers?.map((a: string, i: number) => <p key={i} className="text-sm p-2 rounded" style={{ background: '#FFF7ED', border: '1px solid #FB923C' }}>- {a}</p>)}
            </div>
          ) : (
            <div className="space-y-2">
              {r.options?.map((o: any) => (
                <div key={o.optionId} className="flex items-center gap-2">
                  <span className="text-sm w-40 truncate">{o.text}</span>
                  <div className="flex-1 rounded h-5" style={{ background: '#FFF7ED' }}>
                    <div className="h-5 rounded" style={{ width: `${data.totalResponses ? (o.count / data.totalResponses) * 100 : 0}%`, background: '#F59E0B' }} />
                  </div>
                  <span className="text-sm w-8 text-right">{o.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
