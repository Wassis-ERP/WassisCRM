/**
 * Tipos auxiliares da plataforma multi-corretora. A fonte de verdade vigente e
 * `.codex/artefatos/wassis_erp_esqueleto_v2_6.dbml`.
 *
 * Estes tipos dão forma a fronteiras de UI que ainda usam modelos auxiliares.
 * Para tabelas e campos de negocio, `database.ts` deve refletir o DBML vigente.
 */

/** CORRETORA (filial): unidade com CNPJ/CPF próprio dentro do grupo (tenant). */
export interface Filial {
  id: string;
  tenant_id: string;
  matriz_id: string | null; // self-FK: matriz -> filial (mesma marca)
  razao_social: string | null;
  fantasia: string | null;
  cnpj_cpf: string | null; // PF ou PJ; normalizado (só dígitos)
  susep: string | null;
  percentual_imposto: number | null;
  lgpd_aceito: boolean;
  lgpd_aceito_em: string | null;
  gerente: string | null; // legado/texto livre, preservado para compatibilidade
  gerente_id: string | null; // FK -> produtores (0.2)
  contato: string | null;
  home_page: string | null;
  email: string | null;
  telefone: string | null;
  celular: string | null;
  telefone2: string | null;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

/** Campos editáveis pelo formulário (o resto é preenchido pelo hook/mock). */
export type FilialInput = Omit<Filial, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>;

/** PERFIL de acesso cadastrável (D18): pré-configurados `sistema` + personalizados. */
export interface Perfil {
  id: string;
  tenant_id: string;
  nome: string;
  sistema: boolean; // pré-configurado (não deletável)
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

/** Vínculo usuário ↔ corretora, com o perfil naquela corretora (papel por filial). */
export interface ProfileFilial {
  id: string;
  profile_id: string;
  filial_id: string;
  perfil_id: string;
  principal: boolean; // corretora "casa"/default do usuário
  created_at: string;
  updated_at: string;
}

/** PRODUTOR de negócio: interno quando vinculado a profile; externo quando profile_id = null. */
export interface Produtor {
  id: string;
  tenant_id: string;
  profile_id: string | null;
  nome: string;
  cpf_cnpj: string | null;
  email: string | null;
  telefone: string | null;
  celular: string | null;
  banco: string | null;
  agencia: string | null;
  conta: string | null;
  chave_pix: string | null;
  percentual_repasse_padrao: number | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export type ProdutorInput = Omit<Produtor, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>;
