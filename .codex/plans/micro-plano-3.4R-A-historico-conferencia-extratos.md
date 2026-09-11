# Micro-plano 3.4R-A — Historico e conferencia de extratos

Status: `[x] Concluido`\
Classificacao: `governada/contratual`\
Criado em: 2026-07-21\
Implementacao iniciada: 2026-07-21.\
Concluido em: 2026-07-21.

## Objetivo

Fechar a lacuna de leitura operacional deixada depois do 3.4, tornando os
`comissao_extratos` ja persistidos no mock consultaveis e rastreaveis, e
completando a conferencia do cabecalho do demonstrativo contra a soma dos itens.

O recorte nao reabre o contrato da Fase 3 nem muda o significado de conciliacao
ou baixa. O core da Fase 3 permanece concluido.

## Motivacao

O assistente atual cria extrato, itens, conciliacoes e ocorrencias, mas a
experiencia de leitura fica concentrada no momento da importacao e na projecao
por comissao. Nao existe uma superficie propria para consultar demonstrativos
ja registrados, seu processamento, seus totais e suas ocorrencias.

Os HARs sanitizados do SegFy reforcam que extratos formam uma fila operacional
de longa duracao e precisam ser encontrados por seguradora, periodo e situacao.
A evidencia esta registrada em:

- `.codex/artefatos/benchmarks/segfy-har-financeiro.md`.

## Fontes de verdade obrigatorias

- `.codex/artefatos/instrucoes_projeto_wassis_v2_6.md`;
- `.codex/artefatos/wassis_erp_esqueleto_v2_6.dbml`;
- `.codex/plans/macro_plano.md`;
- `.codex/plans/micro-plano-3.2-contrato-extratos-conciliacao.md`;
- `.codex/plans/micro-plano-3.3-comissoes-baixa-manual.md`;
- `.codex/plans/micro-plano-3.4-leitura-automatica-extratos.md`;
- `relatorio-endpoints-campos.md`, somente como snapshot parcial;
- benchmark sanitizado dos HARs, somente como evidencia de mercado.

## Tabelas DBML envolvidas

Leitura principal:

- `comissao_extratos`;
- `comissao_extrato_itens`;
- `comissao_conciliacoes`;
- `comissao_conciliacao_ocorrencias`.

Lookups e navegacao:

- `filiais`;
- `seguradoras`;
- `comissoes`;
- `propostas`;
- `apolices`;
- `segurados`;
- `profiles` para autoria.

O recorte deve usar o contrato v2.6 existente. Qualquer necessidade de nova
coluna, enum, FK ou cardinalidade interrompe a implementacao e exige revisao
contratual antes de alterar o frontend.

## Legado atual e decisao

### Estado atual

- `useFinanceiroExtratos.ts` expoe apenas mutacoes de processar e confirmar;
- `extratoImportDomain.ts` persiste as quatro entidades no mock;
- `CommissionImportWizard.tsx` mostra previa, confirmacao e conclusao somente
  durante a sessao atual;
- `CommissionsView.tsx` projeta valores e estados por comissao;
- nao existe lista ou detalhe de extratos ja confirmados.

### Decisao de legado

Evoluir o dominio atual sem recriar as entidades e sem duplicar o cockpit.
`Financeiro` continua sendo a unica entrada do menu. A lista de extratos deve
ser aberta a partir de `Comissoes`, em rota dedicada interna ao modulo.

Rotas propostas:

- `/financeiro/extratos` — historico/fila de demonstrativos;
- `/financeiro/extratos/:id` — detalhe do cabecalho, itens e ocorrencias.

As rotas precisam ser declaradas antes de `/financeiro/:id` para nao colidir
com o detalhe de cobranca.

## Escopo executavel

### 1. Projecao tipada de extratos

Criar dominio de leitura que componha, sem fusao persistida:

- identificacao, competencia e periodo;
- corretora e seguradora;
- origem e formato;
- nome/referencia do arquivo;
- parser e versao;
- tentativa e tempos de processamento;
- status de processamento e conciliacao;
- quantidade de itens;
- totais bruto, liquido e descontos;
- quantidade de itens prontos, pendentes, divergentes, ignorados e sem vinculo;
- quantidade de ocorrencias abertas/resolvidas;
- autoria de recebimento/processamento.

### 2. Lista operacional

Entregar lista densa com:

- busca por referencia/nome do arquivo;
- filtros por corretora, seguradora, origem, formato, processamento,
  conciliacao e periodo;
- totais do escopo filtrado;
- badges textuais e semanticos;
- acesso ao detalhe;
- estado vazio, carregamento e erro;
- permissao de leitura respeitando as corretoras acessiveis.

Nao incluir arquivamento, exclusao, busca automatica ou download real do
arquivo neste recorte.

### 3. Detalhe do extrato

Exibir em pagina dedicada:

- cabecalho integral do extrato;
- total informado no demonstrativo;
- soma dos itens normalizados;
- diferenca de totalizacao;
- itens com referencia original, segurado/apolice/proposta/parcela informados,
  valores, percentual, tipo de comissao e status;
- conciliacoes e ocorrencias relacionadas;
- links para comissao, documento, apolice e segurado quando resolvidos;
- arquivo original como referencia somente leitura, sem prometer download
  funcional enquanto o backend nao existir.

### 4. Cabecalho da previa de importacao

Evoluir o contrato de frontend da previa para representar explicitamente:

- referencia externa/numero do demonstrativo;
- competencia e periodo;
- data de emissao;
- data de credito/recebimento informada;
- valor bruto total informado;
- valor liquido total informado;
- descontos totais informados;
- moeda;
- soma derivada dos itens;
- diferenca entre cabecalho e itens.

No mock, esses campos continuam identificados como demonstrativos. Nenhum
layout de seguradora pode ser declarado homologado.

### 5. Conferencia e validacoes

- destacar total compativel dentro da tolerancia monetaria aprovada;
- exigir justificativa ou ocorrencia quando houver diferenca relevante;
- nao alterar automaticamente valores previstos ou itens extraidos;
- nao transformar conciliacao em baixa;
- impedir duplicidade pelo hash/chave ja existentes;
- preservar dados originais e registrar correcoes como ocorrencias;
- manter bruto, liquido e descontos separados.

## Fora do escopo

- login ou senha de seguradora;
- scraping, robo ou download automatico em portal;
- cadastro/monitoramento generico de integracoes;
- busca automatica de parcelas atrasadas ou documentos;
- conta corrente, fluxo de caixa, tesouraria ou conciliacao bancaria;
- OCR e parser real no frontend;
- homologacao de layout sem fixture anonima;
- armazenamento, antivirus, retencao e URL assinada;
- anexo funcional na baixa manual;
- persistencia duravel da fila depois de recarregar a pagina;
- mesa concentrada de correcoes/reprocessamento do 3.4R-B;
- qualquer alteracao do Relatorio de Endpoints & Campos nesta rodada.

## Dependencias e fronteira do backend

O frontend/mock demonstra a leitura e o contrato esperado. O backend futuro
devera oferecer:

- consulta paginada/filtrada de extratos;
- detalhe com itens, conciliacoes e ocorrencias;
- upload e referencia segura do original;
- processamento assincrono e consulta de status;
- previa sem persistencia e confirmacao idempotente;
- reprocessamento por parser/versao;
- resultado item a item;
- enforcement de grupo/corretora e autoria;
- concorrencia e protecao contra confirmacao duplicada;
- URL temporaria para visualizacao/download;
- politicas de tamanho, antivirus e retencao.

Essas responsabilidades devem alimentar a consolidacao futura de
`relatorio-endpoints-campos.md`, mas nao ser implementadas neste repositorio.

## Arquivos frontend provaveis

- `nexus-crm/src/App.tsx`;
- `nexus-crm/src/pages/FinanceiroExtratosPage.tsx`;
- `nexus-crm/src/pages/FinanceiroExtratoDetalhePage.tsx`;
- `nexus-crm/src/components/financeiro/CommissionsView.tsx`;
- `nexus-crm/src/components/financeiro/CommissionImportWizard.tsx`;
- `nexus-crm/src/hooks/useFinanceiroExtratos.ts`;
- `nexus-crm/src/modules/financeiro/extratoImportDomain.ts`;
- novo dominio/projecao de leitura de extratos em
  `nexus-crm/src/modules/financeiro/`;
- testes focados do dominio e das validacoes;
- `nexus-crm/src/lib/queryClient.ts` se novas chaves forem necessarias.

`database.ts` somente deve mudar se a comparacao final provar drift contra o
DBML v2.6. Ele nao deve ser alterado para acomodar conveniencia de tela.

## UI/UX

Ao iniciar a implementacao:

- usar obrigatoriamente `wassis-design-uiux` e `impeccable`;
- preservar o cockpit denso e operacional do Financeiro;
- usar pagina dedicada para lista/detalhe, nunca modal prolongado;
- manter moeda e datas em pt-BR;
- usar fonte mono para valores e referencias tecnicas;
- nao depender apenas de cor para status;
- preservar navegacao de retorno para `Comissoes`;
- garantir teclado, foco, estados vazios e responsividade desktop.

## Ordem de implementacao

1. Revalidar DBML/instrucoes v2.6 e este micro-plano.
2. Criar projecao tipada e testes de totais/status.
3. Criar hook de consulta e chaves de cache.
4. Entregar lista `/financeiro/extratos`.
5. Entregar detalhe `/financeiro/extratos/:id`.
6. Evoluir a previa/cabecalho e suas validacoes.
7. Integrar links a partir de `Comissoes` e da conclusao da importacao.
8. Exercitar fluxo principal no navegador.
9. Atualizar este micro-plano e o macro com o resultado.

## Criterios de aceite

- [x] Existe lista de extratos acessivel a partir de `Comissoes`.
- [x] Filtros e totais respeitam as corretoras acessiveis.
- [x] O detalhe exibe cabecalho, itens, conciliacoes e ocorrencias.
- [x] Cabecalho informado, soma dos itens e diferenca sao distinguiveis.
- [x] Bruto, liquido e descontos permanecem separados.
- [x] Links resolvidos levam a comissao/documento/apolice/segurado corretos.
- [x] Nenhuma conciliacao cria baixa automaticamente.
- [x] Nenhum dado novo de negocio usa JSON.
- [x] Nenhuma busca automatica, credencial ou portal e introduzido.
- [x] Duplicidade por arquivo/identificacao continua idempotente.
- [x] `database.ts` e confirmado aderente ao DBML v2.6 ou o drift e registrado.
- [x] Fluxo principal e layout desktop sao validados no navegador.
- [x] TypeScript, Vitest, ESLint focado e build passam.

## Verificacao prevista

- revisar diff completo e arquivos nao rastreados;
- buscar novos `any`, `setState(` problemático, dialogos nativos e JSON de
  negocio;
- `tsc -b`;
- suite Vitest completa uma vez no fechamento;
- ESLint focado nos arquivos alterados;
- build de producao;
- navegador em zoom 100% e viewport desktop comum;
- validar lista, detalhe, filtros, totalizacao, retorno e deep links.

## Proximo passo apos este recorte

Depois da conclusao do 3.4R-A:

1. avaliar com evidencia de uso se o 3.4R-B e prioritario;
2. se nao for, seguir diretamente para `5.1 — Dashboards alinhados ao modelo
   real`;
3. manter busca automatica em portais fora do escopo;
4. usar o HAR de multicálculo apenas quando 6.4–6.6 forem iniciados.

## Fechamento da execucao

- Entregues lista e detalhe em `/financeiro/extratos` e
  `/financeiro/extratos/:id`, com escopo por corretora, filtros, totais,
  estados operacionais e leitura de itens, conciliacoes e ocorrencias.
- A previa da importacao passou a expor referencia, periodo, datas, bruto,
  descontos, liquido, moeda e comparacao da totalizacao. Divergencia de
  totalizacao exige justificativa antes da confirmacao.
- `Comissoes` recebeu acesso ao historico e aceita deep link por `comissao`; o
  detalhe resolve navegacao para comissao, documento, apolice e segurado.
- O contrato DBML v2.6 e `database.ts` ja continham as estruturas necessarias.
  Nao houve alteracao contratual, coluna nova nem uso de JSON de negocio.
- A idempotencia existente por identificacao/hash foi preservada e a
  conciliacao continuou separada da baixa.
- Validacao em 2026-07-21: `tsc -b`; 31 arquivos/212 testes Vitest; ESLint
  focado nos 11 arquivos TS/TSX do recorte; build de producao; fluxo no
  navegador em 1440x900, incluindo filtro/estado vazio, detalhe, totalizacao,
  retorno, deep link de comissao e previa demonstrativa.
- O aviso de chunk acima de 500 kB do build permanece como divida transversal
  preexistente e nao foi ampliado por uma decisao de contrato deste recorte.
