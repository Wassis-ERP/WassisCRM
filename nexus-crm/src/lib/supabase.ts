/**
 * Adapter "supabase" in-memory.
 *
 * Mantém a mesma forma do client Supabase (`from`, `rpc`, `functions.invoke`)
 * que as hooks já consomem, mas roda 100% no browser contra um banco em
 * memória (lib/inMemoryDb.ts). Sem rede, sem persistência: full reload zera
 * os dados de domínio.
 *
 * Não há mais a seção `auth.*`: o AuthProvider entrega um usuário admin fixo
 * direto pelo contexto (contexts/AuthContext.tsx), sem fluxo de login.
 */

import { InMemoryQueryBuilder, type QueryResult } from './inMemoryQueryBuilder';
import { getTable } from './inMemoryDb';

export const supabase = {
  from<T = any>(table: string) {
    return new InMemoryQueryBuilder<T>(table);
  },

  async rpc<T = any>(name: string, _params?: Record<string, unknown>): Promise<QueryResult<T>> {
    if (name === 'get_team_members') {
      const profiles = getTable('profiles');
      const pf = getTable('profile_filiais');
      const perfis = getTable('perfis');
      const members = profiles.map((p) => {
        const vinc = pf.filter((v) => v.profile_id === p.id);
        const principal = vinc.find((v) => v.principal) ?? vinc[0];
        const perfilNome = principal
          ? perfis.find((pe) => pe.id === principal.perfil_id)?.nome ?? null
          : null;
        return {
          id: p.id,
          full_name: p.full_name ?? '',
          email: p.email ?? '',
          avatar_url: p.avatar_url ?? null,
          created_at: p.created_at,
          corretoras_count: vinc.length,
          perfil_principal: perfilNome,
        };
      });
      return { data: members as any, error: null };
    }
    return { data: null, error: { message: `RPC nao implementada no modo offline: ${name}` } };
  },

  functions: {
    async invoke<T = any>(name: string, _options?: { body?: unknown }): Promise<QueryResult<T>> {
      // Sem backend: aceita a chamada como no-op para nao quebrar a UI.
      // Em particular, 'invite-user' (useTeamAdmin) cai aqui — o convite nao
      // eh realmente enviado.
      if (name === 'invite-user') {
        return { data: { ok: true } as any, error: null };
      }
      return { data: null, error: null };
    },
  },
};
