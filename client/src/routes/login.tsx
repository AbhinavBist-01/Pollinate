import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { API_URL } from '../lib/api'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card'
import { Input } from '#/components/ui/input'

export const Route = createFileRoute('/login')({ component: Login })

function Login() {
  const navigate = useNavigate()
  const { login: authLogin } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await authLogin(email, password)
      navigate({ to: '/dashboard' })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed')
    }
  }

  function handleOAuth(provider: string) {
    window.location.href = `${API_URL}/api/auth/${provider}`
  }

  return (
    <div className="dot-grid -mx-2 grid min-h-[78vh] place-items-center rounded-[1.75rem] border border-white/10 px-6 py-16 sm:-mx-4">
      <Card className="w-full max-w-md border-transparent bg-transparent shadow-none ring-0">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-black text-white">Sign in to your account</CardTitle>
          <CardDescription>Sign in to manage polls and live results.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-4 rounded-lg border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground/80">Email</span>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground/80">Password</span>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
            </label>
            <Button type="submit" size="lg" className="w-full bg-white text-black hover:bg-white/90">Sign in</Button>
          </form>
          <div className="my-5 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> OR <span className="h-px flex-1 bg-border" />
          </div>
          <Button type="button" variant="outline" size="lg" className="w-full border-white/15 bg-white text-black hover:bg-white/90" onClick={() => handleOAuth('google')}>
            Continue with Google
          </Button>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account? <Link to="/register" className="text-primary hover:underline">Register</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
