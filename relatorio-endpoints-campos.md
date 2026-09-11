# Relatório consolidado de Endpoints & Campos — Frontend V1 do WassisCRM

> Contrato de referencia: `.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml` e
> `.codex/artefatos/instrucoes_projeto_wassis_v3_1.md`.
>
> Consolidado em **11/09/2026**, por autorização do usuário, sobre o código
> `6059e829da9793d2d7ff584e4ef24ab711ba39c2`. Substitui o snapshot parcial para
> o escopo entregue da primeira versão do frontend. Não altera o DBML v3.1.
> Backend, persistência, APIs novas, SQL, migrations e enforcement pertencem à
> equipe de backend. A integração HTTP legada existente é delimitada na seção 7.

## Como usar este hand-off

- As seções 0–6 descrevem entidades, operações, filtros, lookups e regras do produto entregue no frontend/mock. A seção 7 distingue a API existente; a seção 8 registra adiamentos e a seção 9 reúne evidências.
- Os caminhos HTTP das seções funcionais são **propostas para a implementação**, relativos a uma base a definir. Não são uma especificação OpenAPI nem afirmam que os endpoints já existem. A equipe de backend pode agrupá-los em comandos tipados preservando a semântica descrita.
- O inventário ao final cobre **68 tabelas e 1.164 colunas**, com tipos, nulabilidade e FKs do DBML. As 67 tabelas tipadas no frontend não implicam 67 telas nem edição de todos os campos. `integracao_logs` é exclusivamente técnico.
- Para campos opcionais de cadastros, consultar também a [matriz UI / preservado / serviço](resultado-reconciliacao-front-2026-09-11.md). Campos fiscais, metadados de processo e autoria não ganham edição livre por estarem no schema.
- Os microplanos preservam decisões e evidências históricas. Para o estado atual, este relatório, o [macroplano](.codex/plans/macro_plano.md) e o [registro de encerramento](aceite-frontend-v1-2026-09-11.md) prevalecem sobre afirmações antigas de hand-off pendente, limite de três cotações ou módulos ainda legados.

## Convenções comuns de leitura, escrita e autorização

1. **Escopo:** GRUPO = `tenants`; CORRETORA = `filiais`. O backend resolve a identidade e os vínculos vigentes, valida a corretora e deriva o escopo dos filhos pela cadeia de FKs. Filtrar no navegador não garante isolamento. Não adicionar `tenant_id`, `filial_id` ou `pipeline_id` redundantes a filhos do contrato.
2. **Leituras:** paginação, ordenação estável e total quando exigido pela tela. Filtros de corretora, período, status, responsável e busca são composições autorizadas, não novos campos persistidos. Agregações respeitam os mesmos filtros da listagem. IDs de registros inativos continuam resolvíveis no histórico.
3. **Escritas:** aceitar somente campos autorizados por ação; atualização parcial preserva campos omitidos. `null` explícito só limpa campos permitidos pelo schema e pelo estado do fluxo. A nulabilidade de leitura não dispensa obrigatoriedade no formulário/ação.
4. **Valores:** datas de negócio em `date`, instantes em `timestamptz`; aplicar calendário/fuso da filial. CPF/CNPJ normalizados. `numeric` exige precisão decimal e arredondamento monetário consistente; a serialização definitiva do DTO será acordada com o backend. IDs semânticos das fixtures não definem o formato de IDs da API.
5. **Comandos:** revalidar elegibilidade, ownership e versão corrente; chave idempotente retorna o mesmo resultado para a mesma intenção e conflito para conteúdo diferente. Transação, concorrência e rollback reais são do backend. O rollback demonstrativo em memória não substitui essas garantias.
6. **Erros:** distinguir validação por campo, registro ausente, falta de permissão, conflito de estado/duplicidade e indisponibilidade de serviço. Preservar o rascunho no front; retornar mensagens seguras e resultado por unidade nos lotes. Não confirmar sucesso descartando campos incompatíveis.
7. **Auditoria:** operações sensíveis e edições geram registros imutáveis por campo, com autoria/tempo do servidor. `atividades` registra autoria humana; `audit_logs` registra fatos técnicos; somente a leitura da timeline os combina.
8. **Contrato:** sem JSON de negócio ou EAV genérico. EAV tipado é restrito aos campos personalizados. JSON como transporte HTTP não autoriza coluna JSON de domínio. Dados cru de integração ficam em TEXT técnico protegido, fora das telas de negócio.
9. **Permissões:** autorizar cada leitura, escrita, exportação e gerenciamento; as seis ações e os escopos da matriz não são intercambiáveis. A simulação de permissões do front não implementa RLS/RBAC de servidor.

## Historico consolidado

Os documentos abaixo permanecem como fonte historica detalhada:

- `.codex/artefatos/endpoints/0.1-plataforma-corretoras.md`
- `.codex/artefatos/endpoints/0.2-produtores.md`
- `.codex/artefatos/endpoints/0.3-segurados.md`

## Status por fase

| Fase | Modulo | Status neste relatorio |
|---|---|---|
| 0.1 | Plataforma multi-corretora | Reconciliado v3.1 em 11/09/2026 |
| 0.2 | Produtores | Reconciliado v3.1 em 11/09/2026 |
| 0.3 | Segurados | Reconciliado v3.1 em 11/09/2026 |
| 0.4a | Ramos reconciliados | Absorvido pela consolidacao G8 |
| 0.4b | Catalogos auxiliares | Absorvido pela consolidacao G8 |
| G8 | Configuracoes V2 como hub de cadastros | Consolidado em 2026-07-08 |
| 0.5 | Funis & Etapas reconciliados | Consolidado em 2026-07-08 |
| 1.1 | Campos personalizados EAV tipado | Consolidado na seção 1 |
| 1.2a-1.2d | Guias, atividades, timeline e notificacoes | Consolidado na seção 1 |
| 2.1–2.9b | Contratos, documentos, importação, riscos e agendas | Consolidado na seção 2 |
| 3.1–3.6 e 3.4R-A | Financeiro securitário | Consolidado na seção 3 |
| 4.1a–4.1c | Sinistros | Consolidado na seção 4 |
| 4.2 | Pós-venda | Consolidado na seção 5 |
| 6.2–6.5R e finalização de setembro | Comercial e multicálculo | Consolidado na seção 6 |
| 5, 6.6, 3.4R-B e G9 | Evoluções adiadas | Mantidas na seção 8 |

---

## Reconciliação de 11/09/2026 — referência v3.1

Os blocos 0.1–0.3 substituem os snapshots anteriores para plataforma e cadastros. As demais fases foram consolidadas nesta rodada documental. O inventário completo é contratual: não significa que todos os campos sejam editáveis na interface. A classificação UI / preservado / serviço está no [resultado da reconciliação](resultado-reconciliacao-front-2026-09-11.md).

## 0.1 — Plataforma multi-corretora

### Campos canônicos

#### `tenants`

`id`, `razao_social`, `nome_fantasia`, `cnpj_cpf`, `slug`, `email`, `telefone`, `celular`, `home_page`, `cep`, `endereco`, `numero`, `complemento`, `bairro`, `cidade`, `uf`, `pais`, `timezone`, `moeda_padrao`, `status`, `ativo`, `criado_em`, `atualizado_em`.

#### `filiais`

`id`, `tenant_id`, `matriz_id`, `razao_social`, `fantasia`, `cnpj_cpf`, `susep`, `percentual_imposto`, `lgpd_aceito`, `lgpd_aceito_em`, `gerente`, `gerente_id`, `contato`, `home_page`, `email`, `telefone`, `celular`, `telefone2`, `inscricao_estadual`, `inscricao_municipal`, `regime_tributario`, `percentual_iss`, `codigo_corretora`, `codigo_externo`, `municipio_ibge`, `pais`, `horario_atendimento`, `observacoes`, `cep`, `endereco`, `numero`, `complemento`, `bairro`, `cidade`, `uf`, `ativo`.

#### `profiles`

`id`, `tenant_id`, `nome_completo`, `email`, `telefone`, `celular`, `cargo`, `departamento`, `avatar_url`, `status`, `ativo`, `ultimo_acesso_em`, `convite_status`, `convite_enviado_em`.

#### `perfis`

`id`, `tenant_id`, `nome`, `descricao`, `sistema`, `nivel_acesso`, `ordem`, `ativo`.

#### `profile_filiais`

`id`, `profile_id`, `filial_id`, `perfil_id`, `principal`, `ativo`, `data_inicio`, `data_fim`.

#### `role_permissions`

`id`, `perfil_id`, `modulo`, `escopo`, `can_read`, `can_create`, `can_update`, `can_delete`, `can_export`, `can_manage`.

### Operações, filtros e lookups esperados

| Operação | Contrato esperado | Regras e filtros |
|---|---|---|
| Consultar grupo | GET /tenants/:id | Identidade e estado institucional; grupo derivado da sessão no serviço. |
| Listar/criar/editar/inativar corretora | GET/POST /filiais; PATCH /filiais/:id | tenant, ativo, busca por nome/documento, ordem razão social; matriz e gerente do mesmo grupo. |
| Listar equipe | GET /equipe (mock: get_team_members) | Grupo obrigatório; nome, email, avatar, ativo/status/convite e quantidade/perfil das corretoras elegíveis. Não retorna created_at inexistente. |
| Convidar ou reenviar convite | POST /convites | Email/nome e grupo; serviço cria identidade e controla PENDENTE/ACEITO/CANCELADO e convite_enviado_em. Mock apenas simula, sem email externo. |
| Atualizar perfil / ativar / inativar | PATCH /profiles/:id | Estado ATIVO/INATIVO coerente com ativo; serviço mantém metadados de último acesso. |
| Listar/criar/renomear/inativar perfil | GET/POST /perfis; PATCH /perfis/:id | tenant, ativo e ordem; nome único no grupo para perfis ativos; perfis de sistema protegidos. |
| Consultar/editar matriz | GET /role_permissions?perfil_id=:id; PATCH /role_permissions/:id | modulo canônico, seis ações independentes e escopo; único perfil + módulo. |
| Vincular/editar/inativar acesso | GET/POST /profile_filiais; PATCH /profile_filiais/:id | profile, filial e perfil; ativo, principal, data_inicio, data_fim. Inativação preserva a linha. |

### Validação e autorização no serviço

- IDs raiz obrigatórios nunca nulos. Usuário, perfil, produtor e corretora referenciados devem existir e pertencer ao mesmo grupo; corretora operacional e perfil ativos ao conceder acesso ativo. Escritas em lote são atômicas.
- Usuário elegível exige ativo=true e status=ATIVO. Vínculo exige ativo=true e período inclusivo válido; datas vazias não impõem limite. Datas inválidas e fim anterior ao início são recusados. Reavaliar vigência no fuso de negócio definido pelo serviço.
- Único vínculo por usuário/corretora. No máximo um principal; troca e inativação não apagam histórico. Novo principal deve estar elegível na data da operação.
- Seis ações: can_read, can_create, can_update, can_delete, can_export, can_manage. Gerenciar não concede CRUD/exportar implicitamente. nivel_acesso é classificação descritiva, sem herança automática.
- GRUPO alcança apenas corretoras autorizadas do grupo; CORRETORA exige o vínculo da corretora do registro; PROPRIO exige autoria/responsabilidade resolvida por módulo. O backend aplica todas as ações, filtros, exportações e administração. Navegação habilitada no front não concede acesso irrestrito a registros.
- Filiais: unicidade de documento por grupo, no máximo uma matriz; impedir auto-referência, ciclos e cadeias. Pessoas, oportunidades e demais registros operacionais carregam filial_id.
- PATCH preserva campos omitidos e distingue null explícito de ausência. Tipos canônicos eliminam full_name/phone/module e timestamps não previstos; a API de identidade possui conversão própria.
- Administração institucional do tenant, convites, auditoria e integracao_logs são responsabilidades do serviço. Não há implementação de backend neste repositório.

## 0.2 — Produtores

### Campos canônicos

#### `produtores`

`id`, `tenant_id`, `profile_id`, `nome`, `cpf_cnpj`, `tipo_pessoa`, `nome_fantasia`, `rg_ie`, `susep`, `categoria_operacional`, `data_nascimento`, `email`, `telefone`, `celular`, `telefone2`, `cep`, `endereco`, `numero`, `complemento`, `bairro`, `cidade`, `uf`, `pais`, `banco`, `agencia`, `conta`, `tipo_conta`, `chave_pix`, `favorecido_nome`, `favorecido_cpf_cnpj`, `descontar_imposto`, `percentual_imposto`, `percentual_repasse_padrao`, `observacoes`, `ativo`.

### Operações e regras

| Operação | Contrato esperado | Regras e filtros |
|---|---|---|
| Listar e consultar | GET /produtores; GET /produtores/:id | tenant, ativo, nome/documento, profile_id; ordem nome. |
| Criar | POST /produtores | Nome e grupo obrigatórios; profile_id opcional diferencia vínculo interno. |
| Editar/inativar | PATCH /produtores/:id | Preservar campos omitidos; inativação não reescreve histórico financeiro. |
| Lookups | GET /profiles; catálogos bancários existentes | Membro do mesmo grupo, sem duplicar vínculo já usado por produtor. |

Formulário em página dedicada contempla PF/PJ, nome fantasia, RG/IE, SUSEP, categoria, nascimento PF, canais, endereço, banco/agência/conta/Pix, tipo de conta, favorecido, imposto e observações. CPF/CNPJ e documento do favorecido são normalizados. Percentuais aceitam 0–100; descontar_imposto exige percentual informado. Dados fiscais não geram cálculo automático novo.

percentual_repasse_padrao é preservado como legado; regras financeiras normalizadas continuam a fonte operacional. Comissão e repasse permanecem distintos. segurados.produtor_id/gerente_id e filiais.gerente_id referenciam produtores do mesmo grupo. Serviço controla unicidade e auditoria, sem confiar na UI.

## 0.3 — Segurados e contatos empresariais

### Campos canônicos

#### `segurados`

`id`, `tenant_id`, `filial_id`, `produtor_id`, `gerente_id`, `cpf_cnpj`, `tipo`, `nome`, `nome_fantasia`, `status`, `lgpd_autorizado`, `email`, `telefone`, `chatwoot_id`, `cep`, `logradouro`, `endereco`, `numero`, `complemento`, `bairro`, `cidade`, `estado`, `data_nascimento`, `sexo`, `estado_civil`, `cnae`, `porte`, `site`, `observacoes`, `created_at`, `updated_at`, `nome_social`, `rg_ie`, `inscricao_municipal`, `atividade_economica`, `profissao`, `renda_mensal`, `cnh_numero`, `cnh_categoria`, `cnh_vencimento`, `celular`, `telefone2`, `whatsapp`, `pais`, `lgpd_autorizado_em`, `origem_importacao`.

#### `pessoa_contato`

`id`, `pj_id`, `pf_id`, `nome`, `cargo`, `departamento`, `email`, `telefone`, `celular`, `principal`, `ativo`, `observacoes`.

### Operações e regras

| Operação | Contrato esperado | Regras e filtros |
|---|---|---|
| Listar/consultar pessoas | GET /segurados; GET /segurados/:id | tenant/corretoras autorizadas, nome/documento, PF/PJ, status, produtor e gerente. |
| Criar/editar pessoa | POST /segurados; PATCH /segurados/:id | tenant e filial obrigatórios/coerentes; nome; documento normalizado e unicidade por corretora (`filial_id + cpf_cnpj`). Prospecto admite documento ausente no contrato; fluxos podem exigir conforme estado. |
| Listar contatos da empresa / empresas da PF | GET /pessoa_contato?pj_id=:id ou pf_id=:id | Escopo herdado da PJ; filtro ativo/principal quando solicitado. |
| Criar/editar contato | POST /pessoa_contato; PATCH /pessoa_contato/:id | PJ obrigatória, PF opcional; nome próprio obrigatório sem PF. PJ/PF do mesmo grupo e corretora. |
| Inativar contato | PATCH /pessoa_contato/:id {ativo:false} | Preserva dados e retira principal. Exclusão curta existente no mock precisa política de histórico definida no backend. |
| Excluir vínculo quando permitido | DELETE /pessoa_contato/:id | Serviço valida autorização, referências e política de auditoria. |

Contato possui nome/cargo/departamento/canais/observações próprios. A leitura usa dados próprios e fallback da PF quando o campo é nulo; a edição preserva essa distinção. A mesma PF não é duplicada entre contatos ativos da mesma PJ. Troca do principal e validações são atômicas; edição não transfere silenciosamente o contato para outra empresa. pessoa_contato não possui tenant_id nem created_at: escopo deriva da PJ.

Segurado preserva campos opcionais não editados. Celular e WhatsApp agora são separados do telefone. created_by não faz parte da tabela: autoria é responsabilidade de auditoria/serviço. LGPD e origem de importação devem ser mantidos pelos processos correspondentes. Nulabilidade do DBML não dispensa validações por fluxo/estado; a revisão posterior zerou as diferenças de nulabilidade dos tipos de leitura. Formulários e comandos preservam validações por estado/fluxo; o backend deve aceitar leituras incompletas e recusar escritas/transições sem dados necessários. Ver resultado-nulabilidade-2026-09-11.md.

## Nota comercial v3.1

- calc_auto.chassi_remarcado é boolean nullable: desconhecido permanece nulo.
- Apresentação/orçamento permite até cinco cotações. Backend deve repetir o limite e a coerência oportunidade → versão do cálculo → cotação → proposta.
- Origem escolhida acompanha proposta manual e importação de propostas no mock; não confundir proposta com contrato/documento/item nem implementar integração real de seguradora neste frontend.
- O hand-off comercial completo está consolidado na seção 6.

---

## G8 — Configuracoes V2 como hub de cadastros

### Entidades DBML

- `seguradoras`
- `origens`
- `motivos_perda`
- `ramos`
- `coberturas_catalogo`
- `recebimento_grades`
- `recebimento_grade_parcelas`
- `repasse_regras`
- `campo_definicoes`
- `campo_opcoes`

### Campos de negocio

#### `seguradoras`

- `id`
- `tenant_id`
- `nome`
- `nome_curto`
- `cnpj`
- `codigo_susep`
- `codigo_interno`
- `site`
- `portal_url`
- `telefone_sac`
- `telefone_assistencia`
- `email`
- `aceita_importacao_pdf`
- `aceita_busca_automatica`
- `ativo`
- `observacoes`

#### `origens`

- `id`
- `tenant_id`
- `nome`
- `tipo`
- `ordem`
- `ativo`

#### `motivos_perda`

- `id`
- `tenant_id`
- `nome`
- `categoria`
- `ordem`
- `ativo`

#### `ramos`

- `id`
- `tenant_id`
- `nome`
- `codigo_susep`
- `risk_type`
- `grupo_operacional`
- `forma_calculo`
- `is_monthly`
- `renovavel`
- `permite_endosso`
- `exige_item`
- `exige_coberturas`
- `ordem`
- `ativo`
- `observacoes`

#### `coberturas_catalogo`

- `id`
- `ramo_id`
- `codigo`
- `codigo_susep`
- `nome`
- `descricao`
- `tipo_cobertura`
- `caracteristica`
- `tipo_risco`
- `modalidade`
- `capital_lmi_padrao`
- `franquia_padrao`
- `carencia_dias`
- `obrigatoria`
- `ordem`
- `ativo`

#### `recebimento_grades`

- `id`
- `seguradora_id`
- `ramo_id`
- `nome`
- `tipo`
- `qtd_parcelas`
- `base_calculo`
- `percentual_default`
- `considera_iof`
- `considera_adicional_fracionamento`
- `vitalicio`
- `ativo`
- `observacoes`

#### `recebimento_grade_parcelas`

- `id`
- `grade_id`
- `numero`
- `tipo_comissao`
- `percentual`
- `percentual_sobre`
- `dias_apos_vencimento`
- `ativo`

#### `repasse_regras`

- `id`
- `tenant_id`
- `filial_id`
- `produtor_id`
- `ramo_id`
- `papel`
- `tipo_documento`
- `base`
- `percentual`
- `valor_fixo`
- `gatilho`
- `qtd_parcelas`
- `limite_parcelas`
- `prioridade`
- `inicio_vigencia`
- `fim_vigencia`
- `ativo`
- `observacoes`

#### `campo_definicoes`

- `id`
- `tenant_id`
- `filial_id`
- `entidade_tipo`
- `chave`
- `nome`
- `tipo_dado`
- `formato`
- `obrigatorio`
- `ativo`
- `ordem`
- `ajuda`
- `min_valor`
- `max_valor`
- `tamanho_max`
- `mascara`
- `placeholder`
- `agrupamento`
- `visivel_em_listagem`

#### `campo_opcoes`

- `id`
- `campo_definicao_id`
- `rotulo`
- `valor`
- `ordem`
- `ativo`

### Operacoes esperadas

| Entidade | Operacoes esperadas | Filtros/ordem |
|---|---|---|
| `seguradoras` | `GET /seguradoras`, `POST /seguradoras`, `PATCH /seguradoras/:id`, `PATCH /seguradoras/:id { ativo:false }` | `tenant_id`, `ativo`, busca por nome/CNPJ/SUSEP/codigo; ordem alfabetica |
| `origens` | `GET /origens`, `POST /origens`, `PATCH /origens/:id`, `PATCH /origens/:id { ativo:false }` | `tenant_id`, `ativo`, `tipo`, busca por nome; ordem alfabetica |
| `motivos_perda` | `GET /motivos_perda`, `POST /motivos_perda`, `PATCH /motivos_perda/:id`, `PATCH /motivos_perda/:id { ativo:false }` | `tenant_id`, `ativo`, `categoria`, busca por nome; ordem alfabetica |
| `ramos` | `GET /ramos`, `POST /ramos`, `PATCH /ramos/:id`, `PATCH /ramos/:id { ativo:false }` | `tenant_id`, `ativo`, `risk_type`, busca por nome/codigo; ordem alfabetica |
| `coberturas_catalogo` | `GET /coberturas_catalogo`, `POST /coberturas_catalogo`, `PATCH /coberturas_catalogo/:id`, `PATCH /coberturas_catalogo/:id { ativo:false }` | `ramo_id`, `ativo`, busca por nome/codigo; `ordem`, depois nome |
| `recebimento_grades` | `GET /recebimento_grades`, `POST /recebimento_grades`, `PATCH /recebimento_grades/:id`, `PATCH /recebimento_grades/:id { ativo:false }` | `seguradora_id`, `ramo_id`, `ativo`, busca por nome |
| `recebimento_grade_parcelas` | `GET /recebimento_grade_parcelas`, `POST /recebimento_grade_parcelas`, `PATCH /recebimento_grade_parcelas/:id`, `PATCH /recebimento_grade_parcelas/:id { ativo:false }` | `grade_id`, `ativo`, ordem por `numero` |
| `repasse_regras` | `GET /repasse_regras`, `POST /repasse_regras`, `PATCH /repasse_regras/:id`, `PATCH /repasse_regras/:id { ativo:false }` | `tenant_id`, `filial_id`, `produtor_id`, `ramo_id`, `papel`, `tipo_documento`, vigencia, `ativo`, `prioridade` |
| `campo_definicoes` | `GET /campo_definicoes`, `POST /campo_definicoes`, `PATCH /campo_definicoes/:id`, `PATCH /campo_definicoes/:id { ativo:false }` | `tenant_id`, `filial_id`, `entidade_tipo`, `ativo`, busca por nome/chave, `ordem` |
| `campo_opcoes` | `GET /campo_opcoes`, `POST /campo_opcoes`, `PATCH /campo_opcoes/:id`, `PATCH /campo_opcoes/:id { ativo:false }` | `campo_definicao_id`, `ativo`, `ordem` |

### Lookups esperados

- `GET /lookups/seguradoras?ativo=true` retorna dados leves para selects.
- `GET /lookups/ramos?ativo=true` retorna ramo, `risk_type` e flags relevantes.
- `GET /lookups/origens?ativo=true` e `GET /lookups/motivos_perda?ativo=true`
  retornam catalogos leves.
- `GET /lookups/coberturas_catalogo?ramo_id=:id&ativo=true` retorna coberturas
  disponiveis para o ramo.
- `GET /lookups/recebimento_grades?seguradora_id=:id&ramo_id=:id` retorna moldes
  de recebimento aplicaveis.
- `GET /lookups/campo_opcoes?campo_definicao_id=:id&ativo=true` retorna opcoes
  de campos personalizados.

### Regras de validacao e backend

- Todo cadastro de grupo deve ser isolado por `tenant_id`.
- `filial_id = NULL` em regras/campos significa padrao do grupo; preenchido
  significa regra/campo proprio da corretora.
- Backend deve aplicar RLS/RBAC e registrar auditoria real nas mutacoes.
- Inativacao e soft-disable; registros historicos continuam resolviveis.
- Campos de identificacao com potencial de unicidade devem ser normalizados
  quando aplicavel: CNPJ, codigo SUSEP, codigo interno e `campo_definicoes.chave`.
- `campo_definicoes` mantém a unicidade `tenant_id + entidade_tipo + chave`,
  conforme DBML; `filial_id` controla disponibilidade e não amplia essa chave.
- `campo_opcoes` pertence a uma `campo_definicao_id` do mesmo tenant.
- `coberturas_catalogo.ramo_id` deve pertencer ao mesmo tenant do ramo.
- Grades de recebimento devem validar `qtd_parcelas`, percentuais, base de
  calculo e consistencia entre parcelas ativas e grade ativa.
- Regras de repasse devem validar precedencia por especificidade, vigencia,
  `prioridade`, `papel`, `base`, `gatilho` e percentuais/valor fixo.
- Alterar configuracoes financeiras nao deve reescrever fatos financeiros ja
  gerados; fatos futuros devem aplicar a regra vigente no momento correto.

---

## 0.5 — Funis & Etapas reconciliados

### Entidades DBML

- `pipelines`
- `pipeline_stages`

### Campos de negocio

#### `pipelines`

- `id`
- `tenant_id`
- `filial_id`
- `nome`
- `entidade_tipo`
- `ativo`
- `ordem`
- `descricao`
- `modelo_fabrica`
- `permite_customizacao`

#### `pipeline_stages`

- `id`
- `pipeline_id`
- `nome`
- `cor`
- `ordem`
- `codigo`
- `tipo_stage`
- `probabilidade`
- `sla_dias`
- `finaliza_com_sucesso`
- `finaliza_com_perda`
- `ativo`

### Operacoes esperadas

| Operacao | Contrato esperado | Observacoes |
|---|---|---|
| Listar funis acessiveis | `GET /pipelines?entidade_tipo=:tipo&ativo=true` | Deve incluir modelos do grupo e funis proprios permitidos |
| Criar funil | `POST /pipelines` | Novo funil do front nasce `ativo=true`, `filial_id=NULL`, modelo do grupo |
| Editar funil | `PATCH /pipelines/:id` | Backend valida tenant, filial e tipo oficial |
| Arquivar funil | `PATCH /pipelines/:id { ativo:false }` | Soft-disable |
| Listar etapas | `GET /pipeline_stages?pipeline_id=:id&ativo=true&order=ordem` | Etapas sempre ordenadas por `ordem` |
| Criar etapa | `POST /pipeline_stages` | Exige `pipeline_id` valido e mesmo tenant |
| Editar etapa | `PATCH /pipeline_stages/:id` | Inclui sucesso/perda, probabilidade e SLA |
| Arquivar etapa | `PATCH /pipeline_stages/:id { ativo:false }` | Soft-disable |
| Reordenar etapas | `PATCH /pipeline_stages/reorder` | Endpoint em lote recomendado para drag and drop futuro |

### Filtros, lookups e escopo

- `pipelines.entidade_tipo` e o campo contratual do modulo do funil.
- Tipos oficiais hoje usados no front: `comercial`, `emissao`, `financeiro` e
  `sinistro`, com camada pequena de compatibilidade para nomes legados.
- O recorte 0.5 nao adicionou `pos_venda`. O modulo permanece no produto e sera
  reintroduzido/reconciliado nos funis durante a Fase 4.2.
- `filial_id = NULL` significa modelo do grupo e deve aparecer para qualquer
  corretora ativa.
- `filial_id` preenchido significa funil proprio da corretora e so deve aparecer
  para a corretora ativa correspondente, ou no modo "Todas as filiais" quando
  acessivel.
- Ordenacao esperada: funil proprio da corretora ativa, modelos do grupo e, em
  seguida, `ordem`/`nome`.

### Regras de validacao e backend

- Backend deve validar tenant, permissao administrativa e se `filial_id` pertence
  ao tenant.
- `pipeline_stages.pipeline_id` deve apontar para funil do mesmo tenant.
- Etapas terminais devem usar `finaliza_com_sucesso` e
  `finaliza_com_perda`; o front nao deve inferir por texto.
- `modelo_fabrica=true` e `permite_customizacao=false` devem limitar edicao no
  backend mesmo que o front esconda a acao.
- Os processos canônicos derivam o funil por `stage_id`. O `pipeline_id` do DTO
  HTTP legado fica restrito ao adapter, conforme a seção 7.
- Pós-venda foi reconciliado sobre `apolices` na Fase 4.2, consolidada na seção 5.

---

## 1 — Campos personalizados e guias transversais

**Entidades:** `campo_definicoes`, `campo_opcoes`, `campo_valores`, `campo_valor_opcoes`, `atividades`, `atividade_mencoes`, `anexos` e `audit_logs`. Definições/opções são administradas em Configurações; os valores são preenchidos no registro.

| Operação proposta | Entrada, filtros e resultado esperado |
|---|---|
| `GET /entidades/:tipo/:id/campos-personalizados` | Definições de grupo/corretora, opções e valores atuais, com ordem, obrigatoriedade e inativos históricos. |
| `PUT /entidades/:tipo/:id/campos-personalizados` | Conjunto tipado de valores e opções; substituir seleções múltiplas atomicamente e auditar alterações. |
| `GET/POST /entidades/:tipo/:id/atividades` | Listar/criar tarefas e observações; filtrar tipo, status, responsável, vencimento, fixação e período. |
| `PATCH /atividades/:id` | Editar conteúdo permitido, atribuição, vencimento, conclusão/reabertura e fixação, preservando autoria/auditoria. |
| `GET /entidades/:tipo/:id/timeline` | Leitura unificada de atividades e logs; filtrar origem/tipo e período; default de atividades/notas. |
| `GET /notificacoes` e `POST /mencoes/:id/marcar-lida` | Derivar de `atividade_mencoes` do usuário; filtros lida/não lida, origem e período; atualizar somente `lida_em` autorizado. |
| `GET/POST /entidades/:tipo/:id/anexos` | Metadados e vínculo de arquivo; upload real e confirmação de armazenamento dependem do serviço. |
| `GET /anexos/:id/download` e remoção autorizada | URL temporária e política de retenção; não expor caminho interno ou aceitar URL arbitrária como arquivo validado. |

**Campos e invariantes:** `entidade_tipo + entidade_id` identifica o destino; tipos congelados: `segurado`, `oportunidade`, `cotacao`, `apolice`, `proposta`, `apolice_item`, `sinistro`, `cobranca`, `pos_venda`. Cálculo, execução e apresentação não são módulos polimórficos nesta versão. Tipos técnicos de auditoria financeira não habilitam guias ou EAV.

`TEXTO_CURTO/TEXTO_LONGO → valor_texto`; `INTEIRO/DECIMAL → valor_numero`; `BOOLEANO → valor_booleano`; `DATA → valor_data`; `DATA_HORA → valor_datahora`; `LISTA_UNICA → valor_opcao_id`; `LISTA_MULTIPLA → campo_valor_opcoes`. O backend garante coerência com a definição, pertencimento das opções, unicidade do valor por registro/campo e ausência de valores em colunas incompatíveis. Ausência de linha significa não preenchido; habilitar obrigatoriedade não invalida retroativamente registros antigos.

Menções normalizadas são a fonte da notificação; texto não substitui `atividade_mencoes`. Validar acesso do destinatário ao registro. Logs são somente leitura; o serviço gera auditoria real. Anexos em mock não certificam armazenamento, antivírus, hash no servidor, retenção nem envio de e-mail/WhatsApp.

**Lookups:** definições por módulo e escopo; opções ativas do campo; usuários elegíveis por corretora; entidade de destino existente e autorizada. **Rastreabilidade:** planos 1.1 e 1.2a–1.2d, com consumidores nos módulos reconstruídos.

## 2 — Contratos, propostas, importação, riscos e agendas

**Entidades:** `apolices`, `propostas`, `apolice_itens`, `item_veiculo`, `item_imovel`, `item_empresa`, `item_vida`, `item_coberturas`, `endosso_subtipos`, `cancelamento_motivos`; agendas em `parcelas`, `comissoes`, `repasses`, com moldes de G8.

### Leituras, filtros e campos

| Operação proposta | Contrato esperado |
|---|---|
| `GET /producao` | Painel/árvore de contratos e documentos, equivalente à composição `vw_producao`; filtros corretora, segurado/documento, seguradora, ramo, tipo, status contratual, etapa, produtor, responsável e vigência. |
| `GET /apolices/:id` | Capa, segurado, seguradora, ramo, produtor, estado atual, documentos e cadeia de renovação, sem fundir as linhas persistidas. |
| `GET /apolices/:id/itens` | Itens e especialização por risco, com inclusão/exclusão documental e coberturas vigentes/históricas. |
| `GET /propostas/:id/agendas` | Três agendas separadas, origem do documento, grade aplicada, regras vencedoras e diagnóstico de fatos processados. |
| `PATCH /apolices/:id` e `PATCH /propostas/:id` | Edições independentes dos campos liberados por estado, com auditoria por campo e preservação de campos omitidos. |

Apólice é contrato e contém o estado da vigência. Proposta é documento `NOVA | RENOVACAO | ENDOSSO | CANCELAMENTO | FATURA`; sua tramitação usa `stage_id`. Número da apólice pode ser nulo na casca `EM_EMISSAO`. `propostas.cotacao_id` é ponte única de origem comercial, opcional nos fluxos sem cotação. Prêmios do documento preservam sinal; `premio_adicional`, `premio_restituicao` e `data_efeito` foram aposentados. Percentuais de comissão e agenciamento são separados.

**Lookups:** segurado da corretora; seguradora e ramo ativos; produtor elegível; funil/etapa de proposta; grades por seguradora/ramo; subtipos de endosso e motivos de cancelamento por escopo/ramo. Inativação dos catálogos não rompe documentos históricos.

### Comandos contratuais e importação

| Operação proposta | Unidade de escrita e regras principais |
|---|---|
| `POST /contratos/cadastro-manual` | Criar contrato + documento + riscos/coberturas e agendas cabíveis em uma transação. Distinguir proposta em tramitação de documento emitido. |
| `POST /importacoes/documentos/previa` | Receber arquivo/referência e contexto; retornar extração, confiança/pendências, candidatos de vínculo e duplicidade. Previa não efetiva contrato. |
| `POST /importacoes/documentos/confirmar` | Consumir revisão explícita, validar vínculos e registrar documento/anexo e efeitos cabíveis atomicamente; idempotência no servidor. |
| `POST /propostas/:id/mover-etapa` | Alterar tramitação. Marcar etapa Emitida sem documento oficial registrado não aplica efeitos contratuais. |
| `POST /propostas/:id/efetivar` | Validar documento oficial e aplicar efeitos, agendas e auditoria conjuntamente; emissão é UPDATE do contêiner, não migração de linha. |
| `POST /apolices/:id/iniciar-renovacao` | Criar oportunidade com `apolice_origem_id`; impedir tentativa ativa duplicada conforme elegibilidade. |
| `POST /oportunidades/:id/transmitir-renovacao` | Criar sucessora `EM_EMISSAO` e proposta RENOVACAO; `renovada_de_id` é FK da antecessora. |
| `POST /apolices/:id/marcar-nao-renovada` | Motivo, elegibilidade e auditoria; não emitir sucessora implicitamente. |
| `POST /apolices/:id/documentos` | Criar endosso, cancelamento ou fatura sem efetivar pela simples criação. Exigir subtipo/motivo e campos próprios. |
| `POST /propostas/:id/agendas/previa` e `/confirmar` | Diagnosticar e gerar parcelas, comissões e repasses; completar ausentes ou substituir coletivamente fatos não processados, com prévia e confirmação explícitas. |

Na efetivação da renovação, sucessora passa a `VIGENTE` e antecessora a `RENOVADA` atomicamente; recusa mantém histórico e permite nova tentativa. Cadeia não aceita autorreferência/ciclo. Endosso versiona inclusão/exclusão/substituição de itens/coberturas; cancelamento altera contrato somente ao ser efetivado. Fatura exige ramo mensal e competência sem sobreposição; duplicação usa a última fatura emitida.

O wizard de importação vigente persiste `NOVA`, `RENOVACAO` e `ENDOSSO`. Reconhecer `CANCELAMENTO`/`FATURA` não autoriza importá-los por esse wizard: os documentos derivados têm fluxo próprio. Match automático por CPF/CNPJ é determinístico; nome semelhante exige revisão. Proposta importada antes da apólice e apólice recebida isoladamente precisam convergir ao contêiner correto, preservando o rastro documental. A simulação atual não faz OCR nem homologa layouts de seguradora.

**Riscos e coberturas:** `apolice_itens` ancora a identidade no contrato. CTI por tipo de risco usa PK=FK e exatamente uma especialização aplicável. `item_vida.pessoa_id` pode ser nulo no item-grupo. `incluido_por_proposta_id`/`excluido_por_proposta_id` preservam autoria documental; a nova cobertura não apaga o valor anterior. Validar filho==pai e catálogo do ramo em toda alteração. A representação contratual não implica formulário completo para todos os riscos futuros.

### Agendas como snapshots

- Parcelas são cobrança do segurado, ligadas à proposta; preservar totais, datas, IOF e adicional. Comissões têm agenda independente e `parcela_id` opcional. Repasses representam despesa para produtor/gerente.
- `recebimento_grades` e linhas são moldes. `tipo_comissao` é snapshot explícito: `NORMAL`, `AGENCIAMENTO`, `VITALICIA`, `ADICIONAL`, `RESTITUICAO`. Não inferir tipo apenas pelo sinal do valor.
- Agenciamento usa o percentual próprio; NORMAL/VITALICIA sem percentual da linha herdam `propostas.comissao_pct`. Exemplo previsto: 300% de agenciamento distribuído em três eventos de 100%, separado de vitalício a 2%.
- Regra de repasse mais específica vence conforme escopo, vigência e critérios; preservar beneficiário, base, percentual, valor e regra aplicada. Gerente vem da carteira naquele momento; produtor vem do contrato. Ausência de regra não inventa percentual; `regra_id = null` identifica manual.
- Prévia informa grade/regra vencedoras, linhas a criar/cancelar e bloqueios. Confirmação revalida o diagnóstico para não duplicar ou substituir fatos processados. Mudança posterior de configuração não reescreve agenda antiga.

**Rastreabilidade:** planos 2.1–2.9b; implementação em `contexts/contractOperations.ts`, `lib/contractAgendaDomain.ts` e domínios de cadastro/importação documental. A geração de agendas não confirma recebimento nem paga repasses.

## 3 — Financeiro securitário

### 3.1 Parcelas e cockpit

**Entidades:** `parcelas` e projeções via proposta → apólice → segurado/corretora. `GET /financeiro/parcelas` e `GET /financeiro/resumo` retornam valores previstos/pagos separados, estado efetivo, origem navegável e totais consistentes com filtros. Filtrar corretora, segurado, seguradora, ramo, documento, período/vencimento, pagamento e status; ordenar de forma estável.

`POST /financeiro/parcelas/confirmar-pagamento` e `/reverter-pagamento` aceitam seleção individual ou lote, data/valor e justificativa aplicável. Revalidar todos os itens e aplicar o lote atomicamente; lote misto inelegível não produz gravação parcial. Previsto não muda pela baixa; reversão limpa apenas a projeção de liquidação e mantém auditoria. Vencimento efetivo considera data de negócio, preservando estados pagos, cancelados e estornados. A cobrança da seção 3.6 usa a parcela existente.

### 3.2–3.4R-A Extratos, conciliação e baixa de comissões

**Entidades:** `comissoes`, `comissao_extratos`, `comissao_extrato_itens`, `comissao_conciliacoes`, `comissao_conciliacao_ocorrencias`, `comissao_baixas`, `comissao_baixa_conciliacoes`.

| Operação proposta | Entrada, filtros e resultado esperado |
|---|---|
| `GET /financeiro/comissoes` | Filtrar corretora, seguradora, segurado, documento, tipo, vencimento/recebimento, status e pendência; retornar previsto, recebido, saldo, diferença e origem. |
| `GET /financeiro/extratos` e `/:id` | Histórico paginado por seguradora, origem, status, competência/período e busca; detalhe com itens, conciliações, ocorrências e original autorizado. |
| `POST /financeiro/extratos/previa` | Upload/referência, seguradora, corretora e contexto; resposta por arquivo com parser/versão, metadados, linhas normalizadas e erros seguros. |
| `POST /financeiro/extratos/confirmar` | Preservar original e correções, confirmar associações revisadas sem executar baixa; idempotência por arquivo/linha. |
| `POST /financeiro/extratos/:id/reprocessar` | Nova tentativa identificada por parser/versão; proteger itens conciliados/consumidos e não duplicar baixas. Processamento durável é responsabilidade futura do serviço. |
| `POST /financeiro/conciliacoes` e `/:id/confirmar` ou `/rejeitar` | Associação item × comissão com valor alocado, método e justificativa; validar disponibilidade e escopo. |
| `POST /financeiro/ocorrencias/:id/resolver` | Resolução tipada e auditada, preservando identificação e histórico. |
| `POST /financeiro/comissoes/baixa/previa` e `/confirmar` | Seleção, valores, data, motivo e conciliações; resultado explícito por comissão. O comando aceito é atômico, incluindo todas as baixas, pontes, projeções e dependências; seleção inválida não gera sucesso parcial silencioso. |
| `POST /financeiro/baixas/:id/estornar` | Evento compensatório integral/parcial, justificativa, valor ainda ativo e trava por repasse pago. |

**Separação dos fatos:** arquivo/extração → item normalizado → associação N:N → ocorrência/resolução → baixa explícita → eventual liberação de repasse. Conciliar nunca significa receber. Item sem comissão correspondente continua preservado; não criar agenda ausente nem alterar `valor_previsto` para fazer o extrato coincidir.

**Estados:** comissão `PREVISTA | PARCIAL | RECEBIDA | DIVERGENTE | CANCELADA`; conciliação `SUGERIDA | CONFIRMADA | REJEITADA | CANCELADA`, tipo `EXATA | PARCIAL | SUGERIDA | MANUAL`. Elegibilidade do item `PRONTO_PARA_BAIXAR` não confirma recebimento. Ocorrência aberta/em análise ou associação sugerida impede baixa; uma nova origem manual não contorna pendência existente.

**Valores:** previsto na comissão; bruto/líquido/descontos no item; alocação e diferença na conciliação; `valor_efetivo` no evento; recebido/saldo/status são projeções. Baixa sem arquivo cria extrato, item e conciliação lógicos de origem MANUAL. Evento `BAIXA` soma; `ESTORNO` compensa a baixa original da mesma comissão sem apagar histórico. Tolerâncias: R$ 0,01 e 0,01 ponto percentual. Parcialidade, divergência aceita, correção e estorno exigem justificativa. Sobrealocação e consumo duplicado são bloqueados transacionalmente.

**Idempotência:** extrato por corretora+chave e corretora+seguradora+hash; item por extrato+chave; associação por item+comissão e item+chave; baixa por comissão+chave. Uma baixa pode consumir N conciliações confirmadas, mantendo a ponte e seus valores. Retry e concorrência precisam de locks/controle de versão no servidor.

**Repasse vinculado:** baixa libera PREVISTO → LIBERADO. Estorno que elimina todo recebimento devolve repasse apenas liberado a PREVISTO; repasse PAGO bloqueia estorno. Atualizações dependentes pertencem à mesma transação da baixa/estorno.

**Arquivos:** o frontend demonstra PDF/XLS/XLSX, prévia, revisão, resultado por arquivo e rejeições seguras. Não há parser/OCR real homologado. Backend deverá prover assinatura MIME, limites, antivírus, armazenamento durável, hash calculado no servidor, extração isolada, tentativas, timeout, retenção e URL temporária. Seguradora só pode ser declarada suportada após fixtures reais anonimizadas e homologação por layout/versão. Reprocessamento e retorno de status não significam mesa de retomada 3.4R-B entregue.

### 3.5 Repasses e recibos

**Entidades:** `repasses`, `repasse_recibos`, `repasse_recibo_itens`; origem em proposta e, quando cabível, comissão. `GET /financeiro/repasses` filtra corretora, beneficiário, papel, seguradora, ramo, documento, status, período e sentido; consulta/relatório PDF ou Excel não paga nada.

`POST /financeiro/recibos/previa` agrupa por filial + beneficiário + sentido CREDITO/DEBITO. `POST /financeiro/recibos/emitir` executa a ação explícita **Emitir recibo e marcar como pago**. Só entram repasses LIBERADO, com valor não zero, beneficiário válido e sem recibo ativo. O pagamento é integral: `valor_pago = valor_previsto`, diferença zero, status PAGO e data do recibo. Não há pagamento parcial nem compensação entre sinais.

O recibo congela dados do cabeçalho e itens impressos; número único e chave idempotente por filial/emissão são do serviço. Lote tem atomicidade **por recibo**, com resultado emitido/idempotente/falho por grupo. Um grupo falho não perde metade dos itens nem desfaz outro recibo concluído. Reimpressão (`GET /financeiro/recibos/:id/documento`) usa o snapshot, sem recalcular regras.

`POST /financeiro/recibos/:id/cancelar` exige recibo EMITIDO, motivo, autoria e idempotência. Cancelamento integral mantém histórico e retorna repasses a LIBERADO, limpando somente pagamento ativo. Recibo ativo mantém a trava de estorno da comissão. Isto registra pagamento operacional; não executa PIX, transferência, CNAB ou conciliação bancária.

### 3.6 Cobranças

**Entidade:** `financeiro_cobrancas`, exclusivamente por `parcela_id`. `GET /financeiro/cobrancas` filtra etapas, status, responsável, prioridade, follow-up, canal, período e origem derivada. `GET /financeiro/parcelas/elegiveis-cobranca` só oferece parcelas efetivamente vencidas.

`POST /financeiro/cobrancas` abre com etapa inicial válida; `PATCH /financeiro/cobrancas/:id` mantém responsável/follow-up/observações; comandos `/mover-etapa`, `/quitar`, `/cancelar` e `/reabrir` preservam status independente do funil. Só uma cobrança ATIVA por parcela, garantida no backend por unicidade parcial ou controle equivalente.

QUITADA exige parcela paga e não executa baixa; CANCELADA exige motivo; ambas gravam `encerrada_em`. Reabrir exige parcela novamente vencida, nenhuma outra cobrança ativa e limpeza dos campos de encerramento. Guias usam `entidade_tipo = cobranca`. Não buscar parcelas em portais nem persistir oportunidade, pipeline ou valores financeiros duplicados.

**Rastreabilidade financeira:** planos 3.1, 3.2, 3.3, 3.4, 3.4R-A, 3.5 e 3.6; domínios em `src/modules/financeiro`. O 3.4R-B permanece condicional.

## 4 — Sinistros

**Entidades:** `sinistros` e `sinistro_envolvidos`; contrato obrigatório em `apolice_id`. `GET /sinistros` filtra corretora derivada, conjunto de etapas, status, responsável, apólice, segurado, seguradora, ramo, período e busca. `GET /sinistros/:id` compõe contrato, envolvidos e guias; lookup de apólices retorna vigência, status e itens elegíveis, e a consulta de itens é sempre filtrada pela apólice.

`POST /sinistros` cria evento + envolvidos + auditoria atomicamente, com status `aberto` e etapa do funil sinistro. `PATCH /sinistros/:id` permite campos operacionais autorizados, sem trocar apólice nem estado final livremente. Inclusão/edição/remoção de envolvidos mantém ao menos um SEGURADO; terceiro usa descrição própria e nunca cadastra PF fictícia em `segurados`. Item informado deve pertencer ao contrato.

| Comando proposto `POST /sinistros/:id/...` | Origem permitida | Destino e exigências |
|---|---|---|
| `concluir-sem-indenizacao` | aberto/reaberto | encerrado_sem_indenizacao; conclusão, indenizado zero, liquidação nula e negativa limpa. |
| `negar` | aberto/reaberto | encerrado_sem_indenizacao; motivo de negativa não vazio e data de conclusão. |
| `concluir-com-indenizacao` | aberto/reaberto | encerrado_com_indenizacao; indenizado positivo, documentação completa, liquidação e conclusão. |
| `cancelar` | aberto/reaberto | cancelado; data de conclusão, sem inventar data_cancelamento ou fato financeiro. |
| `reabrir` | encerrado_sem_indenizacao / encerrado_com_indenizacao / cancelado | reaberto; preservar datas, valores, negativa e histórico. |

Comandos finais não movem etapa; `stage_id` muda pela ação própria de Kanban. Validar ordem ocorrência ≤ documentação ≤ liquidação ≤ conclusão quando aplicável; valores finitos/não negativos; salvado/ressarcimento positivos exigem suas datas. Reabertura não limpa o fechamento antigo: correção exige novo comando de conclusão. Transição, envolvidos e auditorias são uma unidade transacional, com idempotência e controle de concorrência no serviço.

Liquidação financeira do sinistro é dado operacional e não cria parcelas/comissões/repasses. Especializações de sinistro por ramo e tabela de vistoria não fazem parte desta entrega. **Rastreabilidade:** planos 4.1a–4.1c e `src/modules/sinistro`.

## 5 — Pós-venda

**Entidade:** `pos_vendas`, com `apolice_id` obrigatório e `stage_id` do processo; tarefas e onboarding em `atividades`. `GET /pos-vendas` filtra conjunto de etapas, contrato, segurado, seguradora, ramo, responsável, datas, prioridade e busca. Lookup de apólices respeita corretora, status e elegibilidade do processo.

`POST /pos-vendas` cria sobre apólice e etapa inicial válida; `PATCH /pos-vendas/:id` mantém escalares/responsável sem trocar apólice; `POST /pos-vendas/:id/mover-etapa` valida pipeline `entidade_tipo = pos_venda`. Onboarding e acompanhamento mensal elegível criam atividades polimórficas e auditoria conjuntamente, sem duplicar tarefas por repetição da ação. Acompanhamento mensal depende de ramo faturável, sem gerar FATURA automaticamente.

As quatro guias transversais usam `pos_venda`. Não aceitar `oportunidade_id`, `pipeline_id`, `metadata` ou payload financeiro. Implantação de saúde estruturada e novos pipelines de fábrica permanecem evolução aditiva. **Rastreabilidade:** plano 4.2 e `src/modules/pos_venda`.

## 6 — Oportunidades, multicálculo e apresentação comercial

**Entidades:** `oportunidades`, `calculos`, seis especializações `calc_*`, `calculo_coberturas`, `calculo_execucoes`, `cotacoes`, `cotacao_coberturas`, `cotacao_parcelamentos`, `apresentacoes_comerciais`, `apresentacao_cotacoes`. Origem contratual usa `propostas.cotacao_id`.

### Oportunidades e pedidos

| Operação proposta | Campos, filtros e regras |
|---|---|
| `GET/POST /oportunidades`, `GET/PATCH /oportunidades/:id` | Corretora, etapa, ramo, origem, responsável, período, ganho/perda, renovação e busca. Campos de lead, estimativas, prioridade e previsão separados do contrato emitido. |
| `POST /oportunidades/:id/qualificar` | Vincular/criar segurado da mesma corretora, preservando tentativa comercial; lead pode existir sem segurado. |
| `POST /oportunidades/:id/mover-etapa`, `/concluir`, `/reabrir` | Validar etapas e motivo de perda, timestamps de ganho/perda e auditoria; não criar contrato pela mudança do Kanban. |
| `GET /oportunidades/:id/calculos` | Hierarquia cálculo → execuções → cotações com especializações, coberturas e pagamentos ordenados; sem `calculo_id` ou seguradora duplicados na cotação. |
| `POST /oportunidades/:id/calculos` e `POST /calculos/:id/duplicar` | Novo snapshot + uma CTI + coberturas, atomicamente; novos IDs e rótulo gerado pelo domínio, com idempotência. |
| Consultas assistidas de pessoa, veículo/FIPE, CEP e apólice anterior | Entrada normalizada, fonte/cache/timeout e erro seguro; preservar fallback manual e não expor credenciais. São contratos futuros de serviço, atualmente simulados. |

**Versionamento:** pessoa, condutor, risco, vigência, coberturas solicitadas ou default de comissão alterados criam nova versão. Override de comissão por seguradora e retry criam execução. Cotado pode diferir do cliente da oportunidade por escolha explícita em `calculos.segurado_id`. Tipo de seguro é `NOVO | RENOVACAO_PROPRIA | RENOVACAO_OUTRA`; endosso segue o domínio contratual.

Novo seguro deriva um ano-calendário no fuso da filial (29/02 → 28/02 quando necessário); renovação própria começa na data final anterior, com apólice de origem válida. Bônus é inteiro 0–10, com zero explícito. Campos condicionais desconhecidos permanecem nulos; `calc_auto.chassi_remarcado` é boolean nullable v3.1. `nota_interna` não é transmitida.

As seis CTIs de cálculo são `calc_auto`, `calc_residencia`, `calc_condominio`, `calc_vida`, `calc_empresa`, `calc_diversos`. Cobertura solicitada expressa limites/preferências; franquia final, prêmio e carência devolvidos pertencem à cotação. Catálogo deve corresponder ao ramo e o filho à versão. A jornada Auto recebeu o refinamento específico 6.4R-B/6.5R; os demais ramos não foram declarados igualmente homologados com um motor externo.

### Execuções e resultados

`POST /calculos/:id/executar` cria tentativas por seguradora com comissão aplicada; `POST /execucoes/:id/reexecutar` cria nova linha ligada à anterior; `GET /calculos/:id/resultados` retorna sucesso/parcial/pendência/erro seguro por seguradora. Status de execução: AGUARDANDO, EM_EXECUCAO, CONCLUIDA, PENDENTE_DADOS, INDISPONIVEL, ERRO, CANCELADA. Uma falha não invalida resultados das outras seguradoras.

`POST /calculos/:id/cotacoes-manuais` registra execução MANUAL concluída, cotação, coberturas devolvidas e opções de pagamento como agregado normalizado. Resultado é no máximo um por execução (`execucao_id` único). Comissão aplicada não substitui prêmio; parcelas são N opções da cotação, com código único por resultado, valores, entrada, quantidade e primeiro vencimento.

No serviço futuro, normalizar códigos externos e proteger segredos, rate limits, callbacks, polling e retries; payload cru só em `integracao_logs`. Motores simulados no front não demonstram conectividade real com seguradoras ou Agger. Ramos sem suporte externo conservam o caminho manual.

### Apresentação, PDF e origem da proposta

`GET/POST /oportunidades/:id/apresentacoes` e `GET/PATCH /apresentacoes/:id` compõem seleção ordenada de **até cinco cotações** da mesma oportunidade, inclusive versões/cotados diferentes identificados na apresentação. Uma sexta é bloqueada sem perder seleção. `apresentacao_cotacoes` guarda ordem, recomendação, textos e `parcelamento_id` pertencente à respectiva cotação. Ordem e cotação são únicas por apresentação; reordenar/substituir itens é atômico.

Layout VERTICAL/HORIZONTAL, critério de ordenação e visibilidade de FIPE, vantagens, legenda, observações e comissão são campos da apresentação. PDF atual é produzido pelo fluxo de impressão do frontend, com cabeçalho, coberturas e condições de pagamento. Geração/armazenamento autoritativos e compartilhamento por URL segura ficam para o backend. Gerar apresentação/PDF não aprova cotação nem transmite proposta.

`POST /apresentacoes/:id/escolher-cotacao` registra a escolha sem criar documento. A ação explícita de **cadastrar proposta manualmente ou importar proposta** leva `cotacao_id` aos comandos da seção 2. Validar execução concluída, cotação APRESENTADA/APROVADA não vencida, cotado qualificado, seguradora/ramo/corretora correspondentes e origem da renovação própria. Bloquear duplicidade da cotação e outra proposta/contrato não recusado da mesma oportunidade. O mock consulta vínculos e protege a criação; o backend deve repetir isso sob concorrência.

Aprovação da cotação só ocorre no passo final da transação que gravou a proposta vinculada; falha não deixa aprovação isolada. NOVO gera NOVA; renovação gera RENOVACAO e preserva `renovada_de_id` quando própria. A opção de pagamento serve de preenchimento inicial para revisão explícita, sem alterar o resultado original. A importação continua assistida/simulada, mesmo quando iniciada a partir da cotação.

**Rastreabilidade:** planos 6.2–6.5R, finalização de 10/09 e reconciliação de 11/09; `src/modules/comercial`, domínios de cadastro/importação e componentes de apresentação. Não existe módulo genérico de orçamento nem JSON para armazenar seleção.

## 7 — API existente e fronteira de integração

O modo mock demonstra o escopo acima. A conciliação com main preservou chamadas HTTP pré-existentes em `src/lib/backendDomainApi.ts`, com DTO anterior ao DBML v3.1:

| Chamadas realmente presentes no adapter | Limite observado no código |
|---|---|
| `GET/POST /api/segurados`, `GET/PUT /api/segurados/:id` | Listagem, detalhe, cadastro e edição dos campos atendidos. Celular/WhatsApp separados e outros campos complementares canônicos exigem evolução do DTO. |
| `GET/POST /api/oportunidades`, `GET/PUT /api/oportunidades/:id` | Filtros remotos `pipelineId`, `stageId`, `status`; DTO legado com tradução. Prioridade, previsão, campanha e outros campos novos não têm gravação equivalente. |
| `PATCH /api/oportunidades/:id/stage` | Movimentação da etapa; conclusão/reabertura usam a fronteira HTTP existente conforme o hook/adapter. |

Campos legados recebidos em PUT são preservados; campos novos sem suporte são bloqueados/desabilitados, sem descarte silencioso. Leads com contatos próprios e criação/alteração de vínculo canônico de renovação dependem da API. `pipeline_id`/`metadata` legados permanecem na tradução de transporte, sem retornar aos tipos canônicos. Autenticação pode usar WAssisBE; isso não entrega os outros endpoints propostos.

A [matriz de integração](resultado-publicacao-2026-09-11.md) detalha as limitações. O QA da fronteira HTTP usou respostas interceptadas localmente e verificou DTOs; não certificou integração ponta a ponta com ambientes reais. Cada módulo deverá ser conectado e homologado progressivamente pela equipe responsável.

## 8 — Evoluções adiadas e responsabilidades sem tela

| Item | Situação e condição de retomada |
|---|---|
| 3.4R-B Mesa de exceções e retomada | Condicional a necessidade de uso; não confundir histórico/conferência 3.4R-A com fila durável de trabalho posterior. |
| 5.1 Dashboards | KPIs atuais fixos demonstrativos; projeções gerenciais reais aguardam fase SaaS/backend. |
| 5.2 Visão de grupo | Consolidação autorizada entre corretoras, adiada para preparação comercial do SaaS. |
| 5.3 Cliente cruzado | Função privilegiada devolvendo somente o fato autorizado; sem acesso cruzado livre a pessoas. |
| 5.4 Relatórios SaaS | Relatórios gerenciais futuros; PDFs operacionais já existentes não encerram esta frente. |
| 6.6 Agger/Aggilizador | Depende de projeto concreto de API, ambientes, autenticação, limites, idempotência, retorno assíncrono e homologação. |
| G9 Central Técnica e Suporte | Requer escopo e autorização próprios; não abrir por consequência do encerramento. |

`integracao_logs` é tabela técnica de backend; requer acesso restrito e política de retenção/redação de dados sensíveis, sem tela genérica neste frontend. Campos de administração do grupo e metadados de serviço ficam classificados na matriz de reconciliação. Outras especializações futuras, storage, OCR, envio real de notificações, RLS/RBAC, banco/caixa/tesouraria, robôs de portal e automações de seguradoras não foram implementados nesta entrega.

## 9 — Evidências e condições da entrega

- Reconciliação estrutural v3.1: 67 tabelas tipadas, zero colunas ausentes/extras e zero divergências de nulabilidade no inventário final. Compatibilidade estrutural não comprova equivalência semântica completa, constraints executadas ou autorização real. [Resultado](resultado-reconciliacao-front-2026-09-11.md) e [nulabilidade](resultado-nulabilidade-2026-09-11.md).
- Publicação: TypeScript/build aprovados, 44 arquivos e 304 testes; navegação mock e fronteira HTTP interceptada, desktop/mobile. Lint focado preserva 32 ocorrências legadas em três arquivos; build mantém aviso de tamanho de chunks. [Plano de publicação](.codex/plans/micro-plano-publicacao-consolidada-2026-09-11.md).
- Multicálculo, cinco cotações, proposta manual/importada e PDF foram exercitados na finalização; não constitui homologação de parser real. [Plano de finalização](.codex/plans/micro-plano-finalizacao-front-2026-09-10.md).
- Encerramento é do frontend V1 e do hand-off documental. Aceite operacional do sistema integrado, implantação e infraestrutura têm gates próprios. Este documento não autoriza executar backend, migrations ou deploy.
- Novas decisões que alterem o schema exigem revisão conjunta e versionada do DBML/instruções. Campos e rotas propostas deste relatório não devem ser adicionados ao banco por inferência.

## Inventário canônico de tabelas e campos — DBML v3.1

Inventário extraído do par vigente; não é payload de escrita irrestrita. Agrupamento por tipo preserva todos os nomes. Em cada tabela, a lista de obrigatórios reflete apenas PK e `not null` do DBML; demais colunas aceitam nulo estruturalmente, sujeitas às regras da ação. FKs e índices continuam sujeitos às invariantes semânticas descritas acima. Consulte o DBML para comentários e decisões de modelagem completas.

### Tabela `tenants`

Seção funcional: 0.1. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L320).

- **uuid:** `id`.
- **text:** `razao_social`, `nome_fantasia`, `cnpj_cpf`, `slug`, `email`, `telefone`, `celular`, `home_page`, `cep`, `endereco`, `numero`, `complemento`, `bairro`, `cidade`, `uf`, `pais`, `timezone`, `moeda_padrao`, `status`.
- **boolean:** `ativo`.
- **timestamptz:** `criado_em`, `atualizado_em`.

**PK:** `id`. **Não nulos (inclui PK):** `id`.

**FKs:** nenhuma declarada; destino polimórfico, quando aplicável, exige validação no serviço.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `filiais`

Seção funcional: 0.1. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L348).

- **uuid:** `id`, `tenant_id`, `matriz_id`, `gerente_id`.
- **text:** `razao_social`, `fantasia`, `cnpj_cpf`, `susep`, `gerente`, `contato`, `home_page`, `email`, `telefone`, `celular`, `telefone2`, `inscricao_estadual`, `inscricao_municipal`, `regime_tributario`, `codigo_corretora`, `codigo_externo`, `municipio_ibge`, `pais`, `horario_atendimento`, `observacoes`, `cep`, `endereco`, `numero`, `complemento`, `bairro`, `cidade`, `uf`.
- **numeric:** `percentual_imposto`, `percentual_iss`.
- **boolean:** `lgpd_aceito`, `ativo`.
- **timestamptz:** `lgpd_aceito_em`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `tenant_id`.

**FKs:** `tenant_id` → `tenants.id`; `matriz_id` → `filiais.id`; `gerente_id` → `produtores.id`.

**Unicidade/índices adicionais:** `(tenant_id, cnpj_cpf) [unique]`.

### Tabela `profiles`

Seção funcional: 0.1. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L398).

- **uuid:** `id`, `tenant_id`.
- **text:** `nome_completo`, `email`, `telefone`, `celular`, `cargo`, `departamento`, `avatar_url`, `status`, `convite_status`.
- **boolean:** `ativo`.
- **timestamptz:** `ultimo_acesso_em`, `convite_enviado_em`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `tenant_id`.

**FKs:** `tenant_id` → `tenants.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `perfis`

Seção funcional: 0.1. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L417).

- **uuid:** `id`, `tenant_id`.
- **text:** `nome`, `descricao`, `nivel_acesso`.
- **boolean:** `sistema`, `ativo`.
- **integer:** `ordem`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `tenant_id`.

**FKs:** `tenant_id` → `tenants.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `profile_filiais`

Seção funcional: 0.1. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L429).

- **uuid:** `id`, `profile_id`, `filial_id`, `perfil_id`.
- **boolean:** `principal`, `ativo`.
- **date:** `data_inicio`, `data_fim`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `profile_id`, `filial_id`, `perfil_id`.

**FKs:** `profile_id` → `profiles.id`; `filial_id` → `filiais.id`; `perfil_id` → `perfis.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `role_permissions`

Seção funcional: 0.1. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L444).

- **uuid:** `id`, `perfil_id`.
- **text:** `modulo`, `escopo`.
- **boolean:** `can_read`, `can_create`, `can_update`, `can_delete`, `can_export`, `can_manage`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `perfil_id`.

**FKs:** `perfil_id` → `perfis.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `produtores`

Seção funcional: 0.2–0.3 / G8 / 2. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L466).

- **uuid:** `id`, `tenant_id`, `profile_id`.
- **text:** `nome`, `cpf_cnpj`, `tipo_pessoa`, `nome_fantasia`, `rg_ie`, `susep`, `categoria_operacional`, `email`, `telefone`, `celular`, `telefone2`, `cep`, `endereco`, `numero`, `complemento`, `bairro`, `cidade`, `uf`, `pais`, `banco`, `agencia`, `conta`, `tipo_conta`, `chave_pix`, `favorecido_nome`, `favorecido_cpf_cnpj`, `observacoes`.
- **date:** `data_nascimento`.
- **boolean:** `descontar_imposto`, `ativo`.
- **numeric:** `percentual_imposto`, `percentual_repasse_padrao`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `tenant_id`.

**FKs:** `tenant_id` → `tenants.id`; `profile_id` → `profiles.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `segurados`

Seção funcional: 0.2–0.3 / G8 / 2. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L512).

- **uuid:** `id`, `tenant_id`, `filial_id`, `produtor_id`, `gerente_id`.
- **text:** `cpf_cnpj`, `tipo`, `nome`, `nome_fantasia`, `status`, `email`, `telefone`, `chatwoot_id`, `cep`, `logradouro`, `endereco`, `numero`, `complemento`, `bairro`, `cidade`, `estado`, `sexo`, `estado_civil`, `cnae`, `porte`, `site`, `observacoes`, `nome_social`, `rg_ie`, `inscricao_municipal`, `atividade_economica`, `profissao`, `cnh_numero`, `cnh_categoria`, `celular`, `telefone2`, `whatsapp`, `pais`, `origem_importacao`.
- **boolean:** `lgpd_autorizado`.
- **date:** `data_nascimento`, `cnh_vencimento`.
- **timestamptz:** `created_at`, `updated_at`, `lgpd_autorizado_em`.
- **numeric:** `renda_mensal`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `tenant_id`, `filial_id`.

**FKs:** `tenant_id` → `tenants.id`; `filial_id` → `filiais.id`; `produtor_id` → `produtores.id`; `gerente_id` → `produtores.id`.

**Unicidade/índices adicionais:** `(filial_id, cpf_cnpj) [unique]`; `cpf_cnpj`.

### Tabela `pessoa_contato`

Seção funcional: 0.2–0.3 / G8 / 2. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L584).

- **uuid:** `id`, `pj_id`, `pf_id`.
- **text:** `nome`, `cargo`, `departamento`, `email`, `telefone`, `celular`, `observacoes`.
- **boolean:** `principal`, `ativo`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `pj_id`.

**FKs:** `pj_id` → `segurados.id`; `pf_id` → `segurados.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `seguradoras`

Seção funcional: 0.2–0.3 / G8 / 2. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L603).

- **uuid:** `id`, `tenant_id`.
- **text:** `nome`, `nome_curto`, `cnpj`, `codigo_susep`, `codigo_interno`, `site`, `portal_url`, `telefone_sac`, `telefone_assistencia`, `email`, `observacoes`.
- **boolean:** `aceita_importacao_pdf`, `aceita_busca_automatica`, `ativo`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `tenant_id`.

**FKs:** `tenant_id` → `tenants.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `ramos`

Seção funcional: 0.2–0.3 / G8 / 2. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L622).

- **uuid:** `id`, `tenant_id`.
- **text:** `nome`, `codigo_susep`, `risk_type`, `grupo_operacional`, `forma_calculo`, `observacoes`.
- **boolean:** `is_monthly`, `renovavel`, `permite_endosso`, `exige_item`, `exige_coberturas`, `ativo`.
- **integer:** `ordem`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `tenant_id`.

**FKs:** `tenant_id` → `tenants.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `endosso_subtipos`

Seção funcional: 0.2–0.3 / G8 / 2. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L645).

- **uuid:** `id`, `tenant_id`, `filial_id`, `ramo_id`.
- **text:** `nome`, `natureza_canonica`, `observacoes`.
- **integer:** `ordem`.
- **boolean:** `ativo`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `tenant_id`.

**FKs:** `tenant_id` → `tenants.id`; `filial_id` → `filiais.id`; `ramo_id` → `ramos.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `cancelamento_motivos`

Seção funcional: 0.2–0.3 / G8 / 2. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L659).

- **uuid:** `id`, `tenant_id`, `filial_id`, `ramo_id`.
- **text:** `nome`, `observacoes`.
- **integer:** `ordem`.
- **boolean:** `ativo`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `tenant_id`.

**FKs:** `tenant_id` → `tenants.id`; `filial_id` → `filiais.id`; `ramo_id` → `ramos.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `origens`

Seção funcional: 0.2–0.3 / G8 / 2. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L670).

- **uuid:** `id`, `tenant_id`.
- **text:** `nome`, `tipo`.
- **integer:** `ordem`.
- **boolean:** `ativo`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `tenant_id`.

**FKs:** `tenant_id` → `tenants.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `motivos_perda`

Seção funcional: 0.2–0.3 / G8 / 2. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L679).

- **uuid:** `id`, `tenant_id`.
- **text:** `nome`, `categoria`.
- **integer:** `ordem`.
- **boolean:** `ativo`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `tenant_id`.

**FKs:** `tenant_id` → `tenants.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `coberturas_catalogo`

Seção funcional: 0.2–0.3 / G8 / 2. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L688).

- **uuid:** `id`, `ramo_id`.
- **text:** `codigo`, `codigo_susep`, `nome`, `descricao`, `tipo_cobertura`, `caracteristica`, `tipo_risco`, `modalidade`.
- **numeric:** `capital_lmi_padrao`, `franquia_padrao`.
- **integer:** `carencia_dias`, `ordem`.
- **boolean:** `obrigatoria`, `ativo`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `ramo_id`.

**FKs:** `ramo_id` → `ramos.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `pipelines`

Seção funcional: 0.5. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L718).

- **uuid:** `id`, `tenant_id`, `filial_id`.
- **text:** `nome`, `entidade_tipo`, `descricao`.
- **boolean:** `modelo_fabrica`, `permite_customizacao`, `ativo`.
- **integer:** `ordem`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `tenant_id`.

**FKs:** `tenant_id` → `tenants.id`; `filial_id` → `filiais.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `pipeline_stages`

Seção funcional: 0.5. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L732).

- **uuid:** `id`, `pipeline_id`.
- **text:** `nome`, `codigo`, `tipo_stage`, `cor`.
- **integer:** `ordem`, `sla_dias`.
- **numeric:** `probabilidade`.
- **boolean:** `finaliza_com_sucesso`, `finaliza_com_perda`, `ativo`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `pipeline_id`.

**FKs:** `pipeline_id` → `pipelines.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `oportunidades`

Seção funcional: 6. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L756).

- **uuid:** `id`, `tenant_id`, `filial_id`, `segurado_id`, `ramo_id`, `origem_id`, `apolice_origem_id`, `responsavel_id`, `stage_id`, `motivo_perda_id`.
- **text:** `lead_nome`, `lead_documento`, `lead_email`, `lead_telefone`, `titulo`, `descricao`, `prioridade`, `motivo_perda_observacao`, `campanha`, `observacoes`.
- **numeric:** `valor_premio_estimado`, `valor_comissao_estimada`, `comissao_estimada_pct`, `agenciamento_pct`.
- **date:** `data_abertura`, `data_fechamento_prevista`.
- **timestamptz:** `ganha_em`, `perdida_em`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `tenant_id`, `filial_id`, `stage_id`.

**FKs:** `tenant_id` → `tenants.id`; `filial_id` → `filiais.id`; `segurado_id` → `segurados.id`; `ramo_id` → `ramos.id`; `origem_id` → `origens.id`; `apolice_origem_id` → `apolices.id`; `responsavel_id` → `profiles.id`; `stage_id` → `pipeline_stages.id`; `motivo_perda_id` → `motivos_perda.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `calculos`

Seção funcional: 6. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L794).

- **uuid:** `id`, `oportunidade_id`, `ramo_id`, `segurado_id`, `seguradora_anterior_id`.
- **text:** `origem`, `rotulo_versao`, `tipo_seguro`, `numero_apolice_anterior`, `codigo_identificacao_anterior`, `status_apolice_anterior`, `nota_interna`.
- **numeric:** `comissao_sugerida_pct`.
- **integer:** `bonus`, `qtd_sinistros`, `qtd_sinistros_perda_parcial`.
- **boolean:** `transferiu_titularidade`.
- **date:** `vigencia_inicio`, `vigencia_fim`, `vigencia_fim_anterior`.
- **timestamptz:** `criado_em`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `oportunidade_id`, `ramo_id`.

**FKs:** `oportunidade_id` → `oportunidades.id`; `ramo_id` → `ramos.id`; `segurado_id` → `segurados.id`; `seguradora_anterior_id` → `seguradoras.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `calc_auto`

Seção funcional: 6. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L839).

- **uuid:** `calculo_id`.
- **text:** `codigo_fipe`, `marca`, `modelo`, `versao`, `placa`, `chassi`, `renavam`, `combustivel`, `cambio`, `categoria`, `tipo_veiculo`, `uso`, `cep_pernoite`, `condutor_nome`, `condutor_cpf`, `condutor_sexo`, `condutor_estado_civil`, `condutor_profissao`.
- **integer:** `ano_fabricacao`, `ano_modelo`, `km_mensal`, `condutor_tempo_habilitacao`.
- **boolean:** `chassi_remarcado`, `zero_km`, `possui_garagem_residencia`, `possui_garagem_trabalho`, `possui_garagem_estudo`, `blindado`, `alienado`, `rastreador`, `antifurto`, `kit_gas`, `condutor_reside_com_segurado`.
- **date:** `condutor_data_nascimento`.

**PK:** `calculo_id`. **Não nulos (inclui PK):** `calculo_id`.

**FKs:** `calculo_id` → `calculos.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `calc_residencia`

Seção funcional: 6. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L880).

- **uuid:** `calculo_id`.
- **text:** `cep`, `endereco`, `numero`, `complemento`, `bairro`, `cidade`, `uf`, `tipo_imovel`, `tipo_ocupacao`, `tipo_construcao`.
- **numeric:** `area_m2`, `valor_imovel`.
- **boolean:** `proprietario`, `desocupado`, `condominio_fechado`, `area_de_risco`, `possui_alarme`, `possui_monitoramento`, `possui_portao_eletronico`.

**PK:** `calculo_id`. **Não nulos (inclui PK):** `calculo_id`.

**FKs:** `calculo_id` → `calculos.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `calc_condominio`

Seção funcional: 6. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L904).

- **uuid:** `calculo_id`.
- **text:** `nome_condominio`, `cep`, `endereco`, `numero`, `complemento`, `bairro`, `cidade`, `uf`, `tipo_condominio`.
- **numeric:** `area_total_m2`.
- **integer:** `qtd_blocos`, `qtd_pavimentos`, `qtd_unidades`, `qtd_elevadores`.
- **boolean:** `possui_portaria_24h`, `possui_sprinklers`, `possui_extintores`, `possui_para_raios`, `possui_garagem`.

**PK:** `calculo_id`. **Não nulos (inclui PK):** `calculo_id`.

**FKs:** `calculo_id` → `calculos.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `calc_vida`

Seção funcional: 6. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L928).

- **uuid:** `calculo_id`.
- **text:** `sexo`, `profissao`, `beneficiarios_texto`.
- **date:** `data_nascimento`.
- **integer:** `altura_cm`.
- **numeric:** `peso_kg`, `renda_mensal`, `capital_desejado`.
- **boolean:** `fumante`, `pratica_esporte_risco`, `possui_doenca_preexistente`, `usa_medicamento_continuo`.

**PK:** `calculo_id`. **Não nulos (inclui PK):** `calculo_id`.

**FKs:** `calculo_id` → `calculos.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `calc_empresa`

Seção funcional: 6. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L944).

- **uuid:** `calculo_id`.
- **text:** `cnpj`, `razao_social`, `atividade`, `cnae`, `cep`, `endereco`, `numero`, `complemento`, `bairro`, `cidade`, `uf`, `tipo_construcao`.
- **numeric:** `faturamento_anual`, `area_m2`, `valor_estoque`, `valor_equipamentos`.
- **integer:** `qtd_funcionarios`.
- **boolean:** `possui_extintores`, `possui_alarme`, `possui_sprinklers`, `possui_inflamaveis`.

**PK:** `calculo_id`. **Não nulos (inclui PK):** `calculo_id`.

**FKs:** `calculo_id` → `calculos.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `calc_diversos`

Seção funcional: 6. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L970).

- **uuid:** `calculo_id`.
- **text:** `categoria`, `descricao_risco`, `observacoes`.
- **numeric:** `valor_declarado`.

**PK:** `calculo_id`. **Não nulos (inclui PK):** `calculo_id`.

**FKs:** `calculo_id` → `calculos.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `calculo_coberturas`

Seção funcional: 6. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L984).

- **uuid:** `id`, `calculo_id`, `cobertura_id`.
- **boolean:** `selecionada`.
- **numeric:** `limite_solicitado`, `percentual_fipe_solicitado`.
- **text:** `franquia_tipo_solicitado`, `opcao_solicitada`, `observacao_transmitida`.
- **integer:** `quantidade_solicitada`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `calculo_id`, `cobertura_id`.

**FKs:** `calculo_id` → `calculos.id`; `cobertura_id` → `coberturas_catalogo.id`.

**Unicidade/índices adicionais:** `(calculo_id, cobertura_id) [unique]`.

### Tabela `calculo_execucoes`

Seção funcional: 6. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L1003).

- **uuid:** `id`, `calculo_id`, `seguradora_id`, `reexecucao_de_id`.
- **integer:** `tentativa`.
- **text:** `motor`, `comissao_origem`, `status`, `pendencia_codigo`, `pendencia_mensagem`, `erro_codigo`, `erro_mensagem_segura`, `referencia_externa`.
- **numeric:** `comissao_pct_aplicada`.
- **timestamptz:** `iniciada_em`, `concluida_em`, `criada_em`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `calculo_id`, `seguradora_id`, `tentativa`, `motor`, `comissao_origem`, `status`, `criada_em`.

**FKs:** `calculo_id` → `calculos.id`; `seguradora_id` → `seguradoras.id`; `reexecucao_de_id` → `calculo_execucoes.id`.

**Unicidade/índices adicionais:** `(calculo_id, seguradora_id, tentativa) [unique]`; `reexecucao_de_id`.

### Tabela `cotacoes`

Seção funcional: 6. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L1031).

- **uuid:** `id`, `execucao_id`.
- **text:** `numero_cotacao_seguradora`, `status`, `link_proposta`, `mensagem_seguradora`, `restricoes`, `descartada_motivo`, `observacao_interna`.
- **numeric:** `premio_total`, `premio_liquido`, `iof`, `adicional_fracionamento`, `comissao_valor`.
- **date:** `validade`.
- **timestamptz:** `recebida_em`, `aprovada_em`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `execucao_id`.

**FKs:** `execucao_id` → `calculo_execucoes.id`.

**Unicidade/índices adicionais:** `execucao_id`.

### Tabela `cotacao_coberturas`

Seção funcional: 6. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L1053).

- **uuid:** `id`, `cotacao_id`, `cobertura_id`.
- **text:** `chave_resultado`, `codigo_externo`, `nome_informado`, `franquia_tipo`, `clausula_texto`, `observacao_seguradora`.
- **boolean:** `incluida`.
- **numeric:** `limite_aceito`, `percentual_fipe_aceito`, `franquia_valor`, `premio`, `participacao_obrigatoria_pct`.
- **integer:** `carencia_dias`, `ordem`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `cotacao_id`, `chave_resultado`.

**FKs:** `cotacao_id` → `cotacoes.id`; `cobertura_id` → `coberturas_catalogo.id`.

**Unicidade/índices adicionais:** `(cotacao_id, chave_resultado) [unique]`.

### Tabela `cotacao_parcelamentos`

Seção funcional: 6. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L1077).

- **uuid:** `id`, `cotacao_id`.
- **text:** `codigo_opcao`, `forma_pagamento`.
- **integer:** `quantidade_parcelas`, `ordem`.
- **numeric:** `valor_entrada`, `valor_parcela`, `valor_total`, `juros_pct`, `adicional_fracionamento`.
- **date:** `primeiro_vencimento`.
- **boolean:** `principal`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `cotacao_id`, `codigo_opcao`, `forma_pagamento`, `quantidade_parcelas`.

**FKs:** `cotacao_id` → `cotacoes.id`.

**Unicidade/índices adicionais:** `(cotacao_id, codigo_opcao) [unique]`.

### Tabela `apresentacoes_comerciais`

Seção funcional: 6. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L1099).

- **uuid:** `id`, `oportunidade_id`, `criado_por_id`, `cotacao_escolhida_id`.
- **text:** `titulo`, `layout`, `criterio_ordenacao`, `observacoes_comerciais`, `status`.
- **boolean:** `exibir_percentual_fipe`, `exibir_vantagens`, `exibir_legenda`, `exibir_observacoes`, `exibir_comissao`.
- **timestamptz:** `criado_em`, `atualizado_em`, `gerada_em`, `escolhida_em`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `oportunidade_id`.

**FKs:** `oportunidade_id` → `oportunidades.id`; `criado_por_id` → `profiles.id`; `cotacao_escolhida_id` → `cotacoes.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `apresentacao_cotacoes`

Seção funcional: 6. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L1121).

- **uuid:** `id`, `apresentacao_id`, `cotacao_id`, `parcelamento_id`.
- **integer:** `ordem`.
- **boolean:** `recomendada`.
- **text:** `titulo_comercial`, `vantagens_texto`, `observacao_comercial`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `apresentacao_id`, `cotacao_id`, `ordem`.

**FKs:** `apresentacao_id` → `apresentacoes_comerciais.id`; `cotacao_id` → `cotacoes.id`; `parcelamento_id` → `cotacao_parcelamentos.id`.

**Unicidade/índices adicionais:** `(apresentacao_id, cotacao_id) [unique]`; `(apresentacao_id, ordem) [unique]`.

### Tabela `apolices`

Seção funcional: 2 / 4 / 5. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L1144).

- **uuid:** `id`, `segurado_id`, `seguradora_id`, `ramo_id`, `renovada_de_id`, `produtor_id`.
- **text:** `status`, `numero_apolice`, `numero_controle_documento`, `tipo_contratacao`, `tipo_apolice`, `certificado_individual`, `processo_susep`, `estipulante_nome`, `estipulante_cpf_cnpj`, `subestipulante_nome`, `subestipulante_cpf_cnpj`, `vigencia_inicio_hora`, `vigencia_fim_hora`, `moeda`, `periodicidade_pagamento`, `motivo_status`, `canal_emissao`, `observacoes`.
- **date:** `vigencia_inicio`, `vigencia_fim`, `data_emissao`, `data_recebimento_documento`.
- **numeric:** `premio_total`, `premio_liquido`, `iof`, `adicional_fracionamento`, `lmg_total`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `segurado_id`.

**FKs:** `segurado_id` → `segurados.id`; `seguradora_id` → `seguradoras.id`; `ramo_id` → `ramos.id`; `renovada_de_id` → `apolices.id`; `produtor_id` → `produtores.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `propostas`

Seção funcional: 2 / 4 / 5. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L1188).

- **uuid:** `id`, `apolice_id`, `cotacao_id`, `stage_id`, `responsavel_id`, `recebimento_grade_id`, `endosso_subtipo_id`, `cancelamento_motivo_id`.
- **text:** `tipo`, `numero_proposta`, `numero_endosso`, `numero_controle_documento`, `protocolo_seguradora`, `tipo_movimento_endosso`, `motivo_recusa`, `forma_pagamento`, `periodicidade_pagamento`, `numero_fatura`, `observacoes`.
- **date:** `data_transmissao`, `data_recebimento_seguradora`, `data_aceitacao`, `data_recusa`, `data_emissao`, `vigencia_inicio`, `vigencia_fim`, `primeira_parcela_vencimento`, `competencia_inicio`, `competencia_fim`.
- **numeric:** `premio_total`, `premio_liquido`, `iof`, `adicional_fracionamento`, `primeira_parcela_valor`, `comissao_pct`, `agenciamento_pct`.
- **integer:** `qtd_parcelas`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `apolice_id`, `stage_id`.

**FKs:** `apolice_id` → `apolices.id`; `cotacao_id` → `cotacoes.id`; `stage_id` → `pipeline_stages.id`; `responsavel_id` → `profiles.id`; `recebimento_grade_id` → `recebimento_grades.id`; `endosso_subtipo_id` → `endosso_subtipos.id`; `cancelamento_motivo_id` → `cancelamento_motivos.id`.

**Unicidade/índices adicionais:** `cotacao_id`.

### Tabela `apolice_itens`

Seção funcional: 2 / 4 / 5. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L1239).

- **uuid:** `id`, `apolice_id`, `incluido_por_proposta_id`, `excluido_por_proposta_id`.
- **text:** `risk_type`, `descricao`, `identificador_externo`, `endereco_risco_resumo`, `status`, `observacoes`.
- **integer:** `numero_item`.
- **numeric:** `valor_risco`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `apolice_id`.

**FKs:** `apolice_id` → `apolices.id`; `incluido_por_proposta_id` → `propostas.id`; `excluido_por_proposta_id` → `propostas.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `item_veiculo`

Seção funcional: 2 / 4 / 5. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L1264).

- **uuid:** `apolice_item_id`.
- **text:** `codigo_fipe`, `marca`, `modelo`, `versao`, `placa`, `chassi`, `renavam`, `combustivel`, `cambio`, `categoria`, `uso`, `cep_pernoite`, `condutor_principal_nome`, `condutor_principal_cpf`.
- **integer:** `ano_fabricacao`, `ano_modelo`, `classe_bonus`.
- **boolean:** `zero_km`, `blindado`, `alienado`, `rastreador`, `antifurto`, `kit_gas`.
- **date:** `condutor_principal_data_nascimento`.

**PK:** `apolice_item_id`. **Não nulos (inclui PK):** `apolice_item_id`.

**FKs:** `apolice_item_id` → `apolice_itens.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `item_imovel`

Seção funcional: 2 / 4 / 5. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L1292).

- **uuid:** `apolice_item_id`.
- **text:** `cep`, `endereco`, `numero`, `complemento`, `bairro`, `cidade`, `uf`, `tipo_imovel`, `tipo_ocupacao`, `tipo_construcao`.
- **numeric:** `area_m2`, `valor_imovel`.
- **boolean:** `condominio_fechado`, `desocupado`.

**PK:** `apolice_item_id`. **Não nulos (inclui PK):** `apolice_item_id`.

**FKs:** `apolice_item_id` → `apolice_itens.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `item_empresa`

Seção funcional: 2 / 4 / 5. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L1310).

- **uuid:** `apolice_item_id`.
- **text:** `cnpj_risco`, `razao_social_risco`, `atividade`, `cnae`, `cep`, `endereco`, `numero`, `complemento`, `bairro`, `cidade`, `uf`, `tipo_construcao`, `protecao_incendio`.
- **numeric:** `faturamento_anual`, `area_m2`, `valor_estoque`, `valor_equipamentos`.
- **integer:** `qtd_funcionarios`.

**PK:** `apolice_item_id`. **Não nulos (inclui PK):** `apolice_item_id`.

**FKs:** `apolice_item_id` → `apolice_itens.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `item_vida`

Seção funcional: 2 / 4 / 5. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L1332).

- **uuid:** `apolice_item_id`, `pessoa_id`.
- **text:** `nome_grupo`, `certificado_individual`, `parentesco`, `sexo`, `profissao`, `beneficiarios_texto`.
- **integer:** `n_vidas`.
- **date:** `data_nascimento`, `data_inclusao`, `data_exclusao`.
- **numeric:** `salario`, `capital_individual`.

**PK:** `apolice_item_id`. **Não nulos (inclui PK):** `apolice_item_id`.

**FKs:** `apolice_item_id` → `apolice_itens.id`; `pessoa_id` → `segurados.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `item_coberturas`

Seção funcional: 2 / 4 / 5. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L1358).

- **uuid:** `id`, `apolice_item_id`, `cobertura_id`, `incluido_por_proposta_id`, `excluido_por_proposta_id`.
- **numeric:** `capital_lmi`, `franquia_valor`, `premio`, `premio_liquido`, `participacao_obrigatoria_pct`.
- **text:** `franquia_tipo`, `observacoes`.
- **integer:** `carencia_dias`.
- **date:** `vigencia_inicio`, `vigencia_fim`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `apolice_item_id`.

**FKs:** `apolice_item_id` → `apolice_itens.id`; `cobertura_id` → `coberturas_catalogo.id`; `incluido_por_proposta_id` → `propostas.id`; `excluido_por_proposta_id` → `propostas.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `sinistros`

Seção funcional: 2 / 4 / 5. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L1387).

- **uuid:** `id`, `apolice_id`, `stage_id`, `responsavel_id`.
- **text:** `numero_sinistro`, `numero_aviso`, `protocolo_seguradora`, `cobertura_codigo`, `cobertura_nome`, `tipo_sinistro`, `causa`, `descricao`, `local_ocorrencia`, `status`, `negativa_motivo`, `regulador_nome`, `oficina_nome`, `observacoes`.
- **date:** `data_ocorrencia`, `data_aviso`, `data_registro_aviso`, `data_documentacao_completa`, `data_liquidacao_financeira`, `data_conclusao`, `data_salvado`, `data_ressarcimento`.
- **numeric:** `valor_estimado`, `valor_indenizado`, `valor_pendente`, `valor_despesas_regulacao`, `valor_salvado`, `valor_ressarcimento`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `apolice_id`, `stage_id`.

**FKs:** `apolice_id` → `apolices.id`; `stage_id` → `pipeline_stages.id`; `responsavel_id` → `profiles.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `sinistro_envolvidos`

Seção funcional: 2 / 4 / 5. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L1428).

- **uuid:** `id`, `sinistro_id`, `apolice_item_id`.
- **text:** `tipo`, `nome`, `cpf_cnpj`, `email`, `telefone`, `placa`, `seguradora_terceiro`, `apolice_terceiro`, `tipo_dano`, `observacoes`.
- **numeric:** `valor_reclamado`, `valor_indenizado`.
- **boolean:** `responsavel_pelo_evento`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `sinistro_id`.

**FKs:** `sinistro_id` → `sinistros.id`; `apolice_item_id` → `apolice_itens.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `pos_vendas`

Seção funcional: 2 / 4 / 5. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L1452).

- **uuid:** `id`, `apolice_id`, `stage_id`, `responsavel_id`.
- **text:** `tipo_processo`, `status`, `prioridade`, `assunto`, `descricao`, `motivo_pendencia`, `resultado`, `observacoes`.
- **date:** `data_abertura`, `data_conclusao_prevista`, `data_conclusao`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `apolice_id`, `stage_id`.

**FKs:** `apolice_id` → `apolices.id`; `stage_id` → `pipeline_stages.id`; `responsavel_id` → `profiles.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `recebimento_grades`

Seção funcional: G8 / 2. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L1491).

- **uuid:** `id`, `seguradora_id`, `ramo_id`.
- **text:** `nome`, `tipo`, `base_calculo`, `observacoes`.
- **integer:** `qtd_parcelas`.
- **numeric:** `percentual_default`.
- **boolean:** `considera_iof`, `considera_adicional_fracionamento`, `vitalicio`, `ativo`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `seguradora_id`, `ramo_id`.

**FKs:** `seguradora_id` → `seguradoras.id`; `ramo_id` → `ramos.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `recebimento_grade_parcelas`

Seção funcional: G8 / 2. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L1512).

- **uuid:** `id`, `grade_id`.
- **integer:** `numero`, `dias_apos_vencimento`.
- **text:** `tipo_comissao`, `percentual_sobre`.
- **numeric:** `percentual`.
- **boolean:** `ativo`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `grade_id`.

**FKs:** `grade_id` → `recebimento_grades.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `repasse_regras`

Seção funcional: G8 / 2. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L1527).

- **uuid:** `id`, `tenant_id`, `filial_id`, `produtor_id`, `ramo_id`.
- **text:** `papel`, `tipo_documento`, `base`, `gatilho`, `observacoes`.
- **numeric:** `percentual`, `valor_fixo`.
- **integer:** `qtd_parcelas`, `limite_parcelas`, `prioridade`.
- **date:** `inicio_vigencia`, `fim_vigencia`.
- **boolean:** `ativo`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `tenant_id`.

**FKs:** `tenant_id` → `tenants.id`; `filial_id` → `filiais.id`; `produtor_id` → `produtores.id`; `ramo_id` → `ramos.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `parcelas`

Seção funcional: 3. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L1569).

- **uuid:** `id`, `proposta_id`.
- **integer:** `numero`.
- **date:** `vencimento`, `data_pagamento`, `data_baixa`, `competencia_inicio`, `competencia_fim`.
- **numeric:** `valor`, `valor_liquido`, `iof`, `adicional_fracionamento`, `valor_pago`.
- **text:** `status`, `forma_pagamento`, `nosso_numero`, `linha_digitavel`, `codigo_barras`, `numero_fatura`, `observacoes`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `proposta_id`.

**FKs:** `proposta_id` → `propostas.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `financeiro_cobrancas`

Seção funcional: 3. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L1594).

- **uuid:** `id`, `parcela_id`, `stage_id`, `responsavel_id`.
- **date:** `data_abertura`, `vencimento_followup`.
- **text:** `status`, `prioridade`, `canal_preferencial`, `observacoes`, `motivo_encerramento`.
- **timestamptz:** `ultima_cobranca_em`, `proxima_cobranca_em`, `encerrada_em`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `parcela_id`, `stage_id`.

**FKs:** `parcela_id` → `parcelas.id`; `stage_id` → `pipeline_stages.id`; `responsavel_id` → `profiles.id`.

**Unicidade/índices adicionais:** `parcela_id`.

### Tabela `comissoes`

Seção funcional: 3. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L1617).

- **uuid:** `id`, `proposta_id`, `parcela_id`.
- **integer:** `numero`.
- **text:** `tipo_comissao`, `status`, `observacoes`.
- **numeric:** `percentual`, `base_calculo`, `valor_previsto`, `valor_recebido`, `valor_diferenca`.
- **date:** `prevista_em`, `recebida_em`, `competencia_inicio`, `competencia_fim`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `proposta_id`.

**FKs:** `proposta_id` → `propostas.id`; `parcela_id` → `parcelas.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `comissao_extratos`

Seção funcional: 3. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L1654).

- **uuid:** `id`, `tenant_id`, `filial_id`, `seguradora_id`, `recebido_por_id`, `processado_por_id`.
- **text:** `identificacao_externa`, `arquivo_nome`, `arquivo_referencia`, `origem_tipo`, `origem_formato`, `arquivo_mime_type`, `arquivo_hash_sha256`, `chave_idempotencia`, `parser_identificador`, `parser_versao`, `status_processamento`, `status_conciliacao`, `moeda`, `erro_codigo`, `erro_mensagem_segura`, `observacoes`.
- **date:** `competencia`, `periodo_inicio`, `periodo_fim`, `data_emissao`, `data_recebimento`.
- **integer:** `tentativa_processamento`, `quantidade_itens`.
- **numeric:** `valor_bruto_total`, `valor_liquido_total`, `valor_descontos_total`.
- **timestamptz:** `recebido_em`, `processamento_iniciado_em`, `processamento_concluido_em`, `criado_em`, `atualizado_em`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `tenant_id`, `filial_id`, `seguradora_id`, `origem_tipo`, `chave_idempotencia`, `tentativa_processamento`, `status_processamento`, `status_conciliacao`, `criado_em`, `atualizado_em`.

**FKs:** `tenant_id` → `tenants.id`; `filial_id` → `filiais.id`; `seguradora_id` → `seguradoras.id`; `recebido_por_id` → `profiles.id`; `processado_por_id` → `profiles.id`.

**Unicidade/índices adicionais:** `(filial_id, chave_idempotencia) [unique]`; `(filial_id, seguradora_id, arquivo_hash_sha256) [unique]`; `(filial_id, seguradora_id, identificacao_externa) [unique]`.

### Tabela `comissao_extrato_itens`

Seção funcional: 3. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L1705).

- **uuid:** `id`, `extrato_id`, `produtor_id`, `ramo_id`.
- **text:** `identificacao_externa`, `sequencia_externa`, `chave_idempotencia`, `produtor_beneficiario_informado`, `proposta_numero_informado`, `apolice_numero_informado`, `endosso_numero_informado`, `documento_numero_informado`, `parcela_numero_informado`, `segurado_nome_informado`, `tipo_comissao`, `seguradora_lote_informado`, `seguradora_referencia_informada`, `descricao_original`, `status_conciliacao`.
- **date:** `competencia`, `data_credito`, `data_recebimento_informada`.
- **numeric:** `valor_bruto_informado`, `valor_liquido_informado`, `valor_descontos_informado`, `percentual_informado`.
- **timestamptz:** `normalizado_em`, `criado_em`, `atualizado_em`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `extrato_id`, `chave_idempotencia`, `status_conciliacao`, `criado_em`, `atualizado_em`.

**FKs:** `extrato_id` → `comissao_extratos.id`; `produtor_id` → `produtores.id`; `ramo_id` → `ramos.id`.

**Unicidade/índices adicionais:** `(extrato_id, chave_idempotencia) [unique]`; `(extrato_id, identificacao_externa) [unique]`; `(extrato_id, sequencia_externa) [unique]`.

### Tabela `comissao_conciliacoes`

Seção funcional: 3. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L1745).

- **uuid:** `id`, `item_id`, `comissao_id`, `associado_por_id`, `confirmado_por_id`.
- **text:** `chave_idempotencia`, `tipo_associacao`, `status`, `motivo`.
- **numeric:** `confianca_pct`, `valor_previsto_snapshot`, `valor_informado_alocado`, `valor_conciliado`, `valor_diferenca`, `percentual_previsto_snapshot`, `percentual_informado_snapshot`, `percentual_diferenca`.
- **date:** `competencia_prevista_inicio`, `competencia_prevista_fim`, `competencia_informada`.
- **timestamptz:** `criado_em`, `confirmado_em`, `atualizado_em`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `item_id`, `comissao_id`, `chave_idempotencia`, `tipo_associacao`, `status`, `criado_em`, `atualizado_em`.

**FKs:** `item_id` → `comissao_extrato_itens.id`; `comissao_id` → `comissoes.id`; `associado_por_id` → `profiles.id`; `confirmado_por_id` → `profiles.id`.

**Unicidade/índices adicionais:** `(item_id, comissao_id) [unique]`; `(item_id, chave_idempotencia) [unique]`.

### Tabela `comissao_conciliacao_ocorrencias`

Seção funcional: 3. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L1777).

- **uuid:** `id`, `item_id`, `conciliacao_id`, `identificada_por_id`, `resolvida_por_id`.
- **text:** `tipo`, `status`, `motivo`, `resolucao_tipo`, `resolucao_observacao`.
- **numeric:** `valor_esperado`, `valor_encontrado`, `percentual_esperado`, `percentual_encontrado`.
- **date:** `competencia_esperada_inicio`, `competencia_esperada_fim`, `competencia_encontrada`.
- **timestamptz:** `identificada_em`, `resolvida_em`, `atualizado_em`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `item_id`, `tipo`, `status`, `identificada_em`, `atualizado_em`.

**FKs:** `item_id` → `comissao_extrato_itens.id`; `conciliacao_id` → `comissao_conciliacoes.id`; `identificada_por_id` → `profiles.id`; `resolvida_por_id` → `profiles.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `comissao_baixas`

Seção funcional: 3. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L1817).

- **uuid:** `id`, `comissao_id`, `baixa_origem_id`, `criado_por_id`.
- **text:** `tipo`, `origem_tipo`, `motivo_tipo`, `justificativa`, `chave_idempotencia`, `status_resultante`.
- **date:** `data_efetiva`.
- **numeric:** `valor_efetivo`, `saldo_apos`.
- **timestamptz:** `criado_em`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `comissao_id`, `tipo`, `origem_tipo`, `data_efetiva`, `valor_efetivo`, `motivo_tipo`, `chave_idempotencia`, `saldo_apos`, `status_resultante`, `criado_por_id`, `criado_em`.

**FKs:** `comissao_id` → `comissoes.id`; `baixa_origem_id` → `comissao_baixas.id`; `criado_por_id` → `profiles.id`.

**Unicidade/índices adicionais:** `(comissao_id, chave_idempotencia) [unique]`; `baixa_origem_id`.

### Tabela `comissao_baixa_conciliacoes`

Seção funcional: 3. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L1843).

- **uuid:** `id`, `baixa_id`, `conciliacao_id`.
- **numeric:** `valor_aplicado`.
- **timestamptz:** `criado_em`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `baixa_id`, `conciliacao_id`, `valor_aplicado`, `criado_em`.

**FKs:** `baixa_id` → `comissao_baixas.id`; `conciliacao_id` → `comissao_conciliacoes.id`.

**Unicidade/índices adicionais:** `(baixa_id, conciliacao_id) [unique]`.

### Tabela `repasses`

Seção funcional: 3. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L1856).

- **uuid:** `id`, `proposta_id`, `comissao_id`, `beneficiario_id`, `regra_id`.
- **integer:** `numero`.
- **text:** `papel_beneficiario`, `base`, `status`, `forma_pagamento`, `comprovante_referencia`, `observacoes`.
- **numeric:** `percentual`, `valor_previsto`, `valor_pago`, `valor_diferenca`.
- **date:** `previsto_em`, `liberado_em`, `pago_em`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `proposta_id`, `beneficiario_id`.

**FKs:** `proposta_id` → `propostas.id`; `comissao_id` → `comissoes.id`; `beneficiario_id` → `produtores.id`; `regra_id` → `repasse_regras.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `repasse_recibos`

Seção funcional: 3. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L1899).

- **uuid:** `id`, `filial_id`, `beneficiario_id`, `emitido_por_id`, `cancelado_por_id`.
- **text:** `numero`, `sentido`, `status`, `forma_pagamento`, `comprovante_referencia`, `observacoes`, `chave_idempotencia`, `chave_cancelamento`, `filial_nome_snapshot`, `beneficiario_nome_snapshot`, `motivo_cancelamento`.
- **date:** `data_pagamento`.
- **timestamptz:** `emitido_em`, `cancelado_em`, `atualizado_em`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `filial_id`, `beneficiario_id`, `numero`, `sentido`, `status`, `data_pagamento`, `forma_pagamento`, `chave_idempotencia`, `filial_nome_snapshot`, `beneficiario_nome_snapshot`, `emitido_por_id`, `emitido_em`, `atualizado_em`.

**FKs:** `filial_id` → `filiais.id`; `beneficiario_id` → `produtores.id`; `emitido_por_id` → `profiles.id`; `cancelado_por_id` → `profiles.id`.

**Unicidade/índices adicionais:** `(filial_id, numero) [unique]`; `(filial_id, chave_idempotencia) [unique]`; `beneficiario_id`; `status`.

### Tabela `repasse_recibo_itens`

Seção funcional: 3. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L1932).

- **uuid:** `id`, `recibo_id`, `repasse_id`.
- **integer:** `numero_repasse_snapshot`.
- **text:** `documento_referencia_snapshot`, `segurado_nome_snapshot`, `seguradora_nome_snapshot`, `ramo_nome_snapshot`, `papel_beneficiario_snapshot`.
- **numeric:** `valor_previsto_snapshot`, `valor_pago_snapshot`.
- **timestamptz:** `criado_em`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `recibo_id`, `repasse_id`, `documento_referencia_snapshot`, `segurado_nome_snapshot`, `seguradora_nome_snapshot`, `ramo_nome_snapshot`, `valor_previsto_snapshot`, `valor_pago_snapshot`, `criado_em`.

**FKs:** `recibo_id` → `repasse_recibos.id`; `repasse_id` → `repasses.id`.

**Unicidade/índices adicionais:** `(recibo_id, repasse_id) [unique]`; `repasse_id`.

### Tabela `atividades`

Seção funcional: 1 / 8. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L1967).

- **uuid:** `id`, `tenant_id`, `filial_id`, `responsavel_id`, `entidade_id`.
- **text:** `entidade_tipo`, `tipo`, `titulo`, `descricao`, `status`, `prioridade`, `canal`, `origem`, `observacoes`.
- **timestamptz:** `vencimento`, `concluida_em`, `fixada_em`, `lembrete_em`.
- **boolean:** `recorrente`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `tenant_id`.

**FKs:** `tenant_id` → `tenants.id`; `filial_id` → `filiais.id`; `responsavel_id` → `profiles.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `atividade_mencoes`

Seção funcional: 1 / 8. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L1996).

- **uuid:** `id`, `atividade_id`, `profile_id`.
- **timestamptz:** `lida_em`, `notificada_em`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `atividade_id`, `profile_id`.

**FKs:** `atividade_id` → `atividades.id`; `profile_id` → `profiles.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `anexos`

Seção funcional: 1 / 8. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L2006).

- **uuid:** `id`, `tenant_id`, `filial_id`, `entidade_id`.
- **text:** `entidade_tipo`, `nome_arquivo`, `mime_type`, `url_armazenamento`, `categoria`, `descricao`, `origem`, `status`, `hash_sha256`.
- **integer:** `tamanho_bytes`.
- **timestamptz:** `anexado_em`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `tenant_id`.

**FKs:** `tenant_id` → `tenants.id`; `filial_id` → `filiais.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `audit_logs`

Seção funcional: 1 / 8. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L2024).

- **uuid:** `id`, `tenant_id`, `user_id`, `entidade_id`.
- **text:** `entidade_tipo`, `campo`, `valor_antigo`, `valor_novo`, `acao`, `origem`, `ip`, `user_agent`.
- **timestamptz:** `ocorrido_em`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `tenant_id`.

**FKs:** `tenant_id` → `tenants.id`; `user_id` → `profiles.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `integracao_logs`

Seção funcional: 1 / 8. Responsabilidade exclusiva do backend, sem tipo/tela de domínio. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L2048).

- **uuid:** `id`, `tenant_id`, `entidade_id`.
- **text:** `sistema`, `direcao`, `entidade_tipo`, `operacao`, `status`, `chave_externa`, `correlation_id`, `payload_text`, `resposta_text`, `erro_text`.
- **timestamptz:** `iniciado_em`, `concluido_em`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `tenant_id`.

**FKs:** `tenant_id` → `tenants.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `campo_definicoes`

Seção funcional: 1 / G8. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L2083).

- **uuid:** `id`, `tenant_id`, `filial_id`.
- **text:** `entidade_tipo`, `chave`, `nome`, `tipo_dado`, `formato`, `ajuda`, `mascara`, `placeholder`, `agrupamento`.
- **boolean:** `obrigatorio`, `ativo`, `visivel_em_listagem`.
- **integer:** `ordem`, `tamanho_max`.
- **numeric:** `min_valor`, `max_valor`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `tenant_id`, `entidade_tipo`, `chave`.

**FKs:** `tenant_id` → `tenants.id`; `filial_id` → `filiais.id`.

**Unicidade/índices adicionais:** `(tenant_id, entidade_tipo, chave) [unique]`.

### Tabela `campo_opcoes`

Seção funcional: 1 / G8. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L2122).

- **uuid:** `id`, `campo_definicao_id`.
- **text:** `rotulo`, `valor`.
- **integer:** `ordem`.
- **boolean:** `ativo`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `campo_definicao_id`.

**FKs:** `campo_definicao_id` → `campo_definicoes.id`.

**Unicidade/índices adicionais:** nenhum declarado no bloco; regras funcionais adicionais constam das seções acima.

### Tabela `campo_valores`

Seção funcional: 1 / G8. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L2135).

- **uuid:** `id`, `campo_definicao_id`, `entidade_id`, `valor_opcao_id`.
- **text:** `valor_texto`, `origem`.
- **numeric:** `valor_numero`.
- **boolean:** `valor_booleano`.
- **date:** `valor_data`.
- **timestamptz:** `valor_datahora`, `preenchido_em`, `validado_em`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `campo_definicao_id`, `entidade_id`.

**FKs:** `campo_definicao_id` → `campo_definicoes.id`; `valor_opcao_id` → `campo_opcoes.id`.

**Unicidade/índices adicionais:** `(campo_definicao_id, entidade_id) [unique]`; `entidade_id`.

### Tabela `campo_valor_opcoes`

Seção funcional: 1 / G8. Representada nos tipos do frontend; edição por fluxo e campos de serviço conforme as seções funcionais. [Fonte DBML](.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml#L2163).

- **uuid:** `id`, `campo_valor_id`, `campo_opcao_id`.
- **integer:** `ordem`.

**PK:** `id`. **Não nulos (inclui PK):** `id`, `campo_valor_id`, `campo_opcao_id`.

**FKs:** `campo_valor_id` → `campo_valores.id`; `campo_opcao_id` → `campo_opcoes.id`.

**Unicidade/índices adicionais:** `(campo_valor_id, campo_opcao_id) [unique]`.
