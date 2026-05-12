import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '../lib/auth'

export const Route = createFileRoute('/register')({ component: Register })

function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await register(name, email, password)
      navigate({ to: '/dashboard' })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-20 max-w-sm space-y-4">
      <h1 className="text-2xl font-bold">Register</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)}
        className="w-full rounded border px-3 py-2" required style={{ borderColor: '#F59E0B' }} />
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded border px-3 py-2" required style={{ borderColor: '#F59E0B' }} />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded border px-3 py-2" required minLength={6} style={{ borderColor: '#F59E0B' }} />
      <button type="submit" className="w-full rounded py-2 text-white" style={{ background: '#F59E0B' }}>Register</button>
      <p className="text-sm text-center">Already have an account? <a href="/login" style={{ color: '#FB923C' }}>Login</a></p>
    </form>
  )
}
