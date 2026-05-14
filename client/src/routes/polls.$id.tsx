import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import api, { getToken } from '../lib/api'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'

export const Route = createFileRoute('/polls/$id')({
  component: PollDetail,
  beforeLoad: () => { if (!getToken()) throw redirect({ to: '/login' }) },
})

function PollDetail() {
  const { id } = Route.useParams()
  const [poll, setPoll] = useState<any>(null)
  useEffect(() => { api.get(`/api/polls/${id}`).then((r) => setPoll(r.data)) }, [id])

  async function togglePublish() {
    setPoll((prev: any) => prev ? { ...prev, isPublished: !prev.isPublished } : prev)
    try {
      await api.patch(`/api/polls/${id}`, { isPublished: !poll?.isPublished })
    } catch {
      setPoll((prev: any) => prev ? { ...prev, isPublished: !prev.isPublished } : prev)
    }
  }

  function copyLink() { navigator.clipboard.writeText(`${window.location.origin}/p/${poll.shareId}`) }

  if (!poll) return <p className="py-20 text-center text-muted-foreground">Loading...</p>

  const questionCount = poll.questions?.length ?? 0
  const radioCount = poll.questions?.filter((q: any) => q.type === 'radio' || q.type === 'checkbox').length ?? 0

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black text-foreground">{poll.title}</h1>
            <Badge variant={poll.isPublished ? 'default' : 'outline'}>{poll.isPublished ? 'Published' : 'Draft'}</Badge>
          </div>
          {poll.description && <p className="mt-2 text-primary/80">{poll.description}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span>{questionCount} question{questionCount !== 1 ? 's' : ''}</span>
            <span>{radioCount} with options</span>
            {poll.createdAt && <span>Created {new Date(poll.createdAt).toLocaleDateString()}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {poll.isPublished && <Button variant="outline" onClick={copyLink}>Copy Link</Button>}
          <Button onClick={togglePublish} variant={poll.isPublished ? 'outline' : 'default'}>
            {poll.isPublished ? 'Unpublish' : 'Publish'}
          </Button>
        </div>
      </div>

      {poll.isPublished && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-wrap items-center gap-2 p-4 text-sm">
            <span className="text-muted-foreground">Share link:</span>
            <a href={`/p/${poll.shareId}`} className="font-medium text-primary hover:underline">/p/{poll.shareId}</a>
            <Button variant="ghost" size="sm" onClick={copyLink}>Copy</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="border-white/10 bg-card/90 transition-colors hover:border-primary/35">
          <Link to="/polls/$id/results" params={{ id }} className="block p-5 text-center">
            <p className="font-semibold text-foreground">Results</p>
            <p className="mt-1 text-sm text-muted-foreground">View responses</p>
          </Link>
        </Card>
        <Card className="border-white/10 bg-card/90 transition-colors hover:border-primary/35">
          <Link to="/polls/$id/analytics" params={{ id }} className="block p-5 text-center">
            <p className="font-semibold text-foreground">Analytics</p>
            <p className="mt-1 text-sm text-muted-foreground">Track performance</p>
          </Link>
        </Card>
        <Card className="border-white/10 bg-card/90 transition-colors hover:border-primary/35">
          <Link to="/polls/$id/edit" params={{ id }} className="block p-5 text-center">
            <p className="font-semibold text-foreground">Edit</p>
            <p className="mt-1 text-sm text-muted-foreground">Modify poll</p>
          </Link>
        </Card>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-foreground">Questions</h2>
        {poll.questions?.map((q: any, i: number) => (
          <Card key={i} className="border-white/10 bg-card/90">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <CardTitle>{q.text} {q.isRequired && <span className="text-primary">*</span>}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="uppercase">{q.type}</Badge>
                  {q.timeLimit && <Badge variant="outline">{q.timeLimit}s</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {q.type === 'text' ? (
                <p className="rounded-lg border border-white/10 bg-secondary/40 px-4 py-3 text-sm text-muted-foreground italic">Free text answer</p>
              ) : (
                <div className="space-y-2">
                  {q.options?.map((o: any, j: number) => (
                    <div key={j} className="flex items-center gap-2 rounded-lg border border-white/10 bg-secondary/30 px-3 py-2 text-sm text-muted-foreground">
                      <span className={`size-3 border border-white/25 ${q.type === 'radio' ? 'rounded-full' : 'rounded'}`} />
                      {o.text}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
