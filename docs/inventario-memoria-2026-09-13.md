# Inventário de memória — 13/09/2026

53 arquivos com imports diretos de supabase/inMemoryDb, sem testes. Inclui infraestrutura do adapter; não equivale à quantidade de módulos/endpoints.

Caminhos condicionais conectados: AuthContext, useFiliais, useLookups, useOportunidades, usePerfis, usePermission, usePipelineStages, usePipelines, useProdutores, useProfileFiliais, useSeguradoNegocios, useSegurados e adapter comercial. useMyBranches consome as filiais reais. Notificações e preferências de abas não usam memória no modo conectado. Propostas fornece contexto indisponível com mutações rejeitadas.

Demais consumidores permanecem demonstração de desenvolvimento. A allowlist de rotas e requireMemoryMode impedem seu uso silencioso em HML/PRD. Novo consumidor exige contrato e endpoint dedicado antes de liberar UI; não há gateway arbitrário de tabelas.

- `nexus-crm/src/components/apolices/AgendaGenerationModal.tsx`
- `nexus-crm/src/components/apolices/ApoliceContractTabs.tsx`
- `nexus-crm/src/components/apolices/ApoliceOverview.tsx`
- `nexus-crm/src/components/apolices/ContractEditors.tsx`
- `nexus-crm/src/components/apolices/DerivedDocumentModal.tsx`
- `nexus-crm/src/components/apolices/contractTabOperations.ts`
- `nexus-crm/src/components/detail/useEntityTabsState.ts`
- `nexus-crm/src/components/oportunidades/QuoteOriginField.tsx`
- `nexus-crm/src/components/propostas/cadastro-manual/CadastroManualSteps.tsx`
- `nexus-crm/src/components/propostas/cadastro-manual/cadastroManualDomain.ts`
- `nexus-crm/src/components/propostas/importacao/importacaoDomain.ts`
- `nexus-crm/src/components/settings/ContractCatalogTab.tsx`
- `nexus-crm/src/contexts/AuthContext.tsx`
- `nexus-crm/src/contexts/PropostasContext.tsx`
- `nexus-crm/src/contexts/propostasAudit.ts`
- `nexus-crm/src/hooks/useCalculos.ts`
- `nexus-crm/src/hooks/useCamposPersonalizados.ts`
- `nexus-crm/src/hooks/useCommercialPresentation.ts`
- `nexus-crm/src/hooks/useFiliais.ts`
- `nexus-crm/src/hooks/useFiliaisAdmin.ts`
- `nexus-crm/src/hooks/useLookups.ts`
- `nexus-crm/src/hooks/useLookupsAdmin.ts`
- `nexus-crm/src/hooks/useNotifications.ts`
- `nexus-crm/src/hooks/useOportunidades.ts`
- `nexus-crm/src/hooks/usePerfis.ts`
- `nexus-crm/src/hooks/usePerfisAdmin.ts`
- `nexus-crm/src/hooks/usePermission.ts`
- `nexus-crm/src/hooks/usePipelineStages.ts`
- `nexus-crm/src/hooks/usePipelines.ts`
- `nexus-crm/src/hooks/usePipelinesAdmin.ts`
- `nexus-crm/src/hooks/usePosVendas.ts`
- `nexus-crm/src/hooks/useProdutores.ts`
- `nexus-crm/src/hooks/useProdutoresAdmin.ts`
- `nexus-crm/src/hooks/useProfileFiliais.ts`
- `nexus-crm/src/hooks/useSeguradoNegocios.ts`
- `nexus-crm/src/hooks/useSegurados.ts`
- `nexus-crm/src/hooks/useSinistros.ts`
- `nexus-crm/src/hooks/useTeamAdmin.ts`
- `nexus-crm/src/lib/inMemoryQueryBuilder.ts`
- `nexus-crm/src/lib/supabase.ts`
- `nexus-crm/src/modules/comercial/adapter.ts`
- `nexus-crm/src/modules/comercial/manualQuoteDomain.ts`
- `nexus-crm/src/modules/comercial/quoteProposalOrigin.ts`
- `nexus-crm/src/modules/financeiro/cobrancasDomain.ts`
- `nexus-crm/src/modules/financeiro/comissoesDomain.ts`
- `nexus-crm/src/modules/financeiro/extratoImportDomain.ts`
- `nexus-crm/src/modules/financeiro/extratosDomain.ts`
- `nexus-crm/src/modules/financeiro/parcelasDomain.ts`
- `nexus-crm/src/modules/financeiro/repasseDomain.ts`
- `nexus-crm/src/modules/plataforma/platformCommands.ts`
- `nexus-crm/src/modules/pos_venda/adapter.ts`
- `nexus-crm/src/modules/shared.ts`
- `nexus-crm/src/modules/sinistro/adapter.ts`
