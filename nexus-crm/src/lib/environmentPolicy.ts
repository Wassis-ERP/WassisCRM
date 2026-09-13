export interface EnvironmentSettings {
  VITE_AUTH_MODE?: string
  VITE_DATA_MODE?: string
  VITE_API_BASE_URL?: string
}

/** Every deployable build is connected; mock is exclusively a local dev/test mode. */
export function validateEnvironment(settings: EnvironmentSettings, deployed: boolean): void {
  if (deployed && (settings.VITE_AUTH_MODE !== 'backend' || settings.VITE_DATA_MODE !== 'backend')) {
    throw new Error('Build de HML/PRD exige VITE_AUTH_MODE=backend e VITE_DATA_MODE=backend.')
  }
  if (!deployed && settings.VITE_AUTH_MODE !== 'backend' && settings.VITE_DATA_MODE !== 'backend') return
  if (settings.VITE_AUTH_MODE !== 'backend' || settings.VITE_DATA_MODE !== 'backend') {
    throw new Error('Autenticação e dados devem usar backend juntos; não existe modo conectado parcial.')
  }
  let url: URL
  try { url = new URL(settings.VITE_API_BASE_URL ?? '') } catch {
    throw new Error('VITE_API_BASE_URL deve ser uma URL absoluta válida.')
  }
  const localHttp = !deployed && url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  if ((url.protocol !== 'https:' && !localHttp) || url.username || url.password || url.search || url.hash) {
    throw new Error('VITE_API_BASE_URL exige HTTPS, sem credenciais, query ou fragmento. HTTP é permitido apenas em desenvolvimento local.')
  }
}
