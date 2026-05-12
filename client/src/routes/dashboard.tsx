import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import api, { getToken } from '../lib/api'
import { Badge, Card } from '../components/ui'

interface Poll { id: string; title: string; shareId: string; isPublished: boolean; createdAt: string; expiresAt: string | null }

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
  beforeLoad: () => { if (!getToken()) throw redirect({ to: '/login' }) },
})

function Dashboard() {
  const [polls, setPolls] = useState<Poll[]>([])
  useEffect(() => { api.get('/api/polls').then((r) => setPolls(r.data)) }, [])

  async function togglePublish(p: Poll) {
    await api.patch(`/api/polls/${p.id}`, { isPublished: !p.isPublished })
    setPolls((prev) => prev.map((x) => (x.id === p.id ? { ...x, isPublished: !x.isPublished } : x)))
  }

  async function deletePoll(id: string) {
    await api.delete(`/api/polls/${id}`)
    setPolls((prev) => prev.filter((x) => x.id !== id))
  }

  function copyShareLink(shareId: string) {
    navigator.clipboard.writeText(`${window.location.origin}/p/${shareId}`)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-text">My Polls</h1>
        <Link to="/polls/new" className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors">+ New Poll</Link>
      </div>

      {polls.length === 0 && (
        <div className="text-center py-20 text-text/40">
          <p className="text-lg">No polls yet</p>
          <p className="text-sm mt-1">Create your first poll to get started.</p>
        </div>
      )}

      <div className="space-y-3">
        {polls.map((poll) => (
          <Card key={poll.id} className="flex items-center gap-4 rounded-xl p-4 transition-colors hover:border-primary/30">
            <div className={`w-2 h-10 rounded-full shrink-0 ${poll.isPublished ? 'bg-success' : 'bg-white/20'}`} />
            <div className="flex-1 min-w-0">
              <Link to="/polls/$id" params={{ id: poll.id }} className="font-semibold text-text hover:text-primary transition-colors truncate block">{poll.title}</Link>
              <div className="flex items-center gap-3 mt-1">
                <Badge tone={poll.isPublished ? 'success' : 'neutral'}>{poll.isPublished ? 'Published' : 'Draft'}</Badge>
                {poll.isPublished && (
                  <button onClick={() => copyShareLink(poll.shareId)} className="text-xs text-primary hover:underline cursor-pointer" title="Copy share link">
                    Share: /p/{poll.shareId}
                  </button>
                )}
                {poll.expiresAt && <span className="text-xs text-accent">Expires {new Date(poll.expiresAt).toLocaleDateString()}</span>}
              </div>
            </div>
            <button onClick={() => togglePublish(poll)} className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${poll.isPublished ? 'border-accent/30 text-accent hover:bg-accent/5' : 'border-success/30 text-success hover:bg-success/10'}`}>
              {poll.isPublished ? 'Unpublish' : 'Publish'}
            </button>
            <Link to="/polls/$id/results" params={{ id: poll.id }} className="rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/5 transition-colors">Results</Link>
            <Link to="/polls/$id/analytics" params={{ id: poll.id }} className="rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-medium text-accent hover:bg-primary/5 transition-colors">Analytics</Link>
            <button onClick={() => deletePoll(poll.id)} className="text-xs font-medium text-danger hover:text-danger transition-colors">Delete</button>
          </Card>
        ))}
      </div>
    </div>
  )
}
