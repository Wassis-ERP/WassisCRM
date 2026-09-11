# Publicação consolidada — 11/09/2026

Escopo governado/contratual: conciliação e publicação autorizadas pelo usuário, preservando as integrações de Segurados/Oportunidades já presentes em main. Não implementar backend nem novas APIs; adaptar apenas as fronteiras existentes ao contrato v3.1.

## Execução
- [x] Salvar o frontend, relatórios, evidências demonstrativas e o par DBML/instruções v3.1 em commit local (`7380c9f`).
- [x] Incorporar origin/main (inclui origin/Dev), resolver conflitos sem sobrescrever trabalhos e revisar integrações.
- [x] Validar TypeScript, suite de testes, lint focado, build, auditoria DBML e fluxos afetados no navegador.
- [x] Publicar Dev, criar PR para main e preparar merge condicionado aos checks verdes. Estado final de CI/merge/deploy consultável na [PR #47](https://github.com/Wassis-ERP/WassisCRM/pull/47).

## Contrato e aceite
Tabelas diretamente afetadas: segurados, oportunidades, profiles, filiais, tenants e relações consumidas pelos adapters existentes. Fontes: DBML/instruções v3.1, macro-plano e micro-planos de reconciliação/nulabilidade. Decisão de legado: refatorar no lugar, preservar modos mock/API remotos; dados incompletos não ganham valores inventados. Nenhuma configuração de ambiente local será substituída por arquivos de exemplo.

Arquivos prováveis: useSegurados, useOportunidades, adapter comercial, backendDomainApi e testes. O backend mantém responsabilidade por persistência, validação, autorização e isolamento; compatibilidade de DTO fica explícita na fronteira do frontend. database.ts deve continuar aderente ao DBML.

## Evidências
Validações anteriores reutilizadas apenas para o checkpoint de segurança: TypeScript/build aprovados, 295 testes e 34 focados posteriores, lint sem novas ocorrências. Após conciliação, os gates afetados serão executados novamente.

- Base remota conciliada: `79a6304` (main), incluindo a Dev remota. Conflitos resolvidos em useSegurados/useOportunidades/adapter comercial. DTO HTTP legado separado dos tipos DBML; preservar dados remotos não exibidos no PUT e bloquear campos sem suporte antes da gravação.
- Limitações operacionais e hand-off detalhados em `resultado-publicacao-2026-09-11.md`. Cadastro conectado orienta usar segurado cadastrado; prioridade/datas não são inventadas. O modo mock mantém o fluxo completo.
- TypeScript e build final aprovados. Vitest após atualização de dependências: 44 arquivos, 304 testes aprovados. Último ajuste posterior foi apenas overflow do modal/EOF; build repetido, sem alteração funcional.
- Lint do diff consolidado: mesmas 32 ocorrências legadas (8 em useEntityTabsState.test, 18 em inMemoryQueryBuilder, 6 em supabase). Os oito arquivos diretamente ajustados na conciliação passaram no lint focado.
- Auditoria DBML: 68 tabelas / 1.164 colunas, 67 tabelas de domínio representadas, zero colunas ausentes/extras, tipos incompatíveis ou diferenças de nulabilidade. database.ts não foi alterado durante o merge.
- Atualização compatível somente do package-lock para corrigir seis vulnerabilidades transitivas, sem alteração de package.json. npm audit: zero vulnerabilidades. npm 10 global falhou no cálculo da árvore; npm 11 distribuído com Node concluiu sem alterar configuração do ambiente.
- Browser local: edição em mock; listagem/detalhe/edição de Segurados e cadastro/edição de Oportunidades no modo API com HTTP interceptado localmente; gravações verificadas nos DTOs recebidos, sem chamadas a ambientes reais. Desktop 1440×1000 e mobile 390×844, zoom 100%; modal com rolagem interna, sem corte do topo. Evidência: output/publicacao/qa.json e capturas. Conclusão/reabertura e preservação de campos legados cobertas por testes da fronteira HTTP.

- Publicados os commits `7380c9f` e `1fe6d3c` em Dev, incluindo o par DBML/instruções v3.1. PR #47 criada. CodeQL inicial aprovado. O CI inicial revelou dependências opcionais WASM ausentes no lockfile; o lock foi reconciliado em diretório limpo com npm 11.19.0 (mesma versão do runner), sem mudar versões de pacotes já validados. `npm ci --dry-run` para Linux aprovado e auditoria permanece zerada. Resultado das novas execuções e merge registrados na PR para evitar duplicar status remoto mutável neste documento.
