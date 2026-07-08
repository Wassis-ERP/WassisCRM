---
target: Configurações V2 - comentários UI
total_score: 28
p0_count: 0
p1_count: 1
timestamp: 2026-07-07T12-18-59Z
slug: nexus-crm-src-pages-settingspage-tsx
---
Method: dual-agent (A: 019f3c7a-a9fc-7372-99f8-adef507bf56e · B: 019f3c7a-d5b8-7c12-b865-0cf55b9a9e71)

## Design Health Score

| # | Heurística | Score | Ponto-chave |
|---|---:|---:|---|
| 1 | Visibilidade do status | 3 | Estados de loading/erro e botões disabled estão claros nos cadastros. |
| 2 | Correspondência com mundo real | 3 | Campos V2 de seguros/financeiro aparecem com linguagem operacional; repasse ainda precisa explicar melhor a cascata. |
| 3 | Controle e liberdade | 3 | Voltar ao hub, limpar/cancelar edição e confirmações internas funcionam. |
| 4 | Consistência e padrões | 3 | Submenus no corpo e cards/tabelas ficaram mais consistentes; algumas listagens ainda são div-grids. |
| 5 | Prevenção de erros | 3 | Chave estável agora é obrigatória e única por entidade; destrutivas usam confirmador interno. |
| 6 | Reconhecimento em vez de memória | 3 | Hub pesquisável e grupos ajudam; falta navegação rápida entre cadastros quando já dentro de uma aba. |
| 7 | Flexibilidade e eficiência | 2 | Busca existe por cadastro, mas sem ações em massa/simulador de regra. |
| 8 | Estética e minimalismo | 3 | Visual segue W.Assis, sem slop automático; formulários densos foram compactados onde havia excesso. |
| 9 | Recuperação de erros | 3 | Erros aparecem próximos ao formulário e sem diálogo nativo. |
| 10 | Ajuda e documentação | 2 | Há copy contextual em pontos críticos, mas repasse e permissões ainda pedem explicação mais orientada. |
| **Total** |  | **28/40** | **Bom: V2 já operacional, com riscos restantes em repasse/cascata e navegação interna.** |

## Anti-Patterns Verdict

**Parece IA?** Não como slop visual. Detector local retornou `[]`; não há gradiente decorativo, glassmorphism, hover-only crítico ou diálogo nativo.

**LLM assessment:** a tela evoluiu de gaveta única para cockpit de configurações. O risco restante é densidade administrativa: em especial repasse financeiro ainda parece formulário plano para uma regra que deveria comunicar cascata/especificidade.

**Deterministic scan:** `node .agents/skills/impeccable/scripts/detect.mjs --json ...` retornou `[]`.

**Browser evidence:** validação no in-app Browser em `localhost:3000` confirmou sem overflow horizontal em Campos Personalizados, Financeiro Configurável, Seguradoras, Ramos e Coberturas; sem diálogo JS nativo detectado.

## O Que Foi Corrigido Nesta Passada

- Cabeçalho das subtelas ficou menor e mais compatível com UI operacional, apesar do `h1` global do design system.
- Campos Personalizados ganhou divulgação progressiva para validação/exibição/ajuda, reduzindo formulário infinito no primeiro contato.
- Chave estável passou a ser exigida na UI e validada contra duplicidade por entidade, alinhada ao índice `(tenant_id, entidade_tipo, chave)`.
- Grades densas de Campos, Financeiro, Ramos, Coberturas e catálogos passaram de `lg` para `xl`, evitando overflow em desktop com sidebar.
- Listas críticas receberam `minmax(0, ...)` para reduzir risco de ações cortadas.
- Labels abreviadas foram trocadas por `Tamanho máximo` e `Dias após vencimento`.
- Mudança de aba agora reseta scroll para o topo.

## Problemas Restantes

**[P1] Regras de repasse ainda precisam expressar cascata**

Por que importa: o V2 fala em regra mais específica vencendo. A UI ainda usa prioridade e lista plana, o que pode confundir gestor.

Correção: adicionar resumo de especificidade por regra e, depois, simulador simples de “qual regra vence”.

**[P2] Navegação interna ainda poderia acelerar alternância entre cadastros**

Por que importa: depois que o usuário entra em uma aba, voltar ao hub é o caminho principal para trocar de cadastro.

Correção: adicionar uma faixa compacta de cadastros irmãos do grupo atual ou breadcrumbs com menu.

**[P2] Listagens são visualmente tabela, mas semanticamente grids**

Por que importa: no mobile e leitor de tela, alguns valores perdem rótulo explícito.

Correção: adicionar rótulos compactos no mobile ou migrar listagens densas para tabela semântica responsiva.

## Persona Red Flags

**Alex, gestor/power user:** consegue operar, mas ainda sente falta de simulador de repasse e troca rápida entre cadastros relacionados.

**Sam, teclado/acessibilidade:** ações estão visíveis e nomeadas, mas as listas em div-grid ainda não dão a mesma semântica de tabela.

**Gestor de corretora:** campos V2 aparecem, mas regras financeiras precisam deixar impacto operacional mais evidente.

## Perguntas Para Considerar

- Repasse deve ser editado como tabela plana, árvore de especificidade ou tabela + simulador?
- Ao entrar em Seguradoras, o usuário deve ver primeiro cadastro ou lista? Em viewport estreita, hoje o formulário vem antes.
- O hub precisa de favoritos/recentes para cadastros mais usados?
