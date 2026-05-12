import { createFileRoute, Link } from '@tanstack/react-router'
import { useAuth } from '../lib/auth'
import { Badge, Card } from '../components/ui'
import { Button } from '#/components/ui/button'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const { user } = useAuth()
  const features = [
    {
      title: 'Prebuilt Polls, Tuned to Your Workflows',
      copy: 'Create reusable poll formats for planning, feedback, hiring, product research, and team decisions.',
      meta: ['Product', 'Research', 'Team'],
    },
    {
      title: 'Automate Handoffs, Reduce Ops Friction',
      copy: 'Move from question creation to public sharing and live result tracking without switching tools.',
      meta: ['Publish', 'Socket', 'Live'],
    },
    {
      title: 'Approvals, Guardrails, and Full Auditability',
      copy: 'Keep every poll, response, and result view traceable with clean dashboard states.',
      meta: ['Results', 'Access', 'Signals'],
    },
  ]

  return (
    <div className="space-y-24 py-6">
      <section className="dot-panel grid min-h-[72vh] items-center overflow-hidden rounded-[14px] border border-white/[0.06] px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mx-auto max-w-4xl text-5xl font-black leading-[0.94] text-text sm:text-6xl lg:text-7xl">
            Web polls that make you feel like you're in the future
          </h1>
          <p className="mx-auto mt-7 max-w-xl text-lg leading-8 text-text/72">
            Pollinate helps teams create live polls, collect public responses, and turn feedback into clean product signals.
          </p>
          {user ? (
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button asChild variant="secondary" size="lg" className="min-w-44">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Button asChild size="lg" className="min-w-44">
                <Link to="/polls/new">Create poll</Link>
              </Button>
            </div>
          ) : (
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button asChild variant="secondary" size="lg" className="min-w-44">
                <Link to="/login">Sign up</Link>
              </Button>
              <Button asChild size="lg" className="min-w-44">
                <Link to="/register">Register now</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-10">
        <div className="grid gap-10 lg:grid-cols-[1.08fr_0.86fr] lg:items-center">
          <h2 className="max-w-4xl text-5xl font-black leading-[0.96] text-text sm:text-6xl">
            Built for Fast Moving Teams That Need Control.
          </h2>
          <p className="text-xl leading-8 text-text/35">
            Polls move inside your existing workflow, with clean publishing, live analytics, and full traceability. Every question is shareable, every response accountable.
          </p>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={feature.title} className="feature-card group relative min-h-[390px] overflow-hidden rounded-[24px] p-8 transition hover:border-white/15">
              <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-white/[0.06] to-transparent" />
              <div className="relative flex h-full flex-col justify-between">
                <div>
                  <div className="mb-8 min-h-40 rounded-[20px] border border-white/[0.06] bg-black/20 p-5">
                    {index === 0 && <BuilderPreview />}
                    {index === 1 && <WorkflowPreview />}
                    {index === 2 && <ShieldPreview />}
                  </div>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {feature.meta.map((item) => <Badge key={item}>{item}</Badge>)}
                  </div>
                </div>
                <div className="flex items-end justify-between gap-6">
                  <div>
                    <h3 className="text-2xl font-black leading-tight text-text">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-text/50">{feature.copy}</p>
                  </div>
                  <span className="text-4xl font-light text-text/80">+</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

      </section>
    </div>
  )
}

function BuilderPreview() {
  return (
    <div className="-rotate-6 space-y-3 rounded-[18px] border border-white/[0.08] bg-[#1A1A1A] p-4 text-sm text-text/68 shadow-2xl shadow-black/40">
      {[
        ['Risk Analysis', '40s', 'text-yellow-400'],
        ['Issue Tracker', '10s', 'text-success'],
        ['Campaign Planner', '120s', 'text-danger'],
      ].map(([label, time, color]) => (
        <div key={label} className="flex items-center justify-between border-b border-white/[0.05] pb-2">
          <span>{label}</span>
          <span className={`rounded-full border border-current/25 px-2 py-0.5 text-xs ${color}`}>{time}</span>
        </div>
      ))}
      <p className="pt-2 text-text/40">Creates clear, ready-to-use feedback briefs using product and audience context.</p>
    </div>
  )
}

function WorkflowPreview() {
  return (
    <div className="rotate-[-18deg] rounded-[18px] border border-white/[0.08] bg-[#1A1A1A] p-4 text-sm shadow-2xl shadow-black/50">
      {['Fetching Data', 'Processing Data', 'Performing Action', 'Waiting', 'Generating Report'].map((item, index) => (
        <div key={item} className="flex items-center justify-between border-b border-white/[0.06] py-2 text-text/55">
          <span className="flex items-center gap-2">
            <span className={`grid h-5 w-5 place-items-center rounded-full text-xs ${index < 4 ? 'bg-success text-background' : 'bg-yellow-500 text-background'}`}>
              {index < 4 ? '✓' : '•'}
            </span>
            {item}
          </span>
          <span className="text-xs text-text/30">{(index + 1) * 10}s</span>
        </div>
      ))}
    </div>
  )
}

function ShieldPreview() {
  return (
    <div className="dot-panel grid min-h-40 place-items-center rounded-[18px]">
      <div className="grid h-28 w-24 place-items-center rounded-[36px] border-4 border-white bg-success/20 shadow-xl shadow-success/10">
        <div className="h-14 w-14 rounded-full border-[6px] border-success" />
      </div>
    </div>
  )
}
