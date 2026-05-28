import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
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

  // Sincroniza a classe .dark e o localStorage sempre que o estado mudar
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('nexus-crm-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('nexus-crm-theme', 'light')
    }
  }, [darkMode])

  const toggleTheme = () => setDarkMode(!darkMode)

  return (
    <div className="h-screen flex overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
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
  return <AppLayout />
}

export default App
