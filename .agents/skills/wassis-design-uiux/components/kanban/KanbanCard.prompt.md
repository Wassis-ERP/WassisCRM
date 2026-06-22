Card de funil (Kanban) — o componente-assinatura do W.Assis CRM. Representa uma oportunidade/apólice/sinistro numa coluna de pipeline.

```jsx
<KanbanCard
  tag="AUTO"
  title="Renovação Frota XPTO"
  subtitle="1001 Indústria Ltda"
  dueDate="2026-06-25"
  responsavelName="Vinícius Assis"
  value={48500}
  valueLabel="Prêmio"
  accent="primary"
  tags={[{ label: 'Renovar', tone: 'warning' }]}
/>
```

A `dueDate` colore o prazo: vermelho (atrasado), azul (hoje), âmbar (futuro), e tinge a borda. `accent` muda a cor do valor. `accentBar` adiciona a barra lateral colorida (use em módulos secundários). Empilhe estes cards numa coluna com cabeçalho de etapa para reconstruir um board.
