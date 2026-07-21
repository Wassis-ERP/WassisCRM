/**
 * Guia padrão "Anexos e logs" — entity-agnostic. Duas colunas: anexos do
 * cadastro e linha do tempo de eventos. Como o app é frontend-puro, o arquivo
 * selecionado apenas vira metadado no mock, sem upload real.
 */
import { useRef, useState } from 'react'
import { FileText, Image, Archive, Download, Clock, Plus, SlidersHorizontal, Pencil, Trash2, Save, X } from 'lucide-react'
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
  onEditAnexo,
  onRemoveAnexo,
  autorPadrao,
  showAuditLogs,
  onToggleAuditLogs,
  metadataOnly = false,
  readOnly = false,
}: {
  anexos: Anexo[]
  logs: LogEntry[]
  onAddAnexo: (a: Omit<Anexo, 'id'>) => void
  onEditAnexo?: (id: string, a: Pick<Anexo, 'nome' | 'categoria' | 'descricao' | 'status'>) => void
  onRemoveAnexo?: (id: string) => void
  autorPadrao?: string
  showAuditLogs: boolean
  onToggleAuditLogs: (show: boolean) => void
  metadataOnly?: boolean
  readOnly?: boolean
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState<Anexo | null>(null)
  const [draft, setDraft] = useState({ nome: '', categoria: 'documento', descricao: '', status: 'ativo' })

  const startEditing = (anexo: Anexo) => {
    setEditing(anexo)
    setDraft({
      nome: anexo.nome,
      categoria: anexo.categoria ?? 'documento',
      descricao: anexo.descricao ?? '',
      status: anexo.status ?? 'ativo',
    })
  }

  const saveMetadata = () => {
    if (!editing || !draft.nome.trim()) return
    if (editing.id) onEditAnexo?.(editing.id, draft)
    else onAddAnexo({
      nome: draft.nome.trim(),
      tipo: extToTipo(draft.nome),
      tamanho: '0 B',
      tamanhoBytes: 0,
      data: new Date().toISOString(),
      autor: autorPadrao,
      categoria: draft.categoria,
      descricao: draft.descricao,
      status: draft.status,
    })
    setEditing(null)
  }

  const startMetadata = () => {
    setDraft({ nome: '', categoria: 'documento', descricao: '', status: 'ativo' })
    setEditing({ id: '', nome: '', tipo: 'doc', tamanho: '0 B' })
  }

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
          !readOnly && (
            <GhostButton icon={Plus} onClick={() => metadataOnly ? startMetadata() : fileRef.current?.click()}>
              {metadataOnly ? 'Adicionar metadado' : 'Adicionar'}
            </GhostButton>
          )
        }
        bodyClassName=""
      >
        {!readOnly && !metadataOnly && (
          <input
            ref={fileRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        )}
        {editing && (
          <div className="m-4 space-y-3 rounded-[8px] border border-border-1 bg-bg-surface-2 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black text-fg-1">Metadados do anexo</h3>
              <button type="button" onClick={() => setEditing(null)} className="rounded-[6px] p-1.5 text-fg-4 hover:bg-bg-surface-3 hover:text-fg-1" aria-label="Fechar edição"><X size={15} /></button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-bold text-fg-3">Nome do arquivo<input value={draft.nome} onChange={(event) => setDraft((current) => ({ ...current, nome: event.target.value }))} className="mt-1 w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2 text-sm text-fg-1 focus:border-accent-primary focus:outline-none" /></label>
              <label className="text-xs font-bold text-fg-3">Categoria<input value={draft.categoria} onChange={(event) => setDraft((current) => ({ ...current, categoria: event.target.value }))} className="mt-1 w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2 text-sm text-fg-1 focus:border-accent-primary focus:outline-none" /></label>
              <label className="text-xs font-bold text-fg-3 sm:col-span-2">Descrição<textarea value={draft.descricao} onChange={(event) => setDraft((current) => ({ ...current, descricao: event.target.value }))} rows={2} className="mt-1 w-full resize-none rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2 text-sm text-fg-1 focus:border-accent-primary focus:outline-none" /></label>
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={saveMetadata} disabled={!draft.nome.trim()} className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-4 py-2 text-xs font-black text-fg-on-brand disabled:opacity-40"><Save size={14} />Salvar metadados</button>
            </div>
          </div>
        )}
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
                  <div className="flex shrink-0 items-center gap-1">
                    {a.disponivelParaDownload && <button type="button" className="p-1.5 text-fg-4 hover:text-accent-primary transition-colors" title="Baixar"><Download size={16} /></button>}
                    {!readOnly && onEditAnexo && <button type="button" onClick={() => startEditing(a)} className="rounded-[6px] p-1.5 text-fg-4 hover:bg-bg-surface-3 hover:text-accent-primary" aria-label={`Editar metadados de ${a.nome}`}><Pencil size={15} /></button>}
                    {!readOnly && onRemoveAnexo && <button type="button" onClick={() => onRemoveAnexo(a.id)} className="rounded-[6px] p-1.5 text-fg-4 hover:bg-signal-danger/10 hover:text-signal-danger" aria-label={`Remover anexo ${a.nome}`}><Trash2 size={15} /></button>}
                  </div>
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
