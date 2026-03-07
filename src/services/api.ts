const BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://127.0.0.1:8000'

function buildUrl(path: string) {
  const base = BASE_URL.replace(/\/+$/, '')
  const p = path.replace(/^\/+/, '')
  return `${base}/${p}`
}

export type ApiOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: Record<string, string>
  body?: unknown
  auth?: boolean
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const isForm =
    options.body instanceof FormData || options.body instanceof URLSearchParams
  const headers: Record<string, string> = {
    ...(options.headers ?? {}),
  }
  if (!isForm) {
    headers['Content-Type'] = headers['Content-Type'] ?? 'application/json'
  }

  if (options.auth) {
    const token = localStorage.getItem('auth_token')
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let requestBody: BodyInit | undefined
  if (options.body !== undefined) {
    if (typeof options.body === 'string' || isForm) {
      requestBody = options.body as unknown as BodyInit
    } else {
      requestBody = JSON.stringify(options.body)
    }
  }

  const res = await fetch(buildUrl(path), {
    method: options.method ?? 'GET',
    headers,
    body: requestBody,
  })

  if (res.status === 401) {
    clearToken()
    window.location.href = '/'
    throw new Error('Sessão expirada. Faça login novamente.')
  }

  const text = await res.text()
  let data: unknown
  try {
    data = text ? JSON.parse(text) : undefined
  } catch {
    data = text
  }

  if (!res.ok) {
    let message = `Erro ${res.status}: ${res.statusText}`
    if (data && typeof data === 'object') {
      const d = data as Record<string, unknown>
      if (typeof d.message === 'string') message = d.message
      else if (typeof d.error === 'string') message = d.error
      else if (Array.isArray(d.detail)) {
        const details = (d.detail as unknown[])
          .map((it) => {
            if (it && typeof it === 'object') {
              const msg = (it as Record<string, unknown>).msg
              return typeof msg === 'string' ? msg : ''
            }
            return ''
          })
          .filter(Boolean)
          .join('; ')
        if (details) message = details
      } else if (typeof d.detail === 'string') {
        message = d.detail
      }
    } else if (typeof data === 'string' && data.trim()) {
      message = data
    }
    throw new Error(message)
  }
  return data as T
}

export function setToken(token: string) {
  localStorage.setItem('auth_token', token)
}

export function clearToken() {
  localStorage.removeItem('auth_token')
}
