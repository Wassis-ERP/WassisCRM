// Reexports da representação canônica v3.1 em Database.Tables.
import type { Database } from './database'

export type Filial = Database['public']['Tables']['filiais']['Row']
export type Perfil = Database['public']['Tables']['perfis']['Row']
export type ProfileFilial = Database['public']['Tables']['profile_filiais']['Row']
export type Produtor = Database['public']['Tables']['produtores']['Row']

export type FilialInput = Omit<Database['public']['Tables']['filiais']['Insert'], 'id' | 'tenant_id'>
export type ProdutorInput = Omit<Database['public']['Tables']['produtores']['Insert'], 'id' | 'tenant_id'>
