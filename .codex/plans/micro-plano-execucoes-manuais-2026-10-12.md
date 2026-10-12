# Execuções e cotações manuais — 12/10/2026

Escopo governado/contratual, continuidade autorizada pelo usuário sem dependência de contratos individuais das seguradoras. Referências lidas: instruções/DBML v3.1, macro-plano, micro-plano das raízes CRM e domínio atual de execução/apresentação. Contextos de mercado não estão disponíveis neste checkout; nenhuma regra específica de seguradora será inferida.

Legado: hooks e domínios demonstrativos em memória. Decisão: manter demonstração isolada até completar APIs, lookups e adapter HTTP no backend autorizado WAssisBE. Este repositório recebe somente acompanhamento contratual neste bloco, sem SQL, backend ou nova tela.

Tabelas: `calculo_execucoes`, `cotacoes`, `cotacao_coberturas`, `cotacao_parcelamentos`; referências `calculos`, `seguradoras`, `coberturas_catalogo`, `oportunidades`. Campos/enums/FKs foram conferidos em `database.ts` contra DBML v3.1; nenhum drift identificado nesses quatro registros e nenhuma alteração de tipagem necessária.

- [x] Persistência BE das execuções MANUAL, comissão aplicada e histórico, cancelamento e reexecução. Suite local de oito integrações PostgreSQL/TLS aprovada antes do bloco de apresentação.
- [x] Registro atômico do resultado manual e opções de parcelamento, sem alteração do pedido ou resultado antigo.
- [x] Gates locais BE: 161 testes sem PostgreSQL e oito integrações PostgreSQL/TLS aprovadas; Release sem avisos/erros. Concorrência/idempotência, permissões, rollback e jornada HTTP cobertos. CI/publicação em fechamento.
- [x] Apresentação/comparativo persistente BE até cinco cotações da mesma oportunidade, inclusive versões diferentes. Edição concorrente com revisão e integridade de seleção/parcelamento validadas no banco e no HTTP.
- [ ] Lookups e adapter HTTP dos hooks; validação da jornada conectada no navegador.
- [ ] Fila/bridge dos motores automáticos após contratos externos; nenhuma chamada externa neste bloco.

## Contrato para o adapter futuro

POST/GET `/api/calculos/{id}/execucoes`; POST `/api/execucoes/{id}/reexecutar`; POST `/api/execucoes/{id}/cancelar`; POST `/api/execucoes/{id}/cotacao-manual`; GET `/api/execucoes/{id}`; GET `/api/cotacoes/{id}`; GET `/api/oportunidades/{id}/cotacoes`. Escritas exigem `Idempotency-Key`; listas paginadas `{items,page,pageSize,totalCount}`.

Criação recebe `{seguradora_id,motor:MANUAL,comissao_pct_sobrescrita?}`. O backend deriva comissão do pedido quando override é nulo/ausente; zero é override explícito. Reexecução recebe somente `{comissao_pct_sobrescrita?}`, aplica novamente o padrão do pedido se ausente e mantém `reexecucao_de_id`; não herda silenciosamente a sobrescrita anterior. Tentativa aberta bloqueia duplicação; estado terminal exige novo ID. Cancelamento só atua em execução manual aberta; repetição da mesma chave é segura.

Resultado recebe campos escalares de `cotacoes` (sem IDs, status ou timestamps controlados pelo servidor), `coverages` com campos de `cotacao_coberturas` e `installments` com campos de `cotacao_parcelamentos` (sem IDs/FKs técnicos). `premio_total` é obrigatório no registro manual; zero é válido e os demais valores desconhecidos ficam nulos. Coberturas sem catálogo usam `chave_resultado` estável e podem preservar o nome informado. Opções de pagamento são alternativas, não parcelas contratuais. Datas ISO; `link_proposta` somente HTTPS, sem credencial embutida. Retorno `{quote,execution,coverages,installments}`; execução conclui somente ao salvar todo o agregado. Sem aprovação/transmissão ou proposta contratual neste endpoint.

Idempotência, autorização sobre oportunidade (incluindo PROPRIO), RLS grupo/corretora, locks, integridade e auditoria são responsabilidade do backend. Nenhum JSON de negócio é gravado. Relatório consolidado de endpoints não é reemitido por etapa. Prompts de continuidade permanecem exclusivamente no chat.

## Contrato do comparativo

POST/GET `/api/oportunidades/{id}/apresentacoes`, GET/PUT `/api/apresentacoes/{id}`. Escritas exigem `Idempotency-Key`; PUT exige `expectedRevision` devolvida na leitura, impedindo edição concorrente. Retry de chave anterior após edição posterior retorna 409 e exige releitura, sem restaurar estado antigo. Retorno `{presentation,items,revision,results}`; cada resultado preserva a cotação, execução, snapshot do pedido e nome da seguradora. Campos do cabeçalho/itens usam nomes canônicos; `items` ordena seleções e `ordem` é gerada pelo servidor. Zero/nulo mantêm significado. `GERADA` salva configuração pronta para renderização; não promete PDF exportado ou link compartilhável. Escolha do cliente registra `cotacao_escolhida_id`, mas não aprova a cotação nem cria proposta/apólice. O frontend fará tradução dos inputs camelCase demonstrativos para o contrato HTTP quando seus hooks forem conectados.

Tabelas adicionais conferidas: `apresentacoes_comerciais`, `apresentacao_cotacoes`; `database.ts` segue aderente ao DBML v3.1. Revisão e receipts de infraestrutura não entram na tipagem de negócio.

Limite frontend identificado: AGENTS.md exige `wassis-design` para implementar telas, mas `C:\Users\PC\.agents\skills\wassis-design\SKILL.md` está ausente e as pastas `.agents/skills`, `.codex/skills` e cache de plugins não contêm skill Wassis. Localização solicitada ao usuário. Nenhuma tela/hook/adapter foi alterada neste checkpoint documental. Jornada Playwright desta rodada permanece pendente; o runner anterior estava bloqueado pelo Controle de Aplicativos ao iniciar psql.
