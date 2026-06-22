// Tela de listagem de Segurados do WassisCRM.
(function () {
const { StatusBadge, RamoBadge, Avatar, Button, Input } = window.WAssisDesignSystem_502d77
const SIcons = window.Icons

const SEGURADOS = [
  { nome: 'Leonardo Perboni', doc: '123.456.789-00', email: 'leo@email.com', ramos: ['Auto', 'Vida'], apolices: 3, status: 'Ativo' },
  { nome: '1001 Indústria Ltda', doc: '12.345.678/0001-90', email: 'contato@1001.com', ramos: ['Empresarial'], apolices: 5, status: 'Ativo' },
  { nome: 'Ana Silva', doc: '987.654.321-00', email: 'ana.silva@email.com', ramos: ['Residência'], apolices: 1, status: 'Renovar' },
  { nome: 'Mario Sgarbi', doc: '456.789.123-00', email: 'mario@email.com', ramos: ['Vida'], apolices: 2, status: 'Prospecto' },
  { nome: 'Edmilson Giovani', doc: '321.654.987-00', email: 'edmilson@email.com', ramos: ['Auto', 'Moto'], apolices: 4, status: 'Ativo' },
  { nome: 'Roberto Lima', doc: '789.123.456-00', email: 'roberto.lima@email.com', ramos: ['Saúde'], apolices: 1, status: 'Inativo' },
  { nome: 'Marcelo Dias', doc: '654.321.789-00', email: 'm.dias@email.com', ramos: ['Residência', 'Auto'], apolices: 2, status: 'Ativo' },
]

const TH = { textAlign: 'left', padding: '12px 20px', fontFamily: 'var(--font-text)', fontSize: 10, fontWeight: 'var(--w-black)', textTransform: 'uppercase', letterSpacing: 'var(--tr-caps)', color: 'var(--fg-4)' }
const TD = { padding: '14px 20px', fontFamily: 'var(--font-text)', fontSize: 'var(--t-sm)', color: 'var(--fg-1)', borderTop: '1px solid var(--border-1)' }

function Row({ s }) {
  const [hover, setHover] = React.useState(false)
  return (
    <tr onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{ background: hover ? 'var(--bg-surface-2)' : 'transparent', transition: 'background var(--dur-fast) var(--ease-out)', cursor: 'pointer' }}>
      <td style={TD}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar name={s.nome} size={36} />
          <div>
            <div style={{ fontWeight: 'var(--w-semibold)', color: 'var(--fg-1)' }}>{s.nome}</div>
            <div style={{ fontFamily: 'var(--font-text)', fontSize: 12, color: 'var(--fg-3)' }}>{s.email}</div>
          </div>
        </div>
      </td>
      <td style={{ ...TD, fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--fg-2)' }}>{s.doc}</td>
      <td style={TD}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{s.ramos.map((r) => <RamoBadge key={r} ramo={r} dot={false} />)}</div>
      </td>
      <td style={{ ...TD, textAlign: 'center', fontWeight: 'var(--w-bold)' }}>{s.apolices}</td>
      <td style={TD}><StatusBadge status={s.status} /></td>
    </tr>
  )
}

function SeguradosScreen() {
  const Plus = SIcons.Plus, Search = SIcons.Search
  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: '0 0 8px', fontFamily: 'var(--font-display)', fontSize: 'var(--t-3xl)', fontWeight: 'var(--w-bold)', color: 'var(--fg-1)', letterSpacing: 'var(--tr-tight)' }}>Segurados</h1>
          <p style={{ margin: 0, fontFamily: 'var(--font-text)', color: 'var(--fg-3)' }}>{SEGURADOS.length} segurados na carteira ativa.</p>
        </div>
        <Button variant="primary" pill leadingIcon={<Plus size={16} />}>Novo Segurado</Button>
      </div>

      <div style={{ marginBottom: 16, maxWidth: 360 }}>
        <Input pill leadingIcon={<Search size={16} />} placeholder="Buscar por nome, CPF/CNPJ ou e-mail..." />
      </div>

      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-1)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: 'var(--bg-surface-2)' }}>
            <th style={TH}>Segurado</th><th style={TH}>CPF / CNPJ</th><th style={TH}>Ramos</th>
            <th style={{ ...TH, textAlign: 'center' }}>Apólices</th><th style={TH}>Status</th>
          </tr></thead>
          <tbody>{SEGURADOS.map((s) => <Row key={s.doc} s={s} />)}</tbody>
        </table>
      </div>
    </div>
  )
}

window.SeguradosScreen = SeguradosScreen
})()
