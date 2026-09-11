# G1 — Relatorio unico de Endpoints & Campos

> **Estado reconciliado em 11/09/2026:** consolidação ampla autorizada e concluída no [relatório raiz](../../relatorio-endpoints-campos.md), cobrindo a V1 e inventário de 68 tabelas/1.164 colunas. Menções abaixo a snapshot parcial e hand-off futuro preservam a decisão histórica de julho, atendida nesta rodada.

## Objetivo

Consolidar os hand-offs historicos de endpoints e campos ja emitidos em um
arquivo unico, mantendo os documentos separados como fonte historica.
Em 2026-07-08, o arquivo unico foi movido para a raiz do projeto para ser
versionado no GitHub.

Decisao posterior de 2026-07-10: o arquivo atual permanece como snapshot parcial
e nao sera atualizado a cada tela. A proxima consolidacao ampla acontece quando
telas e contratos estiverem estabilizados, antes do hand-off ao backend, ou por
pedido explicito do usuario.

## Tabelas DBML envolvidas

- `filiais`
- `profiles`
- `perfis`
- `profile_filiais`
- `role_permissions`
- `segurados`
- `pessoa_contato`
- `produtores`
- `oportunidades`
- `audit_logs`

## Legado atual

- Decisao: manter temporariamente.
- Os relatorios separados de 0.1, 0.2 e 0.3 continuam validos como historico.
- O macro plano agora aponta para `relatorio-endpoints-campos.md` na raiz como
  destino operacional e versionavel para novos hand-offs.

## Arquivos provaveis

- `relatorio-endpoints-campos.md`
- `.codex/plans/macro_plano.md`

## Mock/tipos necessarios

Nao ha alteracao de mock, tipo, hook, adapter ou tela. Esta tarefa e apenas de
governanca documental.

## UX/fluxo esperado

Sem impacto direto na UI.

## Regras e validacoes

- Preservar o escopo frontend puro: backend aparece apenas como contrato esperado.
- Nao criar ou atualizar hand-off sem autorizacao explicita do usuario.
- Manter `.codex/artefatos/endpoints` como historico/anexo de relatorios antigos.

## Impacto no Relatorio de Endpoints & Campos

Criou o arquivo unico com as fases autorizadas. Em 2026-07-08, G8 e 0.5 tambem
foram consolidados no arquivo raiz; as fases seguintes aguardam a consolidacao
final.

## Criterios de aceite

- Arquivo unico versionavel mantido em `relatorio-endpoints-campos.md`.
- Relatorios historicos 0.1, 0.2 e 0.3 referenciados.
- Macro plano marca G1 como concluido e aponta para o micro-plano.

## Verificacao

- Leitura direta dos arquivos criados/alterados.
- Sem build/testes, pois nao ha alteracao de codigo.
