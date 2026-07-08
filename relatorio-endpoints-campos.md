# Relatorio unico de Endpoints & Campos — WassisCRM

> Contrato de referencia: `.codex/artefatos/wassis_erp_esqueleto_v2_0.dbml` e
> `.codex/artefatos/instrucoes_projeto_wassis_v2_0.md`.
>
> Este arquivo e o hand-off incremental e versionavel na raiz do projeto. O
> projeto segue frontend puro: o front autora e simula contra mock em memoria;
> backend, RLS/RBAC, APIs reais, SQL, migrations e enforcement ficam fora deste
> repositorio.

## Historico consolidado

Os documentos abaixo permanecem como fonte historica detalhada:

- `.codex/artefatos/endpoints/0.1-plataforma-corretoras.md`
- `.codex/artefatos/endpoints/0.2-produtores.md`
- `.codex/artefatos/endpoints/0.3-segurados.md`

## Status por fase

| Fase | Modulo | Status neste relatorio |
|---|---|---|
| 0.1 | Plataforma multi-corretora | Consolidado |
| 0.2 | Produtores | Consolidado |
| 0.3 | Segurados | Consolidado |
| 0.4a | Ramos reconciliados | Absorvido pela consolidacao G8 |
| 0.4b | Catalogos auxiliares | Absorvido pela consolidacao G8 |
| G8 | Configuracoes V2 como hub de cadastros | Consolidado em 2026-07-08 |
| 0.5 | Funis & Etapas reconciliados | Consolidado em 2026-07-08 |

---

## 0.1 — Plataforma multi-corretora

### Entidades DBML

- `tenants`
- `filiais`
- `profiles`
- `perfis`
- `profile_filiais`
- `role_permissions`
- `segurados`
- `oportunidades`
- `audit_logs`

### Campos de negocio

#### `filiais`

- `id`
- `tenant_id`
- `matriz_id`
- `razao_social`
- `fantasia`
- `cnpj_cpf`
- `susep`
- `percentual_imposto`
- `lgpd_aceito`
- `lgpd_aceito_em`
- `gerente`
- `gerente_id`
- `contato`
- `home_page`
- `email`
- `telefone`
- `celular`
- `telefone2`
- `cep`
- `endereco`
- `numero`
- `complemento`
- `bairro`
- `cidade`
- `uf`
- `ativo`

#### `perfis`

- `id`
- `tenant_id`
- `nome`
- `sistema`
- `ativo`

#### `profile_filiais`

- `id`
- `profile_id`
- `filial_id`
- `perfil_id`
- `principal`

#### `role_permissions`

- `id`
- `perfil_id`
- `module`
- `can_read`
- `can_create`
- `can_update`
- `can_delete`

### Operacoes esperadas

| Operacao | Contrato esperado | Observacoes |
|---|---|---|
| Listar corretoras ativas | `GET /filiais?ativo=true&order=razao_social` | Escopo por tenant e permissoes do usuario |
| Criar corretora | `POST /filiais` | Front envia campos de negocio e `ativo=true` |
| Editar corretora | `PATCH /filiais/:id` | Backend valida tenant, matriz e unicidade |
| Inativar corretora | `PATCH /filiais/:id { ativo:false }` | Soft-disable, sem delete fisico |
| Listar perfis | `GET /perfis?ativo=true` | Catalogo do grupo |
| Criar/renomear/inativar perfil | `POST/PATCH /perfis` | Perfil `sistema=true` nao deve ser deletavel |
| Atualizar matriz de permissoes | `POST/PATCH /role_permissions` | Enforcement real no backend |
| Vincular usuario a corretora/perfil | `POST/PATCH/DELETE /profile_filiais` | Perfil e corretora por usuario |
| Listar equipe | RPC `get_team_members()` | Sem papel global; deriva de `profile_filiais` |
| Convidar usuario | Edge function/RPC `invite-user` | Acesso por corretora atribuido depois |

### Regras de validacao e backend

- `filiais (tenant_id, cnpj_cpf)` deve ser unico.
- No maximo uma matriz por tenant; bloquear auto-referencia, ciclos e cadeias.
- `profile_filiais (profile_id, filial_id)` deve ser unico.
- Deve haver no maximo uma corretora principal por usuario.
- Permissao de negocio vem de `profile_filiais.perfil_id -> role_permissions`.
- O filtro do front e apenas UX; RLS/RBAC real e responsabilidade do backend.
- `segurados` e `oportunidades` devem ser carimbados com `filial_id`.

---

## 0.2 — Produtores

### Entidades DBML

- `produtores`
- `profiles`
- `segurados`
- `filiais`
- `audit_logs`

### Campos de negocio

#### `produtores`

- `id`
- `tenant_id`
- `profile_id`
- `nome`
- `cpf_cnpj`
- `email`
- `telefone`
- `celular`
- `banco`
- `agencia`
- `conta`
- `chave_pix`
- `percentual_repasse_padrao`
- `ativo`
- `created_at`
- `updated_at`

### Operacoes esperadas

| Operacao | Contrato esperado | Observacoes |
|---|---|---|
| Listar produtores ativos | `GET /produtores?ativo=true&order=nome` | Catalogo do grupo |
| Criar produtor | `POST /produtores` | Interno se `profile_id` preenchido; externo se `NULL` |
| Editar produtor | `PATCH /produtores/:id` | Nao reescreve historico de segurados/apolices/repasses |
| Inativar produtor | `PATCH /produtores/:id { ativo:false }` | Soft-delete |
| Auditar mutacoes | `POST /audit_logs` | `CREATE_PRODUTOR`, `UPDATE_PRODUTOR`, `DEACTIVATE_PRODUTOR` |

### Lookups e responsabilidades do backend

- `segurados.produtor_id` e `segurados.gerente_id` apontam para `produtores.id`.
- `filiais.gerente_id` deve preferir FK para `produtores.id`, preservando
  `filiais.gerente` como texto legado/compatibilidade.
- `profile_id` preenchido deve pertencer ao mesmo tenant.
- Esperado `UNIQUE(profile_id) WHERE profile_id IS NOT NULL`.
- Produtor inativo nao aparece para novas selecoes, mas historico permanece
  resolvivel.

---

## 0.3 — Segurados

### Entidades DBML

- `segurados`
- `pessoa_contato`
- `produtores`
- `filiais`
- `oportunidades`

### Campos de negocio

#### `segurados`

- `id`
- `tenant_id`
- `filial_id`
- `tipo`
- `nome`
- `nome_fantasia`
- `cpf_cnpj`
- `status`
- `lgpd_autorizado`
- `produtor_id`
- `gerente_id`
- campos de contato
- campos de endereco
- campos especificos PF/PJ usados pelo front

#### `pessoa_contato`

- `id`
- `tenant_id`
- `pj_id`
- `pf_id`
- `cargo`
- `principal`

### Operacoes esperadas

| Operacao | Contrato esperado | Observacoes |
|---|---|---|
| Listar segurados | `GET /segurados?filial_id=:ativa&order=nome` | Corretora ativa; RLS real no backend |
| Obter segurado | `GET /segurados/:id` | Deve resolver produtor/gerente quando necessario |
| Criar segurado | `POST /segurados` | Exige CPF/CNPJ valido e normalizado |
| Editar segurado | `PATCH /segurados/:id` | Mantem unicidade por corretora |
| Listar contatos PJ/PF | `GET /pessoa_contato?pj_id=:id` | Contatos da mesma corretora |
| Criar contato PJ/PF | `POST /pessoa_contato` | PF e PJ continuam cadastros independentes |
| Editar contato PJ/PF | `PATCH /pessoa_contato/:id` | Cargo/principal |
| Remover vinculo PJ/PF | `DELETE /pessoa_contato/:id` | Remove vinculo, nao remove cadastros |

### Regras de validacao e backend

- `UNIQUE(filial_id, cpf_cnpj)`.
- `cpf_cnpj` obrigatorio em cadastro de `segurados`.
- Documento deve ser normalizado com somente digitos.
- A mesma pessoa em outra corretora do grupo gera outro registro independente.
- `pessoa_contato.pj_id` deve apontar para `segurados.tipo = PJ`.
- `pessoa_contato.pf_id` deve apontar para `segurados.tipo = PF`.
- PJ e PF vinculados devem pertencer a mesma `filial_id`.
- Deve haver no maximo um contato principal por `pj_id`.
- Lead sem documento fica em `oportunidades` com `segurado_id = NULL`, nao em
  `segurados`.
- Backend deve poder retornar um sinal controlado de cliente ja existente em
  outra corretora do mesmo grupo, sem vazar dados protegidos.

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
- Nao adicionar nem expandir suporte a `pos_venda` no 0.5; o modulo sera
  aposentado em micro-plano proprio.
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
- Pos-venda ficou fora do escopo por decisao de produto.

---

## Pendencias e limites atuais

- `campo_valores` e `campo_valor_opcoes` ainda nao estao implementados no front;
  fazem parte do proximo recorte recomendado, 1.1.
- Guias transversais ainda usam estado de sessao; 1.2 deve mover para
  `entidade_tipo + entidade_id`.
- Processos legados ainda preservam `pipeline_id`; a migracao para derivacao por
  `stage_id` deve acontecer em fase propria.
- Pos-venda sera aposentado por decisao de produto; nao investir em novos
  contratos, funis ou telas desse modulo antes do micro-plano de remocao.
