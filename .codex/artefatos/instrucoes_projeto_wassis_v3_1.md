# INSTRUÇÕES DO PROJETO — ERP/CRM W.Assis para Corretoras de Seguros (v3.1)

> **Hand-off do frontend (evolui a baseline v1.0).** Fonte da verdade da topologia
> do banco: `wassis_erp_esqueleto_v3_1.dbml`. Estas instruções registram os conceitos
> e decisões; o esqueleto registra as tabelas e FKs. Os dois sobem **juntos**, sob o
> mesmo número de versão.
>
> A numeração 3.x usada nas antigas iterações de design identificava RFCs
> anteriores ao v1.0. A **v3.0 atual** é um bump SemVer posterior ao v2.6 e não
> se confunde com aquelas iterações. O raciocínio histórico está preservado no
> **Log de Decisões** (decisões 1–23) e no changelog ao final.

## Papel da IA
Atuar como arquiteto de software, analista de negócios, especialista em modelagem de dados e desenvolvedor sênior para sistemas de corretoras de seguros.

Objetivo: projetar, validar e evoluir um ERP/CRM priorizando **escalabilidade, simplicidade, consistência de dados e facilidade de manutenção**. Sempre questionar decisões que gerem complexidade desnecessária, duplicidade de dados ou risco de escalabilidade.

---

## Versionamento (SemVer do contrato de schema)

Instruções e DBML compartilham o mesmo número e sobem juntos.

- **MAJOR (ex.: 2.0)** — quebra algo que o front já usa: renomear/remover coluna ou tabela, mudar tipo, inverter FK, remover valor de enum.
- **MINOR (ex.: 1.1)** — aditivo e compatível: tabela nova, coluna *nullable* nova, valor novo de enum, especialização nova (`sinistro_auto`, `pos_venda_implantacao`), expansão de campo das tabelas finas.
- **PATCH (ex.: 1.0.1)** — comentário/doc/esclarecimento; zero mudança estrutural.

> Nota v2.0: apesar de a expansão de campos ser semanticamente aditiva, este bump foi usado como marco de completude funcional de campos antes da retomada do desenvolvimento. O v2.0 não altera tabelas, FKs, cardinalidades nem decisões D1-D18; apenas transforma as “colunas de negócio” previstas no v1.1 em colunas escalares explícitas. Quando o front/database.ts já tinha nomenclatura funcional consolidada, ela deve prevalecer no DBML v2.0 e as adições novas devem ficar marcadas como propostas.

> Decisão explícita v2.1: embora a remoção de três colunas já espelhadas no front
> fosse classificada como MAJOR pela regra acima, o produto determinou o
> versionamento deste recorte como v2.1. O v2.0 permanece preservado como
> histórico e o par v2.1 passa a ser a fonte vigente.

> Decisão explícita v2.2: a proposta passa a separar `% comissão` de
> `% agenciamento`, e cada linha da grade/fato de comissão recebe um tipo
> canônico. O conjunto é fechado em `NORMAL`, `AGENCIAMENTO`, `VITALICIA`,
> `ADICIONAL` e `RESTITUICAO`.

> Decisão explícita v2.3: extratos securitários, itens, associações e ocorrências
> passam a ser normalizados. Item de extrato × comissão é N:N por entidade
> associativa, e conciliar nunca significa baixar ou confirmar recebimento.

> Decisão explícita v2.4: a baixa de comissão e seu estorno são eventos
> imutáveis. Uma comissão admite N baixas parciais e uma baixa pode consumir N
> conciliações confirmadas. O estorno compensa o evento original, não apaga
> histórico e fica bloqueado quando já houver repasse pago vinculado.

> Decisão explícita v2.5: o pagamento integral de repasses no MVP ocorre somente
> pela emissão de recibo persistente e auditável. Relatórios comuns são somente
> leitura. Cada recibo contém uma filial, beneficiário e sentido, congela os
> dados impressos e pode ser reemitido ou cancelado integralmente sem apagar
> histórico. Parcialidade e múltiplos pagamentos ativos foram rejeitados.

> Decisão explícita v2.6: cobrança securitária é um processo de follow-up
> ancorado em parcela efetivamente vencida. Só pode existir uma cobrança ativa
> por parcela. O estado de ciclo de vida é `ATIVA | QUITADA | CANCELADA`; etapa
> do pipeline continua independente. Quitação exige parcela paga, cancelamento
> exige motivo e reabertura só ocorre quando a parcela volta a estar vencida.

> Decisão explícita v3.0: o multi-cálculo passa a separar o pedido comum do
> corretor, cada execução por seguradora, o resultado devolvido, suas coberturas
> e parcelamentos e a apresentação comercial. A mudança é MAJOR porque
> `cotacoes` deixa de apontar diretamente para `calculos`, campos de resultado
> saem de `calculo_coberturas` e estruturas normalizadas novas passam a compor o
> agregado comercial. O par v2.6 permanece preservado como histórico.

Quase tudo que está deliberadamente adiado (ver "Adiado por design") é **aditivo** → cai como MINOR. A baseline é estável; o crescimento esperado é não-quebrante.

O **Log de Decisões (ADR)** — decisões 1–23, com rationale e alternativas rejeitadas — é o ativo arqueológico das iterações de design e das revisões seguintes. O porquê das escolhas vive no log de decisões, não apenas nos bumps de versão.

---

## Conceito central (tríade)
**A apólice é o contrato. A proposta é o documento. O item é o risco segurado.**

```text
apolices (contrato — 1 linha por vigência, contêiner)
 ├── propostas      (documentos: NOVA | RENOVACAO | ENDOSSO | CANCELAMENTO | FATURA)
 │     ├── parcelas   (cobrança do CLIENTE)
 │     ├── comissoes  (RECEITA da corretora — agenda própria) → repasses (DESPESA)
 │     └── (stage de tramitação, cotação de origem, números oficiais)
 └── apolice_itens  (riscos) → especialização por risk_type

comissao_extratos (demonstrativos recebidos da seguradora)
 └── comissao_extrato_itens N:N comissoes, via comissao_conciliacoes
      ├── comissao_conciliacao_ocorrencias (análise e resolução auditável)
      └── comissao_baixas N:N conciliações, via comissao_baixa_conciliacoes

repasses (despesas materializadas do documento)
 └── repasse_recibo_itens → repasse_recibos (pagamento integral auditável)
```

**Regra de relacionamento (R7) — quem aponta para onde:**
- O que é do **contrato** aponta para `apolices`: itens, sinistros, pós-venda, cadeia de renovação (`renovada_de_id`).
- O que é do **documento** aponta para `propostas`: parcelas, **comissões e repasses (cada um com agenda própria)**, stage de tramitação, cotação de origem, números oficiais (`numero_proposta`, `numero_endosso`), vigência documental e prêmio do documento.
- O que é do **risco** aponta para `apolice_itens`: especializações, coberturas, envolvidos de sinistro.

**Estado × documento:** as propostas são os registros imutáveis/oficiais. O **estado** do contrato é mutável e mora numa única linha em `apolices` (status, vigência atual) — nunca replicado nos documentos. "Virar apólice" é **UPDATE, nunca migração de linha**.

> Decisão fechada (não reabrir sem fato novo): rejeitamos a tabela única de documentos
> (linha-apólice + linhas-endosso juntas). O contêiner explícito garante por FK o que a
> tabela única exigiria por triggers. Na leitura, a `vw_producao` (JOIN apolices ×
> propostas) devolve o formato "uma linha por documento" do relatório clássico.

---

## Ciclo de vida do contrato

```text
oportunidade (lead) → cadastro → N cálculos → N cotações → 1 aprovada
  → transmissão: INSERT apolices (EM_EMISSAO, nº nulo) + proposta NOVA + itens
  → emissão:     UPDATE apolices (nº, vigência, VIGENTE) + parcelas
                 + comissões (gerar_comissoes pela grade) + repasses (pelas regras)
  → vida:        endossos / faturas / cancelamento = novas linhas em propostas
  → renovação:   nova oportunidade (apolice_origem_id) → nova apólice (renovada_de_id)
```

- **Casca na transmissão (decidido):** a apólice nasce como casca `EM_EMISSAO` quando a proposta é transmitida — porque a janela de análise tem cobertura (sinistro pode ocorrer antes da emissão e precisa de `apolice_id`), as pendências mexem nos itens, e a tela "propostas e apólices" vira uma única query.
- **Recusa:** `propostas.stage → Recusada` + `apolices.status → RECUSADA`. A casca fica como histórico (sem parcelas/comissões) e alimenta a métrica de aproveitamento por seguradora. Nova tentativa = outra cotação aprovada → nova casca.
- **Renovação:** sempre uma nova oportunidade (`apolice_origem_id`) que gera nova apólice com `renovada_de_id` (FK real, N:1 — tentativas recusadas podem apontar para a mesma antecessora). A antiga vira `RENOVADA` (UPDATE em uma linha). Travas: `CHECK (renovada_de_id != id)`; cadeia completa via `WITH RECURSIVE`.
- **Status da apólice (vida do contrato):** `EM_EMISSAO | VIGENTE | RENOVADA | NAO_RENOVADA | CANCELADA | RECUSADA`.
- **Stage da proposta (tramitação, kanban):** Em análise → Pendente → Emitida | Recusada. Stage é do documento; status é do contrato — nunca misturar.
- **Ramos faturáveis** (transporte, vida em grupo PME, saúde): fatura mensal = proposta `tipo FATURA` com suas próprias parcelas (e sua própria comissão), no mesmo contrato.

---

## Dois domínios: Comercial × Contratual

**Comercial (dado evolutivo) — multi-cálculo reconciliado (decisões 17 e 23):**
```text
oportunidades (segurado_id NULL = lead, com nome genérico, origem e contato mínimo)
  → 0..N calculos          (VERSÕES do pedido comum)
       → N execuções       (tentativas por seguradora)
            → 0..1 cotação (resultado por execução; a aprovada vira proposta)
```
Não existe tabela `leads`: o lead é a oportunidade antes da qualificação. Ao qualificar, cria-se a pessoa (`segurados`, status Prospecto) e preenche-se `segurado_id`. Funil, motivo de perda e conversão são da oportunidade (por tentativa de venda, não por pessoa).

**Ponte comercial → contratual (ponto único):** cotação aprovada → `propostas.cotacao_id` (UNIQUE) na proposta NOVA/RENOVACAO.

> **Nomenclatura (regra fixa, revisada para o multi-cálculo):**
> - **GRUPO** = a organização (cliente do SaaS) = `tenants`.
> - **CORRETORA** = a unidade com CNPJ próprio dentro do grupo = `filiais`.
> - **OPORTUNIDADE** = a tentativa de venda (funil, origem, motivo de perda). 1 por negócio.
> - **CÁLCULO** = snapshot do pedido comum do corretor: um cotado, um risco, uma vigência e preferências de cobertura. N por oportunidade.
> - **EXECUÇÃO** = uma tentativa de submeter um cálculo a uma seguradora, com comissão aplicada e estado próprios. N por cálculo.
> - **COTAÇÃO** = o resultado que **uma** seguradora devolveu para uma execução concluída. É a folha comparável e a que **vira proposta**.
> - **APRESENTAÇÃO COMERCIAL** = seleção ordenada de cotações para o cliente; não altera nem substitui os resultados originais.
> - **PROPOSTA** = documento transmitido à / emitido pela seguradora. N por contrato.
> - **APÓLICE** = o contrato (contêiner). 1 linha por vigência.
> - **COMISSÃO** = receita: o que a corretora recebe da seguradora. Agenda própria por proposta.
> - **REPASSE** = despesa: o que a corretora paga a produtores/gerentes. Gerado por regra ou manualmente.
> - O termo "orçamento" foi aposentado. Nunca usar "proposta" para a simulação comercial.
>   Nunca usar "comissão" para o valor pago ao produtor.

---

## Multi-cálculo (fase comercial) — decisões 17 e 23

A decisão 17 continua definindo o risco cotado estruturado e o eixo de versões.
A decisão 23 corrige a fronteira de autoria: pedido, execução, resultado e
apresentação são fatos diferentes e não compartilham campos por conveniência de
tela. A **Agger (Aggilizador de Cálculos)** permanece referência de campos,
motor inicial e fallback futuro; integração real continua fora deste frontend.

**Três eixos independentes de "N":**

```text
oportunidade (0..N cálculos; Kanban independente do cálculo)
 └── calculos                    ← versões do pedido comum
      ├── calc_*                 ← pessoa, objeto e questionário
      ├── calculo_coberturas     ← limites/preferências solicitados
      └── calculo_execucoes      ← tentativas por seguradora
           └── cotacoes          ← zero ou um resultado por execução
                ├── cotacao_coberturas
                └── cotacao_parcelamentos

apresentacoes_comerciais
 └── apresentacao_cotacoes       ← seleção de resultados da mesma oportunidade
```

Exemplo canônico: o casal cota o Ká. O vendedor faz João-100k, João-200k,
Maria-100k e Maria-200k = **1 oportunidade e 4 cálculos**. Cada cálculo pode
ter várias execuções, inclusive tentativas sucessivas na mesma seguradora; cada
execução concluída materializa no máximo uma cotação. A apresentação pode
selecionar resultados de versões diferentes, sempre deixando o perfil explícito.

**Estrutura vigente:**
- `calculos` — snapshot do pedido comum. Mantém o default de comissão,
  `segurado_id`, resumo de versão gerado pelo domínio, vigência e contexto de
  renovação. `tipo_seguro` aceita somente `NOVO | RENOVACAO_PROPRIA |
  RENOVACAO_OUTRA`; endosso segue o fluxo contratual próprio. Referência externa
  de motor e estado técnico não pertencem a esta tabela.
- `calc_*` — CTI do risco solicitado, separada de `item_*` para preservar
  cotado × emitido.
- `calculo_coberturas` — pedido do corretor: cobertura selecionada, limite/LMI,
  percentual FIPE, tipo de franquia e opção/quantidade desejadas. Valor final de
  franquia, prêmio, carência e participação obrigatória não pertencem ao pedido.
- `calculo_execucoes` — tentativa por seguradora, com comissão aplicada,
  origem do percentual, motor, status, pendência/erro seguros, tempos e
  referência externa. Reexecutar cria nova linha ligada à anterior; não
  sobrescreve histórico.
- `cotacoes` — resultado comercial de uma execução. A ponte
  `propostas.cotacao_id` continua apontando para a cotação escolhida.
- `cotacao_coberturas` — coberturas efetivamente devolvidas, com limites,
  franquias, prêmio, carência, participação e cláusulas por resultado.
- `cotacao_parcelamentos` — N opções de pagamento por cotação; a opção principal
  é somente uma indicação do retorno, não uma escolha do cliente.
- `apresentacoes_comerciais` + `apresentacao_cotacoes` — snapshot normalizado da
  seleção, ordem, destaque, parcelamento escolhido, visibilidade e textos
  comerciais. Não reintroduzem `orcamentos` genéricos e nunca alteram a cotação.

**Regras de versão, renovação e autoria:**
- mudar pessoa, condutor, risco, vigência, cobertura, limite, percentual FIPE ou
  tipo de franquia cria novo cálculo; comissão por seguradora e retry criam nova
  execução;
- `rotulo_versao` é resumo persistido e gerado pelo domínio; não é campo
  obrigatório de digitação;
- `segurado_id` usa por padrão o segurado da oportunidade; cotar outra pessoa é
  ação explícita e continua suportada;
- novo seguro usa a data corrente da filial e deriva o fim um ano-calendário
  depois; 29/02 deriva para 28/02 em ano não bissexto;
- renovação própria usa `oportunidades.apolice_origem_id` e começa na mesma data
  de calendário do fim da vigência anterior, preservando continuidade do
  contrato sem inventar hora em colunas `date`;
- classe de bônus é inteira de `0` a `10`; `0` significa sem bônus e deve ser
  apresentada explicitamente, nunca como texto livre;
- `qtd_sinistros_perda_parcial`, `transferiu_titularidade` e
  `status_apolice_anterior` permanecem nullable e condicionais de renovação por
  evidência de mercado Quiver; renovação própria deriva o que for conhecido e
  adapters podem decidir se exigem os campos na renovação externa;
- `banco_financiamento` é aposentado; para Auto, `calc_auto.alienado` expressa o
  fato de risco confirmado. Observação genérica vira `nota_interna`, não
  transmitida. Encaminhamento ao cliente é atividade/apresentação, não coluna do
  cálculo;
- uma falha ou pendência de uma seguradora não invalida as demais execuções;
- payload cru continua exclusivamente em `integracao_logs` como TEXT. Códigos de
  fio são traduzidos no adapter e nunca viram dado de negócio cru;
- `calculo`, `calculo_execucao` e `apresentacao_comercial` continuam fora do
  conjunto congelado de `entidade_tipo`; incluí-los exigiria mudança aditiva
  posterior.

> **Cobertura da Agger (limite real):** o Aggilizador cobre Auto, Residência,
> Condomínio, Vida individual, Diversos e Empresarial. Vida em Grupo, Saúde,
> grandes riscos e frota como frota seguem caminho manual de primeira classe,
> modelado por execução `MANUAL`, sem credencial ou chamada externa no frontend.

---

## Classificação do risco × Ramo comercial (duas camadas)

**`risk_type` — classificação FIXA (no código).** Conjunto fechado (`VEICULO`, `IMOVEL`, `VIDA`, `EMPRESA`, `CARGA`...). Decide a tabela de especialização. Gravado também em `apolice_itens.risk_type`.

**`ramos` — ramo comercial CADASTRÁVEL.** O usuário cria "Automóvel", "Frota", "RD-Residencial", "Vida em Grupo Global", "Vida em Grupo PME" etc.; cada ramo aponta para um `risk_type` e carrega atributos operacionais (`is_monthly`, grupo, etc.).

```text
risk_type (FIXO)          ramos (cadastrável)
VEICULO   ◄──────────────  Automóvel, Frota
IMOVEL    ◄──────────────  RD-Residencial, Condomínio, Empresarial
VIDA      ◄──────────────  Vida Individual, Vida em Grupo Global, Vida em Grupo PME
```

Especialização (tanto a do item `item_*` quanto a do cálculo `calc_*`) é por **tipo de risco**, não por nome comercial. Auto e Frota usam a mesma `item_veiculo`; a diferença entre individual e frota/grupo é só a quantidade de itens. Global e PME usam a mesma `item_vida`; a diferença é a granularidade do item (ver decisão 10).

---

## Modelagem da especialização (Class Table Inheritance)

`apolice_itens` é fina e idêntica para todos os ramos. Colunas específicas ficam em tabelas separadas por tipo de risco (`item_veiculo`, `item_imovel`, `item_empresa`, `item_vida`...), cada uma com **PK = FK** (`apolice_item_id`) apontando para o item. Cada item tem exatamente uma linha em uma especialização, definida pelo `risk_type`. Sem tabela ponte genérica. Rejeitado o padrão Single Table (colunas perenemente nulas). Custo aceito: novo tipo de risco = tabela nova + JOIN.

O mesmo padrão se repete na fase comercial com `calc_*` (decisão 17) — espelho do item, um nível antes da casca, em tabelas separadas para preservar o *cotado × emitido*.

**História do item (decidido — decisão 13):** `apolice_itens` carrega `incluido_por_proposta_id` e `excluido_por_proposta_id` — qual documento incluiu/excluiu o item. Estado vigente derivável (`excluido_por IS NULL`). O item **fica ancorado na apólice** (identidade estável do risco); **`proposta_itens` não existe** — migrar o item para a proposta fragmentaria o MESMO risco em N linhas sem chave estável (vetado pelo princípio "identidade por FK"). Substituição de objeto (Ká → Fox) = excluir o item antigo + incluir o novo (par de FKs do próprio item). **Alteração de valor (capital, LMI, franquia) versiona na COBERTURA, não no item** (ver Coberturas).

---

## Variação de dados por sub-tipo (três mecanismos) — método

Sempre que os dados variam **dentro de um mesmo módulo** conforme um discriminador (ramo na oportunidade/cálculo, `risk_type` no sinistro, tipo de processo no pós-venda), a escolha de modelagem segue uma árvore única — nunca uma tabela gorda de colunas nulas (Single Table, **rejeitado por princípio**):

```text
A variação de dados é...
│
├─ (1) conhecida no design, COM vários atributos próprios e estáveis?
│        → ESPECIALIZAÇÃO (Class Table Inheritance): tabela-filha por tipo,
│          PK=FK, escolhida pelo discriminador. Ex.: item_veiculo, calc_auto.
│          Custo aceito: tipo novo = tabela + JOIN.
│
├─ (2) poucos campos que existem na tabela-pai mas só fazem sentido p/ alguns?
│        → COLUNA NA TABELA-PAI + VISIBILIDADE CONDICIONAL no front
│          (regra de aplicação; o campo só some da tela).
│          Ex.: agenciamento aparece se ramo ∈ {saúde, vida}.
│
└─ (3) schema genuinamente DESCONHECIDO no design / definido por corretora?
         → CAMPOS PERSONALIZADOS (EAV tipado — decisão 16).
           NUNCA para diferença estrutural conhecida.
```

Regra de bolso: a escolha entre (1) e (2) é só *quantos* campos type-específicos existem — poucos, esconder no front é barato; muitos e com semântica própria, especializar, senão recria-se o pântano de nulos. Aplicações típicas: **multi-cálculo por ramo** = mecanismo (1) (`calc_*`); **agenciamento na oportunidade/cálculo** = mecanismo (2); **sinistro auto × vida** = mecanismo (1), espelhando a especialização dos itens; **pós-venda** = mecanismo (1) só se um processo tiver dado estruturado pesado (ver Pós-venda).

---

## Coberturas (catálogo × contratação)

```text
coberturas_catalogo (cadastro, por ramo_id)     item_coberturas (N:N, por risco)
"o que EXISTE para vender"             ◄──────  "o que ESTE item contratou"
ex.: Incêndio, Danos Elétricos, Morte           + valores da contratação (LMI/capital,
                                                  franquia, prêmio — na implementação)
```

- O mesmo catálogo (`coberturas_catalogo`, filtrado por `ramo_id`) abastece a cotação (`calculo_coberturas`) e o contrato (`item_coberturas`).
- Cobertura é atributo do **risco** (R7): pendura em `apolice_itens`, nunca na apólice ou na proposta. Numa frota, cada veículo tem seu próprio conjunto de coberturas (franquias podem diferir por item). Vale **sem exceção para todos os ramos, incluindo Vida em Grupo** (decisão 10) — um nível só, nada de tabela de "plano" no contrato.
- O modelo é **agnóstico de ramo**: a variação fica no conteúdo do catálogo e na semântica do valor, não na estrutura. Residencial contrata Incêndio/Danos Elétricos com **LMI** e franquia; Vida contrata Morte/IPA com **capital segurado** — mesma coluna de valor contratado, rótulo por ramo no front.
- Atributo específico de algumas coberturas (ex.: carência em Doenças Graves) = coluna *nullable* em `item_coberturas`. **Não** especializar cobertura por `risk_type` sem necessidade comprovada.
- **Versionamento por documento (decisão 13):** `item_coberturas` carrega `incluido_por_proposta_id` e `excluido_por_proposta_id`. Alteração de capital/LMI/franquia = **excluir a linha antiga** (carimba `excluido_por`) **+ incluir a nova** — nunca UPDATE destrutivo; a antiga vira histórico. Vigente = `excluido_por IS NULL`. "Capital na data do sinistro" = a linha de cobertura cuja vigência (via `vigencia_inicio` das propostas) contém a data de ocorrência. É o mesmo padrão **molde × fato/snapshot** já usado em comissões/repasses. (Note que `calculo_coberturas` **não** tem esse par — na cotação a variação é um novo cálculo.)

---

## Vida em Grupo: Global × PME (decisão 10)

Dois produtos de mercado, **mesma estrutura, granularidades de item diferentes**:

```text
GLOBAL → 1 item = 1 GRUPO de pessoas com o mesmo plano
PME    → 1 item = 1 VIDA (funcionário averbado)
```

- **`item_vida`:** `pessoa_id` preenchido = a vida (PME / Vida Individual); `pessoa_id NULL` = item-grupo (Global), com `nome_grupo` e `n_vidas`. `CHECK (pessoa_id IS NOT NULL OR n_vidas IS NOT NULL)`.
- Diferenciação de plano por grupo (ex.: diretoria com capitais maiores) **não exige estrutura nova**: no Global é outro item-grupo; no PME são as próprias coberturas da vida.
- **Global:** sem movimentação de vidas; ajuste do capital global = proposta `ENDOSSO` que **versiona as coberturas do item-grupo** (decisão 13). Caso canônico do versionamento de cobertura.
- **PME:** ramo `is_monthly = true`; movimentação mensal = proposta `FATURA`; vida entra/sai via `incluido/excluido_por_proposta_id`.
- **Sinistro no Global:** o funcionário sinistrado vai nos campos descritivos de `sinistro_envolvidos` (item-grupo como `apolice_item_id`, `tipo = SEGURADO`) — não entra no cadastro de pessoas.
- **Rejeitado:** `apolice_coberturas` ("plano" no nível do contrato). O plano varia por grupo dentro da mesma apólice; a tabela seria estrutura especulativa.

---

## Estrutura base (campos de negócio principais)

- **oportunidades:** `tenant_id`, `filial_id`, `segurado_id` (NULL = lead; é o cliente da tentativa), `ramo_id`, `origem_id`, `apolice_origem_id`, `responsavel_id`, `stage_id`, `motivo_perda_id`.
- **calculos:** `oportunidade_id`, `ramo_id`, `segurado_id` (cotado nesta versão), `seguradora_anterior_id`; negócio: `origem`, `comissao_sugerida_pct`, `rotulo_versao`, bloco de novo/renovação e `nota_interna`.
- **calc_\*:** objeto + questionário do risco cotado por ramo (PK=FK em `calculos`).
- **calculo_coberturas:** `calculo_id`, `cobertura_id`, limite/LMI, percentual FIPE, tipo de franquia e opção/quantidade solicitadas.
- **calculo_execucoes:** `calculo_id`, `seguradora_id`, tentativa, comissão aplicada, motor, status, pendência/erro, tempos e referência externa.
- **cotacoes:** `execucao_id` UNIQUE; prêmio, validade, status, mensagem/restrições e `link_proposta`.
- **cotacao_coberturas:** `cotacao_id`, cobertura normalizada ou chave do retorno, limite aceito, franquia, prêmio, carência, participação e cláusulas.
- **cotacao_parcelamentos:** `cotacao_id`, opção, forma, quantidade, entrada, parcela e total.
- **apresentacoes_comerciais / apresentacao_cotacoes:** oportunidade, autoria, layout, visibilidade, textos comerciais, resultados selecionados, ordem, destaque e parcelamento escolhido.
- **apolices:** `segurado_id`, `seguradora_id`, `ramo_id`, `numero_apolice` (NULL até emitir), `status`, `vigencia_inicio/fim`, `renovada_de_id`, `produtor_id → produtores`, `premio_total`. A corretora deriva do segurado (R6) — não há venda cruzada estrutural (decisão 12).
- **propostas:** `apolice_id`, `tipo`, `cotacao_id`, `numero_proposta`, `numero_endosso`, `vigencia_inicio`, `stage_id`, `responsavel_id`, `recebimento_grade_id`, `endosso_subtipo_id`, `cancelamento_motivo_id`, prêmio total/líquido com sinal, forma de pagamento, `comissao_pct` e `agenciamento_pct`.
- **apolice_itens:** `apolice_id`, `risk_type`, `incluido/excluido_por_proposta_id`.
- **item_coberturas:** `apolice_item_id`, `cobertura_id`, `incluido/excluido_por_proposta_id`, valor contratado.
- **Especializações de item:** veículo, imóvel, empresa, vida (`pessoa_id → segurados` NULL no item-grupo, `nome_grupo`, `n_vidas`, capital).
- **Financeiro:** `parcelas.proposta_id` | `comissoes.proposta_id` (`parcela_id` opcional, `tipo_comissao` como snapshot) | `repasses` (beneficiário em `produtores`). A grade tipa cada linha em `recebimento_grade_parcelas.tipo_comissao`.

---

## Sinistros

```text
sinistros (apolice_id NOT NULL, stage kanban, responsável)
 └── sinistro_envolvidos (N por sinistro)
       apolice_item_id preenchido = item NOSSO
       apolice_item_id NULL       = TERCEIRO (campos descritivos próprios;
                                    terceiro NÃO entra no cadastro de pessoas)
```

Vistoria de sinistro = etapa/pendência do kanban (não existe tabela `vistorias`). No Vida em Grupo Global, o funcionário sinistrado usa os campos descritivos do envolvido (decisão 10). "Capital na data do sinistro" se resolve pela cobertura vigente naquela data (decisão 13).

**Variação auto × vida:** mecanismo (1) da árvore — se a diferença de cabeçalho do evento for rica e estável, especializa-se (`sinistro_auto`, `sinistro_vida`, PK=FK em `sinistros`). Os dados do objeto já chegam pelo item (`apolice_item_id`). Detalhamento próprio adiado (aditivo).

---

## Pós-venda (módulo) — decisão 14

`pos_vendas` **é um módulo de verdade**: passou nos três filtros — onboarding, envio da apólice, orientação de sinistro, implantação de saúde e régua de relacionamento são processos que (a) **não geram documento**, (b) **não são renovação/venda nova** e (c) **não são follow-up simples**.

**Forma:** **um único `entidade_tipo` + N pipelines** — cada processo é um **funil próprio** (`pipelines` + `pipeline_stages`). Mesma mecânica de `oportunidades` e `sinistros`. A tabela `pos_vendas` é fina (`apolice_id`, `stage_id`, `responsavel_id`, status, datas); a camada transversal é igual à dos demais módulos.

**Variação de dados por processo:** árvore de três mecanismos. Dado magro (onboarding/régua) vive em `atividades` (+ campos personalizados). Só dado estruturado pesado (ex.: **implantação de saúde**) cria especialização `pos_venda_implantacao` (PK=FK). **Detalhe em aberto (não bloqueante, aditivo):** quais pipelines de fábrica e se implantação-saúde vira especialização.

**Distinção de guias:** guias **transversais** (polimórficas, iguais em todo módulo) ≠ guias **não-transversais** (telas que o front monta lendo as tabelas de domínio). As não-transversais devem diferir entre e dentro de módulos — composição de front, não decisão de banco, resolvida pela árvore de três mecanismos.

---

## Comissões e Repasses (receita × despesa)

**Dois fatos, dois ciclos de vida, duas tabelas.** Comissão é conciliada contra o extrato da seguradora (status de *recebimento*); repasse é pago ao produtor (status de *pagamento*). Nunca fundir.

**R7 — comissão é filha da PROPOSTA, não da parcela.** O recebimento da seguradora tem agenda própria que não espelha a grade do cliente: esgotamento, agenciamento (100% → 20%; saúde 200–300%), antecipado. `comissoes.parcela_id` é **opcional**, só para conciliação.

```text
CATÁLOGO (configuração)                    AGENDA (fatos, snapshot)
───────────────────────                    ─────────────────────────
recebimento_grades                         comissoes (N por proposta)
 (seguradora × ramo; tipo:                  previsto × recebido, % por evento,
  ANTECIPADO_N | ESGOTAMENTO |              parcela_id opcional (conciliação)
  NA_PARCELA | VITALICIO_*)
 └── recebimento_grade_parcelas            repasses (N por proposta)
      (nº, %; NULL = % da proposta)          beneficiário (snapshot), previsto ×
                                            pago, comissao_id p/ gatilho por
repasse_regras (grupo/corretora × produtor  recebimento, regra_id NULL = MANUAL
 × ramo × papel × tipo_documento)
```

- **Grade é molde; agenda é fato.** `gerar_comissoes(proposta, grade)` e `gerar_repasses(proposta)` materializam linhas na emissão (snapshot, editável). Mudar regra/grade depois não reescreve história. `propostas.recebimento_grade_id` registra o molde aplicado.
- **Vitalício** resolve sozinho: ramo mensal gera proposta `FATURA` por competência, cada FATURA gera sua comissão.
- **`produtores` é entidade própria** (tenant/grupo), com `profile_id` NULL = produtor externo sem login. `segurados.produtor_id/gerente_id` e `apolices.produtor_id` apontam para ela.
- **Gerente é atributo da CARTEIRA** (`segurados.gerente_id`), nunca do negócio. Papel `PRODUTOR` → `apolices.produtor_id`; papel `GERENTE` → gerente do segurado naquele momento (snapshot). Troca de gerente não retroage.
- **Regras** (`repasse_regras`): escopo grupo ou corretora; `produtor_id` NULL = padrão, preenchido = override; por ramo e tipo de documento; base `COMISSAO | PREMIO_LIQUIDO | VALOR_FIXO`; gatilho `NA_EMISSAO | PRIMEIRA_COMISSAO | CONFORME_RECEBIMENTO | PARCELADO`; `limite_parcelas`. A regra mais específica vence.
- **Split e co-produção sem estrutura nova:** produtor + gerente = duas linhas em `repasses`; segundo produtor = lançamento manual (`regra_id NULL`), sem tocar `apolices.produtor_id`.
- **Liberação do repasse:** gatilho por recebimento amarra a linha à comissão (`comissao_id`, CHECK mesma proposta); a baixa da comissão libera o repasse (`PREVISTO → LIBERADO → PAGO`).
- **Rejeitado (benchmark Quiver):** hierarquia genérica de níveis/divisões. É EAV organizacional: inviabiliza constraints. Nossa estrutura fixa cobre os casos reais. Reabrir só com corretora de 4+ níveis de override.
- **UI:** as regras são tabela de decisão; o front pode renderizar como árvore (cascata) + simulador "qual regra venceu e por quê".

---

## Cadastro unificado de pessoas

`segurados` é a entidade única PF/PJ (PRD `prd-cadastro-pessoa`): lead qualificado, cliente, vida segurada e contato apontam para ela. Status inclui `Prospecto` (ex-lead) → `Ativo` → `Inativo`. Terceiros de sinistro e funcionários sinistrados do Vida Global ficam FORA deste cadastro.

**Cadastro por corretora (decisão 12).** `segurados` é **por corretora** (`filial_id NOT NULL`): a mesma pessoa em duas corretoras do grupo são **dois registros distintos**. A corretora B não lê nem reaproveita o cadastro da A — isolamento por estrutura + RLS. Consequências:
- `cpf_cnpj` é **único por corretora** (`UNIQUE(filial_id, cpf_cnpj)`), não global; armazenado **normalizado** (só dígitos) para o match da notificação cruzada; obrigatório quando status ≠ Prospecto.
- Status, produtor e gerente são **por corretora**.
- `pessoa_contato` liga PF a PJ dentro da mesma corretora.
- **Notificação de cliente cruzado** (anti-concorrência interna, sem violar LGPD): uma função de backend cruza o CPF/CNPJ normalizado entre as corretoras do **mesmo grupo** e avisa apenas que **existe** vínculo em outra unidade. Nível de exposição parametrizável pelo **grupo** (master), default **mínimo**. Match só por segurado.
- **`lgpd_autorizado`** é por registro (cada corretora coleta o seu próprio consentimento).

> **Reconciliado com o PRD (19/06/2026):** `prd-cadastro-pessoa` v1.1 corrigiu `cpf_cnpj` de "único no sistema" para **único por filial** (`UNIQUE(filial_id, cpf_cnpj)`), alinhado à decisão 12. Conflito encerrado.

`produtores` é a entidade de produtores e gerentes (decisão 11): papel definido pelo contexto do vínculo, nunca por tipo na tabela. `profile_id` NULL = produtor externo sem login. Inativo não aparece para seleção, mas permanece nos históricos.

---

## Campos personalizados (EAV tipado) — decisão 16

A **única exceção controlada** ao veto a EAV (schema genuinamente desconhecido em tempo de design, definido por corretora). EAV **tipado**, nunca chave/valor anêmico, nunca JSON/array. Quatro tabelas:

```text
campo_definicoes   "que campos existem" por MÓDULO (entidade_tipo) — em Configurações
campo_opcoes       catálogo de opções das listas (relacional, sem array)
campo_valores      "o que ESTE registro preencheu" (1 linha por campo; coluna física por tipo)
campo_valor_opcoes ponte N:N só p/ LISTA_MULTIPLA (substitui array/JSON)
```

**9 tipos lógicos → 6 colunas físicas + 1 ponte:**

```text
tipo_dado (lógico → UI + validação)     coluna física em campo_valores
─────────────────────────────────      ──────────────────────────────
TEXTO_CURTO / TEXTO_LONGO ........      valor_texto
INTEIRO / DECIMAL ................      valor_numero   + flag formato
BOOLEANO .........................      valor_booleano
DATA .............................      valor_data
DATA_HORA ........................      valor_datahora
LISTA_UNICA ......................      valor_opcao_id  (FK → campo_opcoes)
LISTA_MULTIPLA ...................      ponte campo_valor_opcoes (N:N)

flag formato (só INTEIRO/DECIMAL): NUMERO | PERCENTUAL | MOEDA
```

- **`chave` (slug) ≠ `nome` (rótulo):** o rótulo o gestor muda à vontade; a `chave` é o identificador estável. Unicidade por módulo no grupo (`UNIQUE(tenant_id, entidade_tipo, chave)`).
- **Formato é só apresentação:** o valor mora cru em `valor_numero` (12,5% como `12.5`; R$ como `1500.00`).
- **Listas única e múltipla compartilham o catálogo** (`campo_opcoes`); a diferença é onde o valor é gravado.
- **Obrigatoriedade é regra de aplicação, não constraint:** ausência de linha = "não preenchido". A app valida no submit + painel de pendências. Ligar "obrigatório" depois não invalida o passado.
- **"Exatamente um valor coerente com o tipo" = trigger** + CHECK de linha complementar.
- **Onde define × onde preenche:** definição em **Configurações**; preenchimento na guia **"Campos personalizados"** do registro. Refatorar o front atual, que cria o campo de dentro do segurado.
- **Escopo grupo × corretora:** `campo_definicoes.filial_id` NULL = campo do grupo; preenchido = exclusivo daquela corretora.

---

## Suporte transversal

- **atividades** (unificada, polimórfica): timeline + tarefas. Pendente com `vencimento` = tarefa; `concluida_em` = histórico. Tipos: ligação, WhatsApp, e-mail, nota, follow-up. Nota fixada = `fixada_em`. Fonte humana da timeline (Observações).
- **atividade_mencoes** (`atividade_id`, `profile_id`, `lida_em`): menções @usuário normalizadas. O texto guarda só o marcador; a tabela é a fonte da verdade. RLS fase 2.
- **anexos** (polimórfica): documentos/fotos de qualquer entidade.
- **audit_logs** separado (forense técnico, imutável, gravado por trigger) — **nunca fundir com atividades** (decisão 15).
- **integracao_logs**: payload cru como `TEXT` puro — inclui a requisição/resposta crua da Agger (decisão 17); o dado útil do cálculo vai normalizado para `calculos`/`calc_*`/`calculo_coberturas`.
- **Timeline unificada (decisão 15):** a guia "Anexos e logs" exibe **uma linha do tempo só** via `vw_timeline` (UNION de `atividades` + `audit_logs`), read-only sobre o `audit_logs`. Filtro: **default só atividades/notas**; toggle "todos os eventos" inclui os logs. Tudo visível; quem-vê-o-quê é flag de permissão. O "is_log" vive como `origem/tipo` da VIEW.
- **Guias transversais** (Tarefas, Observações, Anexos e logs, Campos personalizados) existem em todos os módulos via polimorfismo: `entidade_tipo` é o **registro oficial de "módulos"**, **conjunto FIXO no código**. **Congelado:** `segurado | oportunidade | cotacao | apolice | proposta | apolice_item | sinistro | cobranca | pos_venda`. (Decisão 17: `calculo` **não** entra por ora — as guias da fase comercial seguem em oportunidade/cotacao; incluí-lo é aditivo/MINOR se surgir necessidade concreta.) D19/D20 admitem em `audit_logs` os identificadores técnicos `comissao_extrato`, `comissao_extrato_item`, `comissao_conciliacao`, `comissao_ocorrencia`, `comissao_baixa` e `comissao_baixa_conciliacao`; isso não os transforma em módulos nem habilita guias/campos personalizados.

---

## Multi-tenant: Grupo × Corretoras (SaaS)

**Reenquadramento (decisão 12):** dois níveis, não "tenant = corretora":

```text
GRUPO / ORGANIZAÇÃO        ← tenant (o cliente do SaaS)
 ├── Corretora A (marca X)   ← filial (CNPJ próprio)
 ├── Corretora B (marca Y)   ← filial (CNPJ próprio)
 └── Corretora C (mesma marca de A)  ← filial (matriz_id → A)
```

- `tenants` = o **grupo/organização**. `filiais` = as **corretoras** (CNPJ próprio — **ou CPF**, há corretor pessoa física; marca/segmento e demais dados como colunas de negócio; `matriz_id` agrupa por marca).
- **Corretora única = caso trivial** — um grupo com uma corretora só nunca dispara cruzamento.
- **Isolamento entre corretoras (LGPD) é a espinha dorsal.** Por estrutura + RLS na fase 2.
- **Catálogos no grupo** (seguradoras, ramos, origens, motivos, coberturas, pipelines, produtores, grades, regras, campos personalizados) — compartilhados. Alguns podem opcionalmente escopar por corretora (`filial_id` nullable).
- **Âncoras de corretora:** `segurados` e `oportunidades` carregam `filial_id NOT NULL`. O resto deriva pela cadeia de FKs.
- **Usuários multi-corretora (decisão 12):** `profile_filiais` (M:N) define em quais corretoras o usuário atua e **com qual perfil em cada uma** (decisão 18: `perfil_id` → `perfis`, não mais o enum `papel`). `profiles` perde o `filial_id`.
- **Perfis de acesso cadastráveis (decisão 18):** o papel vira a tabela `perfis` (pré-configurados `sistema` + personalizados por grupo); `role_permissions` pendura em `perfil_id`. **Autoria** (CRUD de perfis + permissões por módulo) no **front**; **aplicação** (resolução em runtime + RLS) no **backend**.
- **Funis por corretora:** `pipelines.filial_id` nullable.
- **Consolidação de grupo:** views por cima das corretoras (ex.: `vw_clientes_grupo`).
- **Row Level Security** na fase 2, com re-desnormalização de `tenant_id`/`filial_id` + travas filho==pai. Política típica: `filial_id = ANY(filiais_do_usuario())`.

---

## Regras de modelagem do esqueleto (R1–R7)

- **R1.** `tenant_id` só onde não há caminho obrigatório (NOT NULL) até o tenant por outra FK.
- **R2.** Sem `pipeline_id` nos processos — deriva de `stage_id`.
- **R3.** FKs-atalho removidas quando o caminho longo é garantido por FKs NOT NULL.
- **R4.** FKs genéricas de auditoria (`created_by`/`uploaded_by`) ficam fora do
  esqueleto. Autoria operacional exigida pelo ciclo de negócio pode usar FK
  explícita, como recebido/processado/confirmado/resolvido por no recorte D19.
- **R5.** `anexos`/`atividades`/`campo_valores` polimórficas (`entidade_tipo` + `entidade_id`).
- **R6.** `filial_id` segue a regra do `tenant_id`. A corretora é a unidade de isolamento.
- **R7.** Contrato × documento × item. Comissões e repasses são do documento, com agendas próprias. A identidade do item é do contrato (`apolice_itens`); o valor contratado versiona por documento na cobertura (`item_coberturas`).

Na implementação: escrita encapsulada em funções (`emitir`, `registrar_emissao` → `gerar_comissoes` + `gerar_repasses`, `baixar_comissao`, `endossar`, `cancelar`, `renovar`) e leitura via views (`vw_producao`, `vw_comissoes_*`, `vw_clientes_grupo`, `vw_timeline`).

---

## Princípios de modelagem

- Modelagem relacional estruturada; todo dado de negócio em tabela própria, com FK, constraint, índice e integridade referencial.
- **Zero JSON/JSONB.** Payload cru de integração = `TEXT` puro em tabela de log; o dado útil é sempre normalizado. (Pendência de migração: o front legado usa `metadata` JSONB em módulos antigos.)
- Evitar: colunas genéricas, campos ambíguos, EAV. **Exceção única:** campos personalizados (decisão 16).
- **Variação de dados por sub-tipo** segue a árvore de três mecanismos — nunca Single Table.
- Moldes × fatos: configurações geram registros materializados (snapshot); mudar o molde nunca reescreve história. O mesmo padrão sustenta o versionamento da cobertura (decisão 13).
- **Fundir na apresentação, não no armazenamento:** união por view de leitura; armazenamento separado preserva garantias (decisão 15).
- PostgreSQL / Supabase, PKs UUID, FKs explícitas, soft delete quando necessário, auditoria de alterações.

## Expansão de campos v2.0

O v2.0 completa o esqueleto com colunas escalares de negócio nas tabelas existentes, sem criar novas relações. As fontes usadas foram o DBML/instruções v1.1, os contextos de mercado em `.contextos-mercado/portal_ajuda_quiver` e `.contextos-mercado/portal_ajuda_segfy`, a prática operacional de corretoras, referências SUSEP sobre documentos contratuais, SRO, ramos, coberturas, prêmios, intermediação e sinistros, e a implementação atual do front em `nexus-crm/src/types/database.ts`, hooks, mappers e telas.

Regra de reconciliação contra o front atual: campo já implementado não deve ser renomeado no v2.0 só para ficar mais “conceitual”. Exemplo aplicado em `segurados`: o contrato preserva `data_nascimento`, `estado`, `logradouro`, `created_at` e `updated_at`, e deixa campos como `nome_social`, `rg_ie`, `cnh_*`, `whatsapp` e `lgpd_autorizado_em` como adições propostas, ainda não implementadas.

Cobertura principal do mapeamento:

- Plataforma e cadastros: dados de grupo, corretoras/filiais, usuários, perfis, produtores, segurados PF/PJ, contatos, seguradoras, ramos, origens, motivos e coberturas de catálogo.
- Comercial: oportunidades, dados mínimos de lead, cálculos, cotações, questionários por forma de cálculo (`calc_auto`, residência, condomínio, vida, empresa e diversos) e coberturas cotadas.
- Contratual: apólices, propostas/documentos, faturas, endossos, itens emitidos, veículos, imóveis, empresas, vidas, coberturas contratadas, sinistros, envolvidos e pós-venda.
- Financeiro: grades de recebimento, parcelas da grade, regras de repasse, parcelas do cliente, cobranças, comissões e repasses.
- Suporte transversal: atividades/tarefas, menções, anexos, logs de auditoria, logs de integração e campos personalizados tipados.

O v2.0 preserva as escolhas fechadas: contrato x documento x item, comissão diferente de repasse, campos personalizados EAV tipado, zero JSON para dado de negócio, fusão apenas por leitura e ausência de backend/SQL/migrations neste repositório.

---

## Escopo funcional

Pessoas PF/PJ (unificadas, por corretora), Produtores (internos e externos), Seguradoras, Apólices, Propostas, Itens segurados, Coberturas, Sinistros (com terceiros), Renovações, Comissões e Repasses, **Multi-cálculo e Cotações**, Oportunidades (incluindo leads), Pós-venda (módulo com N funis), Grupo e Corretoras (multi-tenant), Usuários multi-corretora, Perfis de acesso (pré-configurados + personalizados), Atividades/tarefas, Anexos, Campos personalizados, Dashboards/indicadores, IA. Integrações: **Agger/Aggilizador (multi-cálculo)**, seguradoras, WhatsApp, e-mail.

Ramos suportados (cadastráveis, mapeados a `risk_type`): Automóvel, Frota, Residencial, Empresarial, Condomínio, Vida Individual, Vida em Grupo Global, Vida em Grupo PME, Saúde Empresarial, Equipamentos, RC, Transporte, e futuros.

---

## Ao responder

Pensar como arquiteto; priorizar escalabilidade, simplicidade e modelagem relacional; questionar decisões ruins; explicar impactos; apresentar diagramas quando útil. Havendo mais de uma solução, comparar prós/contras e recomendar a melhor para o longo prazo. Ser sucinto. Respeitar as decisões fechadas, reabrindo-as apenas diante de fato novo relevante.

---

## Decisões fechadas (resumo)

1. Modelo contrato × documento (`apolices` + `propostas`) — tabela única rejeitada.
2. Casca `EM_EMISSAO` nasce na transmissão; recusada vira histórico.
3. `leads`, `emissoes`, `vistorias`, `tarefas`, `endossos`/`endosso_itens` não existem como tabelas.
4. `orcamentos` → `cotacoes`; ponte = `propostas.cotacao_id`.
5. ~~Comissão: vínculo primário = `parcela → proposta`~~ — **revisada pela decisão 11**. Permanece válido: parcela pertence à proposta.
6. Pessoa unificada = `segurados` com status Prospecto.
7. `sinistro_envolvidos` substitui `sinistro_itens` (terceiros incluídos, fora do cadastro).
8. Renovação = nova oportunidade → nova apólice (`renovada_de_id`, N:1).
9. Menções em notas = `atividade_mencoes` normalizada; nota fixada = `fixada_em`.
10. **Vida em Grupo em um nível só:** coberturas/capitais sempre em `item_coberturas`. Global = item-grupo (`pessoa_id NULL` + `nome_grupo` + `n_vidas`), ajuste de capital via ENDOSSO; PME = vidas averbadas (`is_monthly`), movimentação via FATURA. `apolice_coberturas` rejeitada.
11. **Comissão × Repasse:** comissão = receita (filha da **proposta**, agenda própria, `parcela_id` só conciliação); repasse = despesa (N por proposta, beneficiário em `produtores`). `produtores` reintroduzida. Catálogos: `recebimento_grades`(+`_parcelas`) e `repasse_regras` (a mais específica vence). Cada linha da grade e cada comissão materializada usa somente `NORMAL`, `AGENCIAMENTO`, `VITALICIA`, `ADICIONAL` ou `RESTITUICAO`. Hierarquia genérica tipo Quiver rejeitada.
12. **Grupo × Corretoras:** `tenants` = grupo; `filiais` = corretoras. **Cadastros separados por corretora**; `cpf_cnpj` único por filial, normalizado. Venda cruzada não existe estruturalmente. **Notificação de cliente cruzado** = função de backend (revela só o fato; default mínimo). **Usuários multi-corretora** = `profile_filiais` (papel por corretora). **Funis por corretora** = `pipelines.filial_id` nullable. Identidade compartilhada rejeitada.
13. **Identidade do risco × histórico de cobertura:** item ancorado na apólice; `proposta_itens` rejeitada. **Substituição de objeto** = excluir + incluir item. **Alteração de valor versiona na COBERTURA** (`item_coberturas` com `incluido/excluido_por_proposta_id`; excluir + incluir, nunca UPDATE destrutivo). Snapshot profundo do item rejeitado.
14. **Pós-venda como módulo:** `pos_vendas` fica; modelado como **1 `entidade_tipo` + N pipelines**. `entidade_tipo` congelado com `pos_venda`. Esclarecida a distinção guia transversal × não-transversal. Absorver pós-venda em proposta+oportunidade+atividades rejeitado.
15. **Logs-UI: timeline unificada na leitura, armazenamento separado:** `atividades` e `audit_logs` não se fundem; `vw_timeline` une na leitura com filtro. Tudo visível; "is_log" vira origem da view. Tabela única com `is_log` rejeitada.
16. **Campos personalizados = EAV tipado:** `campo_definicoes`/`campo_opcoes`/`campo_valores`/`campo_valor_opcoes`; 9 tipos lógicos → 6 colunas físicas + 1 ponte; obrigatoriedade = regra de aplicação; coerência valor×tipo por trigger. EAV anêmico e JSON/array rejeitados.
17. **Multi-cálculo (pendência 8 resolvida; fronteira revisada por D23):** `oportunidade → calculos (N versões)`. Especialização do risco cotado por CTI (`calc_auto`/`_residencia`/`_condominio`/`_vida`/`_empresa`/`_diversos`), espelhando `item_*`; `calculo_coberturas` registra o pedido de cobertura. **Agger** = referência de campos + motor inicial + fallback; motor próprio depois. "Cotar em nome de" = `segurado_id` por cálculo. O default de comissão não toca `recebimento_grades`. Cotado ≠ emitido permanece preservado. **Rejeitados:** Single Table de formulário, códigos crus da Agger no schema e achatar perfil e resultado num nível só.
18. **Perfis de acesso cadastráveis (v1.1):** `papel` global deixa de ser enum `app_role` fixo e vira a tabela **`perfis`** (pré-configurados `sistema` master/gestor/produtor/operador + personalizados por grupo). `role_permissions` e `profile_filiais` referenciam `perfil_id` (FK). **Autoria** (CRUD de perfis + permissões por módulo) = **frontend**; **aplicação** (resolução em runtime + RLS) = **backend**. Enum `app_role` rígido rejeitado. O **papel global por usuário** (`user_roles`/`app_role` legado do front) é **aposentado**: a permissão de negócio vem só do **perfil por corretora**; um eventual papel de **identidade** (do provedor de auth) fica na camada de identidade, não no RBAC de negócio. No mesmo bump, `filiais` recebeu as colunas de negócio da tela Corretoras/Filiais, com `cnpj_cpf` aceitando **PF ou PJ** (corretor pessoa física existe — refina a decisão 12).
19. **Extratos e conciliação securitária (v2.3):** o demonstrativo recebido da
    seguradora é normalizado em `comissao_extratos` e
    `comissao_extrato_itens`. Itens e comissões formam N:N por
    `comissao_conciliacoes`; o caso 1:1 continua simples, enquanto recebimentos
    parciais e itens agregados permanecem representáveis. Ocorrências vivem em
    `comissao_conciliacao_ocorrencias`. Ingestão, normalização, associação,
    conciliação, ocorrência e baixa são etapas distintas. Hash/chaves impedem
    duplicidade por arquivo, item e associação. `comissoes.extrato_numero` e
    `seguradora_lote` deixam de existir no contrato vigente para não competir
    com as entidades normalizadas. Conciliar não altera `valor_recebido`,
    `recebida_em` ou `status` da comissão; isso pertence à baixa.
20. **Baixa de comissão auditável (v2.4):** `comissao_baixas` guarda eventos
    imutáveis `BAIXA | ESTORNO`; `comissao_baixa_conciliacoes` liga cada evento
    a uma ou mais conciliações confirmadas. Uma comissão admite N baixas e a
    parcial mantém o saldo na mesma linha materializada pela Fase 2. Sem item
    associado, a operação cria extrato, item e conciliação de origem `MANUAL`.
    `valor_previsto` e valores informados não são sobrescritos; o recebido atual
    é a soma assinada dos eventos. Estorno é compensatório e fica bloqueado por
    repasse `PAGO`. Apagar baixa, reaproveitar conciliação acima do saldo e
    converter conciliação em baixa implicitamente foram rejeitados.
21. **Recibo de repasse auditável (v2.5):** `repasse_recibos` registra uma
    emissão por filial, beneficiário e sentido; `repasse_recibo_itens` congela
    cada linha e valor impresso. Somente `LIBERADO` entra na emissão e passa
    integralmente a `PAGO`, com `valor_pago = valor_previsto` e diferença zero.
    Relatórios, consulta e reemissão não alteram estado. Um repasse admite no
    máximo um recibo ativo; cancelamento integral preserva cabeçalho e itens,
    exige justificativa/autoria/idempotência e devolve os itens a `LIBERADO`.
    Pagamento parcial, múltiplos pagamentos ativos, rateio N:N, baixa por
    exportação e exclusão de recibo foram rejeitados.
22. **Cobrança securitária por parcela (v2.6):** `financeiro_cobrancas` acompanha
    o follow-up de uma parcela efetivamente vencida. `stage_id` representa o
    andamento operacional e `status` representa apenas o ciclo de vida
    `ATIVA | QUITADA | CANCELADA`. Existe no máximo uma cobrança ativa por
    parcela, com garantia final por índice único parcial no backend. Quitação
    exige parcela paga; cancelamento preserva motivo e data; reabertura exige
    parcela novamente vencida e ausência de outra ativa. O tenant e a filial
    derivam da parcela, e `pipeline_id`, `oportunidade_id`, campos de valor
    duplicados e `metadata` foram rejeitados.
23. **Pedido × execução × resultado × apresentação comercial (v3.0):**
    `calculos` e `calculo_coberturas` guardam somente o snapshot comum solicitado
    pelo corretor; `calculo_execucoes` registra cada tentativa por seguradora e
    sua comissão aplicada; `cotacoes` guarda o resultado de uma execução;
    `cotacao_coberturas` e `cotacao_parcelamentos` detalham o que a seguradora
    devolveu; `apresentacoes_comerciais` e `apresentacao_cotacoes` preservam a
    seleção mostrada ao cliente. Retry e mudança de pedido criam fatos novos.
    Foram rejeitados: sobrescrever histórico, manter prêmio/franquia monetária no
    pedido comum, parcelamento único em `cotacoes`, ressuscitar `orcamentos`,
    editar a cotação para montar apresentação e armazenar o artefato em JSON.

---

## Pendências em aberto

**Nenhuma.** A lacuna de autoria e persistência do multi-cálculo foi reconciliada
pela decisão 23. A pendência 8 original [COTACAO-RISCO / MULTI-CALCULO] havia
sido resolvida pela decisão 17. As demais pendências históricas permanecem
encerradas pelas decisões já registradas.

**Adiado por design (não é pendência — é escopo de fases seguintes; tudo aditivo):** novas especializações `sinistro_auto`/`_vida`; `pos_venda_implantacao` + pipelines de fábrica; de-para cotado×emitido + ingestão do documento emitido; Fase 2 (RLS, re-desnormalização + travas filho==pai, triggers, FKs de auditoria, funções de escrita).

---

## Revisão contratual v3.0 — multi-cálculo reconciliado

- Uma oportunidade admite `0..N` cálculos e não depende deles para avançar,
  ganhar ou perder no Kanban. Cada cálculo pertence a exatamente uma
  oportunidade.
- `calculos` guarda somente o pedido comum. `rotulo_versao` é resumo gerado;
  `segurado_id` usa o cliente da oportunidade por default; endosso deixa de ser
  tipo de cálculo; banco do financiamento, encaminhamento e observação genérica
  foram removidos ou ganharam destino explícito.
- `calculo_coberturas` passa a guardar limites e preferências solicitadas.
  `franquia_valor`, `premio`, `carencia_dias` e
  `participacao_obrigatoria_pct` saem dessa tabela e passam ao resultado por
  cotação quando efetivamente devolvidos.
- `calculo_execucoes` registra cada seguradora/tentativa, comissão aplicada,
  motor, estado, pendência/erro, tempos e referência externa. Retry cria nova
  linha por `reexecucao_de_id`; falha parcial não invalida outras seguradoras.
- `cotacoes` passa a apontar por `execucao_id` UNIQUE. Cada execução materializa
  no máximo um resultado, preservado mesmo após recalcular.
- `cotacao_coberturas` e `cotacao_parcelamentos` normalizam coberturas,
  franquias, cláusulas e N opções de pagamento por cotação.
- `apresentacoes_comerciais` e `apresentacao_cotacoes` persistem seleção,
  ordem, destaque, opção de parcelamento, visibilidade e textos comerciais sem
  alterar a cotação. Resultados de cálculos diferentes são admitidos somente se
  pertencem à mesma oportunidade; comparação é limitada a três produtos na
  aplicação.
- Novo seguro deriva um ano-calendário e trata 29/02 como 28/02 no ano não
  bissexto. Renovação própria começa na mesma data de calendário do fim do
  contrato anterior. Classe de bônus usa `0..10`, com `0 = sem bônus`.
- Campos de renovação observados no Quiver permanecem nullable e condicionais;
  renovação própria os deriva quando possível. `banco_financiamento` e
  `cotacao_encaminhada_em` foram aposentados; `nota_interna` não é transmitida.
- O bump é MAJOR: reancora `cotacoes`, remove ou renomeia campos já tipados pelo
  frontend e exige reconciliação de `database.ts`, domínio e mock antes de novo
  trabalho funcional.

**Changelog v3.0 — 22/07/2026:** separa pedido, execução, resultado e
apresentação comercial; cria cinco estruturas normalizadas, reancora cotações,
move valores devolvidos para a cotação e fecha renovação, retry e histórico sem
JSON de negócio.

## Revisão contratual v2.6 — cobranças securitárias

- `financeiro_cobrancas.parcela_id` é a única origem de negócio. A cobrança
  nasce apenas de parcela com estado efetivo `VENCIDA`; documento, apólice,
  segurado, filial e tenant são derivados pela cadeia relacional.
- `stage_id` indica o passo operacional no pipeline de Cobranças. O pipeline é
  derivado pela etapa e não é persistido novamente na cobrança.
- `status` usa somente `ATIVA | QUITADA | CANCELADA`. Prioridade usa
  `BAIXA | MEDIA | ALTA | URGENTE` e canal preferencial usa
  `TELEFONE | WHATSAPP | EMAIL | OUTRO`.
- A aplicação valida e o backend deve garantir com índice único parcial (ou
  constraint transacional equivalente) no máximo uma linha `ATIVA` por
  `parcela_id`. O índice simples do DBML documenta a chave de busca; a condição
  parcial deve ser aplicada pela implementação do backend.
- Encerrar como `QUITADA` exige a parcela já efetivamente paga; a cobrança não
  executa nem duplica o comando de baixa da parcela. Encerrar como
  `CANCELADA` exige `motivo_encerramento`. Ambos gravam `encerrada_em`.
- Reabrir limpa os dados de encerramento e exige parcela efetivamente vencida,
  ausência de outra cobrança ativa e permissão na filial.
- Responsável, prioridade, última/próxima cobrança, follow-up, canal e
  observações são colunas escalares. `oportunidade_id`, `pipeline_id`,
  valores duplicados e `metadata` não pertencem ao contrato vigente.
- Abertura, manutenção, mudança de etapa, encerramento e reabertura devem ser
  atômicos e auditados campo a campo. As quatro guias transversais usam
  `entidade_tipo = cobranca`.
- O recorte acompanha fatos locais já materializados. Busca de parcelas em
  portais de seguradoras, robô, scraping e guarda de credenciais ficam fora de
  escopo.

**Changelog v2.6 — 20/07/2026:** fecha o ciclo de vida da cobrança por parcela,
adiciona encerramento escalar e regra de unicidade ativa, separa status de etapa
e remove do recorte os conceitos legados de oportunidade, pipeline duplicado e
metadata.

## Revisão contratual v2.5 — repasses e recibos de pagamento

- `repasse_recibos` é o cabeçalho autoritativo da baixa integral do repasse no
  MVP. Ele não representa banco, conta a pagar, caixa, tesouraria, PIX, CNAB ou
  conciliação bancária e não executa pagamento real.
- Cada recibo contém exatamente uma filial, um beneficiário e um sentido
  `CREDITO | DEBITO`. Valores positivos e negativos nunca são compensados nem
  misturados no mesmo recibo.
- Somente repasses `LIBERADO`, com beneficiário válido, valor não zero e sem
  recibo ativo podem ser emitidos. A emissão grava cabeçalho, itens, projeção em
  `repasses` e auditoria na mesma transação de cada recibo.
- A baixa é sempre integral: `valor_pago = valor_previsto`,
  `valor_diferenca = 0`, `status = PAGO` e `pago_em = data_pagamento`. Não há
  campo de rateio, saldo parcial ou ponte N:N de pagamentos neste contrato.
- `repasse_recibo_itens` congela número do repasse, documento, segurado,
  seguradora, ramo, papel e valores impressos. A reemissão usa exclusivamente o
  cabeçalho e esses snapshots; não recalcula proposta, grade ou regra vigente.
- A chave é única por filial+emissão. Retry com mesma chave e mesmo conteúdo
  devolve o recibo original; conteúdo diferente é conflito. Um índice parcial
  no backend deve impedir mais de um item ligado a recibo `EMITIDO` por repasse.
- O lote possui atomicidade por recibo: falha de um beneficiário/sentido não
  persiste parcialmente seus itens e não desfaz recibos concluídos de outros
  grupos. A resposta deve identificar emitidos, idempotentes e falhos.
- Cancelamento é integral, nunca `DELETE`. Exige recibo `EMITIDO`, justificativa,
  autor, data e chave idempotente; marca o cabeçalho `CANCELADO`, devolve seus
  repasses a `LIBERADO` e limpa apenas a projeção ativa de pagamento.
- Recibo ativo mantém a trava do v2.4 sobre o estorno da comissão vinculada.
  Depois do cancelamento, a trava some quando nenhum outro impedimento existir.
- `regra_id = NULL` continua identificando repasse manual. `comissao_id = NULL`
  permanece válido e não recebe vínculo artificial. Toda emissão consome os
  snapshots já materializados em `repasses`.
- PDF e Excel de relatório são consultas. A única ação mutável é
  `Emitir recibo e marcar como pago`, com confirmação explícita na aplicação.
- `repasse_recibo` e `repasse_recibo_item` podem ser usados como tipos técnicos
  em `audit_logs`, sem se tornarem módulos ou guias transversais.

**Changelog v2.5 — 16/07/2026:** cria recibos e itens normalizados, fecha
snapshot, autoria, idempotência, atomicidade por recibo e cancelamento integral;
mantém relatório separado de baixa e rejeita parcialidade/múltiplos pagamentos
no MVP. Cobranças securitárias permanecem no 3.6.

## Revisão contratual v2.4 — comissões e baixa manual

- `comissao_baixas` representa somente o reconhecimento operacional do
  recebimento securitário. Não representa banco, conta, caixa, tesouraria ou
  conciliação bancária.
- A baixa é evento imutável. `tipo = BAIXA` soma valor recebido e
  `tipo = ESTORNO` registra valor assinado compensatório, referenciando
  obrigatoriamente uma baixa anterior da mesma comissão.
- Uma comissão admite várias baixas. A baixa parcial mantém saldo pendente na
  mesma comissão e materializa `status = PARCIAL`; não recria a agenda composta
  pela Fase 2.
- `comissao_baixa_conciliacoes` permite N conciliações confirmadas por baixa.
  Toda ponte deve apontar para a mesma comissão e sua soma respeita o valor do
  evento. Uma conciliação nunca baixa por si só.
- Sem item associado, a baixa manual cria cabeçalho, item e conciliação lógicos
  de origem `MANUAL`, preservando a mesma trilha usada por arquivo e integração.
  Não há upload, parser ou leitura de PDF/XLS/XLSX neste recorte.
- O valor previsto permanece em `comissoes.valor_previsto`; bruto, líquido e
  descontos informados permanecem nos itens; alocação/diferença permanecem na
  conciliação; `valor_efetivo` vive no evento; `valor_recebido`, saldo e status
  da comissão são projeções derivadas desses eventos.
- Baixa exata usa tolerância monetária de R$ 0,01 e percentual de 0,01 ponto
  percentual. Baixa parcial, divergência aceita, correção, estorno ou outro
  motivo exigem justificativa. Valor acima do saldo só é aceito como
  divergência explícita e justificada.
- Idempotência é única por comissão+chave. O backend deve serializar a operação,
  conferir saldo e consumo das conciliações, impedir duplicidade e escrever
  baixa, pontes, projeção e auditoria na mesma transação.
- `status` da comissão fica em `PREVISTA | PARCIAL | RECEBIDA | DIVERGENTE |
  CANCELADA`. Estados de sugestão/confirmação continuam exclusivos da
  conciliação; `BAIXA | ESTORNO` são tipos do evento, não status da comissão.
- Ocorrência `ABERTA | EM_ANALISE` ou associação ainda `SUGERIDA` impede baixa.
  O operador deve resolver/rejeitar/confirmar a conciliação antes de reconhecer
  o recebimento; criar nova origem manual não pode contornar essa pendência.
- O evento que altera o estado operacional é a criação de baixa ou estorno; os
  registros históricos nunca são substituídos. Estorno integral ou parcial é
  permitido somente até o valor ainda ativo da baixa original e fica impedido
  quando houver repasse `PAGO` vinculado.
- A baixa libera repasses vinculados de `PREVISTO` para `LIBERADO`; pagamento
  do repasse continua fora do 3.3. Se um estorno eliminar todo recebimento, um
  repasse ainda apenas `LIBERADO` retorna a `PREVISTO`.
- Os tipos técnicos `comissao_baixa` e `comissao_baixa_conciliacao` podem ser
  usados em `audit_logs`, sem criar módulos ou guias transversais.

**Changelog v2.4 — 15/07/2026:** cria o histórico normalizado de baixa/estorno,
sua ponte N:N com conciliações, adiciona o estado `PARCIAL` à comissão, fecha
idempotência/autoria e preserva a separação entre agenda, extrato, conciliação,
ocorrência, baixa e repasse. Leitura automática de arquivos permanece no 3.4 e
pagamento de repasses permanece no 3.5.

## Revisão contratual v2.3 — extratos e conciliação securitária

- `comissao_extratos` representa exclusivamente demonstrativos de comissão
  recebidos de seguradoras. Não representa conta, banco, caixa ou conciliação
  bancária.
- O cabeçalho preserva tenant, corretora, seguradora, identificação externa,
  competência/período, emissão/recebimento, referência do arquivo, origem,
  formato, hash, chave idempotente, parser futuro, tentativas, totais, status,
  autoria e timestamps.
- `comissao_extrato_itens` preserva os dados originais e normalizados de cada
  linha mesmo quando nenhuma comissão é encontrada. Referências informadas de
  proposta, apólice, endosso, documento, parcela e segurado não viram FKs
  inventadas antes da associação confirmada.
- `comissao_conciliacoes` resolve a cardinalidade N:N entre itens e comissões.
  O par item+comissão é único; valores alocados permitem parcialidade e
  agregação. O backend deve impedir sobrealocação por transação e concorrência.
- Tipos de associação são `EXATA | PARCIAL | SUGERIDA | MANUAL`; seus estados
  são `SUGERIDA | CONFIRMADA | REJEITADA | CANCELADA`.
- O item pode ficar `PENDENTE | SUGERIDO | CONCILIADO | PRONTO_PARA_BAIXAR |
  PARCIAL | AMBIGUO | NAO_ENCONTRADO | DIVERGENTE | IGNORADO` sem executar
  baixa. `PRONTO_PARA_BAIXAR` expressa elegibilidade, não recebimento confirmado.
- Erros futuros de processamento usam `LAYOUT_NAO_SUPORTADO |
  ERRO_DE_LEITURA | ARQUIVO_CORROMPIDO | ARQUIVO_PROTEGIDO |
  FORMATO_NAO_SUPORTADO`, sem antecipar o parser do 3.4.
- `comissao_conciliacao_ocorrencias` tipa ausência, ambiguidade, duplicidade e
  diferenças de valor, percentual, competência, parcela, proposta, apólice e
  segurado, além de comissão já conciliada ou já recebida, com resolução e
  autoria.
- Origem, tentativa e estados são obrigatórios no cabeçalho; estado é
  obrigatório também em item, associação e ocorrência. Autores ficam nullable
  para eventos de sistema, enquanto timestamps de criação/identificação e
  atualização são obrigatórios.
- Idempotência: extrato por corretora+chave e corretora+seguradora+hash; item por
  extrato+chave; associação por item+comissão e item+chave.
- `valor_previsto` continua em `comissoes`; o valor informado mora no item; o
  valor alocado/diferença mora na associação; o valor efetivamente recebido é
  projetado em `comissoes.valor_recebido` pelos eventos do contrato v2.4.
- Origem manual e origem por arquivo produzem as mesmas entidades. Receber ou
  normalizar arquivo não confirma recebimento financeiro.
- Os tipos técnicos `comissao_extrato`, `comissao_extrato_item`,
  `comissao_conciliacao` e `comissao_ocorrencia` ficam disponíveis para
  `audit_logs`, sem criar módulos ou guias operacionais próprios.

**Changelog v2.3 — 14/07/2026:** cria quatro tabelas normalizadas para extrato,
itens, associação N:N e ocorrências; fecha autoria e idempotência; remove as
referências concorrentes `extrato_numero`/`seguradora_lote` de `comissoes`; e
preserva a separação entre conciliação e baixa. Parsing e upload permanecem no
3.4; o v2.4 fecha a baixa manual do 3.3.

## Revisão contratual v2.2 — agenciamento e tipos de comissão

- `propostas.comissao_pct` continua representando o percentual normal ou
  vitalício. `propostas.agenciamento_pct` persiste separadamente o percentual
  total de agenciamento nos ramos aplicáveis, especialmente Saúde e Vida.
- O cadastro/revisão da proposta apresenta os dois campos separadamente;
  agenciamento não é inferido de observação, nome da grade ou percentual de uma
  comissão já materializada.
- `recebimento_grade_parcelas.tipo_comissao` classifica a linha do molde e
  `comissoes.tipo_comissao` preserva a classificação no snapshot gerado.
- O conjunto fechado é `NORMAL | AGENCIAMENTO | VITALICIA | ADICIONAL |
  RESTITUICAO`. Não criar sinônimos ou categorias adicionais no frontend.
- Linhas `AGENCIAMENTO` usam a distribuição explícita da grade e devem fechar o
  total de `propostas.agenciamento_pct`. Linhas `NORMAL` ou `VITALICIA` com
  percentual NULL no molde usam `propostas.comissao_pct`.
- Exemplo canônico: Saúde com `agenciamento_pct = 300` e `comissao_pct = 2`
  materializa os três primeiros eventos como `AGENCIAMENTO` a 100% cada e os
  seguintes como `VITALICIA` a 2%.
- Alterar o molde não reescreve fatos já materializados. `tipo_comissao` e
  percentual permanecem editáveis somente enquanto a comissão for operável e
  toda alteração deve gerar `audit_logs`.

**Changelog v2.2 — 13/07/2026:** adiciona `propostas.agenciamento_pct`,
`recebimento_grade_parcelas.tipo_comissao` e `comissoes.tipo_comissao`, fecha o
vocabulário dos eventos de comissão e registra a geração canônica de
agenciamento + vitalício. Campos legados adicionais de veículo observados nos
benchmarks não foram incorporados.

## Revisão contratual v2.1 — documentos e edição auditada

- `propostas.data_efeito`, `premio_adicional` e `premio_restituicao` foram
  removidos. `vigencia_inicio` é a referência temporal dos efeitos do documento.
- `premio_total` e `premio_liquido` preservam o sinal: positivo é acréscimo,
  negativo é restituição/estorno e zero/NULL é sem movimento ou a apurar.
- `tipo_movimento_endosso` contém somente a natureza canônica. O rótulo
  administrável vem de `endosso_subtipos`, cuja linha aponta para uma das
  naturezas `ALTERACAO_DADOS`, `INCLUSAO_ITEM`, `EXCLUSAO_ITEM`,
  `SUBSTITUICAO_ITEM`, `ALTERACAO_COBERTURA`,
  `ALTERACAO_IMPORTANCIA_SEGURADA` ou `ALTERACAO_CLAUSULA`.
- `propostas.endosso_subtipo_id` é obrigatório na aplicação para `ENDOSSO` e
  `propostas.cancelamento_motivo_id` é obrigatório na aplicação para
  `CANCELAMENTO`. Os catálogos aceitam escopo opcional por filial e ramo.
- A etapa continua no contrato de todo documento, mas a leitura operacional a
  exibe somente durante análise, pendência ou recusa.
- A edição de apólice e documento é explícita e independente. Cada campo
  efetivamente alterado gera `audit_logs` imutável com entidade, ID, valores
  anterior/novo, `acao=UPDATE`, usuário, data e origem. No backend definitivo,
  essa garantia pertence a trigger/transação; no front puro, o mock simula o
  mesmo efeito.
- Documento emitido pode ter dados corrigidos, mas a correção não reescreve
  itens, coberturas, parcelas, comissões ou repasses já materializados sem uma
  operação contratual própria.

**Changelog v2.1 — 11/07/2026:** revisão do micro-plano 2.2f. Cria os catálogos
`endosso_subtipos` e `cancelamento_motivos`, adiciona seus vínculos nullable em
`propostas`, remove os três campos obsoletos e estabelece vigência documental,
prêmios com sinal e auditoria por campo. O produto determinou o número v2.1 e o
par v2.0 foi preservado sem edição.

**Changelog v2.0 — 04/07/2026:** marco de completude de campos antes da retomada do frontend. `wassis_erp_esqueleto_v2_0.dbml` expande colunas escalares nas 53 tabelas existentes, mantendo as 112 referências do v1.1 e os 5 blocos de índice intactos. Não cria tabela, FK, índice ou cardinalidade nova. A expansão incorpora sinais dos portais Quiver/Segfy, prática operacional de seguros, SRO/SUSEP e Circular SUSEP 642 para dados de apólice, proposta/endosso, vigência, coberturas, prêmio, intermediação e sinistro. Revisão posterior contra `database.ts`/front preservou a nomenclatura já funcional de `segurados` e separou campos implementados de propostas v2.0.

**Changelog v1.1 — 20/06/2026:** **decisão 18** (perfis de acesso cadastráveis): nova tabela `perfis`; `role_permissions` e `profile_filiais` passam a referenciar `perfil_id` (no lugar do enum `app_role`); **autoria** de perfis no front, **aplicação** (runtime/RLS) no backend; enum `app_role` rígido rejeitado; **papel global por usuário aposentado** (sem `user_roles`/cargo global no front) — permissão de negócio só pelo perfil por corretora. `filiais` recebeu as colunas de negócio da tela Corretoras/Filiais (`razao_social`, `fantasia`, `cnpj_cpf` [PF/PJ], `susep`, `percentual_imposto`, `lgpd_aceito`/`lgpd_aceito_em`, `gerente`, `contato`, `home_page`, contatos, endereço, `ativo`) + `UNIQUE(tenant_id, cnpj_cpf)`. `cnpj_cpf` da corretora reconciliado para aceitar **CPF** (corretor pessoa física), refinando a decisão 12. Esqueleto correspondente: **`wassis_erp_esqueleto_v1_1.dbml`**.

**Changelog v1.0 — 19/06/2026:** baseline entregue ao frontend. Pendência 8 [COTACAO-RISCO] resolvida → **decisão 17** (multi-cálculo: `oportunidade → calculos → cotacoes`; CTI `calc_*` espelhando `item_*`; `calculo_coberturas`; Agger como referência/motor inicial/fallback; cotado ≠ emitido preservado). Nova seção "Multi-cálculo (fase comercial)"; nomenclatura de CÁLCULO/COTAÇÃO revisada; `cotacoes` re-ancorada em `calculos`; seções "Dois domínios", "Estrutura base", "Coberturas" e escopo funcional atualizadas. Adicionada a seção "Versionamento (SemVer)"; o 3.x passa a ser histórico de iterações de design (RFCs arquivados) e o raciocínio fica no log de decisões. Conflito do PRD `cpf_cnpj` **reconciliado** (PRD v1.1, "único por filial"). Esqueleto correspondente: **`wassis_erp_esqueleto_v1_0.txt`**.

---

## Histórico de iterações de design (RFCs arquivados — 3.x)

> Preservado para arqueologia das decisões. Não é changelog de releases.

**v3.5 — 17/06/2026:** pendências 6 [POS-VENDA], 10 [CAMPOS] e 11 [LOGS-UI] resolvidas → decisões 14, 15 e 16. Pós-venda confirmado como módulo (1 `entidade_tipo` + N pipelines); `entidade_tipo` congelado com `pos_venda`. Logs-UI: `vw_timeline` une na leitura. Campos personalizados: EAV tipado (4 tabelas). Esqueleto v3.8.

**v3.4 — 16/06/2026:** pendência 7 (`proposta_itens`) resolvida → decisão 13 (item ancorado na apólice; `item_coberturas` versiona por documento; substituição de objeto = excluir + incluir). Pendência 8 com diretriz registrada (multi-cálculo futuro; cotação × proposta desacopladas). Esqueleto v3.7.

**v3.3 — 13/06/2026:** pendências 3 [VENDA-CRUZADA], 4 [MULTI], 5 [KANBAN] e "papel por filial" resolvidas → decisão 12 (Grupo × Corretoras; cadastros separados; `profile_filiais`; `pipelines.filial_id`). Pendência 12 [CASCATA] removida. Conflito do PRD `cpf_cnpj` registrado para reconciliação. Esqueleto v3.6.

**v3.2 — 12/06/2026:** pendência 2 resolvida → decisão 11 (Comissão × Repasse); `produtores` reintroduzida; `recebimento_grades`/`repasse_regras`/`repasses`; benchmark Quiver rejeitado. Esqueleto v3.5.

**v3.1 — 11/06/2026:** pendência 1 resolvida → decisão 10 (Vida em Grupo Global × PME, um nível de coberturas); `apolice_coberturas` rejeitada. Esqueleto v3.4.

**v3 — 11/06/2026:** seção "Coberturas"; decisão 9 (`atividade_mencoes` + nota fixada); pendências 10 [CAMPOS] e 11 [LOGS-UI]; `entidade_tipo` formalizado. Esqueleto v3.3.


## Revisão aditiva v3.1 — reconciliação frontend (11/09/2026)

O par v3.0 fica preservado. v3.1 adiciona `calc_auto.chassi_remarcado` boolean nullable, preservando o campo já operado pelo front; NULL significa desconhecido, não equivale a falso. Cada apresentação admite até cinco cotações da mesma oportunidade. O sexto item deve ser recusado sem alterar a seleção.

Nomes canônicos de plataforma seguem o DBML: `nome_completo`, `telefone`, `modulo`, `razao_social`, `nome_fantasia`, `ativo`. O nome legado único do grupo é convertido explicitamente em razão social na carga demonstrativa; nome fantasia fica desconhecido até preenchimento. A identidade do provedor de autenticação é uma fronteira separada.

### Autoria de acesso e simulação no frontend

- Ações independentes: ler, criar, editar, excluir, exportar e gerenciar. Gerenciar representa manutenção administrativa do módulo; não concede implicitamente as demais ações.
- Escopo GRUPO agrega apenas corretoras às quais o usuário tem vínculo válido no grupo; CORRETORA restringe à corretora do vínculo; PROPRIO exige também responsabilidade explícita do registro (responsavel_id ou produtor/gerente vinculado ao profile, conforme módulo). Não inferir propriedade pelo nome, cargo ou perfil. Em contexto sem registro, PROPRIO permite abrir o módulo/criar no contexto autorizado, mas não autoriza operação sobre registro arbitrário.
- Em Todas as corretoras, a elegibilidade é união de vínculos válidos, sem transferir permissões de uma corretora para registros de outra. UI demonstrativa não substitui enforcement pelo backend.
- `profile_filiais.ativo = true` e período inclusivo válido habilitam o vínculo; datas NULL não limitam o período. `profiles.ativo = true`, `status = ATIVO` e perfil/corretora ativos também são necessários. Desconhecido não concede acesso. Inativar preserva a linha e a referência histórica.
- Status de usuário ATIVO/INATIVO; convite PENDENTE/ACEITO/CANCELADO. Convite, último acesso e entrega de email são responsabilidade do serviço; mock apenas simula metadados e não envia mensagens.
- `perfis.nivel_acesso` é classificação descritiva, não herança nem bypass das permissões.

### Cadastros e preservação

Todas as colunas de plataforma/cadastros são representadas nos tipos e no mock, mesmo quando opcionais não são editadas nesta entrega. Atualização parcial preserva os valores não editados. Defaults desconhecidos permanecem NULL; booleans operacionais são inicializados explicitamente no fluxo. Dados fiscais do produtor não geram cálculo de imposto automaticamente.

Contato empresarial pertence à PJ; PF vinculada é opcional e, quando presente, pertence à mesma corretora. Dados próprios de contato prevalecem sobre o cadastro PF apenas na leitura do contato. Contato sem PF exige nome; a tela não cria PF fictícia.

A classificação detalhada dos campos editáveis, de serviço e de evolução é registrada no relatório de reconciliação e no hand-off. `integracao_logs` permanece exclusivamente técnico e sem tela de domínio. As diferenças de nulabilidade que expressam validação de negócio não justificam afrouxar formulários.
