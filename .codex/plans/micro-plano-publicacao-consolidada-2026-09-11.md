# Publicação consolidada — 11/09/2026

Escopo governado/contratual: conciliação e publicação autorizadas pelo usuário, preservando as integrações de Segurados/Oportunidades já presentes em main. Não implementar backend nem novas APIs; adaptar apenas as fronteiras existentes ao contrato v3.1.

## Execução
- [ ] Salvar o frontend, relatórios, evidências demonstrativas e o par DBML/instruções v3.1 em commit local.
- [ ] Incorporar origin/main (inclui origin/Dev), resolver conflitos sem sobrescrever trabalhos e revisar integrações.
- [ ] Validar TypeScript, suite de testes, lint focado, build, auditoria DBML e fluxos afetados no navegador.
- [ ] Publicar Dev, criar PR para main, acompanhar checks e concluir merge.

## Contrato e aceite
Tabelas diretamente afetadas: segurados, oportunidades, profiles, filiais, tenants e relações consumidas pelos adapters existentes. Fontes: DBML/instruções v3.1, macro-plano e micro-planos de reconciliação/nulabilidade. Decisão de legado: refatorar no lugar, preservar modos mock/API remotos; dados incompletos não ganham valores inventados. Nenhuma configuração de ambiente local será substituída por arquivos de exemplo.

Arquivos prováveis: useSegurados, useOportunidades, adapter comercial, backendDomainApi e testes. O backend mantém responsabilidade por persistência, validação, autorização e isolamento; compatibilidade de DTO fica explícita na fronteira do frontend. database.ts deve continuar aderente ao DBML.

## Evidências
Validações anteriores reutilizadas apenas para o checkpoint de segurança: TypeScript/build aprovados, 295 testes e 34 focados posteriores, lint sem novas ocorrências. Após conciliação, os gates afetados serão executados novamente.
