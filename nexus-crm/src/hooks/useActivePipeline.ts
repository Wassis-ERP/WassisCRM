import { useMemo, useState } from 'react';
import type { PipelineModule, PipelineRow } from '../modules/types';
import { usePipelines } from './usePipelines';

/**
 * Retorna o pipeline "ativo" de um modulo e expoe um setter para troca manual.
 * A escolha default (1o funil do modulo) e **derivada de `data`** com `useMemo`,
 * sem depender de `useEffect` + `setState` — evita ficar preso em "Carregando funil"
 * quando `isFetched` ja e true mas o efeito ainda nao rodou (F5 / Strict Mode / corrida).
 */
export function useActivePipeline(moduleFilter: PipelineModule | undefined) {
  const { data, isError, isFetched } = usePipelines();

  const availableInModule = useMemo(() => {
    const all = data ?? [];
    return moduleFilter ? all.filter((p) => p.module === moduleFilter) : all;
  }, [data, moduleFilter]);

  /** Funil escolhido manualmente (selector); invalidado se sumir da lista do modulo */
  const [manualPipelineId, setManualPipelineId] = useState<string | null>(null);

  const fallbackPipelineId = useMemo(
    () => (availableInModule.length > 0 ? availableInModule[0].id : null),
    [availableInModule]
  );

  const resolvedPipelineId = useMemo(() => {
    if (
      manualPipelineId &&
      availableInModule.some((p) => p.id === manualPipelineId)
    ) {
      return manualPipelineId;
    }
    return fallbackPipelineId;
  }, [manualPipelineId, availableInModule, fallbackPipelineId]);

  const active = useMemo(
    () =>
      resolvedPipelineId
        ? availableInModule.find((p) => p.id === resolvedPipelineId) ?? null
        : null,
    [resolvedPipelineId, availableInModule]
  );

  const setActive = (p: PipelineRow) => setManualPipelineId(p.id);

  const isLoading = !isError && !isFetched;

  return {
    pipelines: availableInModule,
    active,
    setActive,
    isLoading,
    isError,
    hasMultiple: availableInModule.length > 1,
  };
}
