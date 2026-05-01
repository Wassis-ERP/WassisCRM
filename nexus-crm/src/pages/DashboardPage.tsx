import {
  TrendingUp,
  Users,
  DollarSign,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Activity,
} from 'lucide-react'

/**
 * Dados dos cards de KPI do Dashboard.
 * Cada card representa uma métrica-chave do negócio.
 */
const kpiCards = [
  {
    title: 'Receita Total',
    value: 'R$ 2.847.500',
    change: '+18.2%',
    trend: 'up' as const,
    icon: DollarSign,
    color: 'bg-emerald-500',
  },
  {
    title: 'Novos Segurados',
    value: '1.284',
    change: '+12.5%',
    trend: 'up' as const,
    icon: Users,
    color: 'bg-primary',
  },
  {
    title: 'Taxa de Conversão',
    value: '34.8%',
    change: '-2.1%',
    trend: 'down' as const,
    icon: Target,
    color: 'bg-amber-500',
  },
  {
    title: 'Ticket Médio',
    value: 'R$ 4.250',
    change: '+8.7%',
    trend: 'up' as const,
    icon: TrendingUp,
    color: 'bg-violet-500',
  },
]

/**
 * Dados fictícios de produção mensal para renderizar as barras do gráfico.
 */
const monthlyData = [
  { month: 'Jan', value: 65 },
  { month: 'Fev', value: 78 },
  { month: 'Mar', value: 55 },
  { month: 'Abr', value: 90 },
  { month: 'Mai', value: 82 },
  { month: 'Jun', value: 95 },
  { month: 'Jul', value: 70 },
  { month: 'Ago', value: 88 },
  { month: 'Set', value: 92 },
  { month: 'Out', value: 75 },
  { month: 'Nov', value: 85 },
  { month: 'Dez', value: 98 },
]

/**
 * Dados dos top produtores para o ranking lateral.
 */
const topProdutores = [
  { name: 'Vinícius Assis', value: 'R$ 485.000', percent: 92 },
  { name: 'Hicila Fernandes', value: 'R$ 412.000', percent: 78 },
  { name: 'Carlos Santos', value: 'R$ 358.000', percent: 68 },
  { name: 'Marina Costa', value: 'R$ 295.000', percent: 56 },
  { name: 'Roberto Lima', value: 'R$ 247.000', percent: 47 },
]

/**
 * Atividades recentes do CRM para o feed do dashboard.
 */
const recentActivities = [
  { action: 'Nova apólice emitida', detail: 'Auto - Leonardo Perboni', time: 'Há 5 min', color: 'bg-emerald-500' },
  { action: 'Cotação solicitada', detail: 'Vida - Mario Sgarbi', time: 'Há 12 min', color: 'bg-primary' },
  { action: 'Renovação pendente', detail: 'Empresarial - 1001 Ind.', time: 'Há 30 min', color: 'bg-amber-500' },
  { action: 'Sinistro registrado', detail: 'Auto - Edmilson Giovani', time: 'Há 1h', color: 'bg-danger' },
  { action: 'Lead convertido', detail: 'Residencial - Ana Silva', time: 'Há 2h', color: 'bg-emerald-500' },
]

/**
 * Página do Dashboard Executivo.
 * Tela 8 do Stitch: Executive Analytics Dashboard V3.
 * Exibe KPIs, gráfico de produção, ranking de produtores e feed de atividades.
 */
export default function DashboardPage() {
  return (
    <div className="animate-fade-in">
      {/* Título */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Visão geral de performance e indicadores-chave.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {kpiCards.map((card) => (
          <div
            key={card.title}
            className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`${card.color} p-2.5 rounded-xl text-white`}>
                <card.icon size={20} />
              </div>
              <span
                className={`flex items-center gap-1 text-xs font-semibold ${
                  card.trend === 'up' ? 'text-emerald-500' : 'text-danger'
                }`}
              >
                {card.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {card.change}
              </span>
            </div>
            <p className="text-2xl font-bold mb-1">{card.value}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{card.title}</p>
          </div>
        ))}
      </div>

      {/* Gráficos e Rankings */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {/* Gráfico de Produção */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BarChart3 size={20} className="text-primary" />
              <h2 className="text-lg font-bold">Produção Mensal</h2>
            </div>
            <select className="text-sm bg-slate-100 dark:bg-slate-800 border-0 rounded-lg px-3 py-1.5 text-slate-600 dark:text-slate-300">
              <option>2026</option>
              <option>2025</option>
            </select>
          </div>
          <div className="flex items-end gap-2 h-48">
            {monthlyData.map((item) => (
              <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-gradient-to-t from-primary to-primary-light rounded-t-md transition-all hover:opacity-80"
                  style={{ height: `${item.value}%` }}
                />
                <span className="text-[10px] text-slate-400 font-medium">{item.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ranking de Produtores */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-6">
            <PieChart size={20} className="text-primary" />
            <h2 className="text-lg font-bold">Top Produtores</h2>
          </div>
          <div className="space-y-4">
            {topProdutores.map((p, i) => (
              <div key={p.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium">{p.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{p.value}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                  <div
                    className="bg-gradient-to-r from-primary to-primary-light h-1.5 rounded-full transition-all"
                    style={{ width: `${p.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Atividades Recentes */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-6">
          <Activity size={20} className="text-primary" />
          <h2 className="text-lg font-bold">Atividades Recentes</h2>
        </div>
        <div className="space-y-4">
          {recentActivities.map((act, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className={`w-2.5 h-2.5 rounded-full ${act.color} shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{act.action}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{act.detail}</p>
              </div>
              <span className="text-xs text-slate-400 whitespace-nowrap">{act.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
