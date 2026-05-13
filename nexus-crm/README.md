# WassisCRM

Frontend CRM/Kanban do ecossistema W.Assis, focado em funis operacionais por modulo: comercial, emissao, pos-venda, financeiro e sinistro.

> **Modo atual:** frontend puro. Toda a camada de dados roda em memória dentro do browser (`src/lib/inMemoryDb.ts`). Não há backend conectado: criar, editar e excluir registros funciona normalmente, mas **um full reload da página zera os dados de domínio**. Lookups, pipelines e o usuário admin são reseedados na carga.

## Stack

- React 19
- Vite 8
- TypeScript strict
- React Router
- TanStack Query
- Zustand
- Tailwind CSS 4

## Estrutura

```text
WassisCRM/
  package.json          # scripts roteados para nexus-crm
  nexus-crm/            # aplicacao Vite/React
  planos/               # planejamento tecnico e migracoes auxiliares
  stitch_screens/       # referencias visuais
```

## Configuracao local

Nenhuma variavel de ambiente eh necessaria no modo frontend puro. `.env`/`.env.example` ficam como placeholder para quando o backend definitivo for reintroduzido.

## Comandos

Pela raiz do workspace:

```powershell
npm install
npm run dev
npm run build
npm run lint
npm run preview
```

Ou diretamente no app:

```powershell
cd nexus-crm
npm install
npm run dev
```

## Arquitetura da camada de dados (modo offline)

- `src/lib/inMemoryDb.ts` — tabelas em memoria (`oportunidades`, `segurados`, `pipelines`, etc.) + `seed()` com lookups e pipelines/stages padrao por modulo.
- `src/lib/inMemoryQueryBuilder.ts` — builder encadeavel compativel com a API do Supabase (`select`, `insert`, `update`, `upsert`, `delete`, filtros, `order/limit/range/single/maybeSingle`, joins no estilo PostgREST).
- `src/lib/supabase.ts` — adapter exposto para as hooks: `from()`, `rpc()`, `functions.invoke()`. Sem `auth` (o `AuthProvider` entrega um usuario admin estatico).
- `src/contexts/AuthContext.tsx` — provider mock; nao ha login/logout reais.
- `src/lib/queryClient.ts` — TanStack Query (cache tambem morre no refresh).

Para reintroduzir um backend real, substitua o conteudo de `src/lib/supabase.ts` (e remova os dois arquivos `inMemory*`); as ~25 hooks e os 5 module adapters nao precisam mudar.
