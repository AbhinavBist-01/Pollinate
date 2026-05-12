import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import api from '../lib/api'

export const Route = createFileRoute('/polls/$id')({
  component: PollDetail,
  beforeLoad: () => { if (!localStorage.getItem('token')) throw redirect({ to: '/login' }) },
})

function PollDetail() {
  const { id } = Route.useParams()
  const [poll, setPoll] = useState<any>(null)
  useEffect(() => { api.get(`/api/polls/${id}`).then((r) => setPoll(r.data)) }, [id])

  async function togglePublish() {
    await api.patch(`/api/polls/${id}`, { isPublished: !poll.isPublished })
    setPoll((prev: any) => ({ ...prev, isPublished: !prev.isPublished }))
  }

  function copyLink() { navigator.clipboard.writeText(`${window.location.origin}/p/${poll.shareId}`) }

  if (!poll) return <p className="text-center py-20 text-gray-400">Loading...</p>

  const questionCount = poll.questions?.length ?? 0
  const radioCount = poll.questions?.filter((q: any) => q.type === 'radio' || q.type === 'checkbox').length ?? 0

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-charcoal">{poll.title}</h1>
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${poll.isPublished ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
              {poll.isPublished ? 'Published' : 'Draft'}
            </span>
          </div>
          {poll.description && <p className="text-orange mt-1">{poll.description}</p>}
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>{questionCount} question{questionCount !== 1 ? 's' : ''}</span>
            <span>{radioCount} with options</span>
            {poll.createdAt && <span>Created {new Date(poll.createdAt).toLocaleDateString()}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {poll.isPublished && (
            <button onClick={copyLink} className="rounded-lg bg-honey/10 px-4 py-2 text-xs font-medium text-honey hover:bg-honey/20 transition-colors">Copy Link</button>
          )}
          <button onClick={togglePublish} className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors ${poll.isPublished ? 'border border-orange/30 text-orange hover:bg-orange/5' : 'bg-green-500 text-white hover:bg-green-600'}`}>
            {poll.isPublished ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      </div>

      {poll.isPublished && (
        <div className="rounded-xl bg-honey/5 border border-honey/10 p-4 text-sm">
          <span className="text-gray-600">Share link: </span>
          <a href={`/p/${poll.shareId}`} target="_blank" className="text-honey font-medium hover:underline" rel="noreferrer">/p/{poll.shareId}</a>
          <button onClick={copyLink} className="ml-2 text-xs text-orange hover:underline cursor-pointer">Copy</button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Link to="/polls/$id/results" params={{ id }} className="rounded-xl border border-honey/10 bg-white p-4 text-center shadow-sm hover:border-honey/30 transition-colors">
          <p className="font-semibold text-honey">Results</p>
          <p className="text-xs text-gray-500 mt-1">View responses</p>
        </Link>
        <Link to="/polls/$id/analytics" params={{ id }} className="rounded-xl border border-honey/10 bg-white p-4 text-center shadow-sm hover:border-honey/30 transition-colors">
          <p className="font-semibold text-orange">Analytics</p>
          <p className="text-xs text-gray-500 mt-1">Track performance</p>
        </Link>
        <Link to="/polls/$id/edit" params={{ id }} className="rounded-xl border border-honey/10 bg-white p-4 text-center shadow-sm hover:border-honey/30 transition-colors">
          <p className="font-semibold text-charcoal">Edit</p>
          <p className="text-xs text-gray-500 mt-1">Modify poll</p>
        </Link>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-charcoal">Questions</h2>
        {poll.questions?.map((q: any, i: number) => (
          <div key={i} className="rounded-xl border border-honey/10 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <p className="font-medium text-charcoal">{q.text} {q.isRequired && <span className="text-orange">*</span>}</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded bg-honey/10 px-2 py-0.5 text-honey uppercase">{q.type}</span>
                {q.timeLimit && <span className="rounded bg-orange/10 px-2 py-0.5 text-orange">{q.timeLimit}s</span>}
              </div>
            </div>
            {q.type === 'text' ? (
              <p className="text-sm text-gray-400 italic">Free text answer</p>
            ) : (
              <div className="space-y-1 mt-2">
                {q.options?.map((o: any, j: number) => (
                  <div key={j} className="flex items-center gap-2 text-sm text-gray-600">
                    {q.type === 'radio' ? <div className="w-3 h-3 rounded-full border-2 border-gray-300" /> : <div className="w-3 h-3 rounded border-2 border-gray-300" />}
                    {o.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
