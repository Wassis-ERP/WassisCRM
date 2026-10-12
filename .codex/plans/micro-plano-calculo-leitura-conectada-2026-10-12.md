# Cálculo — leitura conectada — 12/10/2026

Escopo governado/contratual. Continuação autorizada pelo usuário após o reset;
branch `codex/calculation-connected-reads`, baseada no checkpoint HTTP do PR #53.
Referências: instruções/DBML v3.1, macro-plano e micro-plano da fundação HTTP.

## Objetivo e legado

Refatorar no lugar a leitura de pedidos e execuções dos hooks existentes. No modo
backend, ler exclusivamente APIs canônicas, sem montar linhas fictícias do banco,
sem fallback em memória e sem exigir permissão de Configurações. Mock continua
isolado. Nenhuma alteração de tela/design neste recorte; `wassis-design` permanece
ausente e a integração visual/edição exige resolver essa dependência.

## Contrato e arquivos

Conferidos `calculos`, `calc_auto`, `calculo_coberturas`, `calculo_execucoes`,
`cotacoes`, `cotacao_coberturas`, `cotacao_parcelamentos`, `seguradoras` e
`coberturas_catalogo` com `database.ts` v3.1. Projeções de leitura não acrescentam
campos às tabelas. Reaproveitar o domínio de execução separando projeção de
mutação/simulação. Paginação limitada e verificada, AbortSignal propagado, IDs
duplicados rejeitados. Resultados antigos continuam visíveis após retry.

Arquivos: `useCalculos.ts`, domínio de cálculo/execução, serviço de leitura HTTP
e testes. GETs: pedidos por oportunidade, pedido por ID, execuções do pedido,
cotações da oportunidade e lookups comerciais do pedido. Sem SQL/backend novo.

## Critérios e limites

- [x] Hooks de leitura alternam por `VITE_DATA_MODE` e usam cache por usuário/filial.
- [x] Paginação, cancelamento, histórico e zero/nulo preservados; sem prêmio ou
  comissão inferidos. Catálogo ativo ausente não apaga resultado histórico.
- [x] Testes funcionais de serviço/hook e gates de TypeScript/Vitest/lint/build.
- [x] Registrar checkpoint e pendências para a jornada conectada completa.

Criação/duplicação do pedido, calendário do editor, lookups de pessoas, cotação
manual, apresentação e dependências administrativas de `useOportunidade` ainda
precisam do recorte seguinte. Este recorte não certifica a jornada criar → reload
→ cotar → comparar. Não há acionamento de seguradora ou criação de proposta.

Validação local: `tsc -b`, 363 testes Vitest (15 novos), ESLint dos seis arquivos
TypeScript alterados e Vite conectado aprovados. Build usa variáveis temporárias
de processo iguais às do CI, sem editar .env; avisos de fontes já existentes.
Não foi validada uma nova jornada no navegador: edição/persistência manual e
apresentação ainda não estão conectadas. Os hooks do editor/duplicação/assistência/
transmissão/retry recusam o modo backend antes de acessar o mock. Não promover
este checkpoint como fluxo completo nem mesclá-lo isoladamente para habilitar UI.

Limites explícitos: lista completa até 20 páginas de 100 registros; total alterado,
página curta, ID repetido ou execução/resultado divergentes causam erro, sem retorno
parcial. Filial, usuário e modo fazem parte das chaves de cache de leitura. Nome
do cotado é provisoriamente genérico (Lead/Segurado cadastrado), sem buscar pessoas
ou inventar nome; ramo Auto vem da única forma suportada pelo decoder canônico.
Seguradora/cobertura ausente do catálogo ativo mantém os resultados históricos
com rótulo indisponível/nome informado no resultado. `database.ts` permanece v3.1.
