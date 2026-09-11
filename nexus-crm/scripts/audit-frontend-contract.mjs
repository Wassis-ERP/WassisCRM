import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

// Read-only comparison. TypeScript resolves aliases, intersections and DbTable<T>.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const schemaFiles = fs.readdirSync(path.join(root, '.codex/artefatos')).filter(name => /^wassis_erp_esqueleto_v[\d_]+\.dbml$/.test(name)).sort((a,b) => a.localeCompare(b, undefined, { numeric: true }))
const schemaPath = path.join(root, '.codex/artefatos', schemaFiles.at(-1))
const typePath = path.join(root, 'nexus-crm/src/types/database.ts')
const schema = fs.readFileSync(schemaPath, 'utf8')
const tables = new Map()
let current
for (const line of schema.split(/\r?\n/)) {
  const table = /^Table (\w+) \{/.exec(line)
  if (table) { current = new Map(); tables.set(table[1], current); continue }
  if (/^\}/.test(line)) { current = undefined; continue }
  const column = /^  (\w+) (uuid|text|boolean|integer|bigint|numeric|date|timestamptz|timestamp|time|varchar)(?:\b|\()([^\n]*)/.exec(line)
  if (current && column) current.set(column[1], { type: column[2], required: /\[(?:[^\]]*\bnot null\b|[^\]]*\bpk\b)/.test(column[3]), ref: /ref:\s*>\s*([\w.]+)/.exec(column[3])?.[1] ?? null })
}
const platformPath = path.join(root, 'nexus-crm/src/types/platform.ts')
const program = ts.createProgram([typePath, platformPath], { strictNullChecks: true, noEmit: true, target: ts.ScriptTarget.ESNext })
const checker = program.getTypeChecker()
const source = program.getSourceFile(typePath)
const declaration = source.statements.find((node) => ts.isTypeAliasDeclaration(node) && node.name.text === 'Database')
const propertyType = (type, name) => {
  if (!type) return undefined
  const property = type.getProperty(name)
  return property ? checker.getTypeOfSymbolAtLocation(property, declaration) : undefined
}
const dbType = checker.getTypeAtLocation(declaration)
const frontend = propertyType(propertyType(dbType, 'public'), 'Tables')
const platform = program.getSourceFile(platformPath)
const platformNames = { filiais: 'Filial', perfis: 'Perfil', profile_filiais: 'ProfileFilial', produtores: 'Produtor' }
const results = []
for (const [name, columns] of tables) {
  const platformDeclaration = platform.statements.find((node) => ts.isInterfaceDeclaration(node) && node.name.text === platformNames[name])
  const databaseRow = propertyType(propertyType(frontend, name), 'Row')
  const row = databaseRow ?? (platformDeclaration ? checker.getTypeAtLocation(platformDeclaration) : undefined)
  if (!row) { results.push({ table: name, columns: columns.size, missingTable: true }); continue }
  const properties = new Map(row.getProperties().map((property) => [property.name, checker.getTypeOfSymbolAtLocation(property, declaration)]))
  const missing = [], extra = [], incompatible = [], nullability = []
  for (const [column, definition] of columns) {
    const actual = properties.get(column)
    if (!actual) { missing.push(column); continue }
    const parts = actual.isUnion() ? actual.types : [actual]
    const nullable = parts.some((part) => part.flags & ts.TypeFlags.Null)
    const expected = ['integer', 'bigint', 'numeric'].includes(definition.type) ? ts.TypeFlags.NumberLike : definition.type === 'boolean' ? ts.TypeFlags.BooleanLike : ts.TypeFlags.StringLike
    if (parts.some((part) => !(part.flags & (expected | ts.TypeFlags.Null | ts.TypeFlags.Undefined)))) incompatible.push({ column, sql: definition.type, ts: checker.typeToString(actual) })
    if (definition.required === nullable) nullability.push({ column, dbRequired: definition.required, ts: checker.typeToString(actual) })
  }
  for (const column of properties.keys()) if (!columns.has(column)) extra.push(column)
  results.push({ table: name, columns: columns.size, representation: databaseRow ? 'database.ts' : `platform.ts:${platformNames[name]}`, missingDatabaseTable: !databaseRow, missing, extra, incompatible, nullability, foreignKeys: Array.from(columns).filter(([, column]) => column.ref).map(([column, definition]) => ({ column, target: definition.ref, represented: properties.has(column) })) })
}
const extraTables = frontend.getProperties().map((property) => property.name).filter((name) => !tables.has(name))
console.log(JSON.stringify({ source: path.relative(root, schemaPath), tables: tables.size, columns: Array.from(tables.values()).reduce((total, columns) => total + columns.size, 0), frontendTables: frontend.getProperties().length, extraTables, results }, null, 2))
