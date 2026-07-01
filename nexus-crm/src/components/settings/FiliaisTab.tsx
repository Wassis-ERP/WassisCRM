import { useState } from 'react'
import { Plus, Edit, Trash2, Building2, Loader2, MapPin, Network } from 'lucide-react'
import { useFiliaisAdmin } from '../../hooks/useFiliaisAdmin'
import type { Filial, FilialInput } from '../../types/platform'
import { formatCpfCnpj } from '../../utils/documento'
import FilialModal from './FilialModal'
import { useConfirm, useSystemFeedback } from '../feedback/systemFeedbackContext'

export default function FiliaisTab() {
  const { filiais, isLoading, create, update, remove, isSaving, isRemoving } = useFiliaisAdmin()
  const confirm = useConfirm()
  const { notify } = useSystemFeedback()
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState<Filial | null>(null)

  const openNew = () => {
    setSelected(null)
    setIsOpen(true)
  }
  const openEdit = (f: Filial) => {
    setSelected(f)
    setIsOpen(true)
  }

  const handleSave = async (values: FilialInput) => {
    try {
      if (selected) await update({ id: selected.id, patch: values })
      else await create(values)
      setIsOpen(false)
    } catch (err) {
      notify({
        title: 'Erro ao salvar corretora',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        tone: 'danger',
      })
    }
  }

  const handleRemove = async (f: Filial) => {
    const nome = f.fantasia || f.razao_social || 'esta corretora'
    const shouldRemove = await confirm({
      title: 'Inativar corretora',
      description: `Inativar "${nome}"? Ela deixa de aparecer no seletor e nos cadastros.`,
      confirmLabel: 'Inativar',
      tone: 'danger',
    })
    if (!shouldRemove) return
    try {
      await remove(f.id)
    } catch (err) {
      notify({
        title: 'Erro ao inativar corretora',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        tone: 'danger',
      })
    }
  }

  const labelById = new Map(filiais.map((f) => [f.id, f.fantasia || f.razao_social || f.id]))

  return (
    <div className="animate-fade-in flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="text-xl font-bold text-fg-1 mb-1">Corretoras / Filiais</h2>
          <p className="text-sm text-fg-3 font-medium">
            As corretoras (CNPJ/CPF próprio) do grupo. A matriz agrupa as filiais da mesma marca.
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-6 py-2.5 bg-accent-primary text-fg-on-brand rounded-full text-sm font-black hover:bg-accent-primary-hover transition-all shadow-[var(--shadow-brand)] whitespace-nowrap"
        >
          <Plus size={18} /> Nova Corretora
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-fg-3">
          <Loader2 className="animate-spin" size={18} /> Carregando corretoras...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filiais.map((f) => (
            <div
              key={f.id}
              className="p-5 bg-bg-surface border border-border-1 rounded-[8px] group hover:shadow-[var(--shadow-2)] transition-all flex flex-col"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-accent-primary-soft rounded-lg text-accent-primary shrink-0">
                  <Building2 size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-fg-1 truncate">{f.fantasia || f.razao_social || 'Sem nome'}</h3>
                  {f.razao_social && f.fantasia && (
                    <p className="text-[11px] text-fg-3 truncate">{f.razao_social}</p>
                  )}
                  {f.cnpj_cpf && <p className="text-[11px] text-fg-4 font-mono">{formatCpfCnpj(f.cnpj_cpf)}</p>}
                </div>
              </div>

              <div className="space-y-1 text-xs text-fg-3 mb-4 flex-1">
                {(f.cidade || f.uf) && (
                  <p className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-fg-4" />
                    {[f.cidade, f.uf].filter(Boolean).join(' / ')}
                  </p>
                )}
                {f.matriz_id && (
                  <p className="flex items-center gap-1.5">
                    <Network size={12} className="text-fg-4" />
                    Matriz: {labelById.get(f.matriz_id) ?? '—'}
                  </p>
                )}
                {!f.matriz_id && (
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent-primary-soft text-accent-primary">
                    Matriz
                  </span>
                )}
              </div>

              <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(f)}
                  className="p-2 text-fg-4 hover:text-accent-primary hover:bg-accent-primary-soft rounded-[6px] transition-all"
                  title="Editar"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleRemove(f)}
                  disabled={isRemoving}
                  className="p-2 text-fg-4 hover:text-signal-danger hover:bg-signal-danger/10 rounded-[6px] transition-all disabled:opacity-50"
                  title="Inativar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {filiais.length === 0 && (
            <div className="col-span-full text-center py-12 text-fg-4 font-medium text-sm">
              Nenhuma corretora cadastrada. Clique em “Nova Corretora”.
            </div>
          )}
        </div>
      )}

      <FilialModal
        key={`${isOpen}-${selected?.id ?? 'new'}`}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        filial={selected}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  )
}
