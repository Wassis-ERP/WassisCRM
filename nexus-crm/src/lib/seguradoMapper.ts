import type { PessoaContato, Segurado } from '../contexts/seguradosCore'
import type { Database } from '../types/database'

type SeguradoRow = Database['public']['Tables']['segurados']['Row']
type SeguradoUpdate = Database['public']['Tables']['segurados']['Update']
type PessoaContatoRow = Database['public']['Tables']['pessoa_contato']['Row']

/**
 * Linhas devolvidas pelos hooks de detalhe podem trazer joins aninhados
 * (produtor/gerente vindos de `profiles`). Esses campos não fazem parte
 * do schema base, então estendemos o tipo localmente.
 */
type ProfileLite = { id: string; full_name: string | null }
type SeguradoRowWithJoins = SeguradoRow & {
  produtor?: ProfileLite | null
  gerente?: ProfileLite | null
}
type PessoaContatoRowWithJoins = PessoaContatoRow & {
  pj?: Pick<SeguradoRow, 'id' | 'nome' | 'nome_fantasia'> | null
  pf?: Pick<SeguradoRow, 'id' | 'nome'> | null
}

function firstWord(value?: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.split(/\s+/)[0]
}

function initialsFor(name?: string | null): string | null {
  if (!name) return null
  const tokens = name.trim().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return null
  const first = tokens[0][0] ?? ''
  const last = tokens.length > 1 ? tokens[tokens.length - 1][0] ?? '' : ''
  return (first + last).toUpperCase()
}

const GERENTE_COLORS = [
  'bg-blue-500 text-white',
  'bg-emerald-500 text-white',
  'bg-amber-500 text-white',
  'bg-rose-500 text-white',
  'bg-violet-500 text-white',
  'bg-cyan-500 text-white',
]

function colorFor(seed?: string | null): string | null {
  if (!seed) return null
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0
  }
  return GERENTE_COLORS[Math.abs(hash) % GERENTE_COLORS.length]
}

/**
 * Converte linha do Postgres (`public.segurados`) para o modelo de tela.
 * Quando a query trouxer joins de produtor/gerente, os nomes são
 * resolvidos diretamente.
 */
export function mapSeguradoRowToView(row: SeguradoRowWithJoins): Segurado {
  const produtorNome = row.produtor?.full_name ?? null
  const gerenteNome = row.gerente?.full_name ?? null

  return {
    id: row.id,
    tipo: row.tipo,
    nome: row.nome,
    nomeFantasia: row.nome_fantasia ?? undefined,
    documento: row.cpf_cnpj ?? '',
    status: row.status ?? 'Ativo',
    lgpdAutorizado: Boolean(row.lgpd_autorizado),

    email: row.email ?? undefined,
    telefone: row.telefone ?? undefined,
    chatwootId: row.chatwoot_id ?? undefined,

    cep: row.cep ?? undefined,
    logradouro: row.logradouro ?? undefined,
    numero: row.numero ?? undefined,
    complemento: row.complemento ?? undefined,
    bairro: row.bairro ?? undefined,
    cidade: row.cidade ?? undefined,
    estado: row.estado ?? undefined,

    produtorId: row.produtor_id ?? null,
    produtorNome,
    gerenteId: row.gerente_id ?? null,
    gerenteNome,
    gerenteInicial: initialsFor(gerenteNome) ?? firstWord(gerenteNome),
    gerenteCor: colorFor(row.gerente_id ?? gerenteNome),

    dataNascimento: row.data_nascimento ?? undefined,
    sexo: row.sexo ?? undefined,
    estadoCivil: row.estado_civil ?? undefined,

    cnae: row.cnae ?? undefined,
    porte: row.porte ?? undefined,
    site: row.site ?? undefined,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function trimOrNull(value: string | undefined | null): string | null {
  if (value === undefined) return null
  const t = (value ?? '').trim()
  return t === '' ? null : t
}

function applyTipoFilter(u: SeguradoUpdate, tipo: 'PF' | 'PJ' | undefined): SeguradoUpdate {
  // Limpa campos exclusivos do tipo OPOSTO conforme regra do PRD:
  // "Campos exclusivos de PF devem ser ignorados (nulos) quando tipo = PJ e vice-versa".
  if (tipo === 'PF') {
    u.nome_fantasia = null
    u.cnae = null
    u.porte = null
    u.site = null
  } else if (tipo === 'PJ') {
    u.data_nascimento = null
    u.sexo = null
    u.estado_civil = null
  }
  return u
}

/**
 * Monta payload de update a partir do formulário.
 */
export function partialSeguradoToUpdate(data: Partial<Segurado>): SeguradoUpdate {
  const u: SeguradoUpdate = {}
  if (data.nome !== undefined) u.nome = data.nome.trim()
  if (data.nomeFantasia !== undefined) u.nome_fantasia = trimOrNull(data.nomeFantasia)
  if (data.documento !== undefined) u.cpf_cnpj = trimOrNull(data.documento)
  if (data.tipo !== undefined) u.tipo = data.tipo
  if (data.status !== undefined) u.status = data.status
  if (data.lgpdAutorizado !== undefined) u.lgpd_autorizado = data.lgpdAutorizado

  if (data.email !== undefined) u.email = trimOrNull(data.email)
  if (data.telefone !== undefined) u.telefone = trimOrNull(data.telefone)
  if (data.chatwootId !== undefined) u.chatwoot_id = trimOrNull(data.chatwootId)

  if (data.cep !== undefined) u.cep = trimOrNull(data.cep)
  if (data.logradouro !== undefined) u.logradouro = trimOrNull(data.logradouro)
  if (data.numero !== undefined) u.numero = trimOrNull(data.numero)
  if (data.complemento !== undefined) u.complemento = trimOrNull(data.complemento)
  if (data.bairro !== undefined) u.bairro = trimOrNull(data.bairro)
  if (data.cidade !== undefined) u.cidade = trimOrNull(data.cidade)
  if (data.estado !== undefined) u.estado = trimOrNull(data.estado)

  if (data.produtorId !== undefined) u.produtor_id = data.produtorId ?? null
  if (data.gerenteId !== undefined) u.gerente_id = data.gerenteId ?? null

  if (data.dataNascimento !== undefined) u.data_nascimento = trimOrNull(data.dataNascimento)
  if (data.sexo !== undefined) u.sexo = data.sexo ?? null
  if (data.estadoCivil !== undefined) u.estado_civil = data.estadoCivil ?? null

  if (data.cnae !== undefined) u.cnae = trimOrNull(data.cnae)
  if (data.porte !== undefined) u.porte = data.porte ?? null
  if (data.site !== undefined) u.site = trimOrNull(data.site)

  return applyTipoFilter(u, data.tipo)
}

/**
 * Payload de criação compatível com `useCreateSegurado`.
 */
export function buildCreateSeguradoInput(data: Partial<Segurado>) {
  const nome = data.nome?.trim()
  if (!nome) throw new Error('Nome é obrigatório')
  const tipo: 'PF' | 'PJ' = data.tipo ?? 'PF'

  return {
    nome,
    tipo,
    nome_fantasia: trimOrNull(data.nomeFantasia),
    cpf_cnpj: trimOrNull(data.documento),
    status: data.status ?? 'Ativo',
    lgpd_autorizado: data.lgpdAutorizado ?? false,

    email: trimOrNull(data.email),
    telefone: trimOrNull(data.telefone),
    chatwoot_id: trimOrNull(data.chatwootId),

    cep: trimOrNull(data.cep),
    logradouro: trimOrNull(data.logradouro),
    numero: trimOrNull(data.numero),
    complemento: trimOrNull(data.complemento),
    bairro: trimOrNull(data.bairro),
    cidade: trimOrNull(data.cidade),
    estado: trimOrNull(data.estado),

    produtor_id: data.produtorId ?? null,
    gerente_id: data.gerenteId ?? null,

    data_nascimento: tipo === 'PF' ? trimOrNull(data.dataNascimento) : null,
    sexo: tipo === 'PF' ? (data.sexo ?? null) : null,
    estado_civil: tipo === 'PF' ? (data.estadoCivil ?? null) : null,

    cnae: tipo === 'PJ' ? trimOrNull(data.cnae) : null,
    porte: tipo === 'PJ' ? (data.porte ?? null) : null,
    site: tipo === 'PJ' ? trimOrNull(data.site) : null,
  }
}

export function mapPessoaContatoRowToView(row: PessoaContatoRowWithJoins): PessoaContato {
  return {
    id: row.id,
    pjId: row.pj_id,
    pfId: row.pf_id,
    pjNome: row.pj?.nome ?? undefined,
    pjNomeFantasia: row.pj?.nome_fantasia ?? undefined,
    pfNome: row.pf?.nome ?? undefined,
    cargo: row.cargo ?? undefined,
    principal: Boolean(row.principal),
    createdAt: row.created_at,
  }
}
