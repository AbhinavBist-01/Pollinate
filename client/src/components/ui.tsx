import type { ComponentProps, ReactNode } from 'react'

type Tone = 'primary' | 'accent' | 'success' | 'danger' | 'neutral'

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

type CardProps =
  | (ComponentProps<'div'> & { as?: 'div' })
  | (ComponentProps<'form'> & { as: 'form' })

export function Card({ as = 'div', className, ...props }: CardProps) {
  const classes = cx(
    'rounded-[22px] border border-white/[0.07] bg-panel p-6',
    className,
  )

  if (as === 'form') {
    return <form className={classes} {...(props as ComponentProps<'form'>)} />
  }

  return <div className={classes} {...(props as ComponentProps<'div'>)} />
}

export function Badge({
  className,
  tone = 'neutral',
  ...props
}: ComponentProps<'span'> & { tone?: Tone }) {
  const tones: Record<Tone, string> = {
    primary: 'border-primary/20 bg-primary/10 text-primary',
    accent: 'border-accent/20 bg-accent/10 text-accent',
    success: 'border-success/20 bg-success/10 text-success',
    danger: 'border-danger/20 bg-danger/10 text-danger',
    neutral: 'border-white/[0.08] bg-white/[0.06] text-text/60',
  }

  return (
    <span
      className={cx('inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium', tones[tone], className)}
      {...props}
    />
  )
}

export function Button({
  className,
  variant = 'primary',
  ...props
}: ComponentProps<'button'> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  const variants = {
    primary: 'bg-text text-background hover:bg-text/90',
    secondary: 'bg-[#181818] text-text hover:bg-[#222222]',
    ghost: 'border border-white/[0.08] bg-transparent text-text/70 hover:bg-white/[0.06]',
    danger: 'border border-danger/25 bg-danger/10 text-danger hover:bg-danger/15',
  }

  return (
    <button
      className={cx(
        'inline-flex items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-text">{label}</span>
      {children}
      {hint && <span className="block text-xs text-text/45">{hint}</span>}
    </label>
  )
}

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={cx(
        'w-full rounded-lg border border-white/[0.06] bg-[#272727] px-4 py-3 text-sm text-text outline-none transition placeholder:text-text/32 focus:border-accent/60 focus:ring-2 focus:ring-accent/15',
        className,
      )}
      {...props}
    />
  )
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cx(
        'w-full rounded-lg border border-white/[0.06] bg-[#272727] px-4 py-3 text-sm text-text outline-none transition placeholder:text-text/32 focus:border-accent/60 focus:ring-2 focus:ring-accent/15',
        className,
      )}
      {...props}
    />
  )
}

export function Select({ className, ...props }: ComponentProps<'select'>) {
  return (
    <select
      className={cx(
        'w-full rounded-lg border border-white/[0.06] bg-[#272727] px-3 py-3 text-sm text-text outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/15',
        className,
      )}
      {...props}
    />
  )
}
