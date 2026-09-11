# 6.5B — Comparativo e apresentacao comercial

> **Estado reconciliado em 11/09/2026:** limite vigente de cinco cotações, conforme [finalização de 10/09](micro-plano-finalizacao-front-2026-09-10.md) e DBML/instruções v3.1. Referências a três produtos nas evidências de julho descrevem a entrega inicial. Hand-off consolidado na seção 6 do [relatório raiz](../../relatorio-endpoints-campos.md).

Status: `[x] Concluído em 2026-07-22`\
Classificacao: `governada/contratual`\
Criado em: 2026-07-22

## Objetivo

Permitir que o corretor escolha os melhores resultados, compare produtos e
monte uma apresentacao comercial para o cliente sem confundir o artefato de
apresentacao com a cotacao de cada seguradora.

## Tabelas DBML envolvidas

- leitura: `oportunidades`, `calculos`, `cotacoes`, coberturas e parcelamentos
  por cotacao, `seguradoras` e `coberturas_catalogo`;
- escrita: cabecalho e itens normalizados da apresentacao comercial aprovados
  no 6.4R-A;
- ponte futura somente leitura: `propostas.cotacao_id`.

## Legado atual

Decisao: **construir sobre os resultados aninhados do 6.5A**. Nao existe hoje
persistencia do agrupamento composto; nao improvisar estado definitivo no
frontend antes do contrato aprovado.

## Experiencia proposta

### Selecao

- permitir selecionar resultados na lista do calculo;
- manter uma bandeja persistente com contagem e resumo;
- aceitar resultados de calculos diferentes da mesma oportunidade;
- agrupar sempre por versao/perfil para nao esconder diferencas de risco ou
  cobertura;
- impedir mistura entre oportunidades;
- permitir limpar, substituir e reordenar selecoes.

### Comparativo

- comparar até cinco cotações lado a lado (ampliação de 10/09/2026);
- alinhar coberturas equivalentes pelo catalogo/de-para normalizado;
- destacar ausencia de cobertura, limites e franquias diferentes;
- exibir premio, pagamento, comissao apenas quando autorizado e mensagens da
  seguradora;
- permitir voltar aos resultados sem perder a selecao.

### Apresentacao comercial

- escolher layout vertical ou horizontal;
- ordenar por recomendacao, premio ou franquia;
- marcar produtos recomendados/destacados;
- escolher opcao de parcelamento por cotacao;
- controlar exibicao de FIPE, vantagens, legenda, observacoes e comissao;
- editar apenas textos comerciais permitidos, sem alterar o resultado oficial;
- oferecer preview fiel antes de concluir;
- gerar uma representacao mock para impressao/download, claramente identificada
  como frontend enquanto nao houver gerador real.

## Persistencia

Usar as entidades de apresentacao aprovadas no 6.4R-A. O snapshot deve
preservar:

- oportunidade e autoria;
- cotacoes selecionadas;
- ordem e destaque;
- opcao de parcelamento escolhida;
- configuracoes de visibilidade;
- observacoes comerciais;
- data de geracao.

Nao copiar o perfil inteiro, nao alterar a cotacao original e nao armazenar o
documento como JSON de negocio. O arquivo renderizado futuro pode ser anexo,
mas a estrutura que o gerou deve permanecer normalizada.

## Arquivos frontend provaveis

- componentes da lista de resultados e bandeja de selecao;
- pagina/rota dedicada de comparativo e configuracao da apresentacao;
- dominio, hooks, mock e testes do modulo comercial;
- `database.ts` e `inMemoryDb.ts` conforme o contrato aprovado;
- primitives de preview/impressao reutilizaveis, sem gerador externo.

## Mock/tipos necessarios

- agregado tipado da apresentacao e seus itens;
- fixtures de coberturas comparaveis, ausentes e divergentes;
- persistencia deterministica de selecao, ordem, destaque e visibilidade;
- renderer de preview derivado do snapshot, sem duplicar dado oficial.

## Relacao com proposta

- selecionar ou apresentar uma cotacao nao cria proposta;
- apenas uma acao explicita de aprovacao/efetivacao pode usar
  `propostas.cotacao_id`;
- se o cliente escolher uma cotacao da apresentacao, registrar a escolha sem
  descartar as demais;
- o fluxo de efetivacao fica fora deste recorte, salvo a ponte visual e de
  contrato necessaria.

## Nao escopo

- motor real, PDF definitivo ou envio externo;
- assinatura/aceite juridico do cliente;
- pagamento, proposta, emissao ou apolice;
- editor livre de documentos;
- armazenamento em JSON;
- backend, SQL ou migration no repositorio frontend.

## Criterios de aceite

- [x] E possivel selecionar cotacoes de uma ou mais versoes da mesma
      oportunidade, com agrupamento explicito.
- [x] O comparativo limita a cinco produtos e alinha coberturas equivalentes (validação posterior na finalização de setembro).
- [x] Diferencas de franquia, limite, premio e parcelamento ficam claras.
- [x] O corretor configura ordem, destaque e campos visiveis sem alterar a
      cotacao de origem.
- [x] Preview e representacao mock preservam a selecao.
- [x] Sair e voltar nao perde o estado salvo da apresentacao.
- [x] Nenhuma proposta e criada implicitamente.
- [x] Persistencia e tipos seguem o contrato normalizado aprovado.

## Testes funcionais minimos

- selecionar e remover resultados na bandeja;
- bloquear quarta cotacao no comparativo com feedback util;
- combinar duas versoes e conferir os agrupamentos;
- alinhar cobertura ausente/presente e franquias diferentes;
- escolher parcelamento, ordem, destaque e visibilidade;
- salvar, reabrir e conferir o snapshot;
- gerar preview/mock e voltar sem perder estado;
- garantir que cotacoes originais e proposta permanecem inalteradas.

## Notas para o hand-off final de Endpoints & Campos

Registrar CRUD da apresentacao, selecao/ordenacao atomica, regras de mesma
oportunidade, leitura consolidada de cotacoes e geracao futura de arquivo.
Controle de acesso, URL assinada, armazenamento do documento e auditoria ficam
sob responsabilidade do backend.

## Verificacao prevista

Aplicar os gates governados do projeto uma vez sobre o diff final e validar
lista, bandeja, comparativo, configuracao e preview no navegador em zoom 100% e
viewport desktop comum.

## Resultado entregue

- bandeja persistente compartilhada entre versoes, com remocao, limite de tres
  itens e feedback ao tentar selecionar a quarta cotacao;
- pagina dedicada de comparativo, configuracao e preview, com agrupamento
  explicito por versao e alinhamento de coberturas pelo catalogo/de-para;
- destaques para cobertura ausente e divergencias de limite, FIPE, franquia,
  premio e parcelamento;
- configuracao normalizada de layout, ordenacao, recomendacao, escolha do
  cliente, textos comerciais e campos visiveis, sem alterar cotacao ou proposta;
- representacao mock imprimivel e snapshot reabrivel no mock em memoria;
- tipos de `apresentacoes_comerciais` e `apresentacao_cotacoes` alinhados ao
  DBML/instrucoes v3.0, sem drift conhecido neste recorte.

## Evidencias de verificacao

- `tsc -b --pretty false`: aprovado;
- Vitest completo: 38 arquivos e 258 testes aprovados;
- ESLint focado nos arquivos alterados: aprovado;
- build Vite de producao: aprovado; permanece apenas o aviso conhecido de chunk
  principal acima de 500 kB;
- navegador em zoom 100% e viewport 1440 x 900: selecao entre duas versoes,
  bloqueio da quarta cotacao, comparativo, configuracao, preview, geracao mock,
  retorno e reabertura exercitados; sem overflow horizontal da pagina e sem
  erros no console.
