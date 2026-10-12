import { describe, expect, it } from 'vitest'
import { validateEnvironment } from './environmentPolicy'

const connected = { VITE_AUTH_MODE: 'backend', VITE_AUTH_PROVIDER: 'auth0', VITE_DATA_MODE: 'backend', VITE_API_BASE_URL: 'https://api.example.invalid' }
describe('ambiente conectado', () => {
  it('permite build somente com backend e HTTPS', () => expect(() => validateEnvironment(connected, true)).not.toThrow())
  it.each(['', 'mock', 'memory', undefined])('recusa auth/data %s em build', mode => {
    expect(() => validateEnvironment({ ...connected, VITE_AUTH_MODE: mode }, true)).toThrow()
    expect(() => validateEnvironment({ ...connected, VITE_DATA_MODE: mode }, true)).toThrow()
  })
  it('recusa build publicado sem Auth0', () => {
    expect(() => validateEnvironment({ ...connected, VITE_AUTH_PROVIDER: '' }, true)).toThrow('VITE_AUTH_PROVIDER=auth0')
  })
  it.each(['', 'invalid', '/api', 'http://api.example.invalid', 'javascript:alert(1)', 'https://user:pass@api.example.invalid', 'https://api.example.invalid?token=x', 'https://api.example.invalid#x'])('recusa URL %s', url => {
    expect(() => validateEnvironment({ ...connected, VITE_API_BASE_URL: url }, true)).toThrow()
  })
  it('permite mock somente local e exige modos alinhados', () => {
    expect(() => validateEnvironment({}, false)).not.toThrow()
    expect(() => validateEnvironment({ VITE_AUTH_MODE: 'backend' }, false)).toThrow()
    expect(() => validateEnvironment({ ...connected, VITE_API_BASE_URL: 'http://localhost:5080' }, false)).not.toThrow()
    expect(() => validateEnvironment({ ...connected, VITE_API_BASE_URL: 'http://localhost:5080' }, true)).toThrow()
  })
})
