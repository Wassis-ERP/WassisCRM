# WassisCRM

Frontend CRM/Kanban do ecossistema W.Assis, focado em funis operacionais por modulo: comercial, emissao, pos-venda, financeiro e sinistro.

## Stack

- React 19
- Vite 8
- TypeScript strict
- React Router
- TanStack Query
- Zustand
- Supabase Auth/Database
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
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
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

- Supabase: `src/lib/supabase.ts`
- API .NET: helper inicial em `src/lib/apiClient.ts`
- Queries/cache: TanStack Query em `src/lib/queryClient.ts`
- Autenticacao: `src/contexts/AuthContext.tsx`
- Funis dinamicos: hooks em `src/hooks/usePipelines*.ts`

## Seguranca

- `.env`, `node_modules` e `dist` ficam fora do Git.
- Chave `service_role` do Supabase nunca deve entrar neste repositorio.
- O app depende de RLS no Supabase para isolamento por tenant.
- Antes de release:

```powershell
npm audit --audit-level=moderate
npm run build
```

## Backend relacionado

Repositorio: `C:\Users\PC\source\repos\WAssisInsurance`

API local:

```powershell
dotnet run --project C:\Users\PC\source\repos\WAssisInsurance\src\WAssis.Services.Api\WAssis.Services.Api.csproj
```

O backend aceita CORS para os hosts Vite locais configurados em `Frontend:AllowedOrigins`.
