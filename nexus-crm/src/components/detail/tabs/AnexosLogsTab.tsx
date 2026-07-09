/**
 * Guia padrão "Anexos e logs" — entity-agnostic. Duas colunas: anexos do
 * cadastro e linha do tempo de eventos. Como o app é frontend-puro, o arquivo
 * selecionado apenas vira metadado no mock, sem upload real.
 */
import { useRef } from 'react'
import { FileText, Image, Archive, Download, Clock, Plus, SlidersHorizontal } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { DetailCard, EmptyState, GhostButton, Timeline } from '../primitives'
import { fmtDate } from '../../../utils/date'
import type { Anexo, AnexoTipo, LogEntry } from '../types'

const ANEXO_ICON: Record<AnexoTipo, LucideIcon> = {
  pdf: FileText,
  img: Image,
  zip: Archive,
  doc: FileText,
}

function extToTipo(nome: string): AnexoTipo {
  const ext = nome.split('.').pop()?.toLowerCase() ?? ''
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return 'img'
  if (['zip', 'rar', '7z'].includes(ext)) return 'zip'
  if (ext === 'pdf') return 'pdf'
  return 'doc'
}

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function AnexosLogsTab({
  anexos,
  logs,
  onAddAnexo,
  autorPadrao,
  showAuditLogs,
  onToggleAuditLogs,
}: {
  anexos: Anexo[]
  logs: LogEntry[]
  onAddAnexo: (a: Omit<Anexo, 'id'>) => void
  autorPadrao?: string
  showAuditLogs: boolean
  onToggleAuditLogs: (show: boolean) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach((f) =>
      onAddAnexo({
        nome: f.name,
        tipo: extToTipo(f.name),
        tamanho: humanSize(f.size),
        tamanhoBytes: f.size,
        data: new Date().toISOString(),
        autor: autorPadrao,
      }),
    )
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <DetailCard
        title="Anexos"
        icon={FileText}
        action={
          <GhostButton icon={Plus} onClick={() => fileRef.current?.click()}>
            Adicionar
          </GhostButton>
        }
        bodyClassName=""
      >
        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {anexos.length ? (
          <div className="divide-y divide-border-1">
            {anexos.map((a) => {
              const Icon = ANEXO_ICON[a.tipo] ?? FileText
              return (
                <div
                  key={a.id}
                  className="px-6 py-3 flex items-center justify-between hover:bg-bg-surface-2 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded bg-bg-surface-2 text-fg-4 flex items-center justify-center shrink-0">
                      <Icon size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-fg-1 truncate">{a.nome}</p>
                      <p className="text-xs text-fg-4">
                        {[a.tamanho, a.data ? fmtDate(a.data) : null, a.autor]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="p-1.5 text-fg-4 hover:text-accent-primary transition-colors shrink-0"
                    title="Baixar"
                  >
                    <Download size={16} />
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="Nenhum anexo"
            hint="Registre metadados de documentos, apólices e comprovantes deste cadastro."
          />
        )}
      </DetailCard>

      <DetailCard
        title="Linha do tempo"
        icon={Clock}
        action={
          <button
            type="button"
            onClick={() => onToggleAuditLogs(!showAuditLogs)}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              showAuditLogs
                ? 'bg-signal-warning/15 text-signal-warning'
                : 'bg-bg-surface-2 text-fg-3 hover:text-accent-primary'
            }`}
            aria-pressed={showAuditLogs}
          >
            <SlidersHorizontal size={14} />
            Todos os eventos
          </button>
        }
      >
        {logs.length ? (
          <Timeline entries={logs} />
        ) : (
          <EmptyState
            icon={Clock}
            title="Sem registros"
            hint="Alterações das guias aparecem aqui em ordem cronológica."
          />
        )}
      </DetailCard>
    </div>
  )
}
