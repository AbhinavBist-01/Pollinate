import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import api, { getToken } from '../lib/api'

export const Route = createFileRoute('/polls/$id_/edit')({
  component: EditPoll,
  beforeLoad: () => {
    if (!getToken()) throw redirect({ to: '/login' })
  },
})

function EditPoll() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/api/polls/${id}`).then((res) => {
      setTitle(res.data.title)
      setDescription(res.data.description || '')
      setLoading(false)
    })
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await api.patch(`/api/polls/${id}`, { title, description })
    navigate({ to: '/polls/$id', params: { id } })
  }

  if (loading) return <p>Loading...</p>

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold" style={{ color: '#18181B' }}>Edit Poll</h1>
      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
        className="w-full rounded px-3 py-2" required style={{ border: '1px solid #F59E0B' }} />
      <textarea value={description} onChange={(e) => setDescription(e.target.value)}
        className="w-full rounded px-3 py-2" rows={2} style={{ border: '1px solid #F59E0B' }} />
      <button type="submit" className="rounded px-4 py-2 text-white" style={{ background: '#F59E0B' }}>Save</button>
    </form>
  )
}
