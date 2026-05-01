/**
 * Modelo de exibição / formulário de Segurado no front-end.
 * A fonte da verdade é `public.segurados` no Supabase; use `mapSeguradoRowToView`.
 */
export interface Segurado {
  id: string
  nome: string
  documento: string
  tipo: 'PF' | 'PJ'
  email: string
  telefone: string
  chatwootId?: string
  endereco?: string
  status?: 'Ativo' | 'Inativo'
  gerente?: string | null
  gerenteInicial?: string | null
  gerenteCor?: string | null
}
