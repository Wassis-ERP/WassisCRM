# Walkthrough — Fase 0: Segurança e Fundações de Acesso

## Resumo

Implementação completa da camada de autenticação, proteção de rotas e **Matriz de Permissões Granular** do Nexus CRM. O sistema agora não apenas autentica, mas também carrega o papel (Role) e as capacidades do usuário (CRUD por módulo) diretamente do banco de dados.

---

## Marcos Alcançados

### 1. Banco de Dados (Supabase)
*   **Limpeza de Segurança**: Remoção da tabela `public.users` que continha campos de senha redundantes/expostos.
*   **Nova Tabela `public.role_permissions`**: Implementação da estrutura de matriz. Esta tabela atua como "Template" de permissões.
*   **Templates Iniciais**: População automática para os papéis `admin`, `vendedor` e `visualizador`.
*   **RLS (Row Level Security)**: Configurado para permitir que usuários autenticados leiam suas próprias permissões.

### 2. Arquivos de Lógica e Tipagem

| Arquivo | Finalidade |
|---|---|
| `src/types/auth.ts` | **Atualizado**: Adicionado suporte a `ModulePermission` e tipagem exata para Papéis (`Role`). |
| `src/contexts/AuthContext.tsx` | **Reestruturado**: Agora realiza o "Full Fetch" no login (Sessão + Perfil + Matriz de Permissões). |
| `src/hooks/usePermission.ts` | **Novo**: Hook `usePermission('modulo')` criado para facilitar verificações de UI (ex: `can('create')`). |
| `src/hooks/useAuth.ts` | Hook utilitário para acessar o contexto de autenticação. |
| `src/components/layout/PrivateRoute.tsx` | Proteção de rotas com suporte ao estado de carregamento. |

### 3. Interface (UI/UX)
*   **LoginPage.tsx**: Interface premium conectada ao Supabase Auth Real.
*   **Estado de Carregamento**: Adicionada tela de "Autenticando..." para evitar o "Flash de Tela Branca" enquanto as permissões são buscadas no banco.

---

## Resumo Técnico dos Papéis

*   **`admin`**: Bypass total. Pode tudo em todos os módulos.
*   **`vendedor`**: Focado no comercial (CRUD), mas apenas leitura em financeiro.
*   **`visualizador`**: Acesso de leitura (view-only) em todos os módulos liberados.

---

## Validação de Segurança (LGPD)

- [x] As credenciais de acesso nunca são armazenadas em tabelas públicas do banco.
- [x] O controle de acesso é centralizado no `AuthContext`, impedindo acesso via URL a rotas protegidas.
- [x] Implementado princípio do menor privilégio (usuários novos nascem como `visualizador` por padrão).

## Próxima Etapa do Plano Macro

**Fase 1 — Motor de Pipelines**: Começaremos o desenho das tabelas de negociações e a infraestrutura para os múltiplos funis comerciais.
