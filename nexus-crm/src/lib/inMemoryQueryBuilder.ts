/**
 * Query builder in-memory que mimetiza a API encadeável do client Supabase
 * (`.from().select().eq()...`) usada pelas hooks do CRM.
 *
 * Suporta apenas a superfície realmente exercida pelos arquivos em src/hooks,
 * src/contexts, src/modules e src/components — não é um clone completo do
 * PostgREST. Quando algo novo for necessário, adicione aqui.
 */

import { getTable, newId, nowIso, RELATIONS, type Row } from './inMemoryDb';

type QueryError = { message: string; code?: string };
export type QueryResult<T = any> = { data: T | null; error: QueryError | null; count?: number | null };

type QueryOperation = 'select' | 'insert' | 'update' | 'delete' | 'upsert';

type Filter =
  | { op: 'eq'; column: string; value: any }
  | { op: 'neq'; column: string; value: any }
  | { op: 'in'; column: string; value: any[] }
  | { op: 'ilike'; column: string; value: string }
  | { op: 'gte'; column: string; value: any }
  | { op: 'lte'; column: string; value: any };

// ----- parser de select -----

type SelectField =
  | { kind: 'all' }
  | { kind: 'column'; name: string }
  | { kind: 'join'; alias: string; fkColumn?: string; targetTable: string; children: SelectField[] };

function splitTopLevel(s: string, sep: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let buf = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === sep && depth === 0) {
      out.push(buf);
      buf = '';
    } else {
      buf += ch;
    }
  }
  if (buf.length > 0) out.push(buf);
  return out;
}

function parseSelect(input: string, sourceTable: string): SelectField[] {
  const cleaned = input.replace(/\s+/g, ' ').trim();
  if (cleaned === '' || cleaned === '*') return [{ kind: 'all' }];

  const parts = splitTopLevel(cleaned, ',').map((p) => p.trim()).filter(Boolean);
  const fields: SelectField[] = [];

  for (const part of parts) {
    const parenIdx = part.indexOf('(');
    if (parenIdx === -1) {
      // coluna simples ou '*'
      if (part === '*') fields.push({ kind: 'all' });
      else fields.push({ kind: 'column', name: part });
      continue;
    }

    // tem parênteses -> join
    const head = part.slice(0, parenIdx).trim();
    const inner = part.slice(parenIdx + 1, part.lastIndexOf(')')).trim();

    let alias: string;
    let fkColumn: string | undefined;
    if (head.includes(':')) {
      const [a, fk] = head.split(':').map((x) => x.trim());
      alias = a;
      fkColumn = fk;
    } else {
      alias = head;
    }

    // Resolver targetTable via mapa de relações.
    const forwardKey = `${sourceTable}.${alias}`;
    const rel = RELATIONS[forwardKey];
    const targetTable = rel?.target ?? alias;

    fields.push({
      kind: 'join',
      alias,
      fkColumn,
      targetTable,
      children: parseSelect(inner, targetTable),
    });
  }

  return fields;
}

function projectRow(row: Row, fields: SelectField[], sourceTable: string): Row {
  // Se contém 'all', começamos com cópia completa; senão, vazio e copiamos só as colunas pedidas.
  const hasAll = fields.some((f) => f.kind === 'all');
  const out: Row = hasAll ? { ...row } : {};

  for (const f of fields) {
    if (f.kind === 'all') continue;
    if (f.kind === 'column') {
      out[f.name] = row[f.name];
      continue;
    }

    // join
    const rel = RELATIONS[`${sourceTable}.${f.alias}`];
    if (rel?.kind === 'reverse' && rel.childFk) {
      const children = getTable(rel.target).filter((c) => c[rel.childFk!] === row.id);
      out[f.alias] = children.map((c) => projectRow(c, f.children, rel.target));
    } else {
      // forward: usa fkColumn explícito, ou o do mapa, ou tenta `<alias>_id`
      const fk = f.fkColumn ?? rel?.localFk ?? `${f.alias}_id`;
      const targetId = row[fk];
      if (targetId == null) {
        out[f.alias] = null;
      } else {
        const target = getTable(f.targetTable).find((r) => r.id === targetId);
        out[f.alias] = target ? projectRow(target, f.children, f.targetTable) : null;
      }
    }
  }

  return out;
}

// ----- aplicação de filtros / order -----

function matchFilter(row: Row, f: Filter): boolean {
  const v = row[f.column];
  switch (f.op) {
    case 'eq':
      return v === f.value;
    case 'neq':
      return v !== f.value;
    case 'in':
      return Array.isArray(f.value) && f.value.includes(v);
    case 'ilike': {
      if (v == null) return false;
      const pattern = String(f.value).replace(/%/g, '.*').replace(/_/g, '.');
      return new RegExp(`^${pattern}$`, 'i').test(String(v));
    }
    case 'gte':
      return v != null && v >= f.value;
    case 'lte':
      return v != null && v <= f.value;
  }
}

// ----- builder -----

export class InMemoryQueryBuilder<T = any> implements PromiseLike<QueryResult<T>> {
  private readonly table: string;
  private operation: QueryOperation = 'select';
  private selection: string = '*';
  private filters: Filter[] = [];
  private orderBy: Array<{ column: string; ascending: boolean }> = [];
  private limitCount?: number;
  private rangeFromTo?: { from: number; to: number };
  private payload: any;
  private upsertOnConflict?: string;
  private expectsSingle = false;
  private isMaybeSingle = false;
  private hasSelectAfterWrite = false;

  constructor(table: string) {
    this.table = table;
  }

  // ----- operações -----

  select(selection: string = '*'): this {
    if (this.operation === 'select') {
      this.selection = selection;
    } else {
      // chained after insert/update/upsert: usado para retornar registro afetado
      this.selection = selection;
      this.hasSelectAfterWrite = true;
    }
    return this;
  }

  insert(payload: any): this {
    this.operation = 'insert';
    this.payload = payload;
    return this;
  }

  update(payload: any): this {
    this.operation = 'update';
    this.payload = payload;
    return this;
  }

  upsert(payload: any, options?: { onConflict?: string }): this {
    this.operation = 'upsert';
    this.payload = payload;
    this.upsertOnConflict = options?.onConflict;
    return this;
  }

  delete(): this {
    this.operation = 'delete';
    return this;
  }

  // ----- filtros -----

  eq(column: string, value: any): this {
    this.filters.push({ op: 'eq', column, value });
    return this;
  }
  neq(column: string, value: any): this {
    this.filters.push({ op: 'neq', column, value });
    return this;
  }
  in(column: string, value: any[]): this {
    this.filters.push({ op: 'in', column, value });
    return this;
  }
  ilike(column: string, value: string): this {
    this.filters.push({ op: 'ilike', column, value });
    return this;
  }
  gte(column: string, value: any): this {
    this.filters.push({ op: 'gte', column, value });
    return this;
  }
  lte(column: string, value: any): this {
    this.filters.push({ op: 'lte', column, value });
    return this;
  }

  // ----- modificadores -----

  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }): this {
    this.orderBy.push({ column, ascending: options?.ascending !== false });
    return this;
  }
  limit(count: number): this {
    this.limitCount = count;
    return this;
  }
  range(from: number, to: number): this {
    this.rangeFromTo = { from, to };
    return this;
  }
  single(): this {
    this.expectsSingle = true;
    return this;
  }
  maybeSingle(): this {
    this.expectsSingle = true;
    this.isMaybeSingle = true;
    return this;
  }

  // ----- execução -----

  private applyFilters(rows: Row[]): Row[] {
    return rows.filter((r) => this.filters.every((f) => matchFilter(r, f)));
  }

  private applyModifiers(rows: Row[]): Row[] {
    let out = rows;
    if (this.orderBy.length > 0) {
      out = [...out].sort((a, b) => {
        for (const { column, ascending } of this.orderBy) {
          const av = a[column];
          const bv = b[column];
          if (av === bv) continue;
          if (av == null) return ascending ? -1 : 1;
          if (bv == null) return ascending ? 1 : -1;
          if (av < bv) return ascending ? -1 : 1;
          if (av > bv) return ascending ? 1 : -1;
        }
        return 0;
      });
    }
    if (this.rangeFromTo) {
      out = out.slice(this.rangeFromTo.from, this.rangeFromTo.to + 1);
    }
    if (this.limitCount != null) {
      out = out.slice(0, this.limitCount);
    }
    return out;
  }

  private doInsert(): Row[] {
    const table = getTable(this.table);
    const items: Row[] = Array.isArray(this.payload) ? this.payload : [this.payload];
    const inserted: Row[] = [];
    for (const item of items) {
      const row: Row = {
        ...item,
        id: item.id ?? newId(),
        created_at: item.created_at ?? nowIso(),
        updated_at: item.updated_at ?? nowIso(),
      };
      table.push(row);
      inserted.push(row);
    }
    return inserted;
  }

  private doUpdate(): Row[] {
    const table = getTable(this.table);
    const matched = table.filter((r) => this.filters.every((f) => matchFilter(r, f)));
    for (const r of matched) {
      Object.assign(r, this.payload, { updated_at: nowIso() });
    }
    return matched;
  }

  private doDelete(): Row[] {
    const table = getTable(this.table);
    const toDelete = table.filter((r) => this.filters.every((f) => matchFilter(r, f)));
    const ids = new Set(toDelete.map((r) => r.id));
    for (let i = table.length - 1; i >= 0; i--) {
      if (ids.has(table[i].id)) table.splice(i, 1);
    }
    return toDelete;
  }

  private doUpsert(): Row[] {
    const table = getTable(this.table);
    const items: Row[] = Array.isArray(this.payload) ? this.payload : [this.payload];
    const result: Row[] = [];
    for (const item of items) {
      const conflictCol = this.upsertOnConflict ?? 'id';
      const conflictVal = item[conflictCol];
      const existing = conflictVal != null ? table.find((r) => r[conflictCol] === conflictVal) : undefined;
      if (existing) {
        Object.assign(existing, item, { updated_at: nowIso() });
        result.push(existing);
      } else {
        const row: Row = {
          ...item,
          id: item.id ?? newId(),
          created_at: item.created_at ?? nowIso(),
          updated_at: item.updated_at ?? nowIso(),
        };
        table.push(row);
        result.push(row);
      }
    }
    return result;
  }

  private async execute(): Promise<QueryResult<T>> {
    try {
      let rows: Row[];

      switch (this.operation) {
        case 'select':
          rows = this.applyFilters(getTable(this.table));
          rows = this.applyModifiers(rows);
          break;
        case 'insert':
          rows = this.doInsert();
          break;
        case 'update':
          rows = this.doUpdate();
          break;
        case 'delete':
          rows = this.doDelete();
          break;
        case 'upsert':
          rows = this.doUpsert();
          break;
      }

      // Projeção (select / joins). Para writes, só projeta se houve .select() depois.
      const shouldProject = this.operation === 'select' || this.hasSelectAfterWrite;
      let projected: Row[];
      if (shouldProject) {
        const fields = parseSelect(this.selection, this.table);
        projected = rows.map((r) => projectRow(r, fields, this.table));
      } else {
        projected = rows.map((r) => ({ ...r }));
      }

      if (this.expectsSingle) {
        if (projected.length === 0) {
          if (this.isMaybeSingle) return { data: null, error: null };
          return { data: null, error: { message: 'No rows found', code: 'PGRST116' } };
        }
        if (projected.length > 1 && !this.isMaybeSingle) {
          return {
            data: null,
            error: { message: 'Multiple rows returned for .single()', code: 'PGRST116' },
          };
        }
        return { data: projected[0] as any, error: null };
      }

      return { data: projected as any, error: null, count: projected.length };
    } catch (err) {
      return {
        data: null,
        error: { message: err instanceof Error ? err.message : 'In-memory query failed' },
      };
    }
  }

  then<TResult1 = QueryResult<T>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}
