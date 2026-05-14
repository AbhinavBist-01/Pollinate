import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import api, { getToken } from '../lib/api'

interface Option { text: string; order: number }
interface Question { text: string; type: 'radio' | 'checkbox' | 'text'; order: number; isRequired: boolean; timeLimit?: number; options: Option[] }

export const Route = createFileRoute('/polls/$id_/edit')({
  component: EditPoll,
  beforeLoad: () => { if (!getToken()) throw redirect({ to: '/login' }) },
})

function EditPoll() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/api/polls/${id}`).then((r) => {
      setTitle(r.data.title)
      setDescription(r.data.description || '')
      setQuestions(r.data.questions?.map((q: any) => ({
        text: q.text, type: q.type, order: q.order, isRequired: q.isRequired,
        timeLimit: q.timeLimit ?? undefined,
        options: q.options?.map((o: any) => ({ text: o.text, order: o.order })) ?? [],
      })) ?? [])
      setLoading(false)
    })
  }, [id])

  function addQuestion() { setQuestions((prev) => [...prev, { text: '', type: 'radio', order: prev.length, isRequired: true, options: [{ text: '', order: 0 }] }]) }
  function removeQuestion(i: number) { setQuestions((prev) => prev.filter((_, idx) => idx !== i)) }
  function updateQuestion(i: number, field: keyof Question, value: any) {
    setQuestions((prev) => {
      const qs = [...prev]
      if (field === 'type' && (value === 'radio' || value === 'checkbox')) qs[i] = { ...qs[i], type: value, options: qs[i].options.length ? qs[i].options : [{ text: '', order: 0 }] }
      else if (field === 'type' && value === 'text') qs[i] = { ...qs[i], type: value, options: [] }
      else qs[i] = { ...qs[i], [field]: value }
      return qs
    })
  }
  function addOption(qi: number) { setQuestions((prev) => { const qs = [...prev]; qs[qi] = { ...qs[qi], options: [...qs[qi].options, { text: '', order: qs[qi].options.length }] }; return qs }) }
  function updateOption(qi: number, oi: number, text: string) { setQuestions((prev) => { const qs = [...prev]; qs[qi] = { ...qs[qi], options: qs[qi].options.map((o, idx) => idx === oi ? { ...o, text } : o) }; return qs }) }
  function removeOption(qi: number, oi: number) { setQuestions((prev) => { const qs = [...prev]; qs[qi] = { ...qs[qi], options: qs[qi].options.filter((_, idx) => idx !== oi) }; return qs }) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Only send title/description if no questions changed
    const hasQuestionChanges = JSON.stringify(questions) !== JSON.stringify(
      (await api.get(`/api/polls/${id}`)).data.questions?.map((q: any) => ({
        text: q.text, type: q.type, order: q.order, isRequired: q.isRequired,
        timeLimit: q.timeLimit ?? undefined,
        options: q.options?.map((o: any) => ({ text: o.text, order: o.order })) ?? [],
      }))
    )

    const body: any = { title, description }
    if (hasQuestionChanges) body.questions = questions
    await api.patch(`/api/polls/${id}`, body)
    navigate({ to: '/polls/$id', params: { id } })
  }

  if (loading) return <p className="text-center py-20 text-white/30">Loading...</p>

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Edit Poll</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-white/70">Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-honey focus:outline-none focus:ring-1 focus:ring-honey" required />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-white/70">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-honey focus:outline-none focus:ring-1 focus:ring-honey" rows={2} />
          </div>
        </div>

        {questions.map((q, qi) => (
          <div key={qi} className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-1">
                <label className="text-sm font-medium text-white/70">Question {qi + 1}</label>
                <input type="text" value={q.text} onChange={(e) => updateQuestion(qi, 'text', e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-honey focus:outline-none focus:ring-1 focus:ring-honey" placeholder="Enter your question" required />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-white/40">Type</label>
                <select value={q.type} onChange={(e) => updateQuestion(qi, 'type', e.target.value)}
                  className="rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white focus:border-honey focus:outline-none">
                  <option value="radio">Single choice</option>
                  <option value="checkbox">Multiple choice</option>
                  <option value="text">Free text</option>
                </select>
              </div>
              <div className="space-y-1 w-20">
                <label className="text-xs text-white/40">Timer (s)</label>
                <input type="number" min={0} max={600} value={q.timeLimit ?? ''} onChange={(e) => updateQuestion(qi, 'timeLimit', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full rounded-lg border border-white/10 bg-black/20 px-2 py-2.5 text-sm text-white focus:border-honey focus:outline-none" placeholder="Off" />
              </div>
              <label className="flex items-center gap-1.5 pt-6 text-sm text-white/50">
                <input type="checkbox" checked={q.isRequired} onChange={(e) => updateQuestion(qi, 'isRequired', e.target.checked)}
                  className="rounded border-white/20 bg-white/5 text-honey focus:ring-honey" />
                Required
              </label>
              {questions.length > 1 && (
                <button type="button" onClick={() => removeQuestion(qi)} className="pt-6 text-sm text-red-400/60 hover:text-red-400 transition-colors">Remove</button>
              )}
            </div>
            {(q.type === 'radio' || q.type === 'checkbox') && (
              <div className="ml-2 space-y-2">
                {q.options.map((o, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    {q.type === 'radio' ? <div className="w-4 h-4 rounded-full border-2 border-white/20 shrink-0" /> : <div className="w-4 h-4 rounded border-2 border-white/20 shrink-0" />}
                    <input type="text" value={o.text} onChange={(e) => updateOption(qi, oi, e.target.value)}
                      className="flex-1 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-honey focus:outline-none" placeholder={`Option ${oi + 1}`} required />
                    {q.options.length > 1 && (
                      <button type="button" onClick={() => removeOption(qi, oi)} className="text-sm text-white/30 hover:text-red-400 transition-colors">✕</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => addOption(qi)} className="text-sm text-honey/70 hover:text-honey transition-colors ml-7">+ Add option</button>
              </div>
            )}
          </div>
        ))}

        <button type="button" onClick={addQuestion} className="w-full rounded-xl border-2 border-dashed border-white/10 py-4 text-sm font-medium text-white/40 hover:border-honey/30 hover:text-honey transition-colors">
          + Add question
        </button>

        <div className="flex gap-3">
          <button type="submit" className="flex-1 rounded-xl bg-honey py-3 text-sm font-medium text-white hover:bg-honey/90 transition-colors">Save changes</button>
        </div>
      </form>
    </div>
  )
}
