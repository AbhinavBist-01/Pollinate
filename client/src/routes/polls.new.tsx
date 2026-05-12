import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import api, { getToken } from '../lib/api'
import { Button, Card, Field, Input, Select, Textarea } from '../components/ui'

interface Option { text: string; order: number }
interface Question { text: string; type: 'radio' | 'checkbox' | 'text'; order: number; isRequired: boolean; timeLimit?: number; options: Option[] }

export const Route = createFileRoute('/polls/new')({
  component: PollBuilder,
  beforeLoad: () => { if (!getToken()) throw redirect({ to: '/login' }) },
})

function PollBuilder() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState<Question[]>([
    { text: '', type: 'radio', order: 0, isRequired: true, options: [{ text: '', order: 0 }] },
  ])

  function addQuestion() {
    setQuestions((prev) => [...prev, { text: '', type: 'radio', order: prev.length, isRequired: true, options: [{ text: '', order: 0 }] }])
  }

  function removeQuestion(i: number) {
    setQuestions((prev) => prev.filter((_, idx) => idx !== i))
  }

  function updateQuestion(i: number, field: keyof Question, value: any) {
    setQuestions((prev) => {
      const qs = [...prev]
      if (field === 'type' && (value === 'radio' || value === 'checkbox')) {
        qs[i] = { ...qs[i], type: value, options: qs[i].options.length ? qs[i].options : [{ text: '', order: 0 }] }
      } else if (field === 'type' && value === 'text') {
        qs[i] = { ...qs[i], type: value, options: [] }
      } else {
        qs[i] = { ...qs[i], [field]: value }
      }
      return qs
    })
  }

  function addOption(qi: number) {
    setQuestions((prev) => {
      const qs = [...prev]
      qs[qi] = { ...qs[qi], options: [...qs[qi].options, { text: '', order: qs[qi].options.length }] }
      return qs
    })
  }

  function updateOption(qi: number, oi: number, text: string) {
    setQuestions((prev) => {
      const qs = [...prev]
      qs[qi] = { ...qs[qi], options: qs[qi].options.map((o, idx) => idx === oi ? { ...o, text } : o) }
      return qs
    })
  }

  function removeOption(qi: number, oi: number) {
    setQuestions((prev) => {
      const qs = [...prev]
      qs[qi] = { ...qs[qi], options: qs[qi].options.filter((_, idx) => idx !== oi) }
      return qs
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { data } = await api.post('/api/polls', { title, description, questions })
    navigate({ to: '/polls/$id', params: { id: data.id } })
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <p className="text-sm font-semibold text-accent">Poll builder</p>
        <h1 className="mt-1 text-3xl font-black text-text">Create Poll</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="space-y-4">
          <Field label="Poll title">
            <Input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's your poll about?" required className="text-lg" />
          </Field>
          <Field label="Description (optional)">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Add some context..." />
          </Field>
        </Card>

        {questions.map((q, qi) => (
          <Card key={qi} className="space-y-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_11rem_6rem_auto_auto] lg:items-start">
              <Field label={`Question ${qi + 1}`}>
                <Input type="text" value={q.text} onChange={(e) => updateQuestion(qi, 'text', e.target.value)} placeholder="Enter your question" required />
              </Field>
              <Field label="Type">
                <Select value={q.type} onChange={(e) => updateQuestion(qi, 'type', e.target.value)}>
                  <option value="radio">Single choice</option>
                  <option value="checkbox">Multiple choice</option>
                  <option value="text">Free text</option>
                </Select>
              </Field>
              <Field label="Timer">
                <Input type="number" min={0} max={600} value={q.timeLimit ?? ''} onChange={(e) => updateQuestion(qi, 'timeLimit', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="Off" className="px-2" />
              </Field>
              <label className="flex items-center gap-1.5 pt-8 text-sm text-text/60">
                <input type="checkbox" checked={q.isRequired} onChange={(e) => updateQuestion(qi, 'isRequired', e.target.checked)}
                  className="rounded border-white/20 bg-background text-primary focus:ring-accent" />
                Required
              </label>
              {questions.length > 1 && (
                <button type="button" onClick={() => removeQuestion(qi)} className="pt-8 text-sm font-semibold text-danger transition-colors hover:text-danger/80">Remove</button>
              )}
            </div>

            {(q.type === 'radio' || q.type === 'checkbox') && (
              <div className="space-y-2">
                {q.options.map((o, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    {q.type === 'radio' ? <div className="h-4 w-4 shrink-0 rounded-full border-2 border-white/25" /> : <div className="h-4 w-4 shrink-0 rounded border-2 border-white/25" />}
                    <Input type="text" value={o.text} onChange={(e) => updateOption(qi, oi, e.target.value)} className="flex-1 py-2" placeholder={`Option ${oi + 1}`} required />
                    {q.options.length > 1 && (
                      <button type="button" onClick={() => removeOption(qi, oi)} className="text-sm font-semibold text-text/40 transition-colors hover:text-danger">X</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => addOption(qi)} className="ml-7 text-sm font-semibold text-accent transition-colors hover:text-accent/80">+ Add option</button>
              </div>
            )}
          </Card>
        ))}

        <button type="button" onClick={addQuestion} className="w-full rounded-xl border-2 border-dashed border-primary/30 py-4 text-sm font-semibold text-primary transition-colors hover:border-primary/50 hover:bg-primary/5">
          + Add question
        </button>
        <Button type="submit" className="w-full">Create Poll</Button>
      </form>
    </div>
  )
}
