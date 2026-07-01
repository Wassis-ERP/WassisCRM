import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { queryKeys } from '../lib/queryClient';
import { useAuth } from './useAuth';
import type { RamoGrupoOperacional, RamoRiskType } from './useLookups';

type LookupTable = 'ramos' | 'origens' | 'seguradoras' | 'motivos_perda';

export type RamoInput = {
  nome: string;
  risk_type: RamoRiskType;
  grupo_operacional: RamoGrupoOperacional;
  is_monthly: boolean;
  comissao_padrao?: number;
};

export function buildRamoInsertPayload(input: RamoInput, tenantId: string) {
  return {
    ...buildRamoUpdatePayload(input),
    tenant_id: tenantId,
    ativo: true,
  };
}

export function buildRamoUpdatePayload(input: RamoInput) {
  return {
    nome: input.nome.trim(),
    risk_type: input.risk_type,
    grupo_operacional: input.grupo_operacional,
    is_monthly: input.is_monthly,
    comissao_padrao: input.comissao_padrao ?? 0,
  };
}

export function buildLookupInsertPayload(nome: string, tenantId: string) {
  return {
    nome: nome.trim(),
    tenant_id: tenantId,
    ativo: true,
  };
}

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
      
      const payload = {
        ...buildLookupInsertPayload(nome, tenantId),
        ...(table === 'ramos' ? { comissao_padrao: 0 } : {}),
      };

      const { data, error } = await supabase.from(table).insert(payload).select().single();

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'CREATE_LOOKUP',
        entity_type: table,
        entity_id: data.id,
        new_data: payload
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

export function useRamosAdmin() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const tenantId = user?.tenantId;
  const invalidateRamos = () => queryClient.invalidateQueries({ queryKey: queryKeys.lookups.ramos });

  const addMutation = useMutation({
    mutationFn: async (input: RamoInput) => {
      if (!tenantId) throw new Error('Tenant não encontrado');
      if (!input.nome.trim()) throw new Error('Nome do ramo é obrigatório');

      const payload = buildRamoInsertPayload(input, tenantId);

      const { data, error } = await supabase.from('ramos').insert(payload).select().single();

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'CREATE_LOOKUP',
        entity_type: 'ramos',
        entity_id: data.id,
        new_data: payload,
      });

      return data;
    },
    onSuccess: invalidateRamos,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: RamoInput }) => {
      if (!input.nome.trim()) throw new Error('Nome do ramo é obrigatório');

      const payload = buildRamoUpdatePayload(input);

      const { data, error } = await supabase.from('ramos').update(payload).eq('id', id).select().single();

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'UPDATE_LOOKUP',
        entity_type: 'ramos',
        entity_id: id,
        new_data: payload,
      });

      return data;
    },
    onSuccess: invalidateRamos,
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ramos').update({ ativo: false }).eq('id', id);
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'DEACTIVATE_LOOKUP',
        entity_type: 'ramos',
        entity_id: id,
      });
    },
    onSuccess: invalidateRamos,
  });

  return {
    add: addMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: removeMutation.mutateAsync,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}
