/** Keep an ambiguous HTTP result recoverable without persisting a business draft. */
export type RetryableBackendWrite<Input extends object, Result> = (input: Input, scope: string) => Promise<Result>

function fingerprint(value: unknown): string {
  if (value === undefined) return 'undefined'
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value)
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(fingerprint).join(',')}]`
  if (value && typeof value === 'object') {
    const entries = Object.entries(value).filter(([, item]) => item !== undefined).sort(([left], [right]) => left.localeCompare(right))
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${fingerprint(item)}`).join(',')}}`
  }
  throw new Error('O comando contém um valor incompatível com a API.')
}

export function createRetryableBackendWrite<Input extends object, Result>(
  execute: (input: Input, key: string) => Promise<Result>,
  newKey: () => string = () => crypto.randomUUID(),
): RetryableBackendWrite<Input, Result> {
  let retry: { signature: string; key: string } | null = null
  let active: { signature: string; promise: Promise<Result> } | null = null
  return (input, scope) => {
    const snapshot = structuredClone(input)
    const signature = `${JSON.stringify(scope)}:${fingerprint(snapshot)}`
    if (active) return active.signature === signature ? active.promise
      : Promise.reject(new Error('Há uma gravação em andamento. Aguarde antes de alterar o comando.'))
    const attempt = retry?.signature === signature ? retry : { signature, key: newKey() }
    retry = attempt
    const promise = Promise.resolve().then(() => execute(snapshot, attempt.key)).then(result => {
      retry = null
      return result
    }).finally(() => { active = null })
    active = { signature, promise }
    return promise
  }
}
