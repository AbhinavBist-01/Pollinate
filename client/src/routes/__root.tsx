import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { AuthProvider, useAuth } from '../lib/auth'
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

function Nav() {
  const { user, logout } = useAuth()

  return (
    <nav className="sticky top-0 z-30 border-b border-white/10 bg-[#09090a]/80 px-5 py-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-5">
        <Link to="/" className="text-lg font-black tracking-tight text-foreground">
          Pollinate
        </Link>

        <Menubar className="ml-4 hidden border-white/10 bg-secondary/40 text-muted-foreground md:flex">
          <MenubarMenu>
            <MenubarTrigger asChild>
              <Link to="/" className="px-3 py-1.5">Home</Link>
            </MenubarTrigger>
          </MenubarMenu>
          {user && (
            <>
              <MenubarMenu>
                <MenubarTrigger asChild>
                  <Link to="/dashboard" className="px-3 py-1.5">Dashboard</Link>
                </MenubarTrigger>
              </MenubarMenu>
              <MenubarMenu>
                <MenubarTrigger asChild>
                  <Link to="/polls/new" className="px-3 py-1.5">Create</Link>
                </MenubarTrigger>
              </MenubarMenu>
            </>
          )}
        </Menubar>

        <div className="flex-1" />

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="lg" className="gap-2 px-3 text-muted-foreground hover:text-foreground">
                <span className="hidden sm:inline">{user.name}</span>
                <span className="text-primary">Account</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 border-white/10 bg-popover">
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
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="lg">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild size="lg">
              <Link to="/register">Get started</Link>
            </Button>
          </div>
        )}
      </div>
    </nav>
  )
}

function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-[#09090a]/45 px-5 py-10 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div>
          <Link to="/" className="text-lg font-black text-foreground">Pollinate</Link>
          <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
            Live polling for builders who need fast feedback, public response links, and real-time analytics in one focused workspace.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">Product</p>
            <Link to="/dashboard" className="block text-muted-foreground hover:text-foreground">Dashboard</Link>
            <Link to="/polls/new" className="block text-muted-foreground hover:text-foreground">Create poll</Link>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">Access</p>
            <Link to="/login" className="block text-muted-foreground hover:text-foreground">Login</Link>
            <Link to="/register" className="block text-muted-foreground hover:text-foreground">Register</Link>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">Stack</p>
            <p className="text-muted-foreground">React</p>
            <p className="text-muted-foreground">Socket.IO</p>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-8 flex max-w-7xl flex-col gap-2 border-t border-white/10 pt-6 text-xs text-muted-foreground sm:flex-row sm:justify-between">
        <p>Pollinate - code your opinion into signal.</p>
        <p>React / Express / PostgreSQL / Socket.IO</p>
      </div>
    </footer>
  )
}

function RootLayout() {
  return (
    <AuthProvider>
      <div className="app-surface min-h-screen">
        <Nav />
        <main className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
          <Outlet />
        </main>
        <Footer />
      </div>
    </AuthProvider>
  )
}
