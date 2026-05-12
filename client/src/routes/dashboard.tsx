import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import api, { getToken } from '../lib/api'

interface Poll {
  id: string; title: string; shareId: string
  isPublished: boolean; createdAt: string; expiresAt: string | null
}

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
  beforeLoad: () => {
    if (!getToken()) throw redirect({ to: '/login' })
  },
})

function Dashboard() {
  const [polls, setPolls] = useState<Poll[]>([])

  useEffect(() => { api.get('/api/polls').then((res) => setPolls(res.data)) }, [])

  async function togglePublish(poll: Poll) {
    await api.patch(`/api/polls/${poll.id}`, { isPublished: !poll.isPublished })
    setPolls(polls.map((p) => (p.id === poll.id ? { ...p, isPublished: !p.isPublished } : p)))
  }

  async function deletePoll(id: string) {
    await api.delete(`/api/polls/${id}`)
    setPolls(polls.filter((p) => p.id !== id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#18181B' }}>My Polls</h1>
        <Link to="/polls/new" className="rounded px-4 py-2 text-sm text-white" style={{ background: '#F59E0B' }}>Create Poll</Link>
      </div>
      {polls.length === 0 && <p className="text-gray-500">No polls yet. Create one!</p>}
      <div className="space-y-3">
        {polls.map((poll) => (
          <div key={poll.id} className="flex items-center gap-4 rounded p-4" style={{ border: '1px solid #F59E0B', background: '#FFF7ED' }}>
            <div className="flex-1">
              <Link to="/polls/$id" params={{ id: poll.id }} className="font-semibold hover:underline">{poll.title}</Link>
              <p className="text-xs" style={{ color: '#FB923C' }}>
                {poll.isPublished ? (
                  <>Share: <a href={`/p/${poll.shareId}`} target="_blank" style={{ color: '#F59E0B' }}>/p/{poll.shareId}</a></>
                ) : 'Draft'}
                {poll.expiresAt && ` · Expires ${new Date(poll.expiresAt).toLocaleDateString()}`}
              </p>
            </div>
            <button onClick={() => togglePublish(poll)} className="text-xs rounded px-2 py-1" style={{ border: '1px solid #F59E0B', color: '#F59E0B' }}>
              {poll.isPublished ? 'Unpublish' : 'Publish'}
            </button>
            <Link to="/polls/$id/results" params={{ id: poll.id }} className="text-xs rounded px-2 py-1" style={{ border: '1px solid #F59E0B', color: '#FB923C' }}>Results</Link>
            <Link to="/polls/$id/analytics" params={{ id: poll.id }} className="text-xs rounded px-2 py-1" style={{ border: '1px solid #F59E0B', color: '#FB923C' }}>Analytics</Link>
            <button onClick={() => deletePoll(poll.id)} className="text-xs" style={{ color: '#FB923C' }}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  )
}
