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
import { activeProfileLinks } from '../modules/plataforma/platformCommands';

export const supabase = {
  from<T = any>(table: string) {
    return new InMemoryQueryBuilder<T>(table);
  },

  async rpc<T = any>(name: string, _params?: Record<string, unknown>): Promise<QueryResult<T>> {
    if (name === 'get_team_members') {
      const profiles = getTable('profiles').filter(p => !_params?.tenantId || p.tenant_id === _params.tenantId);
      const perfis = getTable('perfis');
      const members = profiles.map((p) => {
        const vinc = activeProfileLinks(String(p.id));
        const principal = vinc.find((v) => v.principal) ?? vinc[0];
        const perfilNome = principal
          ? perfis.find((pe) => pe.id === principal.perfil_id)?.nome ?? null
          : null;
        return {
          id: p.id,
          nome_completo: p.nome_completo ?? '',
          email: p.email ?? '',
          avatar_url: p.avatar_url ?? null,
          ativo: p.ativo === true,
          status: p.status ?? null,
          convite_status: p.convite_status ?? null,
          convite_enviado_em: p.convite_enviado_em ?? null,
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
