import type { Segurado } from '../contexts/seguradosCore'
import type { Database } from '../types/database'

type SeguradoRow = Database['public']['Tables']['segurados']['Row']
type SeguradoUpdate = Database['public']['Tables']['segurados']['Update']

function enderecoFromRow(row: SeguradoRow): string | undefined {
  if (row.endereco?.trim()) return row.endereco.trim()
  const parts = [row.cidade?.trim(), row.estado?.trim()].filter(Boolean)
  return parts.length ? parts.join(', ') : undefined
}

/**
 * Converte linha do Postgres (`public.segurados`) para o modelo de tela do CRM.
 */
export function mapSeguradoRowToView(row: SeguradoRow): Segurado {
  const endereco = enderecoFromRow(row)
  return {
    id: row.id,
    nome: row.nome,
    documento: row.cpf_cnpj ?? '',
    tipo: row.tipo,
    email: row.email ?? '',
    telefone: row.telefone ?? '',
    chatwootId: row.chatwoot_id ?? undefined,
    endereco,
    status: 'Ativo',
    gerente: null,
    gerenteInicial: null,
    gerenteCor: null,
  }
}

/**
 * Monta payload de update a partir do formulário legado (`SeguradoModal`).
 */
export function partialSeguradoToUpdate(data: Partial<Segurado>): SeguradoUpdate {
  const u: SeguradoUpdate = {}
  if (data.nome !== undefined) u.nome = data.nome
  if (data.documento !== undefined) u.cpf_cnpj = data.documento.trim() || null
  if (data.email !== undefined) u.email = data.email.trim() || null
  if (data.telefone !== undefined) u.telefone = data.telefone.trim() || null
  if (data.tipo !== undefined) u.tipo = data.tipo
  if (data.chatwootId !== undefined) u.chatwoot_id = data.chatwootId?.trim() || null
  if (data.endereco !== undefined) {
    const raw = data.endereco.trim()
    u.endereco = raw || null
  }
  return u
}

/** Payload compatível com `useCreateSegurado` / insert em `segurados`. */
export function buildCreateSeguradoInput(data: Partial<Segurado>) {
  const nome = data.nome?.trim()
  if (!nome) throw new Error('Nome é obrigatório')
  return {
    nome,
    cpf_cnpj: data.documento?.trim(),
    telefone: data.telefone?.trim(),
    email: data.email?.trim(),
    tipo: data.tipo,
    chatwoot_id: data.chatwootId?.trim() || null,
    endereco: data.endereco?.trim() || null,
  }
}
