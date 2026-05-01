import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryClient';
import { useAuth } from './useAuth';

type LookupTable = 'ramos' | 'origens' | 'seguradoras' | 'motivos_perda';

export function useLookupsAdmin(table: LookupTable) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenantId;

  const invalidateKeys = () => {
    switch (table) {
      case 'ramos': queryClient.invalidateQueries({ queryKey: queryKeys.lookups.ramos }); break;
      case 'origens': queryClient.invalidateQueries({ queryKey: queryKeys.lookups.origens }); break;
      case 'seguradoras': queryClient.invalidateQueries({ queryKey: queryKeys.lookups.seguradoras }); break;
      case 'motivos_perda': queryClient.invalidateQueries({ queryKey: queryKeys.lookups.motivosPerda }); break;
    }
  };

  const addMutation = useMutation({
    mutationFn: async (nome: string) => {
      if (!tenantId) throw new Error('Tenant não encontrado');
      
      const { data, error } = await supabase.from(table).insert({ 
        nome, 
        tenant_id: tenantId,
        ...(table === 'ramos' ? { comissao_padrao: 0 } : {})
      }).select().single();

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'CREATE_LOOKUP',
        entity_type: table,
        entity_id: data.id,
        new_data: { nome }
      });

      return data;
    },
    onSuccess: () => invalidateKeys(),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      // Soft delete
      const { error } = await supabase.from(table).update({ ativo: false }).eq('id', id);
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'DEACTIVATE_LOOKUP',
        entity_type: table,
        entity_id: id
      });
    },
    onSuccess: () => invalidateKeys(),
  });

  return {
    add: addMutation.mutateAsync,
    remove: removeMutation.mutateAsync,
    isAdding: addMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}
