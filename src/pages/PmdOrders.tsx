import { useEffect, useRef, useState } from 'react'
import { apiFetch } from '@/services/api'
import { logout } from '@/services/auth'

type Order = {
  order: number
  status: string
  type: string
  qtd_materials_checked: number
  qtd_materials: number
  qtd_fines: number
}

type OrdersResponse = {
  success: boolean
  message: string
  data: Order[]
}

export default function PmdOrders() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | undefined>()
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'canceled'>('pending')
  const scanRef = useRef<HTMLInputElement>(null)
  const [scanning, setScanning] = useState(false)
  const [flash, setFlash] = useState<string | undefined>()
  const flashTimer = useRef<number | null>(null)
  const goBack = () => {
    if (window.history.length > 1) window.history.back()
    else window.location.href = '/dashboard'
  }

  const fetchOrders = async () => {
    setLoading(true)
    setError(undefined)
    try {
      const res = await apiFetch<OrdersResponse>('/tobacco/get_orders', {
        method: 'GET',
        auth: true,
      })
      setOrders(res?.data ?? [])
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Falha ao obter pedidos'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    scanRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!scanning) scanRef.current?.focus()
  }, [scanning])

  async function onScanSubmit(e: React.FormEvent) {
    e.preventDefault()
    const val = scanRef.current?.value?.trim()
    if (!val) return
    setScanning(true)
    if (flashTimer.current) {
      window.clearTimeout(flashTimer.current)
      flashTimer.current = null
    }
    try {
      const res = await apiFetch<unknown>(
        `/tobacco_conference/get_data_for_conference?order=${encodeURIComponent(val)}`,
        { method: 'GET', auth: true },
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
        const msg =
          /incorrect/i.test(rawMsg) ? 'Ordem incorreta!' : 'Ordem não encontrada'
        setFlash(msg)
        flashTimer.current = window.setTimeout(() => {
          setFlash(undefined)
          flashTimer.current = null
        }, 3000)
      } else {
        window.location.href = `/conference?order=${encodeURIComponent(val)}`
      }
    } catch (e) {
      const raw = e instanceof Error ? e.message : 'Falha ao buscar ordem'
      const msg = /incorrect/i.test(raw) ? 'Ordem incorreta!' : 'Ordem não encontrada'
      setFlash(msg)
      flashTimer.current = window.setTimeout(() => {
        setFlash(undefined)
        flashTimer.current = null
      }, 3000)
    } finally {
      setScanning(false)
      if (scanRef.current) {
        scanRef.current.focus()
      }
    }
  }

  return (
    <div className="list__container">
      <div className="list__header">
        <button className="back" onClick={goBack} aria-label="Voltar">←</button>
        <h1 className="list__title">Pedidos</h1>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <button className="refresh" onClick={fetchOrders} aria-label="Atualizar" disabled={loading}>
            {loading ? 'Atualizando…' : 'Atualizar'}
          </button>
          <button className="logout" onClick={logout} aria-label="Sair">Sair</button>
        </div>
      </div>
      <form className="list__scan" onSubmit={onScanSubmit}>
        <input
          ref={scanRef}
          type="text"
          className="conf__scan-input"
          placeholder="Bipe o número da OP"
          aria-label="Leitura de OP"
          inputMode="none"
          enterKeyHint="go"
          readOnly={scanning}
          onBlur={() => {
            setTimeout(() => scanRef.current?.focus(), 0)
          }}
        />
      </form>
      <div className="list__filters" role="tablist" aria-label="Filtrar por status">
        <button
          className={`chip ${filter === 'all' ? 'chip--active' : ''}`}
          onClick={() => setFilter('all')}
          role="tab"
          aria-selected={filter === 'all'}
        >
          Todos
        </button>
        <button
          className={`chip chip--pending ${filter === 'pending' ? 'chip--active' : ''}`}
          onClick={() => setFilter('pending')}
          role="tab"
          aria-selected={filter === 'pending'}
        >
          PENDING
        </button>
        <button
          className={`chip chip--completed ${filter === 'completed' ? 'chip--active' : ''}`}
          onClick={() => setFilter('completed')}
          role="tab"
          aria-selected={filter === 'completed'}
        >
          COMPLETED
        </button>
        <button
          className={`chip chip--canceled ${filter === 'canceled' ? 'chip--active' : ''}`}
          onClick={() => setFilter('canceled')}
          role="tab"
          aria-selected={filter === 'canceled'}
        >
          CANCELED
        </button>
      </div>
      {loading && <div className="list__state">Carregando…</div>}
      {error && !loading && <div className="list__alert">{error}</div>}
      {flash && (
        <div className="conf__overlay conf__overlay--error" role="alert" aria-live="assertive">
          <div className="conf__overlay-message">{flash}</div>
        </div>
      )}
      {!loading && !error && (
        <ul className="list">
          {orders
            .filter((o) => {
              if (filter === 'all') return true
              return o.status.toLowerCase() === filter
            })
            .map((o) => {
              const statusLower = o.status.toLowerCase()
              const disabled = statusLower === 'completed' || statusLower === 'canceled'
              return (
                <li key={o.order} className={`list__item ${disabled ? 'list__item--disabled' : ''}`}>
                  {disabled ? (
                    <div
                      className="list__link"
                      aria-disabled="true"
                      title={statusLower === 'completed' ? 'Pedido concluído' : 'Pedido cancelado'}
                    >
                      <div className="list__row">
                        <span className="list__order">#{o.order}</span>
                        <span className={`list__status list__status--${statusLower}`}>
                          {o.status}
                        </span>
                      </div>
                      <div className="list__row">
                        <span className="list__type">{o.type}</span>
                        <span className="list__count">
                          {o.qtd_materials_checked}/{o.qtd_materials}
                        </span>
                      </div>
                      {o.qtd_fines > 0 && (
                        <div className="list__row">
                          <span className="list__fines list__fines--has">Fines: {o.qtd_fines}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <a className="list__link" href={`/conference?order=${o.order}`} aria-label={`Conferir pedido #${o.order}`}>
                      <div className="list__row">
                        <span className="list__order">#{o.order}</span>
                        <span className={`list__status list__status--${statusLower}`}>
                          {o.status}
                        </span>
                      </div>
                      <div className="list__row">
                        <span className="list__type">{o.type}</span>
                        <span className="list__count">
                          {o.qtd_materials_checked}/{o.qtd_materials}
                        </span>
                      </div>
                      {o.qtd_fines > 0 && (
                        <div className="list__row">
                          <span className="list__fines list__fines--has">Fines: {o.qtd_fines}</span>
                        </div>
                      )}
                    </a>
                  )}
                </li>
              )
            })}
          {orders.filter((o) => (filter === 'all' ? true : o.status.toLowerCase() === filter)).length === 0 && (
            <li className="list__state">Nenhum pedido</li>
          )}
        </ul>
      )}
    </div>
  )
}
