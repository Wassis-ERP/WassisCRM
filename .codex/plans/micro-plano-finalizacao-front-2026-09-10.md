# Finalização frontend — multicalculo, apresentação e aderência

> **Estado reconciliado em 11/09/2026:** as divergências residuais desta auditoria inicial foram tratadas pela reconciliação v3.1 e pela revisão de nulabilidade; consultar os planos de 11/09. O limite de cinco foi documentado no par v3.1, e as notas deste recorte estão consolidadas no [relatório raiz](../../relatorio-endpoints-campos.md). O aceite da V1 foi formalizado em rodada documental própria.

Status: [x] Recorte implementado e revisão concluída, 2026-09-10. Escopo governado/contratual. A revisão encontrou drift legado; não significa aderência integral do projeto.

## Fontes e legado

- Fonte vigente: instruções e DBML v3.0. Macro: fase 6.4R/6.5.
- Refatorar no lugar a implementação já preparada em stage; preservar autoria e configurações existentes.
- Domínio exclusivamente mock em memória. Integração real Agger, backend, SQL e migrations fora do escopo.

## Entregas e aceite

Ampliação confirmada pelo usuário em 2026-09-10: incluir resultados manuais e
fechamento da cotação em proposta tanto pelo cadastro manual quanto pelo fluxo
existente de importação de propostas. Reutilizar os assistentes dedicados;
seleção de origem explícita, validação de segurado/seguradora/ramo/oportunidade,
unicidade de `propostas.cotacao_id`, aprovação e gravação atômicas. Renovação
preserva a cadeia contratual. Resultado manual usa execução `MANUAL` e tabelas
de resultado v3.0. Importação continua simulada e revisável, sem OCR/API real.

- [x] Registrar cotação manual com coberturas/parcelamentos normalizados.
- [x] Vincular cotação a proposta pelo cadastro manual e importação, sem duplicar contrato/proposta ao repetir confirmação.

- [x] Revisar jornada cálculo → execução → resultado → apresentação e corrigir lacunas demonstráveis.
- [x] Aceitar até cinco cotações da mesma oportunidade; bloquear a sexta sem perder seleção, ordem, pagamento ou escolha.
- [x] Melhorar PDF por impressão: identidade W.Assis, contexto e vigência, pagamentos e restrições legíveis, cinco opções, paginação sem shell/cortes e visibilidade respeitada.
- [x] Conferir todas as tabelas/colunas de `database.ts` contra DBML v3.0; classificar projeções, tabelas técnicas, ausências e drift real em relatório reproduzível.
- [x] Corrigir divergências seguras no escopo e registrar as que exigirem decisão própria.
- [x] Executar testes, TypeScript, lint focado, build e jornada no navegador desktop/100%; renderizar o PDF para conferir todas as páginas.

## Contrato e hand-off

Entidades comerciais: `calculos`, seis `calc_*`, `calculo_coberturas`, `calculo_execucoes`, `cotacoes`, `cotacao_coberturas`, `cotacao_parcelamentos`, `apresentacoes_comerciais`, `apresentacao_cotacoes`. Limite de cinco é regra do frontend, sem mudança estrutural do DBML. Seleção deve ser atômica, sem misturar oportunidades/parcelamentos nem alterar resultados originais. Escolha do cliente não cria proposta implicitamente. Backend futuro: enforcement de escopo/permissões, atomicidade, geração/armazenamento de documento e integração; registrar achados aqui, sem atualizar o snapshot parcial de endpoints por consequência.

## Evidências

- TypeScript final (`node node_modules/typescript/bin/tsc -b --pretty false`): aprovado.
- Vitest completo: 41 arquivos, 270 testes aprovados. Após ajuste final de preservação das coberturas e bloqueio de segunda proposta ativa, os três arquivos afetados foram reexecutados: 14 testes aprovados (inclui teste novo de recusa/nova tentativa).
- ESLint focado nos arquivos alterados e script de auditoria: aprovado; repetido apenas nos arquivos com alterações posteriores.
- Build de produção Vite: aprovado. Aviso preexistente de chunk principal >500 kB permanece; sem alteração de configuração.
- Navegador Chromium em 1440×900, zoom 100%: cinco cotações em duas versões, sexta bloqueada, configuração, escolha/recomendação, prévia, geração e importação de proposta com origem preservada. Sem erros de página; main 1192 px e scrollWidth 1192 px.
- Navegador: registro manual com franquia zero → comparativo → escolha → cadastro manual → apólice EM_EMISSAO e proposta vinculada. Layout conferido em light/dark, sem overflow; sem erros de página.
- PDFs reais gerados por Chromium e renderizados com PDFium: horizontal 3 páginas, vertical 4 páginas; todas inspecionadas, sem cortes, sobreposição, shell ou página vazia. Saídas em `output/pdf/comparativo-cinco-cotacoes.pdf` e `output/pdf/comparativo-cinco-cotacoes-vertical.pdf`.
- Scripts/evidências locais: `.codex/tmp/qa-finalizacao.cjs`, `.codex/tmp/qa-cotacao-manual.cjs`, `output/pdf/qa-finalizacao.json`, `output/pdf/qa-manual.json`.
- A suíte revelou dois testes com data fixa de julho vencida; fixtures de login e cobrança foram estabilizadas, sem alterar código de autenticação ou financeiro.
- Impeccable atualizado para v4.3.1 com autorização explícita do usuário; alterações de instalação mantidas separadas das mudanças de produto.

## Aderência e riscos residuais

- Relatório versionável: `revisao-front-dbml-2026-09-10.md`. Auditoria reproduzível: `nexus-crm/scripts/audit-frontend-contract.mjs`.
- 68 tabelas / 1163 colunas examinadas; 57 tabelas compatíveis em nomes/colunas/tipos escalares; 94 colunas ausentes e 22 extras nos tipos aplicados. Os 11 casos restantes incluem a tabela técnica `integracao_logs`, deliberadamente sem UI. Há 90 diferenças de nulabilidade, em sua maioria validações mais estritas no frontend.
- `database.ts` do comercial espelha as entidades v3.0 usadas, **exceto `calc_auto.chassi_remarcado`**, já presente antes desta retomada e não previsto no DBML. Mantido temporariamente e documentado para decisão do próximo par contratual; não remover campo nem inventar coluna como consequência da revisão.
- Cadastros/plataforma (incluindo tipos separados em platform.ts) exigem reconciliação própria antes de afirmar alinhamento total do hand-off. A revisão foi concluída; essa migração abrangente não foi disfarçada como correção pontual.
- Limite de cinco substitui a regra anterior de três por decisão explícita do usuário. Comentário histórico no DBML v3.0 não foi tratado como mudança estrutural necessária.
- A ponte copia campos compatíveis de risco/coberturas para conferência no contrato e preserva `propostas.cotacao_id`. FIPE não tem coluna equivalente em `item_coberturas`; é preservada em observações textuais e no resultado original, sem inventar campo numérico de capital.
- Importação é simulação pelo frontend, com metadados do arquivo e revisão; não extrai conteúdo real nem chama seguradora. A integração real e a consolidação definitiva do relatório de endpoints permanecem no fluxo futuro.
