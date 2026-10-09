# Multicálculo — integridade da transmissão Auto (09/10/2026)

## Escopo e fontes
Governada/contratual. Pedido do usuário: corrigir as lacunas identificadas enquanto Renato aprofunda a investigação SegFy. Referência: instruções/DBML v3.1, decisão 23 e de-para `aggerCoverageMap.ts`. Os contextos de mercado não estão disponíveis neste checkout. O ZIP SegFy é evidência parcial, não contrato de API.

## Decisão sobre legado
Refatorar o envio existente no WAssisBE sem apresentar `quotes.quote_requests` como implementação de `erp.calculos`. Um snapshot tipado de transmissão será persistido junto da solicitação legada, preservando condutor, datas e preferências; não altera o DBML nem substitui as tabelas canônicas. A ligação das telas ao backend exige a etapa canônica abaixo. Nenhum backend será implementado neste repositório frontend.

## Etapas
- [x] Continuação: bootstrap Auth0 e smoke do bundle Production corrigidos; jornada real FE→BE aprovada sem fallback local. Idempotência de `CorrelationId` corrigida/validada no BE. A migração canônica também depende da raiz `segurados`: a API grava `public.segurados` e as FKs ERP apontam para `erp.segurados`; consolidar as duas raízes em conjunto, com reconciliação explícita dos registros existentes.
- [x] Backend: snapshot de transmissão criado por solicitação, validação, persistência relacional e transporte até o adaptador; sem endpoint de edição.
- [x] Backend: impedir substituição silenciosa por segurado/data corrente/coberturas padrão; códigos sem de-para retornam restrição local.
- [x] Backend: distinguir aceite do agregador de resultado concluído e aceitar identidade explícita de seguradora/produto.
- [x] Testes adicionados e reexecutados: backend 143/143 local sem PostgreSQL e 148/148 no CI com Testcontainers; CRM 335/335. OCR real continua pendente por ambiente e não foi marcado como aprovado.
- [ ] Etapa posterior: serviços canônicos sobre `calculos`, `calc_*`, `calculo_coberturas`, `calculo_execucoes`, `cotacoes` e pagamentos, com escopo e idempotência.
- [ ] Etapa posterior: conectar hooks do frontend às APIs canônicas e persistir apresentações, após contrato disponível.

Pré-condição confirmada no backend: a API conectada de oportunidades ainda grava `public.oportunidades`, mas o contrato e as FKs do multicálculo usam `erp.oportunidades`. A próxima fatia precisa consolidar essa raiz de forma explícita; dual-write ou cópia silenciosa não serão usados como atalho.

## Contrato e aceite deste recorte
`POST /api/quotes/requests` recebe extensão aditiva `autoSubmission`; GET devolve o snapshot persistido. Não inventar payload SegFy. Versões com pessoas, datas e limites distintos não podem transmitir o mesmo pedido por defaults. Bônus zero e cobertura zero são valores explícitos. Ausência de snapshot ou mapeamento impede chamada externa segura, sem apagar histórico.

Os tipos `database.ts` já descrevem o domínio canônico e permanecem inalterados; o DTO transitório não deve ser acrescentado como tabela de negócio do frontend. `useCalculos` continua simulado até a etapa canônica estar pronta. Comparativo existente e impressão não equivalem a compartilhamento público ou PDF armazenado.

## Verificação
Backend: restore locked, build Release sem avisos, auditoria NuGet, modelo EF sem divergência e 143/143 testes locais sem PostgreSQL aprovados. O run 37962842731 passou 148/148 testes, incluindo as cinco integrações PostgreSQL/Testcontainers; localmente elas não iniciaram porque o Docker Desktop não ficou disponível. OCR real segue pendente sem Tesseract instalado. O CI anterior falhou apenas no scan da imagem API; o digest antigo do ASP.NET 10.0.12 tinha OpenSSL corrigível e foi substituído pelo digest oficial corrente, limpo no Trivy 0.75.0.

Frontend permanece sem mudança funcional neste recorte. O lockfile foi atualizado para as versões corrigidas de `brace-expansion` e `source-map-js`, causa única do run 37962854589; `npm audit --audit-level=moderate`, lint, 335 testes e build backend/Auth0 passaram localmente. A etapa canônica e a ligação de `useCalculos` continuam pendentes, sem apresentar o mock atual como integração concluída.

O run 37965320300 confirmou auditoria, lint, testes, build e construção da imagem, mas revelou três pacotes Alpine corrigíveis no digest NGINX anterior (`libexpat`, `pcre2` e `tiff`). O runtime foi reduzido para a variante oficial `stable-alpine-slim`, fixada por digest; Trivy 0.75.0 retornou zero HIGH/CRITICAL no artefato remoto. O build Node também foi atualizado para o digest corrente da mesma tag 22-alpine, sem alterar a versão da aplicação.

## Evidências da continuação FE→BE

Fetch/status/log confirmaram CRM `0295172` e BE `3752478`; os CIs 37965793466/37965321761 passaram integralmente. Correções desta etapa:

- `main.tsx` passou a fornecer `VITE_AUTH_PROVIDER` à validação; o CI ganhou um smoke do bundle já compilado para detectar falha de bootstrap que o build não via.
- Seletor usa `GET /api/identity/me/branches`: somente ID/nome/atividade dos próprios vínculos vigentes, sem exigir permissão administrativa de grupo. O contexto de dados do BE continua na filial selecionada. `useMyBranches` não dispara consulta administrativa quando conectado.
- O tenant confirmado por `/api/identity/me` é mantido em memória para adapters após reload/login Auth0. Esse contexto não é credencial nem autorização; logout e 401 o limpam. A falha de ganho após reload foi reproduzida e corrigida.
- Backend corrigiu startup Development (processador somente no worker) e idempotência de pedido legado: mesma chave/conteúdo retorna o ID, outra versão retorna 409, concorrência produz uma outbox.

Validação local final: lint, 337/337 testes CRM, build backend/Auth0 e 1/1 smoke Production aprovados. E2E Playwright conectado **1/1 aprovado**, API real + PostgreSQL 16.15/TLS VerifyFull + role não-owner/NOBYPASSRLS, login, criar/editar/recarregar Segurados/Oportunidades, ganho, lista/Kanban e logout/nova sessão. Observados GET/POST/PUT ao BE; conexões fora das origens locais são rejeitadas pelo teste. Cálculos/Tarefas mostram integração pendente. Revisão visual 1440×900 sem overflow/sobreposição; capturas sintéticas em `.screens/e2e` ignoradas. Roteiro: `docs/e2e-local.md`.

BE: 152 testes sem PostgreSQL + seis integrações reais aprovados, zero ignorados; build sem avisos, restore locked, NuGet audit e modelo sem divergência. npm audit zero advisories; Gitleaks 8.30.1 redigido, zero achados nas árvores/históricos disponíveis (61 commits BE/79 CRM antes do checkpoint).

`src/lib/supabase.ts` é adapter **local em memória**, sem SDK ou serviço Supabase remoto; é recusado em modo conectado e Production. Segurados/Oportunidades e lookups citados usam BE. `useCalculos` continua demonstrativo e suas rotas conectadas bloqueadas. Isso não comprova todos os módulos do ERP conectados. O smoke Production intercepta 401 sintético e não comprova Auth0 real; PostgreSQL Windows não comprova fixture Docker, repetida no CI BE. Docker Desktop local permanece indisponível.

Contrato v3.1 e `database.ts` preservados: as mudanças de identidade são DTOs de contexto, sem alteração de tabelas, enums ou FKs de negócio. A divergência public/erp das **duas raízes** foi registrada como fase canônica; sem dual-write/backfill. Permanecem serviços/execuções/resultados/apresentações, renovação própria, de-para homologado, Auth0 provisionado/MFA/recuperação, OCR real e limites/custo operacional. Nenhuma migration em dados reais ou deploy.
