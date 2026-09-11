import { useMemo, useState } from 'react'
import { Link2, Search, UserPlus, X } from 'lucide-react'
import type { OpportunityDetail } from '../../hooks/useOportunidades'
import { useCreateSegurado, useIsDocumentoUnique, useSegurados } from '../../hooks/useSegurados'
import { formatCpfCnpj, isValidDocumento, onlyDigits } from '../../utils/documento'

const inputClass =
  'w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2.5 text-sm font-semibold text-fg-1 placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30'

export default function LeadQualificationPanel({
  opportunity,
  onCancel,
  onQualify,
}: {
  opportunity: OpportunityDetail
  onCancel: () => void
  onQualify: (seguradoId: string) => Promise<void>
}) {
  const segurados = useSegurados()
  const createSegurado = useCreateSegurado()
  const isDocumentoUnique = useIsDocumentoUnique()
  const [mode, setMode] = useState<'existing' | 'new'>('existing')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [tipo, setTipo] = useState<'PF' | 'PJ'>(() => onlyDigits(opportunity.lead_documento).length === 14 ? 'PJ' : 'PF')
  const [nome, setNome] = useState(opportunity.lead_nome ?? '')
  const [documento, setDocumento] = useState(opportunity.lead_documento ?? '')
  const [email, setEmail] = useState(opportunity.lead_email ?? '')
  const [telefone, setTelefone] = useState(opportunity.lead_telefone ?? '')
  const [error, setError] = useState<string | null>(null)
  const [linking, setLinking] = useState(false)

  const options = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase('pt-BR')
    return (segurados.data ?? [])
      .filter((row) => !needle || `${row.nome} ${row.cpf_cnpj ?? ''}`.toLocaleLowerCase('pt-BR').includes(needle))
      .slice(0, 8)
  }, [search, segurados.data])

  const normalizedDocument = onlyDigits(documento)
  const validNew = Boolean(
    nome.trim() &&
    isValidDocumento(normalizedDocument, tipo) &&
    isDocumentoUnique(normalizedDocument),
  )
  const busy = linking || createSegurado.isPending

  const linkExisting = async () => {
    if (!selectedId) return
    setError(null)
    setLinking(true)
    try {
      await onQualify(selectedId)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível vincular o segurado.')
    } finally {
      setLinking(false)
    }
  }

  const createAndLink = async () => {
    setError(null)
    if (!isValidDocumento(normalizedDocument, tipo)) {
      setError(`Informe um ${tipo === 'PF' ? 'CPF' : 'CNPJ'} válido.`)
      return
    }
    if (!isDocumentoUnique(normalizedDocument)) {
      setError('Já existe um segurado com este CPF/CNPJ nesta corretora. Vincule o cadastro existente.')
      return
    }
    setLinking(true)
    try {
      const created = await createSegurado.mutateAsync({
        tipo,
        nome: nome.trim(),
        cpf_cnpj: normalizedDocument,
        email: email.trim() || null,
        telefone: telefone.trim() || null,
        status: 'Prospecto',
        lgpd_autorizado: false,
      })
      await onQualify(created.id)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível qualificar o lead.')
    } finally {
      setLinking(false)
    }
  }

  return (
    <section className="rounded-[8px] border border-accent-primary/25 bg-accent-primary-soft/40">
      <header className="flex items-start justify-between gap-4 border-b border-accent-primary/15 px-4 py-3">
        <div>
          <h3 className="text-sm font-black text-fg-1">Qualificar lead</h3>
          <p className="mt-0.5 text-xs font-semibold text-fg-3">Vincule um segurado existente ou crie o cadastro definitivo sem trocar a oportunidade.</p>
        </div>
        <button type="button" onClick={onCancel} disabled={busy} className="rounded-[6px] p-1.5 text-fg-4 hover:bg-bg-surface hover:text-fg-1 disabled:opacity-40" aria-label="Cancelar qualificação"><X size={17} /></button>
      </header>

      <div className="space-y-4 p-4">
        <div className="inline-flex rounded-[6px] border border-border-1 bg-bg-surface p-1">
          <button type="button" onClick={() => setMode('existing')} className={`rounded-[4px] px-3 py-1.5 text-xs font-black ${mode === 'existing' ? 'bg-accent-primary text-fg-on-brand' : 'text-fg-3 hover:bg-bg-surface-2'}`}>Cadastro existente</button>
          <button type="button" onClick={() => setMode('new')} className={`rounded-[4px] px-3 py-1.5 text-xs font-black ${mode === 'new' ? 'bg-accent-primary text-fg-on-brand' : 'text-fg-3 hover:bg-bg-surface-2'}`}>Novo segurado</button>
        </div>

        {mode === 'existing' ? (
          <div className="space-y-2">
            <label className="relative block">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-4" />
              <input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome ou documento" className={`${inputClass} pl-9`} />
            </label>
            <div className="max-h-44 overflow-y-auto rounded-[6px] border border-border-1 bg-bg-surface">
              {options.map((row) => (
                <button key={row.id} type="button" onClick={() => setSelectedId(row.id)} className={`flex w-full items-center justify-between gap-3 border-b border-border-1 px-3 py-2.5 text-left last:border-0 ${selectedId === row.id ? 'bg-accent-primary-soft' : 'hover:bg-bg-surface-2'}`}>
                  <span className="text-sm font-bold text-fg-1">{row.nome}</span>
                  <span className="font-mono text-xs text-fg-4">{row.cpf_cnpj ? formatCpfCnpj(row.cpf_cnpj) : 'Sem documento'}</span>
                </button>
              ))}
              {!segurados.isLoading && options.length === 0 && <p className="px-3 py-5 text-center text-xs font-semibold text-fg-4">Nenhum segurado encontrado.</p>}
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={() => void linkExisting()} disabled={!selectedId || busy} className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-5 py-2.5 text-sm font-black text-fg-on-brand shadow-[var(--shadow-brand)] disabled:opacity-40"><Link2 size={15} /> Vincular segurado</button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Tipo</span>
                <select value={tipo} onChange={(event) => setTipo(event.target.value as 'PF' | 'PJ')} className={inputClass}><option value="PF">Pessoa física</option><option value="PJ">Pessoa jurídica</option></select>
              </label>
              <label className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">CPF/CNPJ *</span>
                <input value={formatCpfCnpj(documento)} onChange={(event) => setDocumento(onlyDigits(event.target.value).slice(0, tipo === 'PF' ? 11 : 14))} className={`${inputClass} font-mono`} />
              </label>
              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Nome *</span>
                <input value={nome} onChange={(event) => setNome(event.target.value)} className={inputClass} />
              </label>
              <label className="space-y-1.5"><span className="text-[10px] font-black uppercase tracking-widest text-fg-4">E-mail</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} /></label>
              <label className="space-y-1.5"><span className="text-[10px] font-black uppercase tracking-widest text-fg-4">Telefone</span><input value={telefone} onChange={(event) => setTelefone(event.target.value)} className={inputClass} /></label>
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={() => void createAndLink()} disabled={!validNew || busy} className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-5 py-2.5 text-sm font-black text-fg-on-brand shadow-[var(--shadow-brand)] disabled:opacity-40"><UserPlus size={15} /> Criar e qualificar</button>
            </div>
          </div>
        )}

        {error && <div className="rounded-[6px] border border-signal-danger/30 bg-signal-danger/10 px-3 py-2 text-sm font-semibold text-signal-danger">{error}</div>}
      </div>
    </section>
  )
}
