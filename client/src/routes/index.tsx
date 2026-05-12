import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuth } from '../lib/auth'
import { getToken } from '../lib/api'

export const Route = createFileRoute('/')({
  component: Home,
  beforeLoad: () => {
    if (!getToken()) throw redirect({ to: '/login' })
  },
})

function Home() {
  const { user } = useAuth()
  return (
    <div className="text-center py-20">
      <h1 className="text-4xl font-bold">Welcome to Pollinate</h1>
      <p className="mt-2 text-gray-600">Create and share polls with ease.</p>
      {user && (
        <div className="mt-6 flex gap-4 justify-center">
          <a href="/dashboard" className="rounded bg-black px-4 py-2 text-white">Dashboard</a>
          <a href="/polls/new" className="rounded border px-4 py-2">Create Poll</a>
        </div>
      )}
    </div>
  )
}
