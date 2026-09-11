import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getTable } from '../lib/inMemoryDb'
import { queryKeys } from '../lib/queryClient'
import { useAuth } from './useAuth'
import { saveProfileBranchAccess } from '../modules/plataforma/platformCommands'
import type { ProfileFilial } from '../types/platform'

export function useProfileFiliais(profileId: string | undefined) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const key = queryKeys.profileFiliais(profileId ?? '')
  const query = useQuery({queryKey:key,enabled:!!profileId,queryFn:(): ProfileFilial[] => getTable('profile_filiais').filter(v => v.profile_id === profileId).map(v => ({ ...v })) as ProfileFilial[]})
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: key })
    void queryClient.invalidateQueries({ queryKey: queryKeys.team })
    void queryClient.invalidateQueries({ queryKey: queryKeys.permissions })
    window.dispatchEvent(new Event('wassis:access-changed'))
  }
  const setVinculo = useMutation({
    mutationFn: async (input: Omit<Parameters<typeof saveProfileBranchAccess>[0], 'profileId' | 'tenantId'>) => {
      if (!profileId || !user?.tenantId) throw new Error('Usuário e grupo são obrigatórios.')
      return saveProfileBranchAccess({...input,profileId,tenantId:user.tenantId})
    },onSuccess:invalidate,
  })
  const removeVinculo = useMutation({mutationFn:async(filialId:string)=>{
    const existing = getTable('profile_filiais').find(v=>v.profile_id===profileId&&v.filial_id===filialId)
    if (!existing || !profileId || !user?.tenantId) throw new Error('Vínculo não encontrado.')
    return saveProfileBranchAccess({profileId,tenantId:user.tenantId,filialId,perfilId:String(existing.perfil_id),ativo:false})
  },onSuccess:invalidate})
  return {vinculos:query.data??[],isLoading:query.isLoading,setVinculo:setVinculo.mutateAsync,removeVinculo:removeVinculo.mutateAsync,isSaving:setVinculo.isPending||removeVinculo.isPending}
}
