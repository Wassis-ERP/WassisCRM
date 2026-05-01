# Fase 0 - Tasks (Segurança e Autenticação)

- [x] 1. Configurar SDK e Integração Base
  - [x] Criar `.env.example`
  - [x] Verificar `@supabase/supabase-js` no package.json
  - [x] Criar `src/lib/supabase.ts`
- [x] 2. Contexto e Gerenciamento de Estado
  - [x] Criar `src/types/auth.ts`
  - [x] Criar `src/contexts/AuthContext.tsx`
  - [x] Criar `src/hooks/useAuth.ts`
- [x] 3. Proteção e Guarda de Rotas
  - [x] Criar `src/components/layout/PrivateRoute.tsx`
  - [x] Ajustar e envolver o roteamento no `src/App.tsx`
  - [x] Envolver `main.tsx` com `AuthProvider`
- [x] 4. Interface (Login Premium)
  - [x] Criar `src/pages/LoginPage.tsx`
- [x] 5. Validação e Fechamento
  - [x] Checar compilação (`npx tsc --noEmit` — limpo)
  - [x] Atualizar Walkthrough
