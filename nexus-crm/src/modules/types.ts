import type { ComponentType } from 'react';
import type { Database } from '../types/database';

// NOTA: tipos auxiliares abaixo.

export type PipelineModule = Database['public']['Enums']['pipeline_module'];
export type CardStatus = Database['public']['Enums']['card_status'];

export type PipelineRow = Database['public']['Tables']['pipelines']['Row'];
export type PipelineStageRow = Database['public']['Tables']['pipeline_stages']['Row'];

/**
 * Shape generico que o <KanbanBoard /> renderiza. Cada adapter de modulo
 * deve transformar sua entidade (oportunidade, sinistro, emissao...) neste formato.
 */
export interface KanbanCard {
  id: string;
  pipelineId: string | null;
  stageId: string | null;
  status: CardStatus;
  title: string;
  subtitle?: string;
  responsavelId: string | null;
  responsavelName?: string;
  responsavelAvatar?: string;
  primaryValue?: number | null;
  primaryValueLabel?: string;
  dueDate?: string | null;
  tags?: Array<{ label: string; tone?: 'default' | 'success' | 'warning' | 'danger' | 'info' }>;
  concludedAt?: string | null;
  raw: Record<string, unknown>;
}

/**
 * Filtros comuns que o board aplica. Cada adapter decide quais sao suportados via
 * `availableFilters` na definicao do modulo.
 *
 * `status` NAO entra em `availableFilters` pois e universal (toggle Ativos/Concluidos
 * aplicavel a todos os modulos).
 */
export type ConclusionFilter = 'active' | 'concluded' | 'all';

export interface KanbanFilters {
  search?: string;
  ramo?: string;
  origem?: string;
  produtor?: string;
  tipoNegocio?: string;
  dataRetorno?: { start?: string; end?: string };
  dataVigencia?: { start?: string; end?: string };
  status?: ConclusionFilter;
}

export type KanbanFilterKey = Exclude<keyof KanbanFilters, 'status'>;

export interface ConcludePayload {
  status: Exclude<CardStatus, 'pending'>;
  motivoPerdaId?: string | null;
  observacao?: string;
}

export interface MoveCardArgs {
  cardId: string;
  toStageId: string;
  pipelineId: string;
}

export interface ConcludeCardArgs {
  cardId: string;
  payload: ConcludePayload;
}

/**
 * Props que o <KanbanBoard /> passa para cada `CardComponent` de adapter.
 * `onConclude` permite ao card disparar a conclusao (Ganho/Perdido).
 */
export interface KanbanCardProps {
  card: KanbanCard;
  onOpen?: (card: KanbanCard) => void;
  onConclude?: (card: KanbanCard, mode: Exclude<CardStatus, 'pending'>) => void;
  /** Indica se o estagio em que o card esta permite conclusao como "ganho". */
  canWin?: boolean;
}

/**
 * Props passadas para o componente de modal de criacao plugavel por modulo.
 * Cada modulo define seu proprio componente; a `ModuleKanbanPage` apenas
 * controla a abertura/fechamento e refetch.
 */
export interface CreateCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  pipelineId: string | null;
  onCreated?: (id: string) => void;
}

/**
 * Contrato de um adapter de modulo. O board consome apenas esta interface,
 * permitindo plugar novos modulos sem tocar no componente visual.
 */
export interface ModuleAdapter {
  module: PipelineModule;
  fetchCards: (args: { pipelineId: string; tenantId: string; includeConcluded?: boolean }) => Promise<KanbanCard[]>;
  updateStage: (args: MoveCardArgs) => Promise<void>;
  conclude: (args: ConcludeCardArgs) => Promise<void>;
  CardComponent: ComponentType<KanbanCardProps>;
  availableFilters: KanbanFilterKey[];
  /**
   * Componente de modal de criacao. Opcional: se ausente, o botao "+ Novo"
   * nao aparece na pagina de Kanban do modulo.
   */
  createModalComponent?: ComponentType<CreateCardModalProps>;
  /**
   * Rota de detalhe do card. Opcional: se ausente, clicar no card e no-op.
   */
  detailRoute?: (id: string) => string;
  /**
   * Label exibido no botao de criacao (ex.: "Novo Sinistro", "Nova Cobranca").
   * Default: "Novo".
   */
  createLabel?: string;
}
