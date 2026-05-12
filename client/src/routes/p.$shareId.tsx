import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef, useCallback } from 'react'
import api from '../lib/api'

export const Route = createFileRoute('/p/$shareId')({ component: PublicResponse })

function PublicResponse() {
  const { shareId } = Route.useParams()
  const [poll, setPoll] = useState<any>(null)
  const [answers, setAnswers] = useState<Record<string, any[]>>({})
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    api.get(`/api/public/polls/${shareId}`).then((r) => setPoll(r.data)).catch(() => setError('Poll not found or expired'))
  }, [shareId])

  const questions = poll?.questions ?? []
  const current = questions[currentIdx]
  const isLast = currentIdx === questions.length - 1

  const startTimer = useCallback((seconds: number | null) => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!seconds) { setTimeLeft(null); return }
    setTimeLeft(seconds)
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) { clearInterval(timerRef.current!); return 0 }
        return prev - 1
      })
    }, 1000)
  }, [])

  useEffect(() => {
    if (current) startTimer(current.timeLimit ?? null)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [current, startTimer])

  useEffect(() => {
    if (timeLeft === 0 && current) {
      handleNext()
    }
  }, [timeLeft])

  function setOption(qId: string, optId: string) {
    setAnswers((prev) => ({ ...prev, [qId]: [{ questionId: qId, optionId: optId }] }))
  }

  function toggleOption(qId: string, optId: string) {
    setAnswers((prev) => {
      const current = prev[qId] ?? []
      const exists = current.some((a) => a.optionId === optId)
      return {
        ...prev,
        [qId]: exists ? current.filter((a) => a.optionId !== optId) : [...current, { questionId: qId, optionId: optId }],
      }
    })
  }

  function setText(qId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [qId]: [{ questionId: qId, value }] }))
  }

  function handleNext() {
    if (isLast) {
      handleSubmit()
    } else {
      setCurrentIdx((prev) => prev + 1)
    }
  }

  async function handleSubmit() {
    const allAnswers = Object.values(answers).flat().filter(Boolean)
    try {
      await api.post(`/api/public/polls/${shareId}/respond`, { answers: allAnswers })
      setSubmitted(true)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit')
    }
  }

  if (error) return <div className="flex items-center justify-center min-h-screen bg-cream"><div className="text-center"><p className="text-orange text-lg">{error}</p></div></div>
  if (submitted) return (
    <div className="flex items-center justify-center min-h-screen bg-cream">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
          <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h1 className="text-3xl font-bold text-charcoal">You're done!</h1>
        <p className="text-orange mt-2 text-lg">Your responses have been recorded.</p>
      </div>
    </div>
  )
  if (!poll) return <div className="flex items-center justify-center min-h-screen bg-cream"><p className="text-gray-400 text-lg">Loading...</p></div>

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <div className="bg-charcoal text-cream px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="font-bold text-lg truncate">{poll.title}</h1>
          <span className="text-sm text-honey">{currentIdx + 1}/{questions.length}</span>
        </div>
        {/* Progress bar */}
        <div className="max-w-2xl mx-auto mt-2 h-1.5 rounded-full bg-white/20 overflow-hidden">
          <div className="h-full rounded-full bg-honey transition-all" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} />
        </div>
      </div>

      {/* Question area */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xl">
          {/* Timer */}
          {current?.timeLimit && (
            <div className="text-center mb-8">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full text-2xl font-bold ${timeLeft !== null && timeLeft <= 5 ? 'bg-red-100 text-red-500 animate-pulse' : 'bg-honey/10 text-honey'}`}>
                {timeLeft ?? current.timeLimit}
              </div>
              <p className="text-xs text-gray-500 mt-1">seconds left</p>
            </div>
          )}

          {/* Question */}
          <div className="bg-white rounded-2xl shadow-sm border border-honey/10 p-8">
            <p className="text-xs text-orange uppercase tracking-wide mb-2">Question {currentIdx + 1}</p>
            <h2 className="text-xl font-bold text-charcoal mb-6">{current.text}</h2>

            {current.type === 'text' ? (
              <textarea onChange={(e) => setText(current.id, e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-5 py-4 text-sm focus:border-honey focus:outline-none focus:ring-1 focus:ring-honey" rows={4} placeholder="Type your answer..." autoFocus />
            ) : current.type === 'checkbox' ? (
              <div className="space-y-3">
                {current.options?.map((o: any) => (
                  <label key={o.id} className={`flex items-center gap-4 rounded-xl border p-4 text-sm cursor-pointer transition-all hover:bg-cream ${answers[current.id]?.some((a: any) => a.optionId === o.id) ? 'border-honey bg-honey/5' : 'border-gray-100'}`}>
                    <input type="checkbox" checked={answers[current.id]?.some((a: any) => a.optionId === o.id) ?? false} onChange={() => toggleOption(current.id, o.id)}
                      className="w-5 h-5 rounded border-gray-300 text-honey focus:ring-honey" />
                    {o.text}
                  </label>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {current.options?.map((o: any) => (
                  <label key={o.id} className={`flex items-center gap-4 rounded-xl border p-4 text-sm cursor-pointer transition-all hover:bg-cream ${answers[current.id]?.[0]?.optionId === o.id ? 'border-honey bg-honey/5' : 'border-gray-100'}`}>
                    <input type="radio" name={current.id} checked={answers[current.id]?.[0]?.optionId === o.id} onChange={() => setOption(current.id, o.id)}
                      className="w-5 h-5 border-gray-300 text-honey focus:ring-honey" />
                    {o.text}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Next / Submit */}
          <div className="mt-6 text-center">
            <button onClick={handleNext} className="rounded-xl bg-honey px-10 py-3 text-sm font-medium text-white hover:bg-honey/90 transition-colors shadow-sm">
              {isLast ? 'Submit' : timeLeft === 0 ? 'Next →' : 'Skip →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
