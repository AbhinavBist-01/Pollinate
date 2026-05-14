import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import api, { getToken } from '../lib/api'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'

export const Route = createFileRoute('/polls/$id_/edit')({
  component: EditPoll,
  beforeLoad: () => { if (!getToken()) throw redirect({ to: '/login' }) },
})

function EditPoll() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/api/polls/${id}`).then((r) => { setTitle(r.data.title); setDescription(r.data.description || ''); setLoading(false) })
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await api.patch(`/api/polls/${id}`, { title, description })
    navigate({ to: '/polls/$id', params: { id } })
  }

  if (loading) return <p className="py-20 text-center text-muted-foreground">Loading...</p>

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="border-white/10 bg-card/90">
        <CardHeader>
          <CardTitle className="text-2xl font-black">Edit Poll</CardTitle>
          <CardDescription>Update the public title and supporting description.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground/80">Title</span>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground/80">Description</span>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
            </label>
            <Button type="submit" size="lg">Save changes</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
