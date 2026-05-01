# WassisCRM

Frontend CRM/Kanban do ecossistema W.Assis, focado em funis operacionais por modulo: comercial, emissao, pos-venda, financeiro e sinistro.

## Stack

- React 19
- Vite 8
- TypeScript strict
- React Router
- TanStack Query
- Zustand
- WAssisBE API/JWT
- Tailwind CSS 4

## Estrutura

Este app fica dentro do workspace `WassisCRM`:

```text
WassisCRM/
  package.json          # scripts roteados para nexus-crm
  nexus-crm/            # aplicacao Vite/React
  planos/               # planejamento tecnico e migracoes auxiliares
  stitch_screens/       # referencias visuais
```

## Configuracao local

Na raiz do workspace ou dentro de `nexus-crm`, crie um `.env` a partir do exemplo:

```powershell
Copy-Item .env.example .env
```

Variaveis:

```env
VITE_API_BASE_URL=https://localhost:54269
```

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

## Integracoes

- API .NET: helper em `src/lib/apiClient.ts`
- Sessao backend/JWT: `src/lib/backendSession.ts`
- Adaptador legado: `src/lib/supabase.ts` roteia chamadas antigas para o `WAssisBE` enquanto os hooks sao migrados para endpoints dedicados.
- Queries/cache: TanStack Query em `src/lib/queryClient.ts`
- Autenticacao: `src/contexts/AuthContext.tsx`
- Funis dinamicos: hooks em `src/hooks/usePipelines*.ts`

## Seguranca

- `.env`, `node_modules` e `dist` ficam fora do Git.
- O app nao deve acessar banco direto pelo browser.
- JWT signing keys, connection strings e credenciais de integracao ficam apenas no backend/ambiente seguro.
- Antes de release:

```powershell
npm audit --audit-level=moderate
npm run build
```

## Backend relacionado

Repositorio: `C:\Users\PC\source\repos\WAssisBE`

API local:

```powershell
dotnet run --project C:\Users\PC\source\repos\WAssisBE\src\WAssis.Services.Api\WAssis.Services.Api.csproj
```

O backend aceita CORS para os hosts Vite locais configurados em `Frontend:AllowedOrigins`.
