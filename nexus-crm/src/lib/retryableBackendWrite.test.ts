import { describe, expect, it, vi } from 'vitest'
import { createRetryableBackendWrite } from './retryableBackendWrite'

describe('sessão de gravação HTTP', () => {
  it('reutiliza a chave após resposta perdida e inicia outra operação após confirmação', async () => {
    const keys = vi.fn().mockReturnValueOnce('key-1').mockReturnValueOnce('key-2')
    const execute = vi.fn<(input: { value: number }, key: string) => Promise<string>>()
      .mockRejectedValueOnce(new Error('Resposta perdida')).mockResolvedValue('id-persistido')
    const write = createRetryableBackendWrite(execute, keys)
    await expect(write({ value: 0 }, 'tenant/branch/user')).rejects.toThrow('Resposta perdida')
    await expect(write({ value: 0 }, 'tenant/branch/user')).resolves.toBe('id-persistido')
    await expect(write({ value: 0 }, 'tenant/branch/user')).resolves.toBe('id-persistido')
    expect(execute.mock.calls.map(([, key]) => key)).toEqual(['key-1', 'key-1', 'key-2'])
  })

  it('compartilha clique duplicado e impede comando diferente durante a gravação', async () => {
    let release: (result: string) => void = () => { throw new Error('Promise não preparada.') }
    const execute = vi.fn(() => new Promise<string>(resolve => { release = resolve }))
    const write = createRetryableBackendWrite(execute, () => 'key')
    const first = write({ value: null }, 'scope')
    const duplicate = write({ value: null }, 'scope')
    expect(duplicate).toBe(first)
    await expect(write({ value: 0 }, 'scope')).rejects.toThrow('em andamento')
    await expect(write({ value: null }, 'other-branch')).rejects.toThrow('em andamento')
    expect(execute).toHaveBeenCalledTimes(1)
    release('same-id')
    await expect(first).resolves.toBe('same-id')
  })

  it('congela o input de um comando assíncrono e mantém key ao reordenar propriedades', async () => {
    const execute = vi.fn<(input: { risk: { model: string }; bonus: number }, key: string) => Promise<void>>()
      .mockRejectedValue(new Error('Rede'))
    const input = { risk: { model: 'Original' }, bonus: 0 }
    const write = createRetryableBackendWrite(execute, () => 'key-original')
    const attempt = write(input, 'scope')
    input.risk.model = 'Editado após clique'
    await expect(attempt).rejects.toThrow('Rede')
    expect(execute.mock.calls[0][0].risk.model).toBe('Original')
    await expect(write({ bonus: 0, risk: { model: 'Original' } }, 'scope')).rejects.toThrow('Rede')
    expect(execute.mock.calls[1][1]).toBe('key-original')
  })

  it('separa null/zero, payload alterado e escopo, sem tentar gravar NaN', async () => {
    let sequence = 0
    const execute = vi.fn<(input: { value: number | null }, key: string) => Promise<void>>().mockRejectedValue(new Error('Rede'))
    const write = createRetryableBackendWrite(execute, () => `key-${++sequence}`)
    await expect(write({ value: null }, 'scope')).rejects.toThrow('Rede')
    await expect(write({ value: 0 }, 'scope')).rejects.toThrow('Rede')
    await expect(write({ value: 0 }, 'other-branch')).rejects.toThrow('Rede')
    expect(execute.mock.calls.map(([, key]) => key)).toEqual(['key-1', 'key-2', 'key-3'])
    expect(() => write({ value: Number.NaN }, 'scope')).toThrow('incompatível')
    expect(execute).toHaveBeenCalledTimes(3)
  })
})
