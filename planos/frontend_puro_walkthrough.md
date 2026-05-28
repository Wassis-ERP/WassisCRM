# Walkthrough — Migração para "Frontend Puro" (sessão volátil)

## Contexto

O repositório `nexus-crm/` foi originalmente construído conversando direto com o **Supabase** e, em seguida, redirecionado para um **BFF .NET (WAssisBE)** através de um adapter que mimetizava a API do Supabase. O backend será reconstruído fora deste repositório, então o CRM foi convertido para um modo **frontend puro**:

- Toda a camada de dados roda **em memória dentro do browser**.
- Operações de **CRUD** funcionam normalmente (criar, editar, excluir, listar).
- Um **full reload da página zera os dados de domínio** (lookups e pipelines padrão voltam pela seed).
- Não há mais autenticação real — um usuário admin estático é entregue pelo `AuthProvider`.

A estratégia segue o conceito de **BFF**, mas com o "B" implementado **in-process no próprio browser**: uma camada que expõe a mesma API que as ~25 hooks + 5 module adapters já consumiam, evitando reescrever páginas, modais, hooks e rotas.

---

## Visão geral da arquitetura final

```
src/
├── lib/
│   ├── inMemoryDb.ts            ← tabelas em memória + seed + RELATIONS
│   ├── inMemoryQueryBuilder.ts  ← builder encadeável (select/insert/update/upsert/delete + joins)
│   ├── supabase.ts              ← adapter exposto: from(), rpc(), functions.invoke()
│   └── queryClient.ts           ← TanStack Query (cache também morre no refresh)
├── contexts/
│   └── AuthContext.tsx          ← Context + AuthProvider mock (usuário admin fixo)
├── hooks/                       ← 25 hooks intactos
├── modules/                     ← 5 module adapters intactos
├── pages/                       ← páginas intactas
└── components/                  ← modais e layout intactos
```

**Princípio central:** o adapter mantém a mesma forma do client Supabase (`.from().select().eq()...` thenable, `{ data, error }`), então **nada acima da camada `lib/` precisou ser tocado**.

---

## Cronologia das mudanças

### Etapa 1 — Inventário da superfície real

Antes de codar, mapeamos exatamente o que era usado:

- **Métodos do builder**: `from`, `select`, `insert`, `update`, `upsert`, `delete`, `eq`, `ilike`, `order`, `limit`, `single`, `maybeSingle`, thenable. ( `neq`, `in`, `gte`, `lte`, `contains`, `or`, `is`, `range` aparecem no código antigo mas não são exercidos em runtime — incluí os mais prováveis assim mesmo.)
- **Joins em selects**: padrão PostgREST `alias:fk ( fields )` (forward many-to-one) e `tabela (fields)` sem alias (reverse one-to-many, usado só em `pipelines → pipeline_stages`).
- **RPCs**: apenas `get_team_members`.
- **Edge functions**: apenas `invite-user`.
- **Auth real**: lia `profiles`, `user_roles`, `role_permissions`.

Essa lista virou o checklist do que o adapter precisava cobrir.

### Etapa 2 — Criação do `inMemoryDb.ts`

Arquivo novo: [`src/lib/inMemoryDb.ts`](../nexus-crm/src/lib/inMemoryDb.ts).

- **Tabelas** como variáveis de módulo (`const db: Record<string, Row[]>`). Como módulos JS reinicializam no full reload, é a forma mais natural de ter "estado de sessão volátil" sem código extra.
- **Tabelas registradas**: `oportunidades`, `emissoes`, `pos_vendas`, `financeiro_cobrancas`, `sinistros`, `segurados`, `pessoa_contato`, `pipelines`, `pipeline_stages`, `profiles`, `user_roles`, `role_permissions`, `ramos`, `seguradoras`, `origens`, `motivos_perda`, `anexos`, `atividades`, `audit_logs`, `tenants`.
- **Helpers**: `newId()` (UUID v4 via `crypto.randomUUID` com fallback), `nowIso()`, `getTable(name)`.
- **Constantes**: `MOCK_TENANT_ID`, `MOCK_USER_ID`.
- **`RELATIONS`**: mapa que o builder consulta para resolver joins. Cada entrada é `<sourceTable>.<alias>` → `{ target, localFk | childFk, kind: 'forward' | 'reverse' }`. Cobre:
  - Forwards de `oportunidades` para `segurados`, `ramos`, `seguradoras`, `origens`, `motivos_perda`.
  - Forwards de `emissoes`, `pos_vendas`, `sinistros`, `financeiro_cobrancas` para `oportunidades`.
  - Forwards de `segurados` para `profiles` via aliases `produtor` (`produtor_id`) e `gerente` (`gerente_id`).
  - Forwards de `pessoa_contato` para `segurados` via aliases `pj` (`pj_id`) e `pf` (`pf_id`).
  - Reverse `pipelines → pipeline_stages` via `pipeline_id`.
- **`seed()`**: roda uma única vez na carga do módulo e popula:
  - 1 tenant mock (`Wassis Dev`).
  - 1 profile + user_role admin (`dev@wassis.com`).
  - Matriz de permissões completa para `admin`, `vendedor`, `visualizador` × 9 módulos.
  - Lookups: 5 ramos, 5 seguradoras, 5 origens, 4 motivos_perda.
  - 5 pipelines (1 por módulo) com 3-4 stages cada, incluindo flags `is_win_eligible`/`is_loss_eligible`.

### Etapa 3 — Criação do `inMemoryQueryBuilder.ts`

Arquivo novo: [`src/lib/inMemoryQueryBuilder.ts`](../nexus-crm/src/lib/inMemoryQueryBuilder.ts).

A peça mais densa. Implementa a classe `InMemoryQueryBuilder<T>` que mimetiza o builder do Supabase:

- **Encadeável** com fluent API (`.from('x').select('*').eq('id', y).single()`).
- **Thenable** — implementa `then()` para que `await builder` funcione direto.
- **Operações**: `select`, `insert`, `update`, `upsert`, `delete`.
- **Filtros**: `eq`, `neq`, `in`, `ilike` (com tradução de `%`/`_` para regex), `gte`, `lte`.
- **Modificadores**: `order(col, { ascending?, nullsFirst? })`, `limit`, `range`, `single`, `maybeSingle`.
- **`select()` após write**: permite o padrão `.insert(payload).select('*').single()` — retorna o registro inserido projetado.
- **Parser de `select`**: faz split top-level por vírgula respeitando parênteses, depois para cada segmento decide se é coluna (`id`, `nome`), wildcard (`*`) ou join (`alias:fk ( inner )` ou `nome ( inner )`).
- **Projeção com joins**:
  - Forward: usa o `localFk` no source para achar o registro em `getTable(target)`. Atribui em `row[alias]` (ou `null`).
  - Reverse: filtra `getTable(target).filter(c => c[childFk] === row.id)`. Atribui em `row[alias]` como array.
  - Recursivo: joins aninhados (ex. `emissoes → oportunidades → segurados`) funcionam.
- **Retorno**: `{ data, error: null, count }`. Para `.single()`, valida cardinalidade e retorna erro PostgREST-like (`PGRST116`) quando 0 ou >1 linhas.

### Etapa 4 — Substituição do `supabase.ts`

[`src/lib/supabase.ts`](../nexus-crm/src/lib/supabase.ts) foi totalmente reescrito.

Versão inicial mantinha um `auth` completo (signIn/signOut/getSession/onAuthStateChange/refreshSession/getUser + subscribers) por compatibilidade. Após a segunda passada de limpeza, **toda a seção `auth.*` foi removida** porque ninguém mais a consome — o `AuthProvider` entrega o usuário direto pelo Context.

O arquivo final expõe apenas:

```ts
export const supabase = {
  from<T>(table) { return new InMemoryQueryBuilder<T>(table); },
  async rpc(name, params) { /* get_team_members local */ },
  functions: { async invoke(name, opts) { /* invite-user: noop ok */ } },
};
```

### Etapa 5 — Deleção da camada HTTP antiga

Removidos definitivamente:

- `src/lib/apiClient.ts` (fetch wrapper para o BFF)
- `src/lib/apiClient.test.ts`
- `src/lib/backendSession.ts` (storage de access token + endpoints `/api/identity/*`)
- `src/lib/backendSession.test.ts`

Nenhum import sobrou. `package.json` já não tinha `@supabase/supabase-js`.

### Etapa 6 — Consolidação do `AuthContext.tsx`

Antes: dois arquivos (`AuthContext.tsx` com provider real + `MockAuthContext.tsx` paralelo) e seleção condicional no `main.tsx` via `VITE_USE_MOCK_AUTH`.

Depois: um único arquivo [`src/contexts/AuthContext.tsx`](../nexus-crm/src/contexts/AuthContext.tsx) (~60 linhas) que exporta:

- `AuthContext` — o React Context (consumido por `hooks/useAuth.ts`).
- `AuthProvider` — componente que entrega `session`, `user` (com permissões admin completas), `loading: false`, `signOut`/`refreshSession` no-op.

Deletados:

- `src/contexts/MockAuthContext.tsx` (absorvido pelo `AuthContext.tsx`).

### Etapa 7 — Simplificação de roteamento

Como o `AuthProvider` sempre entrega um usuário, `/login` e `PrivateRoute` viraram código morto.

- Deletado: `src/pages/LoginPage.tsx`.
- Deletado: `src/components/layout/PrivateRoute.tsx`.
- [`src/App.tsx`](../nexus-crm/src/App.tsx) simplificado: o root agora é só `function App() { return <AppLayout />; }`. Sumiram o `<Routes>` raiz, a rota `/login` e o wrapper `<PrivateRoute>`.

### Etapa 8 — Ajustes de bootstrap e envs

- [`src/main.tsx`](../nexus-crm/src/main.tsx) agora importa `AuthProvider` direto de `contexts/AuthContext`, sem branch por env var.
- `.env` e `.env.example` esvaziados (placeholder explicando que não há backend a configurar).
- `VITE_USE_MOCK_AUTH` e `VITE_API_BASE_URL` deixaram de existir.

### Etapa 9 — README

[`nexus-crm/README.md`](../nexus-crm/README.md) reescrito:

- Banner avisando que está em modo frontend puro com sessão volátil.
- Stack atualizada (removida menção a `WAssisBE API/JWT`).
- Seções de "Backend relacionado" e "Configuracao local" com variáveis removidas.
- Nova seção **Arquitetura da camada de dados (modo offline)** descrevendo os três arquivos chave e como retornar para um backend real.

---

## Como rodar e verificar

```powershell
cd nexus-crm
npm install
npm run dev
```

- Abra `http://localhost:3000`.
- Crie uma oportunidade → veja no kanban → mova entre stages → marque ganho/perdido → exclua.
- Repita para `segurados`, `emissões`, `pós-venda`, `financeiro`, `sinistros`.
- DevTools → Network: zero requisições XHR/fetch para `/api/*`.
- **F5**: tudo que você criou some; lookups e pipelines padrão voltam.

Validação de build:

```powershell
npm run build   # tsc -b && vite build → exit 0
```

---

## Inventário final de arquivos

### Adicionados

| Arquivo | Linhas | Função |
|---|---|---|
| `src/lib/inMemoryDb.ts` | ~260 | Tabelas em memória + RELATIONS + seed |
| `src/lib/inMemoryQueryBuilder.ts` | ~330 | Builder encadeável thenable |

### Modificados (e enxugados)

| Arquivo | Estado |
|---|---|
| `src/lib/supabase.ts` | Reescrito (~50 linhas). Só `from`, `rpc`, `functions.invoke`. |
| `src/contexts/AuthContext.tsx` | De ~195 → ~60 linhas. Provider mock estático. |
| `src/main.tsx` | Importa `AuthProvider`; sem flag de mock. |
| `src/App.tsx` | Sem `<Routes>`, sem `/login`, sem `PrivateRoute`. |
| `.env`, `.env.example` | Esvaziados. |
| `README.md` | Reescrito. |

### Removidos

- `src/lib/apiClient.ts` + `.test.ts`
- `src/lib/backendSession.ts` + `.test.ts`
- `src/contexts/MockAuthContext.tsx`
- `src/pages/LoginPage.tsx`
- `src/components/layout/PrivateRoute.tsx`

### Preservados intactos

- Todas as 25 hooks (`src/hooks/*`)
- Os 5 module adapters (`src/modules/comercial`, `emissao`, `pos_venda`, `financeiro`, `sinistro`)
- Todas as páginas (`src/pages/*`)
- Todos os modais e componentes (`src/components/*`)
- `src/lib/queryClient.ts`
- `src/types/*` (incluindo o schema gerado em `database.ts` — fonte de tipos, sem custo de runtime)

---

## Como reintroduzir um backend de verdade depois

Quando o WAssisBE (ou outro backend) estiver pronto:

1. **Substituir `src/lib/supabase.ts`** por um adapter HTTP que aponta para os endpoints reais (similar ao que existia antes — `apiRequest` + `/api/data-gateway/query`).
2. **Deletar** `src/lib/inMemoryDb.ts` e `src/lib/inMemoryQueryBuilder.ts`.
3. **Trocar `AuthProvider`** em `src/contexts/AuthContext.tsx` por uma versão que faz login real (a forma antiga ainda está no git history como referência).
4. **Recriar** `LoginPage.tsx` e `PrivateRoute.tsx`, e voltar o `<Routes>` em `App.tsx` (também disponível no git history).
5. Reativar `.env` com `VITE_API_BASE_URL` apontando para a API.

Nenhuma hook, módulo ou página precisa mudar — a interface continua a mesma.

---

## Pontos de atenção / dívidas conhecidas

1. **`invite-user` (`useTeamAdmin`)** retorna `{ ok: true }` falso. A UI mostra "convite enviado" mas nada acontece. Aceitável por enquanto.
2. **`audit_logs`** recebe inserts (de várias hooks admin) mas nenhuma página lê a tabela; é um lixo controlado.
3. **Joins não mapeados em `RELATIONS`** caem para o heurístico `alias = nome da tabela`. Se um novo select usar um alias não mapeado, basta acrescentar uma entrada em `RELATIONS`.
4. **Cardinalidade exata do `.single()`** retorna erro PostgREST-like. Se alguma hook esperar comportamento diferente, ajustar caso a caso.
5. **`src/types/database.ts`** continua sendo o schema gigante gerado do Supabase original. Não é lixo — fornece tipagem `Row/Insert/Update` para as hooks. Mas vários tipos (Views, Functions, Enums não usados) ainda estão lá; limpeza opcional para outra rodada.
