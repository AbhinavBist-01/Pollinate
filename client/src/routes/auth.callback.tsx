import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { setToken } from '../lib/api'

export const Route = createFileRoute('/auth/callback')({ component: OAuthCallback })

function OAuthCallback() {
  const navigate = useNavigate()
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    done.current = true
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      setToken(token)
      navigate({ to: '/dashboard' })
    } else {
      navigate({ to: '/login' })
    }
  }, [navigate])

  return (
    <div className="flex items-center justify-center min-h-screen bg-cream">
      <p className="text-gray-400">Completing sign in...</p>
    </div>
  )
}
