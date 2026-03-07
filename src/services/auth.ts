import { apiFetch, setToken } from './api'

type LoginResponse = {
  access_token: string
  user?: { id: string; name: string; email: string }
}

export async function login(oneid: string, password: string) {
  const form = new URLSearchParams({ username: oneid, password })
  const data = await apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: form,
  })
  if (data?.access_token) setToken(data.access_token)
  return data
}

export function isAuthenticated() {
  return Boolean(localStorage.getItem('auth_token'))
}

export function logout() {
  localStorage.removeItem('auth_token')
  window.location.href = '/'
}
