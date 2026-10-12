# Oportunidade — contexto comercial HTTP — 12/10/2026

Escopo governado/contratual; continuação autorizada. Refatorar a leitura existente
de `useOportunidade` para resolver ramo/origem/motivo/etapa por referências da própria
oportunidade, em lugar do diretório administrativo de Configurações. Sem mudança
de tela, layout, schema ou fluxo de escrita; skill de UI continua pendente.

Fontes conferidas: macro-plano, instruções/DBML v3.1 (`oportunidades`, `ramos`,
`origens`, `motivos_perda`, `pipeline_stages`, `pipelines`) e `database.ts`.
BE implementado na branch `codex/commercial-opportunity-context`, em repo separado.

- [x] Adapter de GET `/api/oportunidades/{id}/contexto-comercial`, projeção tipada,
  validação de vínculos/nullable/campos mínimos, AbortSignal; zero fallback.
- [x] Hook resolve contexto sem APIs de Configurações e isola cache por sessão/
  grupo/filial. Segurados mantém API e permissão própria; nenhum bypass pessoal.
- [x] Tests de contrato e consulta, tsc, suite, lint e build; registrar limites.

Campos de resposta: opportunityId; insuranceBranch (id/nome/risk_type/
grupo_operacional/forma_calculo); origin/lossReason (id/nome); stage com os 12 campos
de `pipeline_stages`. Somente registros vinculados, incluindo referências inativas
históricas; não constitui catálogo selecionável para edição.

Aceite deste recorte é a camada de leitura. Jornada completa criar pedido → reload
→ cotação manual → comparativo e validação no navegador permanecem pendentes.
`database.ts` não receberá tipos de infraestrutura, tabelas fictícias ou novo JSON.

Gates locais: tsc, 375 testes Vitest (12 novos), ESLint dos cinco arquivos TS e
build conectado aprovados. Mocks negados e respostas adulteradas não geram fallback;
request AbortSignal percorre oportunidade/contexto/segurado. Nenhum campo pipeline_id
foi acrescentado à oportunidade: o funil deriva de pipeline_stages, como no v3.1.
Backend PR #35, commit 1e3f54d; leitura do frontend depende desse endpoint.

Usuário orientou continuar os pontos sem skill e deixar o design das telas para
Renato. Nenhuma página/componente visual foi alterado. Catálogos retornados aqui são
projeções das referências existentes, não opções disponíveis para novas associações.
Caso a oportunidade esteja ligada a pessoa, sua leitura ainda pode ser negada pelo
módulo Segurados; a autorização não é ampliada nem escondida. Não certificar a
jornada no navegador pelo teste de hook: essa integração continua em recorte próprio.
