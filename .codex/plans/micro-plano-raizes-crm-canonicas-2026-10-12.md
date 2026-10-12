# Raízes CRM canônicas — 12/10/2026

## Escopo
Governada/contratual. Usuário autorizou continuidade e confirmou que eventuais registros existentes são somente não produtivos; dispensada reconciliação de dados legados. Referência: DBML/instruções v3.1, micro-plano de transmissão Auto e revisão dos commits BE 3af5da2 / CRM 2e78b5e, com CIs aprovados.

## Decisão de legado
Reconstruir as raízes Segurados/Oportunidades sobre `erp.*` no backend, eliminando as tabelas legadas `public.*` na migration não produtiva. Manter contrato HTTP de leitura compatível para a interface atual; campos canônicos, UUIDs, calendário e permissões governam a gravação. Sem dual-write nem migration neste repositório frontend.

## Etapas
- [x] Backend: mapas canônicos, reset não produtivo, isolamento e testes de regressão. CI BE 38248283807, commit ab95578, integralmente aprovado com 160 testes.
- [x] Jornada HTTP real com PostgreSQL/Testcontainers e role sem bypass aprovada no CI.
- [ ] Jornada Playwright local desta rodada: bloqueada pelo Controle de Aplicativos ao iniciar psql. Não invalidar a evidência anterior do Renato, nem reutilizá-la como teste desta mudança.
- [x] Pedidos Auto no BE: POST/GET `/api/oportunidades/{id}/calculos`, GET `/api/calculos/{id}`, payload e retorno canônicos com CTI/coberturas. Header `Idempotency-Key` obrigatório; retry equivalente retorna mesmo ID, alteração retorna 409. [CI funcional 38254084220](https://github.com/Wassis-ERP/WAssisBE/actions/runs/38254084220), commit 1b54cb4, integralmente aprovado. Local: 156 testes sem PostgreSQL + 7 integrações PostgreSQL/TLS aprovados, nenhum ignorado; concorrência/rollback/renovação própria cobertos.
- [ ] Execuções/resultados e apresentações, bridge do motor legado e ligação dos hooks.

Tabelas envolvidas: `segurados`, `oportunidades`, `profiles`, `produtores`, `pipelines`, `pipeline_stages`, `ramos`, `origens`, `motivos_perda`, `apolices`. `database.ts` segue o v3.1 e não requer alteração neste recorte. Nenhuma tela nova/hook de cálculo será conectado antes das APIs correspondentes. Endpoints e campos adicionais serão registrados aqui durante implementação; relatório consolidado não será reemitido por etapa.

Verificação: gates backend e jornada Playwright FE→BE; mudanças documentais frontend não exigem repetição de build/lint/testes da aplicação inalterada.

## Contrato dos pedidos Auto para integração futura
POST recebe campos de `CalculationCreateInput` com `specialization.forma = AUTO`. O backend gera `rotulo_versao`, substitui IDs técnicos recebidos por IDs próprios, deriva vigência e segurado padrão e devolve `{calculation,specialization,coverages}`. Lista é paginada `{items,page,pageSize,totalCount}`. Zero/unknown são preservados; só dados de ramo Auto e catálogos do ramo são aceitos. Datas em `yyyy-MM-dd`; novo deriva calendário no timezone do grupo herdado pela filial. Renovação própria deriva a apólice de origem do ramo/escopo e bloqueia informação anterior contraditória. Alteração de pedido exige novo POST/nova chave, sem editar snapshot. Receita técnica de idempotência e auditoria pertencem exclusivamente ao backend.

`database.ts` permanece alinhado ao v3.1; nenhuma tabela de receipts ou DTO técnico foi acrescentada ao mock. `useCalculos` e as rotas conectadas continuam aguardando execução/resultados para uma jornada coerente, sem misturar backend e resultados simulados. Ver `docs/canonical-calculations-plan.md` no BE para implementação e limites. Nenhum prompt de continuidade é gravado nos repositórios.
