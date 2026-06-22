import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import DashboardPage from './pages/DashboardPage'
import SeguradosPage from './pages/SeguradosPage'
import SeguradoDetalhePage from './pages/SeguradoDetalhePage'
import OportunidadesPage from './pages/OportunidadesPage'
import OportunidadeDetalhePage from './pages/OportunidadeDetalhePage'
import ModuleKanbanPage from './pages/ModuleKanbanPage'
import SinistroDetalhePage from './pages/SinistroDetalhePage'
import FinanceiroDetalhePage from './pages/FinanceiroDetalhePage'
import EmissaoDetalhePage from './pages/EmissaoDetalhePage'
import PosVendaDetalhePage from './pages/PosVendaDetalhePage'
import PropostasPage from './pages/PropostasPage'
import SettingsPage from './pages/SettingsPage'
import { useAuth } from './hooks/useAuth'
import wassisMark from './assets/brand/wassis-mark.png'
import wassisLogoDark from './assets/brand/wassis-logo-full_sidebar_dark.png'

function LoginPage() {
  const { signIn } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await signIn(username.trim(), password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-bg-app text-fg-1 flex">
      {/* Painel da marca — só em telas largas */}
      <aside className="relative hidden lg:flex flex-col justify-between w-1/2 overflow-hidden bg-brand-primary-deep p-12 text-fg-on-brand">
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background:
              'radial-gradient(120% 120% at 0% 0%, var(--brand-blue) 0%, var(--brand-blue-deep) 55%, var(--neutral-950) 130%)',
          }}
        />
        <div
          aria-hidden
          className="absolute -right-24 -top-24 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{ background: 'var(--brand-blue-on-dark)' }}
        />
        <div className="relative flex items-center">
          <img src={wassisLogoDark} alt="W.Assis" className="h-10 w-auto object-contain" />
        </div>

        <div className="relative max-w-md space-y-4">
          <h2 className="font-display text-4xl font-bold leading-tight tracking-tight">
            CRM de seguros, do primeiro contato à renovação.
          </h2>
          <p className="text-base leading-relaxed text-white/70">
            Gerencie segurados, oportunidades, sinistros e cobranças em um só lugar.
          </p>
        </div>

        <p className="relative text-xs text-white/50">© {new Date().getFullYear()} W.Assis · Todos os direitos reservados</p>
      </aside>

      {/* Formulário */}
      <div className="flex w-full flex-col items-center justify-center p-6 lg:w-1/2">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm rounded-2xl border border-border-1 bg-bg-surface p-8 shadow-[var(--shadow-3)]"
        >
          <div className="mb-8 space-y-1.5">
            <img
              src={wassisMark}
              alt="W.Assis"
              className="mb-5 h-12 w-12 rounded-2xl shadow-[var(--shadow-brand)] lg:hidden"
            />
            <h1 className="font-display text-2xl font-bold tracking-tight text-fg-1">Bem-vindo de volta</h1>
            <p className="text-sm text-fg-3">Acesse sua conta para continuar.</p>
          </div>

          <div className="space-y-5">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-fg-3">Usuário</span>
              <span className="relative block">
                <Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-4" />
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="seu@email.com"
                  className="w-full rounded-xl border border-border-1 bg-bg-surface-2 py-3 pl-11 pr-3 text-sm text-fg-1 placeholder:text-fg-4 transition-all focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                  autoComplete="username"
                  required
                />
              </span>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-fg-3">Senha</span>
              <span className="relative block">
                <Lock size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-4" />
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-border-1 bg-bg-surface-2 py-3 pl-11 pr-11 text-sm text-fg-1 placeholder:text-fg-4 transition-all focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-fg-4 transition-colors hover:text-fg-2"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>

            {error && (
              <p className="rounded-xl border border-signal-danger/20 bg-signal-danger/10 px-3 py-2 text-xs font-semibold text-signal-danger">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-accent-primary py-3 text-sm font-semibold text-accent-primary-fg shadow-[var(--shadow-brand)] transition-all hover:bg-accent-primary-hover disabled:opacity-50"
            >
              {submitting ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}

/**
 * Layout Principal do CRM — Sidebar + Header + Conteúdo.
 * Só é renderizado para usuários autenticados.
 */
function AppLayout() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('nexus-crm-theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Sincroniza as classes de tema e o localStorage sempre que o estado mudar.
  // Marca explicitamente .light/.dark: o design system tem auto dark-mode via
  // prefers-color-scheme, e só a classe .light cancela esse modo automático.
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', darkMode)
    root.classList.toggle('light', !darkMode)
    localStorage.setItem('nexus-crm-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  const toggleTheme = () => setDarkMode(!darkMode)

  return (
    <div className="h-screen flex overflow-hidden bg-bg-app text-fg-1">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onToggleTheme={toggleTheme}
        darkMode={darkMode}
      />
      <main className="flex-1 flex flex-col min-w-0">
        <Header />
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/segurados" element={<SeguradosPage />} />
            <Route path="/segurados/:id" element={<SeguradoDetalhePage />} />
            <Route path="/oportunidades" element={<OportunidadesPage />} />
            <Route path="/oportunidades/:id" element={<OportunidadeDetalhePage />} />
            <Route
              path="/sinistros"
              element={<ModuleKanbanPage module="sinistro" title="Sinistros" description="Funil de atendimento e regulacao" />}
            />
            <Route path="/sinistros/:id" element={<SinistroDetalhePage />} />
            <Route
              path="/emissoes"
              element={<ModuleKanbanPage module="emissao" title="Emissao" description="Proposta, endosso e apolice" />}
            />
            <Route path="/emissoes/:id" element={<EmissaoDetalhePage />} />
            <Route
              path="/pos-venda"
              element={<ModuleKanbanPage module="pos_venda" title="Pos-Venda" description="Relacionamento e renovacoes" />}
            />
            <Route path="/pos-venda/:id" element={<PosVendaDetalhePage />} />
            <Route
              path="/financeiro"
              element={<ModuleKanbanPage module="financeiro" title="Financeiro" description="Cobrancas e conciliacao" />}
            />
            <Route path="/financeiro/:id" element={<FinanceiroDetalhePage />} />
            <Route path="/produtores" element={<Navigate to="/configuracoes?tab=produtores" replace />} />
            <Route path="/propostas" element={<PropostasPage />} />
            <Route path="/configuracoes" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

/**
 * Componente raiz do Nexus CRM.
 *
 * Modo frontend puro: não há rota pública de login — o AuthProvider já entrega
 * um usuário admin estático, então o layout principal é montado direto.
 */
function App() {
  const { loading, user } = useAuth()

  if (loading) {
    return (
      <main className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center text-sm font-bold text-slate-500">
        Carregando...
      </main>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return <AppLayout />
}

export default App
