import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import api from '../lib/api'

export const Route = createFileRoute('/p/$shareId')({
  component: Respond,
})

function Respond() {
  const { shareId } = Route.useParams()
  const [poll, setPoll] = useState<any>(null)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/api/public/polls/${shareId}`).then((res) => setPoll(res.data)).catch(() => setError('Poll not found or expired'))
  }, [shareId])

  function setOption(questionId: string, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: { questionId, optionId } }))
  }

  function toggleOption(questionId: string, optionId: string) {
    setAnswers((prev) => {
      if (prev[questionId]?.optionId === optionId) {
        return { ...prev, [questionId]: undefined }
      }
      return { ...prev, [questionId]: { questionId, optionId } }
    })
  }

  function setText(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: { questionId, value } }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const answerList = Object.values(answers).filter(Boolean)
      await api.post(`/api/public/polls/${shareId}/respond`, { answers: answerList })
      setSubmitted(true)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit')
    }
  }

  if (error) return <div className="text-center py-20"><p style={{ color: '#FB923C' }}>{error}</p></div>
  if (submitted) return <div className="text-center py-20"><h1 className="text-2xl font-bold">Response submitted!</h1><p className="text-gray-600">Thank you.</p></div>
  if (!poll) return <p className="text-center py-20">Loading...</p>

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: '#18181B' }}>{poll.title}</h1>
      {poll.description && <p style={{ color: '#FB923C' }}>{poll.description}</p>}

      {poll.questions?.map((q: any) => (
        <div key={q.id} className="rounded p-4 space-y-2" style={{ border: '1px solid #F59E0B', background: '#FFF7ED' }}>
          <p className="font-medium">{q.text} {q.isRequired && <span style={{ color: '#FB923C' }}>*</span>}</p>
          {q.type === 'text' ? (
            <textarea onChange={(e) => setText(q.id, e.target.value)}
              className="w-full rounded px-3 py-2" rows={3} required={q.isRequired} style={{ border: '1px solid #FB923C' }} />
          ) : q.type === 'checkbox' ? (
            q.options?.map((o: any) => (
              <label key={o.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" onChange={() => toggleOption(q.id, o.id)} />
                {o.text}
              </label>
            ))
          ) : (
            q.options?.map((o: any) => (
              <label key={o.id} className="flex items-center gap-2 text-sm">
                <input type="radio" name={q.id} onChange={() => setOption(q.id, o.id)} required={q.isRequired} />
                {o.text}
              </label>
            ))
          )}
        </div>
      ))}

      <button type="submit" className="w-full rounded py-2 text-white" style={{ background: '#F59E0B' }}>Submit</button>
    </form>
  )
}
