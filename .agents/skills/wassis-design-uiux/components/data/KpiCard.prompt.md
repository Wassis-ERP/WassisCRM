Cartão de indicador (KPI) do dashboard — métrica com ícone colorido, valor grande e variação percentual.

```jsx
import { DollarSign, Users } from 'lucide-react'

<KpiCard title="Receita Total" value="R$ 2.847.500" change="+18.2%" trend="up"
  icon={<DollarSign size={20} />} iconColor="var(--signal-success)" />
<KpiCard title="Taxa de Conversão" value="34.8%" change="-2.1%" trend="down"
  icon={<Users size={20} />} iconColor="var(--accent-primary)" />
```

Use em grids de 4 colunas no topo de dashboards. `iconColor` aceita qualquer token (ramo, signal, accent).
