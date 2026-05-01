import { QueryClient } from '@tanstack/react-query';

/**
 * Client global do TanStack Query para o Nexus CRM.
 *
 * Regras de cache alinhadas ao perfil do CRM:
 * - staleTime curto por padrao (os dados do Kanban mudam com frequencia)
 * - refetchOnWindowFocus: true para manter board sincronizado entre abas
 * - retry conservador para nao mascarar erros de RLS
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: true,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});

/**
 * Chaves de cache padronizadas. Usar sempre estes factories para evitar typos.
 */
export const queryKeys = {
  pipelines: ['pipelines'] as const,
  stages: (pipelineId: string | null | undefined) => ['pipeline_stages', pipelineId] as const,
  cards: (module: string, pipelineId: string | null | undefined, status?: string) =>
    ['kanban_cards', module, pipelineId, status ?? 'pending'] as const,
  lookups: {
    ramos: ['ramos'] as const,
    origens: ['origens'] as const,
    seguradoras: ['seguradoras'] as const,
    motivosPerda: ['motivos_perda'] as const,
  },
  team: ['team_members'] as const,
  permissions: ['role_permissions'] as const,
};
