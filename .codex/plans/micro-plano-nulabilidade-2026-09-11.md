# Nulabilidade de leitura × validação de escrita — 11/09/2026

Escopo governado/contratual autorizado: revisar as 87 diferenças restantes, campo a campo, preservando mudanças locais. Frontend/mock e documentação, sem configuração, backend ou publicação.

Fontes: par DBML/instruções v3.1, auditoria e resultado da reconciliação, macro-plano. Refatoração no lugar: tipos Row reconhecem null previsto no DBML; inputs de formulário e comandos continuam exigindo dados necessários à operação. Não usar defaults de exibição para fabricar informações de negócio.

## Execução
- [x] Conferir a contagem: o resumo dizia 87, mas o inventário contém 86 campos; todos foram alinhados ao DBML.
- [x] Tratar consumidores: rótulos/canais incompletos, flags desconhecidas, valores financeiros e catálogos sem informação. Manter validações de criação/transição e rejeitar operações sem dados suficientes.
- [x] Testar leitura incompleta e bloqueio de escrita; conferir principais jornadas no navegador.
- [x] Auditoria estrutural, TypeScript, testes, lint focado e build; atualizar relatório, painel e hand-off.

## Aceite e responsabilidades
- Campos nullable não viram propriedades opcionais por conveniência. FKs not null permanecem obrigatórias.
- Não classificar null silenciosamente como status válido, consentimento, permissão ou valor monetário confirmado.
- Formulários podem usar vazio/false como estado de edição; persistência/transição deve continuar validada explicitamente.
- Hand-off distingue contratos de leitura e validações por estado/fluxo. Exceções remanescentes devem apontar campo e justificativa, sem encobrir incompatibilidade.

## Resultado e evidências

- Inventário exato: `nulabilidade-campos-2026-09-11.json`, 86 campos. Auditoria `auditoria-nulabilidade-2026-09-11.json`: 68 tabelas/1.164 colunas no DBML, 67 tabelas no front, zero nulabilidades divergentes, zero colunas ausentes/extras/incompatíveis. Nenhuma exceção de nulabilidade canônica restante.
- Tipos de leitura corrigidos em database/platformRows e declarações administrativas; entradas separadas, obrigatoriedade de FKs mantida. Campos de leitura nulos não se tornam opcionais indiscriminadamente. Diferenças de enum mais restrito e validação de operação não equivalem a nulabilidade.
- TypeScript final aprovado; build Vite aprovado (aviso conhecido de chunks >500 kB).
- Vitest completo: 43 arquivos, 295 testes aprovados; 34 testes de nulabilidade/catálogos repetidos após os últimos ajustes. Sem nova dívida de lint: 32 ocorrências legadas em três arquivos, baseline da reconciliação preservada. Últimos arquivos alterados passaram no lint focado.
- Browser: leitura de dados incompletos em Segurados, Grades, Ramos, Seguradoras e Campos Personalizados; tipo/status sem seleção inventada; grade sem tipo corrigida pela UI e escrita verificada no mock; desktop 1440×1000 e mobile 390×844. Nenhum erro de página/console nas jornadas registradas.
- Evidências `output/nulabilidade/qa.json`, `qa-repair.json`, screenshots; comandos em `.codex/tmp/qa-nullable.cjs` e `qa-grade-repair.cjs`; logs TypeScript/Vitest/lint/build na mesma pasta tmp. Falhas iniciais de QA foram seletores inadequados, corrigidos; resultados finais passaram.
- Revisão e tratamento por campo: `resultado-nulabilidade-2026-09-11.md`. Painel visual, resultado geral e hand-off do recorte atualizados. DBML/instruções v3.1 não tiveram mudança estrutural; backend continua fora do escopo.
- Git diff sem erros de whitespace. Nenhuma configuração, commit, push ou publicação neste recorte; mudanças locais anteriores preservadas.
