import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import api, { getToken } from '../lib/api'

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

  function copyLink(shareId: string) {
    navigator.clipboard.writeText(`${window.location.origin}/p/${shareId}`)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">My Polls</h1>
        <Link to="/polls/new" className="rounded-lg bg-honey px-5 py-2 text-sm font-medium text-white hover:bg-honey/90 transition-colors">+ New Poll</Link>
      </div>

      {polls.length === 0 && (
        <div className="text-center py-20 text-white/20">
          <p className="text-lg">No polls yet</p>
          <p className="text-sm mt-1">Create your first poll to get started.</p>
        </div>
      )}

      <div className="space-y-3">
        {polls.map((poll) => (
          <div key={poll.id} className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 hover:border-honey/30 transition-colors">
            <div className={`w-2 h-10 rounded-full shrink-0 ${poll.isPublished ? 'bg-green-400' : 'bg-white/20'}`} />
            <div className="flex-1 min-w-0">
              <Link to="/polls/$id" params={{ id: poll.id }} className="font-semibold text-white hover:text-honey transition-colors truncate block">{poll.title}</Link>
              <div className="flex items-center gap-3 mt-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${poll.isPublished ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white/30'}`}>
                  {poll.isPublished ? 'Published' : 'Draft'}
                </span>
                {poll.isPublished && (
                  <button onClick={() => copyLink(poll.shareId)} className="text-xs text-honey/70 hover:text-honey cursor-pointer" title="Copy share link">
                    /p/{poll.shareId}
                  </button>
                )}
                {poll.expiresAt && <span className="text-xs text-orange/70">Expires {new Date(poll.expiresAt).toLocaleDateString()}</span>}
              </div>
            </div>
            <button onClick={() => togglePublish(poll)} className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${poll.isPublished ? 'border-orange/20 text-orange/70 hover:border-orange/40' : 'border-green-500/20 text-green-400 hover:border-green-500/40'}`}>
              {poll.isPublished ? 'Unpublish' : 'Publish'}
            </button>
            <Link to="/polls/$id/results" params={{ id: poll.id }} className="rounded-lg border border-honey/20 px-3 py-1.5 text-xs font-medium text-honey/70 hover:border-honey/40 transition-colors">Results</Link>
            <Link to="/polls/$id/analytics" params={{ id: poll.id }} className="rounded-lg border border-honey/20 px-3 py-1.5 text-xs font-medium text-orange/70 hover:border-honey/40 transition-colors">Analytics</Link>
            <button onClick={() => deletePoll(poll.id)} className="text-xs font-medium text-red-400/60 hover:text-red-400 transition-colors">Delete</button>
          </div>
        ))}
      </div>
    </div>
  )
}
