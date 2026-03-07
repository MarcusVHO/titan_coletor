import { logout } from '@/services/auth'

export default function Dashboard() {
  return (
    <div className="dash__container">
      <div className="dash__topbar">
        <button className="logout" onClick={logout} aria-label="Sair">Sair</button>
      </div>
      <a className="pmd__button" href="/pmd" aria-label="PMD">
        <svg className="pmd__icon" viewBox="0 0 64 64" aria-hidden="true">
          <rect x="10" y="30" width="34" height="14" rx="3" />
          <rect x="24" y="24" width="14" height="8" rx="2" />
          <circle cx="20" cy="48" r="6" />
          <circle cx="40" cy="48" r="6" />
          <path d="M44 36h6c6 0 10 4 10 10v4h-8v-4c0-1.1-.9-2-2-2h-6z" />
          <path d="M2 36h10v6H2z" />
          <path d="M6 42h8" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <span>PMD</span>
      </a>
    </div>
  )
}
