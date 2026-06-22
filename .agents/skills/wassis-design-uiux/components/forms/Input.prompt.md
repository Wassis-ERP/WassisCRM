Campo de texto da marca — para formulários, modais de criação e a busca global do header (use `pill` + `leadingIcon`).

```jsx
import { Search } from 'lucide-react'

<Input label="Nome do segurado" placeholder="Ex.: Maria Silva" />
<Input label="E-mail" error="E-mail inválido" defaultValue="abc" />
<Input pill leadingIcon={<Search size={16} />} placeholder="Buscar por nome, CPF, e-mail..." />
```

Props: `label`, `hint`, `error`, `leadingIcon`, `pill`. Foco mostra o ring azul da marca; `error` pinta a borda de vermelho.
