import { useState, type FormEvent, type ReactNode } from 'react'
import { X, Building2, Edit, Network } from 'lucide-react'
import type { Filial, FilialInput } from '../../types/platform'
import { useFiliais } from '../../hooks/useFiliais'
import { formatCpfCnpj } from '../../utils/documento'
import { formatCep, formatTelefone } from '../../utils/masks'

const EMPTY: FilialInput = {
  matriz_id: null,
  razao_social: '',
  fantasia: '',
  cnpj_cpf: '',
  susep: '',
  percentual_imposto: null,
  lgpd_aceito: false,
  lgpd_aceito_em: null,
  gerente: '',
  contato: '',
  home_page: '',
  email: '',
  telefone: '',
  celular: '',
  telefone2: '',
  cep: '',
  endereco: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
  ativo: true,
}

function toForm(f: Filial | null): FilialInput {
  if (!f) return { ...EMPTY }
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const { id, tenant_id, created_at, updated_at, ...rest } = f
  /* eslint-enable @typescript-eslint/no-unused-vars */
  return { ...EMPTY, ...rest }
}

const inputClass =
  'w-full px-4 py-3 bg-bg-surface-2 text-fg-1 placeholder:text-fg-4 border border-border-1 rounded-[6px] text-sm focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 font-medium'

function Field({ label, children, span = 1 }: { label: string; children: ReactNode; span?: 1 | 2 | 3 }) {
  const spanClass = span === 3 ? 'md:col-span-3' : span === 2 ? 'md:col-span-2' : ''
  return (
    <div className={`space-y-1.5 ${spanClass}`}>
      <label className="text-[10px] font-black text-fg-4 uppercase tracking-widest ml-1">{label}</label>
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-[11px] font-black text-fg-3 uppercase tracking-widest mt-2 mb-1 md:col-span-3">
      {children}
    </h3>
  )
}

export default function FilialModal({
  isOpen,
  onClose,
  filial,
  onSave,
  isSaving,
}: {
  isOpen: boolean
  onClose: () => void
  filial: Filial | null
  onSave: (values: FilialInput) => Promise<void>
  isSaving: boolean
}) {
  const [form, setForm] = useState<FilialInput>(() => toForm(filial))
  const { data: filiais } = useFiliais()

  if (!isOpen) return null

  const set = <K extends keyof FilialInput,>(k: K, v: FilialInput[K]) =>
    setForm((p) => ({ ...p, [k]: v }))

  // Invariante: existe no máximo UMA matriz por grupo (matriz_id === null); as
  // demais corretoras são filiais e apontam para ela. O tipo é determinístico:
  // a 1ª corretora é a matriz; as seguintes são filiais; editar a matriz a mantém.
  const existingMatriz = (filiais ?? []).find((f) => f.matriz_id === null && f.id !== filial?.id)
  const isMatriz = filial ? filial.matriz_id === null : !existingMatriz

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const payload: FilialInput = {
      ...form,
      matriz_id: isMatriz ? null : existingMatriz?.id ?? null,
      uf: form.uf ? form.uf.toUpperCase().slice(0, 2) : form.uf,
      lgpd_aceito_em: form.lgpd_aceito
        ? form.lgpd_aceito_em ?? new Date().toISOString()
        : null,
    }
    await onSave(payload)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[var(--bg-overlay)] backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-bg-surface w-full max-w-3xl rounded-[12px] shadow-[var(--shadow-3)] border border-border-1 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-8 py-6 border-b border-border-1 flex items-center justify-between bg-bg-surface-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-primary-soft rounded-[6px] text-accent-primary">
              {filial ? <Edit size={20} /> : <Building2 size={20} />}
            </div>
            <h2 className="text-xl font-black text-fg-1 uppercase tracking-tight">
              {filial ? 'Editar Corretora' : 'Nova Corretora'}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-2 hover:bg-bg-surface-3 rounded-full transition-colors text-fg-4 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-8 overflow-y-auto max-h-[70vh] custom-scrollbar grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
            <SectionTitle>Identificação</SectionTitle>
            <Field label="Razão Social" span={2}>
              <input
                className={inputClass}
                value={form.razao_social ?? ''}
                onChange={(e) => set('razao_social', e.target.value)}
                placeholder="Ex: Wassis Corretora de Seguros LTDA"
              />
            </Field>
            <Field label="Nome Fantasia">
              <input
                className={inputClass}
                value={form.fantasia ?? ''}
                onChange={(e) => set('fantasia', e.target.value)}
                placeholder="Marca exibida"
              />
            </Field>
            <Field label="CNPJ / CPF">
              <input
                className={inputClass}
                value={formatCpfCnpj(form.cnpj_cpf ?? '')}
                onChange={(e) => set('cnpj_cpf', e.target.value)}
                placeholder="PF ou PJ"
              />
            </Field>
            <Field label="SUSEP">
              <input
                className={inputClass}
                value={form.susep ?? ''}
                onChange={(e) => set('susep', e.target.value)}
                placeholder="Registro SUSEP"
              />
            </Field>
            <Field label="Tipo de unidade">
              <div className="h-[46px] px-4 flex items-center gap-2 bg-bg-surface-2 border border-border-1 rounded-[6px]">
                {isMatriz ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent-primary-soft text-accent-primary">
                    <Network size={12} /> Matriz (sede do grupo)
                  </span>
                ) : (
                  <span className="text-sm font-medium text-fg-2 flex items-center gap-1.5 min-w-0">
                    <Network size={12} className="text-fg-4 shrink-0" />
                    Filial de <strong className="text-fg-1 truncate">{existingMatriz?.label}</strong>
                  </span>
                )}
              </div>
            </Field>

            <SectionTitle>Fiscal & LGPD</SectionTitle>
            <Field label="% Imposto">
              <input
                type="number"
                step="0.01"
                className={inputClass}
                value={form.percentual_imposto ?? ''}
                onChange={(e) =>
                  set('percentual_imposto', e.target.value === '' ? null : Number(e.target.value))
                }
                placeholder="0,00"
              />
            </Field>
            <Field label="Aceite LGPD (corretora)" span={2}>
              <label className="flex items-center gap-3 h-[46px] px-4 bg-bg-surface-2 border border-border-1 rounded-[6px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.lgpd_aceito}
                  onChange={(e) => set('lgpd_aceito', e.target.checked)}
                  className="w-4 h-4 accent-[var(--accent-primary)]"
                />
                <span className="text-sm font-medium text-fg-2">
                  {form.lgpd_aceito ? 'Termos aceitos' : 'Termos não aceitos'}
                </span>
              </label>
            </Field>

            <SectionTitle>Contato</SectionTitle>
            <Field label="Gerente">
              <input className={inputClass} value={form.gerente ?? ''} onChange={(e) => set('gerente', e.target.value)} />
            </Field>
            <Field label="Contato">
              <input className={inputClass} value={form.contato ?? ''} onChange={(e) => set('contato', e.target.value)} />
            </Field>
            <Field label="Home Page">
              <input className={inputClass} value={form.home_page ?? ''} onChange={(e) => set('home_page', e.target.value)} placeholder="https://" />
            </Field>
            <Field label="E-mail">
              <input type="email" className={inputClass} value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} />
            </Field>
            <Field label="Telefone">
              <input className={inputClass} value={formatTelefone(form.telefone ?? '')} onChange={(e) => set('telefone', e.target.value)} />
            </Field>
            <Field label="Celular">
              <input className={inputClass} value={formatTelefone(form.celular ?? '')} onChange={(e) => set('celular', e.target.value)} />
            </Field>
            <Field label="Telefone 2">
              <input className={inputClass} value={formatTelefone(form.telefone2 ?? '')} onChange={(e) => set('telefone2', e.target.value)} />
            </Field>

            <SectionTitle>Endereço</SectionTitle>
            <Field label="CEP">
              <input className={inputClass} value={formatCep(form.cep ?? '')} onChange={(e) => set('cep', e.target.value)} placeholder="00000-000" />
            </Field>
            <Field label="Endereço" span={2}>
              <input className={inputClass} value={form.endereco ?? ''} onChange={(e) => set('endereco', e.target.value)} placeholder="Logradouro" />
            </Field>
            <Field label="Número">
              <input className={inputClass} value={form.numero ?? ''} onChange={(e) => set('numero', e.target.value)} />
            </Field>
            <Field label="Complemento">
              <input className={inputClass} value={form.complemento ?? ''} onChange={(e) => set('complemento', e.target.value)} />
            </Field>
            <Field label="Bairro">
              <input className={inputClass} value={form.bairro ?? ''} onChange={(e) => set('bairro', e.target.value)} />
            </Field>
            <Field label="Cidade" span={2}>
              <input className={inputClass} value={form.cidade ?? ''} onChange={(e) => set('cidade', e.target.value)} />
            </Field>
            <Field label="UF">
              <input
                maxLength={2}
                className={inputClass}
                value={form.uf ?? ''}
                onChange={(e) => set('uf', e.target.value.toUpperCase())}
                placeholder="SP"
              />
            </Field>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 border-t border-border-1 bg-bg-surface-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-6 py-2.5 text-sm font-bold text-fg-3 hover:text-fg-1 hover:bg-bg-surface-3 rounded-[6px] transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || !(form.razao_social ?? '').trim()}
              className="px-8 py-2.5 bg-accent-primary text-fg-on-brand rounded-full text-sm font-black hover:bg-accent-primary-hover transition-all shadow-[var(--shadow-brand)] disabled:opacity-50"
            >
              {isSaving ? 'Salvando...' : filial ? 'Atualizar' : 'Criar Corretora'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
