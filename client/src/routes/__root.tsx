import * as React from 'react'
import {
  HeadContent,
  Scripts,
  createRootRoute,
  Link,
} from '@tanstack/react-router'
import appCss from '../styles.css?url'
import { AuthProvider, useAuth } from '../lib/auth'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Pollinate' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
})

function Logo() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="10" stroke="#F59E0B" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" fill="#FB923C" />
      <line
        x1="12"
        y1="2"
        x2="12"
        y2="6"
        stroke="#F59E0B"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="12"
        y1="18"
        x2="12"
        y2="22"
        stroke="#F59E0B"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="2"
        y1="12"
        x2="6"
        y2="12"
        stroke="#F59E0B"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="18"
        y1="12"
        x2="22"
        y2="12"
        stroke="#F59E0B"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function Nav() {
  const { user, logout } = useAuth()
  return (
    <nav
      className="flex items-center gap-4 border-b px-6 py-3"
      style={{
        background: '#18181B',
        color: '#FFF7ED',
        borderColor: '#F59E0B',
      }}
    >
      <Link
        to="/"
        className="flex items-center gap-2 font-bold text-lg"
        style={{ color: '#F59E0B' }}
      >
        <Logo /> Pollinate
      </Link>
      <div className="flex-1" />
      {user ? (
        <>
          <span className="text-sm" style={{ color: '#FB923C' }}>
            {user.name}
          </span>
          <button
            onClick={logout}
            className="text-sm"
            style={{ color: '#FFF7ED' }}
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <Link to="/login" className="text-sm" style={{ color: '#FFF7ED' }}>
            Login
          </Link>
          <Link to="/register" className="text-sm" style={{ color: '#FFF7ED' }}>
            Register
          </Link>
        </>
      )}
    </nav>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <AuthProvider>
          <Nav />
          <main className="mx-auto max-w-5xl p-6">{children}</main>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  )
}
