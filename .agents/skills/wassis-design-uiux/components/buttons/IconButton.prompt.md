Botão somente-ícone — para barras de ferramentas, cabeçalhos de coluna do Kanban e ações de linha (ex.: "mais opções", "fechar").

```jsx
import { MoreHorizontal, X } from 'lucide-react'

<IconButton label="Mais opções"><MoreHorizontal size={16} /></IconButton>
<IconButton tone="danger" label="Remover"><X size={16} /></IconButton>
```

Tons: `neutral | primary | danger`. Tamanhos `sm | md | lg`. Sempre passe `label` para acessibilidade.
