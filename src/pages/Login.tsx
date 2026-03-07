import type { FormEvent } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '@/services/auth'

type LoginState = {
  oneid: string
  password: string
  error?: string
  loading: boolean
  success?: string
}

export default function Login() {
  const [state, setState] = useState<LoginState>({
    oneid: '',
    password: '',
    loading: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setState((s) => ({ ...s, loading: true, error: undefined, success: undefined }))
    try {
      if (!state.oneid) throw new Error('Informe seu OneID')
      if (state.oneid.length < 3) throw new Error('OneID muito curto')
      if (!state.password) throw new Error('Informe sua senha')
      if (state.password.length < 6) throw new Error('Senha muito curta')

      await login(state.oneid, state.password)
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Erro ao autenticar'
      setState((s) => ({ ...s, error: message }))
    } finally {
      setState((s) => ({ ...s, loading: false }))
    }
  }

  return (
    <div className="login__container">
      <form
        className="login__card"
        onSubmit={onSubmit}
        aria-busy={state.loading}
        autoComplete="off"
      >
        <div className="login__brand">
          <div className="login__logo" aria-hidden="true">TC</div>
          <div className="login__brand-text">
            <h1 className="login__title">Titan Conferência</h1>
            <p className="login__subtitle">Acesse sua conta para continuar</p>
          </div>
        </div>

        <div className="login__field">
          <label className="login__label" htmlFor="oneid">OneID</label>
          <input
            id="oneid"
            type="text"
            value={state.oneid}
            onChange={(e) => setState((s) => ({ ...s, oneid: e.target.value }))}
            placeholder="seu OneID"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
          />
        </div>

        <div className="login__field">
          <label className="login__label" htmlFor="password">Senha</label>
          <div className="login__input-wrap">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={state.password}
              onChange={(e) =>
                setState((s) => ({ ...s, password: e.target.value }))
              }
              placeholder="••••••••"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
            />
            <button
              className="login__toggle"
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
        </div>

        {state.error && <div className="login__alert login__alert--error">{state.error}</div>}
        {state.success && <div className="login__alert login__alert--success">{state.success}</div>}

        <div className="login__actions">
          <button className="login__button" disabled={state.loading}>
            {state.loading ? 'Entrando…' : 'Entrar'}
          </button>
        </div>
      </form>
    </div>
  )
}
