// Tela de Dashboard executivo do WassisCRM.
(function () {
const { KpiCard, Card } = window.WAssisDesignSystem_502d77
const DashIcons = window.Icons

const KPIS = [
  { title: 'Receita Total', value: 'R$ 2.847.500', change: '+18.2%', trend: 'up', icon: 'DollarSign', color: 'var(--signal-success)' },
  { title: 'Novos Segurados', value: '1.284', change: '+12.5%', trend: 'up', icon: 'Users', color: 'var(--accent-primary)' },
  { title: 'Taxa de Conversão', value: '34.8%', change: '-2.1%', trend: 'down', icon: 'Target', color: 'var(--signal-warning)' },
  { title: 'Ticket Médio', value: 'R$ 4.250', change: '+8.7%', trend: 'up', icon: 'TrendingUp', color: 'var(--accent-primary)' },
]
const MONTHS = [['Jan',65],['Fev',78],['Mar',55],['Abr',90],['Mai',82],['Jun',95],['Jul',70],['Ago',88],['Set',92],['Out',75],['Nov',85],['Dez',98]]
const PRODUTORES = [['Vinícius Assis','R$ 485.000',92],['Hicila Fernandes','R$ 412.000',78],['Carlos Santos','R$ 358.000',68],['Marina Costa','R$ 295.000',56],['Roberto Lima','R$ 247.000',47]]
const ATIVIDADES = [
  ['Nova apólice emitida','Auto · Leonardo Perboni','Há 5 min','var(--signal-success)'],
  ['Cotação solicitada','Vida · Mario Sgarbi','Há 12 min','var(--accent-primary)'],
  ['Renovação pendente','Empresarial · 1001 Ind.','Há 30 min','var(--signal-warning)'],
  ['Sinistro registrado','Auto · Edmilson Giovani','Há 1h','var(--signal-danger)'],
  ['Lead convertido','Residencial · Ana Silva','Há 2h','var(--signal-success)'],
]

function SectionTitle({ icon, children }) {
  const Icon = DashIcons[icon]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      <span style={{ color: 'var(--accent-primary)', display: 'flex' }}><Icon size={20} /></span>
      <h2 style={{ margin: 0, fontFamily: 'var(--font-text)', fontSize: 'var(--t-lg)', fontWeight: 'var(--w-bold)', color: 'var(--fg-1)' }}>{children}</h2>
    </div>
  )
}

function DashboardScreen() {
  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: '0 0 8px', fontFamily: 'var(--font-display)', fontSize: 'var(--t-3xl)', fontWeight: 'var(--w-bold)', color: 'var(--fg-1)', letterSpacing: 'var(--tr-tight)' }}>Dashboard</h1>
        <p style={{ margin: 0, fontFamily: 'var(--font-text)', color: 'var(--fg-3)' }}>Visão geral de performance e indicadores-chave.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 32 }}>
        {KPIS.map((k) => {
          const Icon = DashIcons[k.icon]
          return <KpiCard key={k.title} title={k.title} value={k.value} change={k.change} trend={k.trend} iconColor={k.color} icon={<Icon size={20} />} />
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 32 }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <SectionTitle icon="BarChart3">Produção Mensal</SectionTitle>
            <span style={{ fontFamily: 'var(--font-text)', fontSize: 'var(--t-sm)', fontWeight: 600, color: 'var(--fg-3)', background: 'var(--bg-surface-2)', padding: '6px 12px', borderRadius: 'var(--r-md)' }}>2026</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 180 }}>
            {MONTHS.map(([m, v]) => (
              <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ width: '100%', height: `${v}%`, background: 'linear-gradient(to top, var(--accent-primary), var(--accent-primary-hover))', borderRadius: '4px 4px 0 0' }} />
                <span style={{ fontFamily: 'var(--font-text)', fontSize: 10, color: 'var(--fg-4)', fontWeight: 500 }}>{m}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{ marginBottom: 24 }}><SectionTitle icon="PieChart">Top Produtores</SectionTitle></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {PRODUTORES.map(([name, val, pct], i) => (
              <div key={name}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent-primary-soft)', color: 'var(--accent-primary)', fontFamily: 'var(--font-text)', fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                    <span style={{ fontFamily: 'var(--font-text)', fontSize: 'var(--t-sm)', fontWeight: 500, color: 'var(--fg-1)' }}>{name}</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-text)', fontSize: 'var(--t-sm)', fontWeight: 600, color: 'var(--fg-2)' }}>{val}</span>
                </div>
                <div style={{ width: '100%', height: 6, background: 'var(--bg-surface-2)', borderRadius: 'var(--r-pill)' }}>
                  <div style={{ width: `${pct}%`, height: 6, background: 'linear-gradient(to right, var(--accent-primary), var(--accent-primary-hover))', borderRadius: 'var(--r-pill)' }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div style={{ marginBottom: 24 }}><SectionTitle icon="Activity">Atividades Recentes</SectionTitle></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {ATIVIDADES.map(([action, detail, time, color], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px', borderRadius: 'var(--r-md)' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, flex: 'none' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontFamily: 'var(--font-text)', fontSize: 'var(--t-sm)', fontWeight: 500, color: 'var(--fg-1)' }}>{action}</p>
                <p style={{ margin: 0, fontFamily: 'var(--font-text)', fontSize: 'var(--t-xs)', color: 'var(--fg-3)' }}>{detail}</p>
              </div>
              <span style={{ fontFamily: 'var(--font-text)', fontSize: 'var(--t-xs)', color: 'var(--fg-4)', whiteSpace: 'nowrap' }}>{time}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

window.DashboardScreen = DashboardScreen
})()
