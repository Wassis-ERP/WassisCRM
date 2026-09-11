# Reconciliação frontend × DBML — 11/09/2026

Escopo governado/contratual autorizado pelo usuário: aplicar as recomendações dos 11 pontos do painel visual. Frontend/mock e contrato documental; sem backend, SQL, migrations, alterações de configuração, commit ou publicação.

## Fontes e legado
- Par vigente inicial v3.0, revisão técnica de 10/09, painel visual e macro-plano.
- Preservar o trabalho local anterior de multicalculo, propostas e PDF.
- Refatorar plataforma/cadastros no lugar; converter aliases explicitamente e manter a identidade de autenticação em sua fronteira própria.
- Mercado: referências locais Quiver/SegFy de cadastro, produtores e acesso; o DBML prevalece.
- Design: wassis-design e impeccable, estendendo as telas existentes sem redesenho.

## Entidades e decisões
- tenants, filiais, profiles, perfis, profile_filiais, role_permissions, produtores, segurados e pessoa_contato: completar representação tipada e defaults nulos explícitos para dados desconhecidos; integrar tipos de plataforma em Database.Tables.
- Preservar validações de negócio justificadas apesar da nulabilidade estrutural. FKs raiz obrigatórias não aceitam null; verificar coerência grupo/corretora antes de mutar.
- Permissões: seis ações independentes; escopo GRUPO/CORRETORA/PROPRIO; simulação no mock com contexto de registro quando necessário. Backend recebe enforcement e resolução definitiva de autoria/responsável por módulo.
- Acesso: ativo + período inclusivo por corretora, datas vazias sem limite; estado do usuário independente do login; inativação preserva vínculo/histórico. Convite no mock não envia mensagem externa.
- Produtores: dados operacionais PF/PJ, favorecido/conta/imposto; nenhuma nova fórmula tributária automática.
- Contatos PJ com ou sem PF, dados próprios prevalecem no contato; vínculo entre pessoas somente da mesma corretora.
- Campos opcionais classificados entre UI atual, técnico/serviço e preservado no contrato para evolução. Não criar tela de integracao_logs.
- Par v3.1 aditivo: chassi_remarcado nullable em calc_auto; comentário e regra documentados para cinco cotações. v3.0 permanece histórico.

## Execução
- [x] Contrato, tipos, aliases, defaults e vínculos obrigatórios.
- [x] Permissões e ciclo de acesso: domínio, hooks e UI, testes.
- [x] Cadastros e contatos: preservação, formulários e testes.
- [x] Auditoria final e documentação/hand-off; atualizar painel com resultados reais.
- [x] TypeScript, Vitest completo, ESLint focado, build e jornadas no navegador.

## Critérios de aceite / hand-off
- Nenhuma coluna do domínio aplicado ausente por esquecimento; ausências técnicas e nulabilidade remanescente classificadas.
- Escritas sem grupo/corretora ou com vínculos cruzados não deixam mutação parcial.
- Acesso inativo/fora de vigência não é usado pela simulação; seis ações e escopos persistem; testes com duas corretoras e contexto próprio.
- Cadastros preservam campos opcionais em atualização parcial; contato sem PF e produtor PF/PJ exercitados.
- Relatório de endpoints consolidado no recorte reconciliado com operações, lookups, validações e responsabilidades de serviço; demais fases mantêm seus limites explícitos.

## Conclusão e validações — 11/09/2026

- TypeScript: `node node_modules/typescript/bin/tsc -b` aprovado depois das últimas alterações.
- Vitest completo: 42 arquivos, 282 testes aprovados, `--maxWorkers=2`. Após ajuste de data local e separação de canais próprios/herdados, 14 testes dos dois domínios afetados aprovados.
- ESLint focado no diff e arquivos novos: 32 ocorrências legadas em três arquivos (18 any em inMemoryQueryBuilder, 8 any em useEntityTabsState.test, 5 any + 1 argumento não usado em supabase); comparação com HEAD documentada, sem nova dívida. Últimos sete arquivos ajustados passaram no lint focado.
- Build de produção Vite aprovado; aviso conhecido de chunks acima de 500 kB, sem alteração de configuração.
- Browser em zoom 100%, desktop 1440×1000 e mobile 390×844: produtor PF/PJ e favorecido/imposto, perfil personalizado/matriz/escopo, ativação/vigência/inativação preservada, contato sem PF e com PF, edição de contato, identidade do membro, celular/WhatsApp separados e smoke comercial. Tema escuro e filtros do painel verificados.
- Evidências: `output/reconciliacao/qa-partial.json`, `qa-contacts.json`, `qa-final.json` e screenshots na mesma pasta; logs e baseline de lint em `.codex/tmp`.
- Auditoria atual: 68 tabelas / 1.164 colunas; 67 tabelas do front compatíveis em nomes e tipos escalares; zero colunas ausentes/extras; integracao_logs técnico; 87 nulabilidades mais restritas no front e zero FK obrigatória aceita como nula. `database.ts` alinhado ao par v3.1 no recorte, incluindo RPC de equipe.
- Hand-off do recorte 0.1–0.3 e nota comercial consolidados em `relatorio-endpoints-campos.md`; relatório original preservado; resultado atual em `resultado-reconciliacao-front-2026-09-11.md` e painel atualizado.
- Limites: autorização do backend e log técnico futuros; campos opcionais sem UI classificados no resultado; nulabilidade aplicada não foi relaxada sem necessidade operacional. Nenhuma configuração alterada nesta reconciliação. Trabalho anterior preservado, sem commit/push.
- Verificação adicional no navegador: editar cargo de contato vinculado à PF preserva email/telefone/celular próprios nulos; evidência `output/reconciliacao/qa-inheritance.json`. Diff final sem erros de whitespace.
