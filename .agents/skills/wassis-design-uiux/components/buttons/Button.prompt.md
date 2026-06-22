Botão de ação do W.Assis CRM — use para qualquer ação primária, secundária ou destrutiva; ative `pill` no CTA principal de uma tela (ex.: "Nova Oportunidade").

```jsx
import { Plus } from 'lucide-react'

<Button variant="primary" pill leadingIcon={<Plus size={16} />}>
  Nova Oportunidade
</Button>

<Button variant="secondary">Editar</Button>
<Button variant="ghost" size="sm">Cancelar</Button>
<Button variant="danger" size="sm">Excluir</Button>
```

Variantes: `primary` (azul sólido), `secondary` (azul soft), `ghost` (contorno), `danger` (vermelho soft). Tamanhos `sm | md | lg`. `pill` aplica o estilo de CTA da marca (caixa-alta + tracking + sombra azul). Ícones via `leadingIcon` / `trailingIcon` (use lucide-react, tamanho 14–18).
