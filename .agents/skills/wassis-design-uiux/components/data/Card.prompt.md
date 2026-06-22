Superfície de seção — o contêiner-padrão para blocos de detalhe, listas e formulários. Borda fina + sombra suave + cantos de 8px.

```jsx
import { Users } from 'lucide-react'

<Card title="Dados do segurado" icon={<Users size={16} />} action={<Button variant="ghost" size="sm">Editar</Button>}>
  <p>Conteúdo da seção…</p>
</Card>

<Card>Card sem cabeçalho (só corpo).</Card>
```

Omita `title` para um card sem header. `action` fica à direita do cabeçalho.
