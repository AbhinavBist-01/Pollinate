import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import api, { getToken } from '../lib/api'
import { Button, Card, Field, Input, Textarea } from '../components/ui'

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

  if (loading) return <p className="text-center py-20 text-text/40">Loading...</p>

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-text mb-6">Edit Poll</h1>
      <Card as="form" onSubmit={handleSubmit} className="space-y-5">
        <Field label="Title">
          <Input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </Field>
        <Field label="Description">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </Field>
        <Button type="submit">Save changes</Button>
      </Card>
    </div>
  )
}
