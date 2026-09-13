import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules() })

it('bloqueia acesso direto, adapter, RPC e simulação em modo backend', async () => {
  vi.stubEnv('VITE_DATA_MODE', 'backend')
  vi.resetModules()
  const { getTable } = await import('./inMemoryDb')
  const { supabase } = await import('./supabase')
  expect(() => getTable('segurados')).toThrow('Integração pendente')
  expect(() => supabase.from('segurados')).toThrow('Integração pendente')
  await expect(supabase.rpc('get_team_members')).rejects.toThrow('Integração pendente')
  await expect(supabase.functions.invoke('invite-user')).rejects.toThrow('Integração pendente')
})
