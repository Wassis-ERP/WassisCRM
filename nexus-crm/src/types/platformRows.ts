// Contrato aplicado v3.1; campos opcionais desconhecidos permanecem null.
import type { Database } from './database'

export type TenantRow = {
  id: string
  razao_social: string | null
  nome_fantasia: string | null
  cnpj_cpf: string | null
  slug: string | null
  email: string | null
  telefone: string | null
  celular: string | null
  home_page: string | null
  cep: string | null
  endereco: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  uf: string | null
  pais: string | null
  timezone: string | null
  moeda_padrao: string | null
  status: string | null
  ativo: boolean | null
  criado_em: string | null
  atualizado_em: string | null
}

export type FilialRow = {
  id: string
  tenant_id: string
  matriz_id: string | null
  razao_social: string | null
  fantasia: string | null
  cnpj_cpf: string | null
  susep: string | null
  percentual_imposto: number | null
  lgpd_aceito: boolean | null
  lgpd_aceito_em: string | null
  gerente: string | null
  gerente_id: string | null
  contato: string | null
  home_page: string | null
  email: string | null
  telefone: string | null
  celular: string | null
  telefone2: string | null
  inscricao_estadual: string | null
  inscricao_municipal: string | null
  regime_tributario: string | null
  percentual_iss: number | null
  codigo_corretora: string | null
  codigo_externo: string | null
  municipio_ibge: string | null
  pais: string | null
  horario_atendimento: string | null
  observacoes: string | null
  cep: string | null
  endereco: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  uf: string | null
  ativo: boolean | null
}

export type ProfileRow = {
  id: string
  tenant_id: string
  nome_completo: string | null
  email: string | null
  telefone: string | null
  celular: string | null
  cargo: string | null
  departamento: string | null
  avatar_url: string | null
  status: string | null
  ativo: boolean | null
  ultimo_acesso_em: string | null
  convite_status: string | null
  convite_enviado_em: string | null
}

export type PerfilRow = {
  id: string
  tenant_id: string
  nome: string | null
  descricao: string | null
  sistema: boolean | null
  nivel_acesso: string | null
  ordem: number | null
  ativo: boolean | null
}

export type ProfileFilialRow = {
  id: string
  profile_id: string
  filial_id: string
  perfil_id: string
  principal: boolean | null
  ativo: boolean | null
  data_inicio: string | null
  data_fim: string | null
}

export type RolePermissionRow = {
  id: string
  perfil_id: string
  modulo: string | null
  escopo: 'GRUPO' | 'CORRETORA' | 'PROPRIO' | null
  can_read: boolean | null
  can_create: boolean | null
  can_update: boolean | null
  can_delete: boolean | null
  can_export: boolean | null
  can_manage: boolean | null
}

export type ProdutorRow = {
  id: string
  tenant_id: string
  profile_id: string | null
  nome: string | null
  cpf_cnpj: string | null
  tipo_pessoa: 'PF' | 'PJ' | null
  nome_fantasia: string | null
  rg_ie: string | null
  susep: string | null
  categoria_operacional: string | null
  data_nascimento: string | null
  email: string | null
  telefone: string | null
  celular: string | null
  telefone2: string | null
  cep: string | null
  endereco: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  uf: string | null
  pais: string | null
  banco: string | null
  agencia: string | null
  conta: string | null
  tipo_conta: string | null
  chave_pix: string | null
  favorecido_nome: string | null
  favorecido_cpf_cnpj: string | null
  descontar_imposto: boolean | null
  percentual_imposto: number | null
  percentual_repasse_padrao: number | null
  observacoes: string | null
  ativo: boolean | null
}

export type SeguradoRow = {
  id: string
  tenant_id: string
  filial_id: string
  produtor_id: string | null
  gerente_id: string | null
  cpf_cnpj: string | null
  tipo: Database["public"]["Enums"]["tipo_pessoa"] | null
  nome: string | null
  nome_fantasia: string | null
  status: Database["public"]["Enums"]["status_pessoa"] | null
  lgpd_autorizado: boolean | null
  email: string | null
  telefone: string | null
  chatwoot_id: string | null
  cep: string | null
  logradouro: string | null
  endereco: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
  data_nascimento: string | null
  sexo: Database["public"]["Enums"]["sexo_pessoa"] | null
  estado_civil: Database["public"]["Enums"]["estado_civil"] | null
  cnae: string | null
  porte: Database["public"]["Enums"]["porte_empresa"] | null
  site: string | null
  observacoes: string | null
  created_at: string | null
  updated_at: string | null
  nome_social: string | null
  rg_ie: string | null
  inscricao_municipal: string | null
  atividade_economica: string | null
  profissao: string | null
  renda_mensal: number | null
  cnh_numero: string | null
  cnh_categoria: string | null
  cnh_vencimento: string | null
  celular: string | null
  telefone2: string | null
  whatsapp: string | null
  pais: string | null
  lgpd_autorizado_em: string | null
  origem_importacao: string | null
}

export type PessoaContatoRow = {
  id: string
  pj_id: string
  pf_id: string | null
  nome: string | null
  cargo: string | null
  departamento: string | null
  email: string | null
  telefone: string | null
  celular: string | null
  principal: boolean | null
  ativo: boolean | null
  observacoes: string | null
}

export const platformDefaults = {
  tenants: {
  "razao_social": null,
  "nome_fantasia": null,
  "cnpj_cpf": null,
  "slug": "",
  "email": null,
  "telefone": null,
  "celular": null,
  "home_page": null,
  "cep": null,
  "endereco": null,
  "numero": null,
  "complemento": null,
  "bairro": null,
  "cidade": null,
  "uf": null,
  "pais": null,
  "timezone": null,
  "moeda_padrao": null,
  "status": null,
  "ativo": null,
  "criado_em": null,
  "atualizado_em": null
} as Omit<TenantRow, 'id'>,
  filiais: {
  "matriz_id": null,
  "razao_social": null,
  "fantasia": null,
  "cnpj_cpf": null,
  "susep": null,
  "percentual_imposto": null,
  "lgpd_aceito": false,
  "lgpd_aceito_em": null,
  "gerente": null,
  "gerente_id": null,
  "contato": null,
  "home_page": null,
  "email": null,
  "telefone": null,
  "celular": null,
  "telefone2": null,
  "inscricao_estadual": null,
  "inscricao_municipal": null,
  "regime_tributario": null,
  "percentual_iss": null,
  "codigo_corretora": null,
  "codigo_externo": null,
  "municipio_ibge": null,
  "pais": null,
  "horario_atendimento": null,
  "observacoes": null,
  "cep": null,
  "endereco": null,
  "numero": null,
  "complemento": null,
  "bairro": null,
  "cidade": null,
  "uf": null,
  "ativo": false
} as Omit<FilialRow, 'id' | 'tenant_id'>,
  profiles: {
  "nome_completo": null,
  "email": null,
  "telefone": null,
  "celular": null,
  "cargo": null,
  "departamento": null,
  "avatar_url": null,
  "status": null,
  "ativo": null,
  "ultimo_acesso_em": null,
  "convite_status": null,
  "convite_enviado_em": null
} as Omit<ProfileRow, 'id' | 'tenant_id'>,
  perfis: {
  "nome": "",
  "descricao": null,
  "sistema": false,
  "nivel_acesso": null,
  "ordem": null,
  "ativo": false
} as Omit<PerfilRow, 'id' | 'tenant_id'>,
  profile_filiais: {
  "principal": false,
  "ativo": null,
  "data_inicio": null,
  "data_fim": null
} as Omit<ProfileFilialRow, 'id' | 'profile_id' | 'filial_id' | 'perfil_id'>,
  role_permissions: {
  "modulo": null,
  "escopo": null,
  "can_read": null,
  "can_create": null,
  "can_update": null,
  "can_delete": null,
  "can_export": null,
  "can_manage": null
} as Omit<RolePermissionRow, 'id' | 'perfil_id'>,
  produtores: {
  "profile_id": null,
  "nome": "",
  "cpf_cnpj": null,
  "tipo_pessoa": null,
  "nome_fantasia": null,
  "rg_ie": null,
  "susep": null,
  "categoria_operacional": null,
  "data_nascimento": null,
  "email": null,
  "telefone": null,
  "celular": null,
  "telefone2": null,
  "cep": null,
  "endereco": null,
  "numero": null,
  "complemento": null,
  "bairro": null,
  "cidade": null,
  "uf": null,
  "pais": null,
  "banco": null,
  "agencia": null,
  "conta": null,
  "tipo_conta": null,
  "chave_pix": null,
  "favorecido_nome": null,
  "favorecido_cpf_cnpj": null,
  "descontar_imposto": null,
  "percentual_imposto": null,
  "percentual_repasse_padrao": null,
  "observacoes": null,
  "ativo": false
} as Omit<ProdutorRow, 'id' | 'tenant_id'>,
  segurados: {
  "produtor_id": null,
  "gerente_id": null,
  "cpf_cnpj": null,
  "tipo": "PF",
  "nome": "",
  "nome_fantasia": null,
  "status": "Prospecto",
  "lgpd_autorizado": false,
  "email": null,
  "telefone": null,
  "chatwoot_id": null,
  "cep": null,
  "logradouro": null,
  "endereco": null,
  "numero": null,
  "complemento": null,
  "bairro": null,
  "cidade": null,
  "estado": null,
  "data_nascimento": null,
  "sexo": null,
  "estado_civil": null,
  "cnae": null,
  "porte": null,
  "site": null,
  "observacoes": null,
  "created_at": "",
  "updated_at": "",
  "nome_social": null,
  "rg_ie": null,
  "inscricao_municipal": null,
  "atividade_economica": null,
  "profissao": null,
  "renda_mensal": null,
  "cnh_numero": null,
  "cnh_categoria": null,
  "cnh_vencimento": null,
  "celular": null,
  "telefone2": null,
  "whatsapp": null,
  "pais": null,
  "lgpd_autorizado_em": null,
  "origem_importacao": null
} as Omit<SeguradoRow, 'id' | 'tenant_id' | 'filial_id'>,
  pessoa_contato: {
  "pf_id": null,
  "nome": null,
  "cargo": null,
  "departamento": null,
  "email": null,
  "telefone": null,
  "celular": null,
  "principal": false,
  "ativo": null,
  "observacoes": null
} as Omit<PessoaContatoRow, 'id' | 'pj_id'>,
}

export const platformColumns = {
  "tenants": [
    "id",
    "razao_social",
    "nome_fantasia",
    "cnpj_cpf",
    "slug",
    "email",
    "telefone",
    "celular",
    "home_page",
    "cep",
    "endereco",
    "numero",
    "complemento",
    "bairro",
    "cidade",
    "uf",
    "pais",
    "timezone",
    "moeda_padrao",
    "status",
    "ativo",
    "criado_em",
    "atualizado_em"
  ],
  "filiais": [
    "id",
    "tenant_id",
    "matriz_id",
    "razao_social",
    "fantasia",
    "cnpj_cpf",
    "susep",
    "percentual_imposto",
    "lgpd_aceito",
    "lgpd_aceito_em",
    "gerente",
    "gerente_id",
    "contato",
    "home_page",
    "email",
    "telefone",
    "celular",
    "telefone2",
    "inscricao_estadual",
    "inscricao_municipal",
    "regime_tributario",
    "percentual_iss",
    "codigo_corretora",
    "codigo_externo",
    "municipio_ibge",
    "pais",
    "horario_atendimento",
    "observacoes",
    "cep",
    "endereco",
    "numero",
    "complemento",
    "bairro",
    "cidade",
    "uf",
    "ativo"
  ],
  "profiles": [
    "id",
    "tenant_id",
    "nome_completo",
    "email",
    "telefone",
    "celular",
    "cargo",
    "departamento",
    "avatar_url",
    "status",
    "ativo",
    "ultimo_acesso_em",
    "convite_status",
    "convite_enviado_em"
  ],
  "perfis": [
    "id",
    "tenant_id",
    "nome",
    "descricao",
    "sistema",
    "nivel_acesso",
    "ordem",
    "ativo"
  ],
  "profile_filiais": [
    "id",
    "profile_id",
    "filial_id",
    "perfil_id",
    "principal",
    "ativo",
    "data_inicio",
    "data_fim"
  ],
  "role_permissions": [
    "id",
    "perfil_id",
    "modulo",
    "escopo",
    "can_read",
    "can_create",
    "can_update",
    "can_delete",
    "can_export",
    "can_manage"
  ],
  "produtores": [
    "id",
    "tenant_id",
    "profile_id",
    "nome",
    "cpf_cnpj",
    "tipo_pessoa",
    "nome_fantasia",
    "rg_ie",
    "susep",
    "categoria_operacional",
    "data_nascimento",
    "email",
    "telefone",
    "celular",
    "telefone2",
    "cep",
    "endereco",
    "numero",
    "complemento",
    "bairro",
    "cidade",
    "uf",
    "pais",
    "banco",
    "agencia",
    "conta",
    "tipo_conta",
    "chave_pix",
    "favorecido_nome",
    "favorecido_cpf_cnpj",
    "descontar_imposto",
    "percentual_imposto",
    "percentual_repasse_padrao",
    "observacoes",
    "ativo"
  ],
  "segurados": [
    "id",
    "tenant_id",
    "filial_id",
    "produtor_id",
    "gerente_id",
    "cpf_cnpj",
    "tipo",
    "nome",
    "nome_fantasia",
    "status",
    "lgpd_autorizado",
    "email",
    "telefone",
    "chatwoot_id",
    "cep",
    "logradouro",
    "endereco",
    "numero",
    "complemento",
    "bairro",
    "cidade",
    "estado",
    "data_nascimento",
    "sexo",
    "estado_civil",
    "cnae",
    "porte",
    "site",
    "observacoes",
    "created_at",
    "updated_at",
    "nome_social",
    "rg_ie",
    "inscricao_municipal",
    "atividade_economica",
    "profissao",
    "renda_mensal",
    "cnh_numero",
    "cnh_categoria",
    "cnh_vencimento",
    "celular",
    "telefone2",
    "whatsapp",
    "pais",
    "lgpd_autorizado_em",
    "origem_importacao"
  ],
  "pessoa_contato": [
    "id",
    "pj_id",
    "pf_id",
    "nome",
    "cargo",
    "departamento",
    "email",
    "telefone",
    "celular",
    "principal",
    "ativo",
    "observacoes"
  ]
} as const

export const platformRequired = {
  "tenants": [
    "id"
  ],
  "filiais": [
    "id",
    "tenant_id"
  ],
  "profiles": [
    "id",
    "tenant_id"
  ],
  "perfis": [
    "id",
    "tenant_id"
  ],
  "profile_filiais": [
    "id",
    "profile_id",
    "filial_id",
    "perfil_id"
  ],
  "role_permissions": [
    "id",
    "perfil_id"
  ],
  "produtores": [
    "id",
    "tenant_id"
  ],
  "segurados": [
    "id",
    "tenant_id",
    "filial_id"
  ],
  "pessoa_contato": [
    "id",
    "pj_id"
  ]
} as const
