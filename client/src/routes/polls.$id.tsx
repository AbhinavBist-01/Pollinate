import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import api, { getToken } from '../lib/api'

interface Poll {
  id: string; title: string; description: string; shareId: string
  isPublished: boolean; expiresAt: string | null; questions: any[]
}

export const Route = createFileRoute('/polls/$id')({
  component: PollDetail,
  beforeLoad: () => {
    if (!getToken()) throw redirect({ to: '/login' })
  },
})

function PollDetail() {
  const { id } = Route.useParams()
  const [poll, setPoll] = useState<Poll | null>(null)

  useEffect(() => { api.get(`/api/polls/${id}`).then((res) => setPoll(res.data)) }, [id])

  if (!poll) return <p>Loading...</p>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold" style={{ color: '#18181B' }}>{poll.title}</h1>
      {poll.description && <p style={{ color: '#FB923C' }}>{poll.description}</p>}
      <div className="flex gap-2">
        <Link to="/polls/$id/results" params={{ id }} className="rounded px-3 py-1 text-sm" style={{ border: '1px solid #F59E0B', color: '#F59E0B' }}>Results</Link>
        <Link to="/polls/$id/analytics" params={{ id }} className="rounded px-3 py-1 text-sm" style={{ border: '1px solid #F59E0B', color: '#F59E0B' }}>Analytics</Link>
        <Link to="/polls/$id/edit" params={{ id }} className="rounded px-3 py-1 text-sm" style={{ border: '1px solid #F59E0B', color: '#F59E0B' }}>Edit</Link>
      </div>
      {poll.isPublished && (
        <p className="text-sm">Share: <a href={`/p/${poll.shareId}`} target="_blank" style={{ color: '#FB923C' }}>/p/{poll.shareId}</a></p>
      )}
      <div className="space-y-3">
        {poll.questions?.map((q: any, i: number) => (
          <div key={i} className="rounded p-3" style={{ border: '1px solid #F59E0B', background: '#FFF7ED' }}>
            <p className="font-medium">{q.text} {q.isRequired && <span style={{ color: '#FB923C' }}>*</span>}</p>
            <p className="text-xs" style={{ color: '#FB923C' }}>{q.type}</p>
            {q.options?.map((o: any, j: number) => (
              <p key={j} className="text-sm ml-4">- {o.text}</p>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
