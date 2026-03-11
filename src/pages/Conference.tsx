import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiFetch } from '@/services/api'
import { logout } from '@/services/auth'

type Item = {
  id: number
  material_code: string
  checked: boolean
  is_fines: boolean
}

type ConferenceData = {
  id: number
  order: number
  status: string
  items: Item[]
}

type Response = {
  success: boolean
  message: string
  data: ConferenceData
}

export default function Conference() {
  const [params] = useSearchParams()
  const orderParam = params.get('order')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | undefined>()
  const [data, setData] = useState<ConferenceData | undefined>()
  const inputRef = useRef<HTMLInputElement>(null)
  const [checking, setChecking] = useState(false)
  const [flash, setFlash] = useState<string | undefined>()
  const flashTimer = useRef<number | null>(null)
  const goBack = () => {
    if (window.history.length > 1) window.history.back()
    else window.location.href = '/pmd'
  }

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        if (!orderParam) throw new Error('Número da ordem não informado')
        const res = await apiFetch<Response>(
          `/tobacco_conference/get_data_for_conference?order=${encodeURIComponent(
            orderParam,
          )}`,
          { method: 'GET', auth: true },
        )
        if (active) setData(res.data)
      } catch (e) {
        if (active) {
          const msg =
            e instanceof Error ? e.message : 'Falha ao obter dados da conferência'
          setError(msg)
        }
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [orderParam])

  const counts = useMemo(() => {
    const total = data?.items?.length ?? 0
    const checked = data?.items?.filter((i) => i.checked).length ?? 0
    const fines = data?.items?.filter((i) => i.is_fines).length ?? 0
    return { total, checked, pending: total - checked, fines }
  }, [data])

  const nextIndex = useMemo(() => {
    const idx = data?.items?.findIndex((i) => !i.checked)
    return typeof idx === 'number' ? idx : -1
  }, [data])

  useEffect(() => {
    if (nextIndex >= 0) {
      const el = document.querySelector<HTMLElement>(`[data-conf-index="${nextIndex}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [nextIndex])

  useEffect(() => {
    if (data?.status) {
      const s = data.status.toLowerCase()
      if (s === 'completed' || s === 'canceled') {
        setFlash(s === 'completed' ? 'Pedido já concluído' : 'Pedido cancelado')
        const t = window.setTimeout(() => {
          window.location.href = '/pmd'
        }, 1500)
        return () => window.clearTimeout(t)
      }
    }
  }, [data?.status])

  useEffect(() => {
    if (!checking) {
      inputRef.current?.focus()
    }
  }, [checking])

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const value = inputRef.current?.value?.trim()
    if (!value || !orderParam) return
    setChecking(true)
    setError(undefined)
    ;(async () => {
      try {
        const res = await apiFetch<unknown>(
          `/tobacco_conference/check_item?order=${encodeURIComponent(
            orderParam,
          )}&check_text=${encodeURIComponent(value)}`,
          { method: 'POST', auth: true },
        )
        type MaybeRes = { success?: unknown; message?: unknown; data?: unknown }
        const anyRes = res as MaybeRes | undefined
        const isErr =
          anyRes &&
          typeof anyRes === 'object' &&
          'success' in anyRes &&
          anyRes.success === false
        if (isErr) {
          const rawMsg = typeof anyRes?.message === 'string' ? (anyRes.message as string) : ''
          const msg = /incorrect/i.test(rawMsg) ? 'Item incorreto!' : 'Falha ao conferir item'
          if (flashTimer.current) {
            window.clearTimeout(flashTimer.current)
            flashTimer.current = null
          }
          setFlash(msg)
          if (inputRef.current) {
            inputRef.current.value = ''
            inputRef.current.focus()
          }
          flashTimer.current = window.setTimeout(() => {
            setFlash(undefined)
            flashTimer.current = null
          }, 3000)
        } else {
          const okRes = anyRes as { data?: unknown }
          if (okRes && okRes.data && typeof okRes.data === 'object') {
            setData(okRes.data as ConferenceData)
          }
          if (inputRef.current) {
            inputRef.current.value = ''
            inputRef.current.focus()
          }
        }
      } catch (e) {
        const raw = e instanceof Error ? e.message : 'Falha ao conferir item'
        const msg =
          /incorrect/i.test(raw) ? 'Item incorreto!' : 'Falha ao conferir item'
        if (flashTimer.current) {
          window.clearTimeout(flashTimer.current)
          flashTimer.current = null
        }
        setFlash(msg)
        if (inputRef.current) {
          inputRef.current.value = ''
          inputRef.current.focus()
        }
        flashTimer.current = window.setTimeout(() => {
          setFlash(undefined)
          flashTimer.current = null
        }, 3000)
      } finally {
        setChecking(false)
      }
    })()
  }

  return (
    <div className="conf__container">
      <div className="conf__top">
        <div className="conf__header">
          <button className="back" onClick={goBack} aria-label="Voltar">←</button>
          <h1 className="conf__title">
            Conferência {data?.order ? `#${data.order}` : ''}
          </h1>
          {data?.status && (
            <span className={`conf__status conf__status--${data.status.toLowerCase()}`}>
              {data.status}
            </span>
          )}
          <button className="logout" onClick={logout} aria-label="Sair">Sair</button>
        </div>

        <div className="conf__summary">
          <span>Total: {counts.total}</span>
          <span>Conferidos: {counts.checked}</span>
          <span>Pendentes: {counts.pending}</span>
          <span className="conf__fines">Fines: {counts.fines}</span>
        </div>

        <form className="conf__scan" onSubmit={onSubmit}>
          <input
            ref={inputRef}
            type="text"
            className="conf__scan-input"
            placeholder="Bipe o código do material"
            aria-label="Entrada do coletor"
            inputMode="none"
            enterKeyHint="done"
            readOnly={checking}
            onBlur={() => {
              setTimeout(() => inputRef.current?.focus(), 0)
            }}
          />
        </form>
      </div>

      {loading && <div className="list__state">Carregando…</div>}
      {error && !loading && <div className="list__alert">{error}</div>}
      {flash && (
        <div className="conf__overlay conf__overlay--error" role="alert" aria-live="assertive">
          <div className="conf__overlay-message">{flash}</div>
        </div>
      )}

      {!loading && (
        <ul className="list">
          {data?.items?.map((it, idx) => (
            <li
              key={it.id}
              data-conf-index={idx}
              className={`list__item conf__item ${it.checked ? 'conf__item--checked' : ''} ${
                !it.checked && idx === nextIndex ? 'conf__item--next' : ''
              }`}
            >
              <div className="list__row">
                <span className="conf__code">{it.material_code}</span>
                {it.is_fines && <span className="conf__badge conf__badge--fines">FINE</span>}
                {it.checked && <span className="conf__badge conf__badge--checked">CHECKED</span>}
              </div>
            </li>
          ))}
          {(!data?.items || data.items.length === 0) && (
            <li className="list__state">Nenhum item</li>
          )}
        </ul>
      )}
    </div>
  )
}
