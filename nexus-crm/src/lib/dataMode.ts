export const usesBackendData = import.meta.env.VITE_DATA_MODE === 'backend'

export function requireMemoryMode(): void {
  if (usesBackendData || import.meta.env.PROD) {
    throw new Error('Integração pendente: esta operação ainda não está disponível no ambiente conectado. Nenhum dado foi salvo.')
  }
}
