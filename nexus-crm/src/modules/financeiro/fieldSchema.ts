import type { FieldDef } from '../comercial/fieldSchema'

export const FINANCEIRO_CORE_FIELDS: FieldDef[] = [
  { key: 'parcela_id', label: 'Parcela vencida', type: 'select', required: true },
  { key: 'responsavel_id', label: 'Responsável', type: 'select' },
  { key: 'prioridade', label: 'Prioridade', type: 'select' },
  { key: 'ultima_cobranca_em', label: 'Última cobrança', type: 'date' },
  { key: 'proxima_cobranca_em', label: 'Próxima cobrança', type: 'date' },
  { key: 'canal_preferencial', label: 'Canal preferencial', type: 'select' },
  { key: 'observacoes', label: 'Observações', type: 'textarea' },
]
