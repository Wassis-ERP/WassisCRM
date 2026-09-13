import { describe, expect, it } from 'vitest'
import { externalWebUrl } from './safeUrl'

describe('URLs de sites de segurados', () => {
  it.each(['javascript:alert(1)', 'data:text/html,a', 'file:///etc/passwd', 'https://user:password@example.com', 'https://'])('rejeita protocolo ou credencial: %s', value => expect(externalWebUrl(value)).toBeNull())
  it('normaliza endereço web sem protocolo', () => expect(externalWebUrl('example.com/a')).toBe('https://example.com/a'))
})
