# Relatorio unico de Endpoints & Campos — WassisCRM

> Contrato de referencia: `.codex/artefatos/wassis_erp_esqueleto_v3_1.dbml` e
> `.codex/artefatos/instrucoes_projeto_wassis_v3_1.md`.
>
> Este arquivo e o snapshot parcial e versionavel do hand-off ja consolidado.
> Por decisao de 2026-07-10, ele nao sera atualizado a cada tela: a proxima
> consolidacao ampla acontecera quando telas e contratos estiverem estabilizados,
> antes da entrega ao backend, ou mediante pedido explicito. O projeto segue
> frontend puro para dados de dominio; backend, RLS/RBAC, APIs de dominio reais,
> SQL, migrations e enforcement ficam fora deste repositorio.

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
| 1.1 | Campos personalizados EAV tipado | Implementado; hand-off adiado para consolidacao final |
| 1.2a-1.2d | Guias, atividades, timeline e notificacoes | Implementado; hand-off adiado para consolidacao final |

---

## Reconciliação de 11/09/2026 — referência v3.1

Os blocos 0.1–0.3 abaixo substituem os snapshots anteriores para plataforma e cadastros. As rotas são contratos propostos para a equipe de backend; o frontend continua usando mock em memória. Demais fases mantêm o status parcial indicado neste documento. O inventário completo de campos de cada tabela é contratual: não significa que todos sejam editáveis na interface. A classificação UI / preservado / serviço está em [resultado da reconciliação](resultado-reconciliacao-front-2026-09-11.md).

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
| Criar/editar pessoa | POST /segurados; PATCH /segurados/:id | tenant e filial obrigatórios/coerentes; nome; documento normalizado e unicidade no grupo. Prospecto admite documento ausente no contrato; fluxos podem exigir conforme estado. |
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
- Esta nota atualiza as decisões comerciais específicas; o hand-off completo de todas as telas comerciais continua sujeito à consolidação final.

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
- `campo_definicoes` deve manter unicidade por escopo relevante, no minimo
  `tenant_id + filial_id + entidade_tipo + chave`.
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
- `pipeline_id` ainda existe em processos legados do front como drift tolerado
  deste recorte. A regra contratual futura e derivar o funil por `stage_id`, mas
  essa migracao deve ser fase propria.
- Pos-venda ficou fora do escopo do recorte 0.5, mas permanece no produto e
  sera reconciliado sobre `apolices` na Fase 4.2.

---

## Pendencias e limites atuais

- `campo_valores` e `campo_valor_opcoes` ja foram implementados no primeiro fluxo
  operacional de Segurado; a documentacao detalhada fica para a consolidacao final.
- Guias transversais ja usam `entidade_tipo + entidade_id` no fluxo de Segurado;
  a expansao ocorre conforme cada modulo for reconstruido.
- Processos legados ainda preservam `pipeline_id`; a migracao para derivacao por
  `stage_id` deve acontecer em fase propria.
- Pos-venda permanece no produto para onboarding do segurado e acompanhamentos
  mensais de ramos faturaveis; o legado deve migrar de `oportunidade_id` para
  `apolice_id` na Fase 4.2.
# Nota de integração — 11/09/2026

A conciliação com main preserva a integração HTTP existente de Segurados e Oportunidades, cujo DTO ainda é anterior ao DBML v3.1. A tipagem canônica foi mantida e a tradução fica em `backendDomainApi.ts`. Campos sem suporte não são descartados em gravações: há bloqueio explícito. Matriz de limitações e responsabilidades em `resultado-publicacao-2026-09-11.md`. Multicalculo e demais módulos continuam em memória.
