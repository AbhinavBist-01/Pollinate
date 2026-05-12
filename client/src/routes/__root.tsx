import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { AuthProvider, useAuth } from '../lib/auth'
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar'
import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { Menubar, MenubarMenu, MenubarTrigger } from '#/components/ui/menubar'

export const Route = createRootRoute({
  component: RootLayout,
})

function LogoMark() {
  return (
    <span className="grid h-10 w-10 place-items-center rounded-lg border border-white/[0.08] bg-black">
      <img src="/pollinate-mark.png" alt="Pollinate" className="h-8 w-8 object-contain" />
    </span>
  )
}

function Nav() {
  const { user, logout } = useAuth()
  return (
    <nav className="sticky top-0 z-20 border-b border-white/[0.06] bg-background/90 px-5 py-4 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-4">
      <Link to="/" className="flex items-center gap-3 text-lg font-bold text-text">
        <LogoMark />
        <span>Pollinate</span>
      </Link>
      <Menubar className="ml-6 hidden border-white/[0.08] bg-transparent text-text/70 md:flex">
        <MenubarMenu>
          <MenubarTrigger asChild>
            <Link to="/" className="px-3 py-1.5">Home</Link>
          </MenubarTrigger>
        </MenubarMenu>
        {user && (
          <MenubarMenu>
            <MenubarTrigger asChild>
              <Link to="/dashboard" className="px-3 py-1.5">Dashboard</Link>
            </MenubarTrigger>
          </MenubarMenu>
        )}
      </Menubar>
      <div className="flex-1" />
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="lg" className="gap-3 px-2">
              <Avatar size="sm">
                <AvatarImage src="/avatar.jpeg" alt={user.name} />
                <AvatarFallback>{user.name?.slice(0, 2).toUpperCase() || 'PL'}</AvatarFallback>
              </Avatar>
              <span className="hidden text-text/70 sm:inline">{user.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 border-white/[0.08] bg-popover">
            <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/dashboard">Dashboard</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/polls/new">Create poll</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} variant="destructive">Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <>
          <Button asChild variant="ghost" size="lg">
            <Link to="/login">Login</Link>
          </Button>
          <Button asChild size="lg">
            <Link to="/register">Register</Link>
          </Button>
        </>
      )}
      </div>
    </nav>
  )
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-white/[0.06] px-5 py-10">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <Link to="/" className="inline-flex items-center gap-3 text-lg font-bold text-text">
            <LogoMark />
            <span>Pollinate</span>
          </Link>
          <p className="mt-4 max-w-md text-sm leading-6 text-text/45">
            Live polling, public response links, and clean analytics for teams that need fast feedback without noisy dashboards.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text/30">Product</p>
            <div className="mt-3 space-y-2 text-sm text-text/55">
              <Link to="/dashboard" className="block hover:text-text">Dashboard</Link>
              <Link to="/polls/new" className="block hover:text-text">Create Poll</Link>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text/30">Access</p>
            <div className="mt-3 space-y-2 text-sm text-text/55">
              <Link to="/login" className="block hover:text-text">Login</Link>
              <Link to="/register" className="block hover:text-text">Register</Link>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text/30">Build</p>
            <div className="mt-3 space-y-2 text-sm text-text/55">
              <p>React</p>
              <p>Express</p>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-white/[0.06] pt-6 text-xs text-text/35 sm:flex-row sm:items-center sm:justify-between">
        <p>Created by Abhinav.</p>
        <p>Pollinate - Live polling for sharper decisions.</p>
      </div>
    </footer>
  )
}

function RootLayout() {
  return (
    <AuthProvider>
      <Nav />
      <main className="relative mx-auto max-w-7xl p-5 sm:p-8">
        <Outlet />
      </main>
      <Footer />
    </AuthProvider>
  )
}
