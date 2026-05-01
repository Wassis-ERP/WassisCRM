# Fase 3: A Grande Integração e Configurações Globais

> **Status:** ✅ Concluída

## Contexto
O projeto avançou muito nas Fases 1 e 2 criando a lógica do Banco de Dados e as interfaces visuais principais (Kanban multi-funis, telas híbridas). Contudo, a aba de **Configurações Globais**, a lógica da matriz de permissões atual, equipes e listas de apoio (lookups) ainda dependiam de cenários _mockados_ em `localStorage`. 
Essa revisão adapta a Fase 3 para atender um requerimento fundamental: **ser possível criar, editar usuários e suas respectivas permissões DIRETAMENTE pela UI do sistema, conectados a um banco de dados vivo e sem furos nas regras.**

## Objetivos da Fase 3

1. [x] **Gestão Segura de Usuários pela UI:** Admins vão criar contas, definir os perfis (roles) e configurar a matriz de permissões, conectando o Supabase Auth aos registros em banco.
2. [x] **Abandono do "Mock" (localStorage):** Exclusão sumária de todas as abstrações offline como `settingsCore.ts`. Everything comes from and goes to the Postgres Database.
3. [x] **Gerência Real de Pipelines e Lookups:** Manipular Ramos, Seguradoras, Motivos de Perda e os Estágios (Funis) dos 5 módulos persistidos no Banco.
4. [x] **Respeito às Normas LGPD:** Toda exclusão será "Soft-Delete", todo controle de autorização será regido pelas RLS (`get_user_tenant_id()`).

---

## Estrutura de Execução por Micro-Fases

### Micro-fase 3.1: CRUD de Lookups (Rendição do Banco)
- [x] Substituído o uso de `SettingsContext` na área de Configurações.
- [x] Criado o hook `useLookupsAdmin.ts` para persistência no Supabase.
- [x] Implementado formulários visuais para Ramos, Seguradoras, Origens e Motivos de Perda.
- [x] Aplicado lógica de `ativo = false` para inativação de registros.

### Micro-fase 3.2: Gestão Completa de Oportunidades: Funis (Pipelines) e Etapas
- [x] Refatorado `usePipelinesAdmin.ts` e `usePipelineStagesAdmin.ts`.
- [x] Adicionada a coluna `is_loss_eligible` à tabela `pipeline_stages`.
- [x] Atualizado o `StepsConfigModal.tsx` para gerenciar flags de Ganho/Perda e ordenação.

### Micro-fase 3.3: Criação de Contas e Gestão de Equipe
- [x] Criada a função RPC `get_team_members` para listagem segura de perfis e cargos.
- [x] Implementado o hook `useTeamAdmin.ts`.
- [x] Refatorada a `ProdutoresPage.tsx` para exibir membros reais e permitir alteração de cargos.
- [x] Preparado fluxo de convite via Edge Function.

### Micro-fase 3.4: Editor da Matriz de Permissões
- [x] Criado o hook `usePermissionsAdmin.ts`.
- [x] Implementado o componente `PermissionsMatrix.tsx` para edição visual de permissões por cargo/módulo.
- [x] Integrada a aba "Matriz de Permissões" na `SettingsPage.tsx`.

### Micro-fase 3.5: RBAC Completo, Bloqueios e Validação LGPD
- [x] Criada a tabela `audit_logs` para rastreabilidade LGPD.
- [x] Implementados logs de auditoria em todos os hooks de administração (Lookups, Pipelines, Team, Permissions).
- [x] Garantido que administradores só vejam dados de seu próprio *tenant*.
- [x] Removida dependência do mock `settingsCore.ts` nas páginas afetadas.

---

## Próximos Passos
Prosseguir para a **Fase 4: Gestão de Segurados e Oportunidades**, focando em dados de contatos, histórico e arquivos.
