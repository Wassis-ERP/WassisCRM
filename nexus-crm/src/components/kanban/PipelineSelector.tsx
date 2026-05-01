import { ChevronRight } from 'lucide-react';
import type { PipelineRow } from '../../modules/types';

interface PipelineSelectorProps {
  value: string | null;
  onChange: (pipeline: PipelineRow) => void;
  pipelines: PipelineRow[];
  isLoading?: boolean;
  isError?: boolean;
}

/**
 * Dropdown apresentacional para troca de pipeline. A selecao do pipeline "ativo"
 * e responsabilidade do hook `useActivePipeline`.
 */
export function PipelineSelector({ value, onChange, pipelines, isLoading, isError }: PipelineSelectorProps) {
  if (isError) {
    return (
      <span className="text-[10px] font-black uppercase tracking-wider text-rose-500">
        Falha ao carregar funis
      </span>
    );
  }

  return (
    <div className="relative">
      <select
        disabled={isLoading || pipelines.length === 0}
        value={value ?? ''}
        onChange={(e) => {
          const p = pipelines.find((x) => x.id === e.target.value);
          if (p) onChange(p);
        }}
        className="pl-4 pr-10 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-black text-slate-700 dark:text-slate-200 appearance-none focus:ring-2 focus:ring-primary/20 shadow-sm cursor-pointer hover:border-primary/30 transition-all uppercase tracking-wider disabled:opacity-50"
      >
        {isLoading && <option value="">Carregando...</option>}
        {!isLoading && pipelines.length === 0 && <option value="">Nenhum funil</option>}
        {pipelines.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <ChevronRight size={14} className="rotate-90" />
      </div>
    </div>
  );
}
