import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react'
import api, { setToken, clearAuth, getToken } from './api'

interface User {
  id: string
  name: string
  email: string
}

interface AuthContext {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthCtx = createContext<AuthContext | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (token) {
      api
        .get('/api/auth/me')
        .then((res) => setUser(res.data))
        .catch(() => clearAuth())
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  // Login User and set token in local storage
  async function login(email: string, password: string) {
    const { data } = await api.post('/api/auth/login', { email, password })
    setToken(data.token)
    setUser(data.user)
  }

  // Register User and set token in local storage
  async function register(name: string, email: string, password: string) {
    const { data } = await api.post('/api/auth/register', {
      name,
      email,
      password,
    })
    setToken(data.token)
    setUser(data.user)
  }

  function logout() {
    clearAuth()
    setUser(null)
  }

  return (
    <AuthCtx value={{ user, loading, login, register, logout }}>
      {children}
    </AuthCtx>
  )
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
