import type { KanbanCard, KanbanFilterKey, KanbanFilters } from './types';

/** Indica se um valor de filtro deve ser tratado como "todos" (nao filtrar). */
function isEmptyFilter(value: unknown): boolean {
  return value === undefined || value === null || value === '' || value === 'Todos' || value === 'todos';
}

/**
 * Le um nome aninhado em `card.raw` usando path com ponto, ex.:
 * `ramos.nome`, `oportunidades.ramos.nome`. Tolerante a null/undefined.
 */
function readRawPath(raw: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let cursor: unknown = raw;
  for (const part of parts) {
    if (cursor && typeof cursor === 'object') {
      cursor = (cursor as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return cursor;
}

/** Tenta ler o nome do ramo de um card em multiplos locais (comercial tem diferente dos demais). */
function readRamo(card: KanbanCard): string | null {
  const candidates = [
    readRawPath(card.raw, 'ramos.nome'),
    readRawPath(card.raw, 'oportunidades.ramos.nome'),
  ];
  for (const c of candidates) if (typeof c === 'string') return c;
  return null;
}

function readOrigem(card: KanbanCard): string | null {
  const candidates = [
    readRawPath(card.raw, 'origens.nome'),
    readRawPath(card.raw, 'oportunidades.origens.nome'),
  ];
  for (const c of candidates) if (typeof c === 'string') return c;
  return null;
}

function readTipoNegocio(card: KanbanCard): string | null {
  const candidates = [
    readRawPath(card.raw, 'tipo_negocio'),
    readRawPath(card.raw, 'oportunidades.tipo_negocio'),
  ];
  for (const c of candidates) if (typeof c === 'string') return c;
  return null;
}

/**
 * Aplica os filtros suportados pelo adapter do modulo aos cards ja carregados.
 * Filtros NAO listados em `availableFilters` sao ignorados mesmo se presentes.
 *
 * O filtro de `status` e aplicado em todos os modulos independentemente de
 * `availableFilters` (toggle universal Ativos/Concluidos/Todos).
 */
export function applyKanbanFilters(
  cards: KanbanCard[],
  filters: KanbanFilters | undefined,
  availableFilters: KanbanFilterKey[],
): KanbanCard[] {
  if (!filters) return cards;
  const enabled = new Set(availableFilters);
  const search = filters.search?.trim().toLowerCase() ?? '';

  return cards.filter((card) => {
    if (enabled.has('search') && search) {
      const hay = `${card.title} ${card.subtitle ?? ''}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }

    if (enabled.has('ramo') && !isEmptyFilter(filters.ramo)) {
      const ramo = readRamo(card);
      if (!ramo || ramo !== filters.ramo) return false;
    }

    if (enabled.has('origem') && !isEmptyFilter(filters.origem)) {
      const origem = readOrigem(card);
      if (!origem || origem !== filters.origem) return false;
    }

    if (enabled.has('produtor') && !isEmptyFilter(filters.produtor)) {
      if (card.responsavelId !== filters.produtor) return false;
    }

    if (enabled.has('tipoNegocio') && !isEmptyFilter(filters.tipoNegocio)) {
      const tipo = readTipoNegocio(card);
      if (!tipo || tipo !== filters.tipoNegocio) return false;
    }

    if (enabled.has('dataRetorno') && filters.dataRetorno) {
      const { start, end } = filters.dataRetorno;
      const due = card.dueDate ? new Date(card.dueDate) : null;
      if (start) {
        if (!due || due < new Date(start)) return false;
      }
      if (end) {
        if (!due || due > new Date(end)) return false;
      }
    }

    if (enabled.has('dataVigencia') && filters.dataVigencia) {
      const { start, end } = filters.dataVigencia;
      const ini = readRawPath(card.raw, 'vigencia_inicio') ?? readRawPath(card.raw, 'oportunidades.vigencia_inicio');
      const fim = readRawPath(card.raw, 'vigencia_fim') ?? readRawPath(card.raw, 'oportunidades.vigencia_fim');
      if (start && typeof ini === 'string' && new Date(ini) < new Date(start)) return false;
      if (end && typeof fim === 'string' && new Date(fim) > new Date(end)) return false;
    }

    return true;
  });
}
