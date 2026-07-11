---
target: lista de propostas e apolices com endosso vinculado
total_score: 22
p0_count: 0
p1_count: 3
timestamp: 2026-07-10T15-52-13Z
slug: crm-src-components-propostas-propostaslistview-tsx
---
# Design Health Score

| # | Heuristica | Nota | Questao principal |
|---|---|---:|---|
| 1 | Visibilidade do estado | 3/4 | Os badges existem, mas nao mostram claramente a relacao contrato-documento. |
| 2 | Correspondencia com o mundo real | 3/4 | A terminologia e correta; a lista plana nao representa apolice e documentos filhos. |
| 3 | Controle e liberdade | 2/4 | Falta uma perspectiva inequivoca de contrato versus documento. |
| 4 | Consistencia e padroes | 2/4 | Contratos e documentos usam a mesma anatomia; Editar nao corresponde ao resultado. |
| 5 | Prevencao de erros | 2/4 | Status contratual e etapa documental podem ser confundidos. |
| 6 | Reconhecimento em vez de memorizacao | 2/4 | O operador precisa reconciliar linhas repetidas mentalmente. |
| 7 | Flexibilidade e eficiencia | 2/4 | Nao ha agrupamento ou aceleradores evidentes. |
| 8 | Estetica e minimalismo | 3/4 | A base e limpa, mas a duplicacao de entidades gera ruido. |
| 9 | Recuperacao de erros | 2/4 | Acoes provisorias nao orientam um proximo passo real. |
| 10 | Ajuda e documentacao | 1/4 | Falta explicacao contextual dos tres tipos de estado. |
| **Total** | | **22/40** | **Aceitavel; melhorias significativas necessarias** |

# Anti-Patterns Verdict

## Avaliacao humana

A interface nao parece gerada por IA de imediato. Ela e coerente, densa e operacional. O problema e de arquitetura da informacao: a composicao plana nao foi reconciliada com o dominio apolice -> documentos. A mesma Viaforte aparece como apolice e endosso em linhas equivalentes, com estados que parecem competir.

## Varredura deterministica

O detector retornou exit code 0, JSON vazio e zero regras ou locais. Isso confirma que nao ha anti-padroes mecanicos detectaveis no componente; o defeito principal exige julgamento de produto.

## Evidencia visual

A criacao de uma nova aba isolada falhou com `Grouping is not supported by tabs in this window`, e o in-app browser alternativo estava indisponivel. Nenhum overlay foi criado. A avaliacao visual humana usou a rota ao vivo em uma aba independente na Avaliacao A; a captura fornecida pelo usuario tambem evidencia a duplicacao.

# Impressao geral

A base visual funciona, mas a lista responde mal a pergunta central: a Viaforte e dois contratos ou um contrato com um endosso? A maior oportunidade e transformar o contrato em unidade visual e revelar os documentos como filhos.

# O que funciona

- Terminologia e badges ja separam Apolice, Endosso, Vigente e Endosso em tramitacao.
- Colunas e densidade sustentam leitura rapida de um cockpit operacional.
- Tokens, tipografia e superficies permanecem coerentes com o WassisCRM.

# Issues prioritarios

## [P1] A arquitetura plana contradiz o modelo contratual

**Por que importa:** apolice e endosso parecem negocios equivalentes, afetando contagem, triagem e entendimento.

**Correcao:** usar arvore agrupada: linha principal para o contrato; chevron do pai para documentos; sublinhas indentadas para proposta, endosso, renovacao e fatura; cada filho com acao ou chevron proprio de detalhe.

**Comando sugerido:** `$impeccable shape`.

## [P1] Status contratual e tramitacao documental competem

**Por que importa:** Vigente, Endosso em tramitacao e Pendente parecem estados concorrentes da mesma entidade.

**Correcao:** no pai, mostrar `Contrato: Vigente` e `Situacao operacional: 1 endosso em tramitacao`; no filho, `Etapa: Pendente`.

**Comando sugerido:** `$impeccable clarify`.

## [P1] Affordances prometem outra acao

**Por que importa:** o botao rotulado Editar abre um aviso de detalhe; os chevrons sao todos anunciados apenas como Expandir.

**Correcao:** usar `Ver detalhes`, destinos reais e labels contextuais com `aria-expanded` e `aria-controls`.

**Comando sugerido:** `$impeccable harden`.

## [P2] A expansao revela o conteudo errado

**Por que importa:** campos de veiculo nao explicam a cadeia documental que o usuario tentou abrir.

**Correcao:** mostrar tipo/numero do documento, etapa, transmissao, emissao, efeito, premio e responsavel.

**Comando sugerido:** `$impeccable distill`.

## [P2] Semantica e escala de interacao sao frageis

**Por que importa:** grid de divs, labels genericos e textos de 10-11 px prejudicam teclado, leitor de tela e zoom.

**Correcao:** tabela semantica ou treegrid com roles explicitos, foco visivel, alvos confortaveis e associacao entre cabecalhos e celulas.

**Comando sugerido:** `$impeccable audit`.

# Personas

## Alex, operador avancado

Reconcilia manualmente as duas linhas Viaforte, nao consegue varrer um contrato e todos os documentos como unidade e perde previsibilidade na acao Editar. A arvore deve permitir teclado e expandir/recolher todos.

## Sam, teclado e leitor de tela

Varios botoes chamados Expandir nao informam o registro controlado; falta `aria-expanded`; a grade visual nao garante associacao semantica; controles e textos pequenos perdem contexto no zoom.

## Riley, casos-limite

Uma apolice sem documentos, dez endossos, documentos recusados/sem numero, renovacoes encadeadas e multiplos endossos simultaneos exigem ordenacao, historico preservado e `Ver todos` sem um terceiro nivel confuso.

# Observacoes menores

- `Acompanhamento de Propostas` nao descreve bem uma superficie que mistura contratos e documentos.
- O numero da apolice deve aparecer na linha principal.
- Quantidade de documentos e documento mais recente sao bons resumos do pai recolhido.
- A alternancia `Apolices | Documentos` e util como perspectiva secundaria, nao como substituta do agrupamento.

# Perguntas a considerar

- A visao padrao deve responder primeiro qual contrato existe ou qual documento precisa de acao?
- Quais tres sinais no pai recolhido bastam para decidir se ele deve ser aberto?
- O filho precisa de um segundo accordion ou `Ver documento` preserva melhor a densidade?
- Com dez endossos, quantos ficam visiveis antes de `Ver todos`?

# Recomendacao

Adotar a arvore agrupada por apolice na visao de carteira. Preservar a lista plana somente na perspectiva explicitamente documental e no Kanban, onde cada linha/cartao e uma proposta movimentavel. Como complemento futuro, oferecer `Apolices | Documentos` compartilhando busca e filtros.
