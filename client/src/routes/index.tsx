import { createFileRoute, Link } from '@tanstack/react-router'
import { useAuth } from '../lib/auth'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const { user } = useAuth()
  const features = [
    ['Build', 'Create timed polls with single choice, multi choice, and text questions.'],
    ['Share', 'Publish a clean public response link without making voters create accounts.'],
    ['Read', 'Track answers, top options, and response velocity from a calm dashboard.'],
  ]

  return (
    <div className="space-y-20">
      <section className="dot-grid relative -mx-2 grid min-h-[82vh] place-items-center overflow-hidden rounded-[1.75rem] border border-white/10 px-6 py-24 text-center shadow-2xl shadow-black/40 sm:-mx-4">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(17,17,19,0.08),rgba(17,17,19,0.72))]" />
        <div className="relative mx-auto max-w-4xl">
          <Badge variant="outline" className="mb-8 border-white/10 bg-white/[0.03] text-muted-foreground">
            Live polling platform
          </Badge>
          <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Polls that feel like{' '}
            <span className="text-honey">they're happening live</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
            Create timed quizzes, collect responses, and watch results update in real-time. No setup required.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="min-w-44 bg-white text-black hover:bg-white/90">
              <Link to="/polls/new">Create a poll</Link>
            </Button>
            {!user ? (
              <Button asChild variant="outline" size="lg" className="min-w-44 border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]">
                <Link to="/register">Create account</Link>
              </Button>
            ) : (
              <Button asChild variant="outline" size="lg" className="min-w-44 border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            )}
          </div>
          {!user && (
            <p className="mt-8 text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline">Sign in</Link>
            </p>
          )}
        </div>
      </section>

      <section className="space-y-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.75fr] lg:items-end">
          <h2 className="max-w-3xl text-4xl font-black leading-tight text-foreground sm:text-5xl">
            Built for live feedback that needs control.
          </h2>
          <p className="text-lg leading-8 text-muted-foreground">
            Pollinate keeps every workflow quiet, dense, and readable: create the poll, share the public link, and watch responses turn into signal.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {features.map(([title, copy], index) => (
            <Card key={title} className="surface-glow min-h-64 border-white/10 transition-colors hover:border-white/20">
              <CardContent className="flex h-full flex-col justify-between p-6">
                <div className="space-y-4">
                  <span className="inline-flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-sm font-black text-primary">
                    0{index + 1}
                  </span>
                  <h3 className="text-2xl font-black text-foreground">{title}</h3>
                </div>
                <p className="mt-8 text-sm leading-6 text-muted-foreground">{copy}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
