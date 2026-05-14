import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import api, { getToken } from '../lib/api'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'

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
      if (field === 'type' && (value === 'radio' || value === 'checkbox')) qs[i] = { ...qs[i], type: value, options: qs[i].options.length ? qs[i].options : [{ text: '', order: 0 }] }
      else if (field === 'type' && value === 'text') qs[i] = { ...qs[i], type: value, options: [] }
      else qs[i] = { ...qs[i], [field]: value }
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
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/80">Builder</p>
        <h1 className="mt-2 text-3xl font-black text-foreground">Create Poll</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="border-white/10 bg-card/90">
          <CardHeader>
            <CardTitle>Poll details</CardTitle>
            <CardDescription>Give your poll a clear title and short context.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground/80">Poll title</span>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's your poll about?" required />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground/80">Description</span>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Add context for responders..." />
            </label>
          </CardContent>
        </Card>

        {questions.map((q, qi) => (
          <Card key={qi} className="border-white/10 bg-card/90">
            <CardHeader>
              <CardTitle>Question {qi + 1}</CardTitle>
              <CardDescription>{q.type === 'text' ? 'Free text response' : 'Choice based response'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 lg:grid-cols-[1fr_12rem_7rem_auto_auto] lg:items-end">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-foreground/80">Question</span>
                  <Input value={q.text} onChange={(e) => updateQuestion(qi, 'text', e.target.value)} placeholder="Enter your question" required />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-foreground/80">Type</span>
                  <Select value={q.type} onValueChange={(value) => updateQuestion(qi, 'type', value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="radio">Single choice</SelectItem>
                      <SelectItem value="checkbox">Multiple choice</SelectItem>
                      <SelectItem value="text">Free text</SelectItem>
                    </SelectContent>
                  </Select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-foreground/80">Timer</span>
                  <Input type="number" min={0} max={600} value={q.timeLimit ?? ''} onChange={(e) => updateQuestion(qi, 'timeLimit', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="Off" />
                </label>
                <label className="flex items-center gap-2 pb-2 text-sm text-muted-foreground">
                  <input type="checkbox" checked={q.isRequired} onChange={(e) => updateQuestion(qi, 'isRequired', e.target.checked)} />
                  Required
                </label>
                {questions.length > 1 && <Button type="button" variant="destructive" onClick={() => removeQuestion(qi)}>Remove</Button>}
              </div>

              {(q.type === 'radio' || q.type === 'checkbox') && (
                <div className="space-y-2 rounded-xl border border-white/10 bg-secondary/30 p-3">
                  {q.options.map((o, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <span className={`size-4 shrink-0 border border-white/25 ${q.type === 'radio' ? 'rounded-full' : 'rounded'}`} />
                      <Input value={o.text} onChange={(e) => updateOption(qi, oi, e.target.value)} placeholder={`Option ${oi + 1}`} required />
                      {q.options.length > 1 && <Button type="button" variant="ghost" onClick={() => removeOption(qi, oi)}>X</Button>}
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={() => addOption(qi)}>+ Add option</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        <Button type="button" variant="outline" size="lg" className="w-full border-dashed" onClick={addQuestion}>+ Add question</Button>
        <Button type="submit" size="lg" className="w-full">Create Poll</Button>
      </form>
    </div>
  )
}
