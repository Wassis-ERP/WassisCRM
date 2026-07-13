export interface ScopedCatalogRow {
  id: string
  nome: string
  ativo: boolean
  filial_id: string | null
  ramo_id: string | null
}

const normalized = (value: string) => value.trim().toLocaleLowerCase('pt-BR')

export function hasScopedCatalogDuplicate<T extends ScopedCatalogRow>(
  rows: T[],
  input: { id?: string | null; nome: string; filialId: string | null; ramoId: string | null },
): boolean {
  return rows.some((row) =>
    row.id !== input.id &&
    row.ativo &&
    normalized(row.nome) === normalized(input.nome) &&
    row.filial_id === input.filialId &&
    row.ramo_id === input.ramoId,
  )
}

export function resolveScopedCatalog<T extends ScopedCatalogRow>(
  rows: T[],
  filialId: string | null,
  ramoId: string | null,
): T[] {
  const applicable = rows
    .filter((row) => row.ativo && (!row.filial_id || row.filial_id === filialId) && (!row.ramo_id || row.ramo_id === ramoId))
    .sort((a, b) => {
      const specificityA = Number(Boolean(a.filial_id)) * 2 + Number(Boolean(a.ramo_id))
      const specificityB = Number(Boolean(b.filial_id)) * 2 + Number(Boolean(b.ramo_id))
      return specificityB - specificityA || a.nome.localeCompare(b.nome, 'pt-BR')
    })
  const selected = new Map<string, T>()
  applicable.forEach((row) => {
    const key = normalized(row.nome)
    if (!selected.has(key)) selected.set(key, row)
  })
  return Array.from(selected.values()).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}
