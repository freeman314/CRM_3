import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

type AuthUser = {
  id: string
  username?: string
  role?: string
} | null

type AuthContextType = {
  accessToken: string | null
  user: AuthUser
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const [accessToken, setAccessToken] = useState<string | null>(() => sessionStorage.getItem('access_token'))
  const [refreshToken, setRefreshToken] = useState<string | null>(() => sessionStorage.getItem('refresh_token'))
  const user = useMemo<AuthUser>(() => {
    if (!accessToken) return null
    const payload = parseJwt(accessToken)
    if (!payload) return null
    return { id: payload.sub, username: payload.username, role: payload.role }
  }, [accessToken])

  // Configure global axios interceptors once
  useEffect(() => {
    const reqId = axios.interceptors.request.use((config) => {
      if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
      return config
    })
    const resId = axios.interceptors.response.use(
      (res) => res,
      async (error) => {
        const original = error.config
        if (error.response?.status === 401 && refreshToken && !original._retry) {
          original._retry = true
          try {
            const { data } = await axios.post('/api/auth/refresh', {
              userId: parseJwt(accessToken!)?.sub,
              refreshToken,
            })
            setAccessToken(data.access_token)
            setRefreshToken(data.refresh_token)
            sessionStorage.setItem('access_token', data.access_token)
            sessionStorage.setItem('refresh_token', data.refresh_token)
            original.headers.Authorization = `Bearer ${data.access_token}`
            return axios(original)
          } catch (e) {
            await logout()
          }
        }
        // If backend blocks due to first login or deactivated, redirect to change password or logout
        if (error.response?.status === 403) {
          const msg = error.response?.data?.message
          if (typeof msg === 'string' && msg.includes('Password change required')) {
            navigate('/profile/change-password')
          } else if (typeof msg === 'string' && msg.includes('deactivated')) {
            await logout()
          }
        }
        return Promise.reject(error)
      },
    )
    return () => {
      axios.interceptors.request.eject(reqId)
      axios.interceptors.response.eject(resId)
    }
  }, [accessToken, refreshToken])

  async function login(username: string, password: string) {
    const { data } = await axios.post('/api/auth/login', { username, password })
    setAccessToken(data.access_token)
    setRefreshToken(data.refresh_token)
    sessionStorage.setItem('access_token', data.access_token)
    sessionStorage.setItem('refresh_token', data.refresh_token)
    if (data.firstLogin) navigate('/profile/change-password')
    else navigate('/')
  }

  async function logout() {
    try {
      if (accessToken) {
        await axios.post('/api/auth/logout', null, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
      }
    } catch {}
    setAccessToken(null)
    setRefreshToken(null)
    sessionStorage.removeItem('access_token')
    sessionStorage.removeItem('refresh_token')
    navigate('/login')
  }


  return (
    <AuthContext.Provider value={{ accessToken, user, login, logout }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

function parseJwt(token: string): any | null {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        })
        .join(''),
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}


