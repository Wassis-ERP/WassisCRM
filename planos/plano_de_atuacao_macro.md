# Plano Diretor Macro do CRM

Este documento é o guia oficial de roteirização do desenvolvimento do CRM. Cada "Fase" listada aqui deve ser tratada como um escopo isolado, ideal para ser inicializada em **uma nova conversa dedicada** com a IA. Essa estratégia de compartimentação serve para manter o contexto cirúrgico, sem alucinações e em pequenos passos seguros.

---

## FASE 0: Segurança, Fundações e Matriz de Permissões ✅ CONCLUÍDA

**Objetivo:** Proteger o front-end e estabelecer o "Cérebro de Acesso" granular. O banco precisa saber não apenas *quem* está logado, mas exatamente *o que* cada usuário pode fazer em cada módulo (Comercial, Financeiro, etc).

> 📖 **Walkthrough detalhado:** `planos/fase0_walkthrough.md`

- ✅ Configurar SDK do Supabase localmente.
- ✅ Criar o Provedor de Autenticação (`<AuthContext>`) gerenciando Estado e Sessão.
- ✅ Construção da Tela de Autenticação (`/login`) Premium.
- ✅ Construção de `PrivateRoute` no arquivo `App.tsx` (bloqueando acesso indevido).
- ✅ **Matriz de Permissões (Capabilities Matrix)**: Criação da estrutura de banco de dados onde "Módulos" (Linhas) se cruzam com "Ações CRUD" (Colunas) por usuário.

## FASE 1: O Motor de Pipelines - Infraestrutura Híbrida (Back-end) ✅ CONCLUÍDA

**Objetivo:** Construir a infraestrutura de banco de dados para múltiplos funis dinâmicos com multi-tenancy.

> 📖 **Walkthrough detalhado:** `planos/fase1_walkthrough.md`
> 📋 **Plano de implementação:** `planos/fase1_motor_pipelines_plan.md`

- ✅ Infraestrutura multi-tenancy: tabela `tenants` + `tenant_id` em todas as tabelas.
- ✅ Construção das tabelas `pipelines` (com `won_label`/`lost_label`) e `pipeline_stages` (com `is_win_eligible`).
- ✅ Refatoração de `oportunidades`: substituição de enums fixos por `pipeline_id` + `stage_id` + `status` (card_status: pending/won/lost).
- ✅ Políticas RLS com isolamento completo por tenant via função `get_user_tenant_id()`.
- ✅ Geração dos Tipos globais TypeScript via Supabase Gen (`database.ts`).

## FASE 1.1: Modelagem de Dados dos Módulos (Back-end) ✅ CONCLUÍDA

**Objetivo:** Criar a modelagem completa de dados para todos os módulos de negócio, consolidando `oportunidades` como hub central e criando tabelas dedicadas por módulo.

> 📖 **Walkthrough detalhado:** `planos/fase1_1_walkthrough.md`
> 📋 **Plano de implementação:** `.cursor/plans/arquitetura_dados_crm_2477cf9f.plan.md`

- ✅ Tabela `seguradoras` (nova lookup): nome, codigo_susep, ativo.
- ✅ Expansão de `oportunidades` como hub central: `seguradora_id`, `indicador`, `agenciamento`, `tipo_negocio`, `tipo_contato`, `metadata` JSONB. Campo `producao` convertido de gerado para editável (n8n calcula).
- ✅ Tabela `sinistros`: campos tipados (numero_sinistro, datas, valores) + JSONB por ramo (placa, BO, oficina...).
- ✅ Tabelas `emissoes`, `pos_vendas`, `financeiro_cobrancas`: enxutas, com lookup para oportunidade.
- ✅ Compartilhamento de `atividades` e `anexos` entre módulos via FKs nullable.
- ✅ Enums novos: `tipo_negocio` (novo/renovacao/endosso) e `tipo_sinistro` (colisao/roubo_furto/...).
- ✅ RLS em todas as novas tabelas. Banco agora com 18 tabelas e 6 enums.
- ✅ Regeneração de `database.ts` com tipagem completa.

## FASE 2: Materialização do Kanban e Telas (Front-end Híbrido) ✅ CONCLUÍDA

**Objetivo:** Colocar o Motor de Pipelines da Fase 1 visualmente na tela, criando um construtor de jornadas flexível.

> 📋 **Plano de implementação:** `planos/fase2_kanban_dinamico_plan.md`
> 📖 **Walkthrough:** `planos/fase2_walkthrough.md`

- ✅ Componente React de Drag-and-Drop agnóstico (`<KanbanBoard />`) + `<KanbanColumn />` + `<PipelineSelector />`.
- ✅ Infraestrutura TanStack Query com updates otimistas (`useMoveCard`, `useConcludeCard`) e adapters plugáveis por módulo (`ModuleAdapter` + `registry`).
- ✅ Bootstrap SQL idempotente (migração `006_fase2_bootstrap_seed`) populando tenant W.Assis, pipelines e stages padrão dos 5 módulos.
- ✅ **Pipeline Comercial** ponta-a-ponta: `NovaOportunidadeModal`, `ComercialCard`, `OportunidadeDetalhePage` e `OportunidadesListPage` persistindo em Supabase; botões **Ganho/Perdido** com seleção de motivo via `<ConcludeCardModal />`; `metadata jsonb` por ramo.
- ✅ Adapters e cards definitivos dos módulos Sinistro, Emissão, Pós-Venda e Financeiro (`KanbanCardShell` + `makeKanbanCard`), com rotas dedicadas e entradas no menu lateral.
- ✅ Filtros dinâmicos por módulo (`availableFilters` + `applyKanbanFilters`), toggle Ativos/Concluídos/Todos universal, contadores e soma de prêmio por coluna, selects populados via `useLookups`.
- ✅ Micro 7: walkthrough LGPD/RLS, atualização de `project-overview` / `status.yaml`, build TypeScript limpo; advisors Supabase documentados para execução manual no Dashboard (MCP opcional).

## FASE 2.5: Modais e Detalhes dos Demais Funis ✅ CONCLUÍDA

**Objetivo:** Fechar a lacuna de criação/edição manual dos funis não-comerciais antes de avançar para a Fase 3. Sinistro e Financeiro (independentes do Comercial) passam a ter modais ricos, enquanto Emissão e Pós-Venda ganham fallback administrativo mínimo até a automação via n8n (Fase 4).

> 📖 **Walkthrough detalhado:** `planos/fase2_5_walkthrough.md`

- ✅ Extensão do `ModuleAdapter` com `createModalComponent`, `createLabel` e `detailRoute`; botão "+ Novo" e navegação de detalhe integrados no `ModuleKanbanPage`.
- ✅ Hooks dedicados (`useSinistros`, `useFinanceiroCobrancas`, `useEmissoes`, `usePosVendas`) com `create/update/get` e invalidação de cache TanStack Query.
- ✅ **Sinistro** (criação manual rica): `NovoSinistroModal` com metadata por ramo e `SinistroDetalhePage` com edição + conclusão (Concluído / Cancelado); rota `/sinistros/:id`.
- ✅ **Financeiro** (cobrança avulsa/delinquência): `NovaCobrancaModal` com toggle "Vinculada a apólice" × "Avulsa" + metadata de parcela/atraso/forma_pagamento; `FinanceiroDetalhePage` com conclusão (Quitado / Inadimplente); rota `/financeiro/:id`. Migração SQL manual `007_fase2_5_cobranca_oportunidade_nullable.sql` libera `oportunidade_id` nullable.
- ✅ **Emissão / Pós-Venda** (fallback administrativo): `NovaEmissaoModal` e `NovaPosVendaModal` com banner informando que o fluxo primário é automatizado via n8n; filtro por oportunidades `won`; `EmissaoDetalhePage` (Emitida/Recusada) e `PosVendaDetalhePage` (Concluído/Cancelado); rotas `/emissoes/:id` e `/pos-venda/:id`.
- ✅ Build TypeScript limpo (`npx tsc --noEmit`) e walkthrough dedicado registrando escopo, smoke-test LGPD e dependência da migração 007.

## FASE 3: A Grande Integração (Configurações e Equipe) ✅ CONCLUÍDA

**Objetivo:** Dar "vida de verdade" ao aplicativo atual que já possui telas mas opera com lógicas simuladas, focando em segurança e conformidade LGPD.

> 📖 **Walkthrough detalhado:** `.context/docs/walkthroughs/phase3_integration.md`
> 📋 **Plano de implementação:** `planos/fase3_integracao_e_configuracoes_plan.md`

- ✅ **Gestão de Equipe Real**: Substituição de mocks por listagem via RPC `get_team_members` e troca de cargos vinculada ao Supabase Auth.
- ✅ **Matriz de Permissões Dinâmica**: Implementação de grade CRUD por módulo persistida na tabela `role_permissions`.
- ✅ **Aterramento de Lookups e Pipelines**: CRUD de Ramos, Seguradoras e Funis totalmente migrado para o Supabase com suporte a soft-delete (`is_active`).
- ✅ **Conformidade LGPD (Auditoria)**: Implementação da tabela `audit_logs` e registro automático de todas as ações administrativas para rastreabilidade.
- ✅ **Abandono de Mocks**: Remoção definitiva das abstrações `localStorage` (`SettingsContext`, `settingsCore.ts`) nas áreas afetadas.

## FASE 4: O "Cérebro" de Integrações via n8n

**Objetivo:** Extrair lógicas e gatilhos da infraestrutura primária e delegar orquestrações complexas para o ecossistema N8N. Os fallbacks manuais criados na Fase 2.5 para Emissão/Pós-Venda permanecem como "plano B administrativo"; Sinistro e Financeiro continuam com criação manual por natureza do negócio (evento externo e controle de inadimplência).

- Habilitar os Webhooks criptografados no Supabase (Database Webhooks).
- Configuração no n8n do fluxo cruzado primário: *"Dado o Ganho Comercial -> Disparar Criação de Oportunidade na Aba de Emissão"* e, na sequência, *"Emissão concluída -> Criar registro de Pós-Venda e parcelas Financeiras"*.
- Configuração no n8n: Geração automatizada das parcelas/receitas do fluxo Financeiro baseando-se nas chaves fixadas no Banco Tipado (sem remover o fluxo de cobrança avulsa manual).
- Rotinas (CRON): varredura noturna por etapas estagnadas gerando alertas para a equipe de gestão.

## FASE 5: Ferramentas Administrativas de Alta Gestão

**Objetivo:** Tirar a necessidade do Desenvolvedor alterar código sempre que o Diretor quiser adicionar perguntas aos funis.

- Construção do **Módulo Visual de Campos Dinâmicos (Construtor de Formulários)**.
- Integração que permita ao admin salvar a ordem visual dos campos que preencherão o JSONB dos cartões de seguros/propostas na ponta.

---

> [!TIP]
> **Como operar com o Plano Diretor:** Quando abrir um novo chat/conversa com a IA, inicie a conversa dizendo *"Vamos executar a FASE 0 presente no arquivo `planos/plano_de_atuacao_macro.md`"* e a IA saberá exatamente em que momento do projeto e com quais limitações e prioridades deve trabalhar!