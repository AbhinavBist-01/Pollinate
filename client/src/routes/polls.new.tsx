import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import api, { getToken } from '../lib/api'

interface Option { text: string; order: number }
interface Question { text: string; type: 'radio' | 'checkbox' | 'text'; order: number; isRequired: boolean; options: Option[] }

export const Route = createFileRoute('/polls/new')({
  component: PollBuilder,
  beforeLoad: () => {
    if (!getToken()) throw redirect({ to: '/login' })
  },
})

function PollBuilder() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState<Question[]>([
    { text: '', type: 'radio', order: 0, isRequired: true, options: [{ text: '', order: 0 }] },
  ])

  function addQuestion() {
    setQuestions([...questions, { text: '', type: 'radio', order: questions.length, isRequired: true, options: [{ text: '', order: 0 }] }])
  }

  function updateQuestion(i: number, field: keyof Question, value: any) {
    const qs = [...questions]
    if (field === 'type' && (value === 'radio' || value === 'checkbox') && (!qs[i].options || qs[i].options.length === 0)) {
      qs[i] = { ...qs[i], type: value, options: [{ text: '', order: 0 }] }
    } else if (field === 'type' && value === 'text') {
      qs[i] = { ...qs[i], type: value, options: [] }
    } else {
      qs[i] = { ...qs[i], [field]: value }
    }
    setQuestions(qs)
  }

  function addOption(qi: number) {
    const qs = [...questions]
    qs[qi] = { ...qs[qi], options: [...qs[qi].options, { text: '', order: qs[qi].options.length }] }
    setQuestions(qs)
  }

  function updateOption(qi: number, oi: number, text: string) {
    const qs = [...questions]
    qs[qi] = { ...qs[qi], options: qs[qi].options.map((o, idx) => (idx === oi ? { ...o, text } : o)) }
    setQuestions(qs)
  }

  function removeOption(qi: number, oi: number) {
    const qs = [...questions]
    qs[qi] = { ...qs[qi], options: qs[qi].options.filter((_, idx) => idx !== oi) }
    setQuestions(qs)
  }

  function removeQuestion(i: number) {
    setQuestions(questions.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { data } = await api.post('/api/polls', { title, description, questions })
    navigate({ to: '/polls/$id', params: { id: data.id } })
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: '#18181B' }}>Create Poll</h1>
      <input type="text" placeholder="Poll title" value={title} onChange={(e) => setTitle(e.target.value)}
        className="w-full rounded px-3 py-2 text-lg" required style={{ border: '1px solid #F59E0B' }} />
      <textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)}
        className="w-full rounded px-3 py-2" rows={2} style={{ border: '1px solid #F59E0B' }} />

      {questions.map((q, qi) => (
        <div key={qi} className="space-y-2 rounded p-4" style={{ border: '1px solid #F59E0B', background: '#FFF7ED' }}>
          <div className="flex items-center gap-2">
            <input type="text" placeholder="Question text" value={q.text}
              onChange={(e) => updateQuestion(qi, 'text', e.target.value)}
              className="flex-1 rounded px-2 py-1" required style={{ border: '1px solid #FB923C' }} />
            <select value={q.type} onChange={(e) => updateQuestion(qi, 'type', e.target.value)}
              className="rounded px-2 py-1 text-sm" style={{ border: '1px solid #FB923C' }}>
              <option value="radio">Radio</option>
              <option value="checkbox">Checkbox</option>
              <option value="text">Text</option>
            </select>
            <label className="flex items-center gap-1 text-sm">
              <input type="checkbox" checked={q.isRequired} onChange={(e) => updateQuestion(qi, 'isRequired', e.target.checked)} />
              Required
            </label>
            {questions.length > 1 && (
              <button type="button" onClick={() => removeQuestion(qi)} className="text-sm" style={{ color: '#FB923C' }}>Remove</button>
            )}
          </div>
          {(q.type === 'radio' || q.type === 'checkbox') && (
            <div className="ml-4 space-y-1">
              {q.options.map((o, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <input type="text" placeholder={`Option ${oi + 1}`} value={o.text}
                    onChange={(e) => updateOption(qi, oi, e.target.value)}
                    className="flex-1 rounded px-2 py-1 text-sm" required style={{ border: '1px solid #FB923C' }} />
                  {q.options.length > 1 && (
                    <button type="button" onClick={() => removeOption(qi, oi)} className="text-xs" style={{ color: '#FB923C' }}>X</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => addOption(qi)} className="text-sm" style={{ color: '#F59E0B' }}>+ Add option</button>
            </div>
          )}
        </div>
      ))}

      <button type="button" onClick={addQuestion} className="w-full rounded border border-dashed py-2 text-sm" style={{ borderColor: '#F59E0B', color: '#F59E0B' }}>
        + Add question
      </button>
      <button type="submit" className="w-full rounded py-2 text-white" style={{ background: '#F59E0B' }}>
        Create Poll
      </button>
    </form>
  )
}
