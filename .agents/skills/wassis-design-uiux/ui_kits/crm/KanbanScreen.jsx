// Tela de Kanban (funil Comercial) do WassisCRM, com arrastar-e-soltar.
(function () {
const { KanbanCard, Button } = window.WAssisDesignSystem_502d77
const KIcons = window.Icons
const { useState: useKState } = React

const STAGES = [
  { id: 'novo', name: 'Novo Lead', color: 'var(--neutral-400)' },
  { id: 'cotacao', name: 'Em Cotação', color: 'var(--ramo-auto)' },
  { id: 'negociacao', name: 'Negociação', color: 'var(--ramo-previdencia)' },
  { id: 'fechamento', name: 'Fechamento', color: 'var(--signal-success)', win: true },
]

const INITIAL = {
  novo: [
    { id: 'c1', tag: 'AUTO', title: 'Seguro Auto — HB20', subtitle: 'João Pereira', dueDate: '2026-06-28', responsavelName: 'Marina Costa', value: 3200, valueLabel: 'Prêmio' },
    { id: 'c2', tag: 'VIDA', title: 'Vida Individual', subtitle: 'Ana Costa', dueDate: '2026-07-02', responsavelName: 'Hicila Fernandes', value: 1850, valueLabel: 'Prêmio' },
  ],
  cotacao: [
    { id: 'c3', tag: 'RESIDÊNCIA', title: 'Resid. Apto Centro', subtitle: 'Marcelo Dias', dueDate: '2026-06-22', responsavelName: 'Vinícius Assis', value: 980, valueLabel: 'Prêmio', tags: [{ label: 'Retorno hoje', tone: 'warning' }] },
    { id: 'c4', tag: 'EMPRESARIAL', title: 'Renovação Frota XPTO', subtitle: '1001 Indústria Ltda', dueDate: '2026-06-18', responsavelName: 'Carlos Santos', value: 48500, valueLabel: 'Prêmio', tags: [{ label: 'Renovar', tone: 'warning' }] },
  ],
  negociacao: [
    { id: 'c5', tag: 'SAÚDE', title: 'Plano Família', subtitle: 'Roberto Lima', dueDate: '2026-07-10', responsavelName: 'Hicila Fernandes', value: 12400, valueLabel: 'Prêmio' },
  ],
  fechamento: [
    { id: 'c6', tag: 'MOTO', title: 'Moto CG 160', subtitle: 'Paulo Henrique', dueDate: '2026-07-15', responsavelName: 'Marina Costa', value: 2100, valueLabel: 'Prêmio', accent: 'success', tags: [{ label: 'Ganho', tone: 'success' }] },
  ],
}

function fmt(v) {
  return v >= 1000 ? `R$ ${(v / 1000).toFixed(1).replace('.0', '')}K` : `R$ ${v}`
}

function StatusToggle({ value, onChange }) {
  const opts = [['active', 'Ativos'], ['concluded', 'Concluídos'], ['all', 'Todos']]
  return (
    <div style={{ display: 'flex', gap: 2, padding: 4, background: 'var(--bg-surface)', border: '1px solid var(--border-1)', borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-1)' }}>
      {opts.map(([v, label]) => (
        <button key={v} onClick={() => onChange(v)} style={{
          padding: '6px 12px', borderRadius: 'var(--r-sm)', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--font-text)', fontSize: 10, fontWeight: 'var(--w-black)', textTransform: 'uppercase', letterSpacing: 'var(--tr-widest)',
          background: value === v ? 'var(--accent-primary)' : 'transparent',
          color: value === v ? 'var(--accent-primary-fg)' : 'var(--fg-4)',
          boxShadow: value === v ? 'var(--shadow-1)' : 'none',
          transition: 'all var(--dur-fast) var(--ease-out)',
        }}>{label}</button>
      ))}
    </div>
  )
}

function Column({ stage, cards, onDragStart, onDrop }) {
  const [over, setOver] = useKState(false)
  const total = cards.reduce((s, c) => s + (c.value || 0), 0)
  return (
    <div style={{ width: 288, flex: 'none', display: 'flex', flexDirection: 'column', minHeight: 0 }}
      onDragOver={(e) => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={() => { setOver(false); onDrop(stage.id) }}>
      <div style={{ marginBottom: 12, padding: '0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color, flex: 'none' }} />
            <h3 style={{ margin: 0, fontFamily: 'var(--font-text)', fontSize: 10, fontWeight: 'var(--w-black)', textTransform: 'uppercase', letterSpacing: 'var(--tr-caps)', color: 'var(--fg-3)' }}>{stage.name}</h3>
            <span style={{ padding: '2px 6px', background: 'var(--bg-surface)', border: '1px solid var(--border-1)', borderRadius: 'var(--r-sm)', fontFamily: 'var(--font-text)', fontSize: 9, fontWeight: 'var(--w-black)', color: 'var(--fg-4)' }}>{cards.length}</span>
            {stage.win && <span title="Etapa de ganho" style={{ color: 'var(--signal-success)', fontSize: 10, fontWeight: 900 }}>★</span>}
          </div>
        </div>
        {total > 0 && <div style={{ marginTop: 4, marginLeft: 16, fontFamily: 'var(--font-text)', fontSize: 9, fontWeight: 'var(--w-black)', textTransform: 'uppercase', letterSpacing: 'var(--tr-widest)', color: 'var(--fg-4)' }}>Total: <span style={{ color: 'var(--accent-primary)' }}>{fmt(total)}</span></div>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto', padding: 4, borderRadius: 'var(--r-lg)', background: over ? 'var(--accent-primary-soft)' : 'transparent', transition: 'background var(--dur-fast) var(--ease-out)' }} className="custom-scrollbar">
        {cards.map((c) => (
          <div key={c.id} draggable onDragStart={() => onDragStart(c.id, stage.id)} style={{ cursor: 'grab' }}>
            <KanbanCard {...c} />
          </div>
        ))}
        {cards.length === 0 && (
          <div style={{ height: 72, border: '1px dashed var(--border-1)', borderRadius: 'var(--r-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--font-text)', fontSize: 9, fontWeight: 'var(--w-black)', textTransform: 'uppercase', letterSpacing: 'var(--tr-widest)', color: 'var(--fg-4)', fontStyle: 'italic' }}>Vazio</span>
          </div>
        )}
      </div>
    </div>
  )
}

function KanbanScreen() {
  const [board, setBoard] = useKState(INITIAL)
  const [status, setStatus] = useKState('active')
  const [drag, setDrag] = useKState(null)
  const Plus = KIcons.Plus, Search = KIcons.Search, Filter = KIcons.Filter

  const onDragStart = (cardId, from) => setDrag({ cardId, from })
  const onDrop = (to) => {
    if (!drag || drag.from === to) return setDrag(null)
    setBoard((b) => {
      const card = b[drag.from].find((c) => c.id === drag.cardId)
      if (!card) return b
      return {
        ...b,
        [drag.from]: b[drag.from].filter((c) => c.id !== drag.cardId),
        [to]: [...b[to], card],
      }
    })
    setDrag(null)
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'var(--t-3xl)', fontWeight: 'var(--w-black)', color: 'var(--fg-1)', textTransform: 'uppercase', letterSpacing: 'var(--tr-tighter)' }}>Comercial</h1>
          <p style={{ margin: '4px 0 0', fontFamily: 'var(--font-text)', fontSize: 11, fontWeight: 'var(--w-bold)', textTransform: 'uppercase', letterSpacing: 'var(--tr-widest)', color: 'var(--fg-4)' }}>Funil de novas oportunidades</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <StatusToggle value={status} onChange={setStatus} />
          <Button variant="primary" pill size="sm" leadingIcon={<Plus size={14} />}>Nova Oportunidade</Button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, marginBottom: 16, background: 'var(--bg-surface)', border: '1px solid var(--border-1)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-1)' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', left: 12, color: 'var(--fg-4)', display: 'flex' }}><Search size={14} /></span>
          <input placeholder="Buscar..." style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px 8px 34px', background: 'var(--bg-surface-2)', border: 'none', borderRadius: 'var(--r-md)', fontFamily: 'var(--font-text)', fontSize: 12, fontWeight: 600, color: 'var(--fg-2)', outline: 'none' }} />
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--fg-4)', fontFamily: 'var(--font-text)', fontSize: 10, fontWeight: 'var(--w-black)', textTransform: 'uppercase', letterSpacing: 'var(--tr-widest)' }}><Filter size={14} /> Filtros</span>
      </div>

      <div style={{ display: 'flex', gap: 16, flex: 1, overflowX: 'auto', overflowY: 'hidden', paddingBottom: 4 }} className="custom-scrollbar">
        {STAGES.map((s) => <Column key={s.id} stage={s} cards={board[s.id]} onDragStart={onDragStart} onDrop={onDrop} />)}
      </div>
    </div>
  )
}

window.KanbanScreen = KanbanScreen
})()
