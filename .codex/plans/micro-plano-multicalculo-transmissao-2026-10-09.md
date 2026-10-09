# Multicálculo — integridade da transmissão Auto (09/10/2026)

## Escopo e fontes
Governada/contratual. Pedido do usuário: corrigir as lacunas identificadas enquanto Renato aprofunda a investigação SegFy. Referência: instruções/DBML v3.1, decisão 23 e de-para `aggerCoverageMap.ts`. Os contextos de mercado não estão disponíveis neste checkout. O ZIP SegFy é evidência parcial, não contrato de API.

## Decisão sobre legado
Refatorar o envio existente no WAssisBE sem apresentar `quotes.quote_requests` como implementação de `erp.calculos`. Um snapshot tipado de transmissão será persistido junto da solicitação legada, preservando condutor, datas e preferências; não altera o DBML nem substitui as tabelas canônicas. A ligação das telas ao backend exige a etapa canônica abaixo. Nenhum backend será implementado neste repositório frontend.

## Etapas
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
