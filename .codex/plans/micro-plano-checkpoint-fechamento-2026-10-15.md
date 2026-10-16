# Checkpoint e fechamento — 15/10/2026

Escopo governado/documental solicitado pelo usuário: atualizar os repositórios,
conferir a entrega do Renato e consolidar situação e walkthrough de fechamento.
Sem alteração de UI, hook, adapter, contrato, configuração ou banco.

## Referências e decisão de legado

Instruções e DBML v3.1; macro-plano e micro-plano de integração das telas de
14/10 lidos. Reutilizar as telas/regras existentes, substituindo persistência
demonstrativa por comandos/querys canônicos em recortes posteriores. Não abrir
o gateway de tabelas como atalho de integração. `database.ts` não foi alterado;
esta rodada não constitui uma nova auditoria integral das suas 68 tabelas.

Base funcional FE: `2e01c14`, `codex/calculation-screen-integration`, PR #57.
Base funcional BE: `5691a2a`, `codex/calculation-screen-support`, PR #37.
Fetch e pull fast-forward concluídos. Main continua FE `c1da8cd` / BE `851f1d2`.
Todos os PRs incrementais FE #53–57 e BE #34–37 permanecem abertos em rascunho.

## Evidências e resultado

- [x] Conferir remotos, branches, SHAs, PRs, dependências e árvores limpas.
- [x] Verificar CI do código BE `5691a2a`: 169 testes e demais gates aprovados.
  https://github.com/Wassis-ERP/WAssisBE/actions/runs/38625978541
- [x] Verificar CI do código FE `2e01c14`: lint, testes, audit, build,
  smoke compilado e imagem/scan aprovados.
  https://github.com/Wassis-ERP/WassisCRM/actions/runs/38626879591
- [x] Revisar evidência registrada: 395 testes FE, jornada real BE+CRM 2/2 e
  capturas desktop 1440×900/100%; origem no micro-plano de 14/10 e PR #57.
  Navegador/IdP real não foram reexecutados neste checkpoint.
- [x] Confrontar allowlist de rotas, adapters, guardas de memória, contratos
  Auto/MANUAL e mapas de persistência do BE com as declarações dos planos.
- [x] Consolidar análise e walkthrough no BE:
  `docs/checkpoint-fechamento-2026-10-15.md`.
- [x] Atualizar macro-plano e revisar diff documental. Reaproveitar gates do código
  sem repetir TypeScript/Vitest/build sobre alterações somente documentais.

## Próximos recortes recomendados

1. Consolidar a cadeia BE #34→37 e FE #53→57 em versões coerentes para main/HML.
   Aguardar validação da integração resultante; CRM main pode acionar redeploy.
2. Configuração mínima autossuficiente: acesso à área administrativa somente nos
   recortes prontos, catálogos/funis necessários, perfis e ciclo real do usuário.
3. Resultado manual Auto → formalização explícita → proposta/apólice/item/CTI;
   preservar snapshots e autoria. PDF comercial pode ser recorte independente.
4. Agendas, conciliação, baixas/estornos, repasses e recibos persistidos.
5. Completar funções transversais, cobrança, sinistros, pós-venda e indicadores.
6. Seguradoras/OCR por integração comprovada, com orçamento e recuperação.

O shell atual permite Segurados/Oportunidades e as rotas de cálculo/comparativo;
`/configuracoes`, propostas/apólices, financeiro e atendimento seguem bloqueados.
APIs administrativas existentes não equivalem a todas as telas liberadas.
`policies.policy_drafts` e `financial.*` existentes no BE não comprovam os
agregados canônicos completos do DBML. Marcação antiga de frontend entregue
não deve ser lida como SaaS/ERP inteiro pronto.

O próximo micro-plano funcional deve especificar entidades/campos/operações,
autorização e teste gravar→recarregar→reabrir. Design permanece com Renato e
deve seguir a skill exigida pelo AGENTS.md. Nada foi modificado nas telas.
Não houve merge, deploy ou migration compartilhada. O walkthrough completo e
os gates operacionais estão no documento central do BE.
