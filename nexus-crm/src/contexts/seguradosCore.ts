/**
 * Modelo de exibição / formulário de Segurado no front-end.
 *
 * A fonte da verdade é `public.segurados` no Supabase (in-memory no modo
 * frontend puro). Use `mapSeguradoRowToView` para converter a linha bruta
 * para este modelo de tela.
 *
 * Alinhado ao PRD — Módulo de Cadastro de Pessoas v1.0:
 * entidade unificada PF/PJ + campos exclusivos por tipo + endereço
 * estruturado + atribuição a produtor/gerente (refs `profiles`) + LGPD.
 */

export type StatusPessoa = 'Ativo' | 'Inativo' | 'Prospecto'
export type SexoPessoa = 'M' | 'F' | 'Outro'
export type EstadoCivil =
  | 'Solteiro'
  | 'Casado'
  | 'Divorciado'
  | 'Viuvo'
  | 'UniaoEstavel'
export type PorteEmpresa =
  | 'MEI'
  | 'Microempresa'
  | 'PequenoPorte'
  | 'MedioPorte'
  | 'GrandePorte'

export interface Segurado {
  id: string

  // Identificação
  tipo: 'PF' | 'PJ'
  nome: string
  nomeFantasia?: string
  documento: string
  status: StatusPessoa
  lgpdAutorizado: boolean

  // Contato
  email?: string
  telefone?: string
  chatwootId?: string

  // Endereço estruturado
  cep?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string

  // Atribuição (refs profiles via produtor_id / gerente_id)
  produtorId?: string | null
  produtorNome?: string | null
  gerenteId?: string | null
  gerenteNome?: string | null
  // Apresentação reutilizada pela listagem (avatar inicial + cor)
  gerenteInicial?: string | null
  gerenteCor?: string | null

  // Campos exclusivos de PF
  dataNascimento?: string
  sexo?: SexoPessoa
  estadoCivil?: EstadoCivil

  // Campos exclusivos de PJ
  cnae?: string
  porte?: PorteEmpresa
  site?: string

  // Auditoria mínima (usada em históricos e detalhes)
  createdAt?: string
  updatedAt?: string
}

/**
 * Vínculo PJ ↔ PF (`pessoa_contato`).
 * Apenas um registro com `principal=true` é permitido por `pjId` (regra
 * aplicada na camada de hooks via `useCreatePessoaContato`/`useUpdate...`).
 */
export interface PessoaContato {
  id: string
  pjId: string
  pfId: string
  pjNome?: string
  pjNomeFantasia?: string
  pfNome?: string
  cargo?: string
  principal: boolean
  createdAt?: string
}
