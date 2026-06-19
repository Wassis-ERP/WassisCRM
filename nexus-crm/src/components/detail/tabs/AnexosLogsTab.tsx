/**
 * Guia padrão "Anexos e logs" — entity-agnostic. Duas colunas: anexos do
 * cadastro e linha do tempo de eventos. Como o app é frontend-puro, o upload
 * apenas registra metadados do arquivo (nome/tamanho/tipo) na sessão.
 */
import { useRef, useState } from 'react'
import { FileText, Image, Archive, Download, Clock, Plus } from 'lucide-react'
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

const inputCls =
  'w-full px-3 py-2 bg-bg-surface text-fg-1 border border-border-1 rounded-[6px] text-sm focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30'

function NovoLogForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (l: Omit<LogEntry, 'id'>) => void
  onCancel: () => void
}) {
  const [titulo, setTitulo] = useState('')
  const [detalhe, setDetalhe] = useState('')

  const submit = () => {
    if (!titulo.trim()) return
    onSubmit({
      titulo: titulo.trim(),
      detalhe: detalhe.trim() || undefined,
      quando: new Date().toISOString(),
      tipo: 'nota',
    })
    onCancel()
  }

  return (
    <div className="mb-4 p-4 bg-bg-surface-2 rounded-xl border border-border-1 space-y-3">
      <input
        autoFocus
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Título do registro"
        className={inputCls}
      />
      <textarea
        value={detalhe}
        onChange={(e) => setDetalhe(e.target.value)}
        placeholder="Detalhe (opcional)"
        rows={2}
        className={inputCls}
      />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-sm text-fg-3 hover:text-fg-1">
          Cancelar
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!titulo.trim()}
          className="px-4 py-1.5 bg-accent-primary text-fg-on-brand rounded-full text-sm font-semibold hover:bg-accent-primary-hover disabled:opacity-50"
        >
          Registrar
        </button>
      </div>
    </div>
  )
}

export default function AnexosLogsTab({
  anexos,
  logs,
  onAddAnexo,
  onAddLog,
  autorPadrao,
}: {
  anexos: Anexo[]
  logs: LogEntry[]
  onAddAnexo: (a: Omit<Anexo, 'id'>) => void
  onAddLog: (l: Omit<LogEntry, 'id'>) => void
  autorPadrao?: string
}) {
  const [addingLog, setAddingLog] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach((f) =>
      onAddAnexo({
        nome: f.name,
        tipo: extToTipo(f.name),
        tamanho: humanSize(f.size),
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
            Enviar
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
            hint="Envie documentos, apólices e comprovantes deste cadastro."
          />
        )}
      </DetailCard>

      <DetailCard
        title="Linha do tempo"
        icon={Clock}
        action={
          !addingLog && (
            <GhostButton icon={Plus} onClick={() => setAddingLog(true)}>
              Novo log
            </GhostButton>
          )
        }
      >
        {addingLog && <NovoLogForm onSubmit={onAddLog} onCancel={() => setAddingLog(false)} />}
        {logs.length ? (
          <Timeline entries={logs} />
        ) : (
          !addingLog && (
            <EmptyState
              icon={Clock}
              title="Sem registros"
              hint="Eventos e anotações do cadastro aparecem aqui em ordem cronológica."
            />
          )
        )}
      </DetailCard>
    </div>
  )
}
