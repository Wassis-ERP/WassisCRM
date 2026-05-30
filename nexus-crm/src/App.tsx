import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Lock, Mail, ShieldCheck } from 'lucide-react'
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
import ProdutoresPage from './pages/ProdutoresPage'
import PropostasPage from './pages/PropostasPage'
import SettingsPage from './pages/SettingsPage'
import { useAuth } from './hooks/useAuth'

function LoginPage() {
  const { signIn } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await signIn(username.trim(), password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nao foi possivel entrar.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-900/5 p-6 space-y-5"
      >
        <div className="space-y-2">
          <div className="w-11 h-11 rounded-xl bg-primary text-white flex items-center justify-center">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">W.Assis CRM</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Acesse com seu usuario de homologacao.</p>
          </div>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Usuario</span>
          <span className="relative block">
            <Mail size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full pl-10 pr-3 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:border-primary focus:outline-none"
              autoComplete="username"
              required
            />
          </span>
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Senha</span>
          <span className="relative block">
            <Lock size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full pl-10 pr-3 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:border-primary focus:outline-none"
              type="password"
              autoComplete="current-password"
              required
            />
          </span>
        </label>

        {error && (
          <p className="rounded-xl border border-danger/20 bg-danger/10 px-3 py-2 text-xs font-bold text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-primary text-white rounded-xl text-sm font-black hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {submitting ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
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
            <Route path="/produtores" element={<ProdutoresPage />} />
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
