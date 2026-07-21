import {
  AlertTriangle,
  Banknote,
  ClipboardList,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import type { SinistroDetalhe, SinistroResponsavel } from '../../hooks/useSinistros'
import type {
  SinistroEnvolvidoMaintenanceDraft,
  SinistroMaintenanceInput,
  SinistroMaintenancePatch,
} from '../../modules/sinistro/maintenance'
import { fmtDate } from '../../utils/date'
import { DetailCard, DetailField } from '../detail/primitives'

type EnvolvidoDraft = SinistroEnvolvidoMaintenanceDraft & { clientKey: string }

type CommonProps = {
  sinistro: SinistroDetalhe
  isSaving: boolean
  onCancel: () => void
  onSave: (input: SinistroMaintenanceInput) => void
}

type OverviewProps = CommonProps & {
  responsaveis: SinistroResponsavel[]
}

type EnvolvidosProps = CommonProps & {
  onConfirmRemove: (nome: string) => Promise<boolean>
  onLastInsuredBlocked: () => void
}

const inputClass = 'mt-1 w-full rounded-[6px] border border-border-1 bg-bg-surface px-3 py-2 text-sm text-fg-1 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 disabled:bg-bg-surface-2 disabled:text-fg-4'

function valueOrEmpty(value: string | number | null): string {
  return value == null ? '' : String(value)
}

function numberOrNull(value: string): number | null {
  if (!value.trim()) return null
  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

function formatCurrency(value: number | null): string | undefined {
  if (value == null) return undefined
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function safeDate(value: string | null): string | undefined {
  return value ? fmtDate(value) : undefined
}

function makeClientKey(): string {
  return `envolvido-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function toMaintenanceDraft(
  row: SinistroEnvolvidoMaintenanceDraft | SinistroDetalhe['sinistro_envolvidos'][number],
): SinistroEnvolvidoMaintenanceDraft {
  return {
    id: row.id,
    apolice_item_id: row.apolice_item_id,
    tipo: row.tipo,
    nome: row.nome,
    cpf_cnpj: row.cpf_cnpj,
    email: row.email,
    telefone: row.telefone,
    placa: row.placa,
    seguradora_terceiro: row.seguradora_terceiro,
    apolice_terceiro: row.apolice_terceiro,
    tipo_dano: row.tipo_dano,
    valor_reclamado: row.valor_reclamado,
    responsavel_pelo_evento: row.responsavel_pelo_evento,
    observacoes: row.observacoes,
  }
}

function Field({ label, children, full = false }: { label: string; children: ReactNode; full?: boolean }) {
  return <label className={`text-xs font-bold text-fg-3 ${full ? 'sm:col-span-2 lg:col-span-3' : ''}`}>{label}{children}</label>
}

function EditActions({ isSaving, onCancel, onSave }: { isSaving: boolean; onCancel: () => void; onSave: () => void }) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <button type="button" onClick={onCancel} disabled={isSaving} className="inline-flex items-center gap-2 rounded-full border border-border-1 px-3 py-2 text-xs font-bold text-fg-3 hover:bg-bg-surface-2 disabled:opacity-50">
        <X size={14} /> Cancelar
      </button>
      <button type="button" onClick={onSave} disabled={isSaving} className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-3 py-2 text-xs font-bold text-fg-on-brand hover:bg-accent-primary-hover disabled:opacity-50">
        <Save size={14} /> {isSaving ? 'Salvando…' : 'Salvar alterações'}
      </button>
    </div>
  )
}

export default function SinistroMaintenanceForm({
  sinistro,
  responsaveis,
  isSaving,
  onCancel,
  onSave,
}: OverviewProps) {
  const [patch, setPatch] = useState<SinistroMaintenancePatch>({
    responsavel_id: sinistro.responsavel_id,
    numero_sinistro: sinistro.numero_sinistro,
    numero_aviso: sinistro.numero_aviso,
    protocolo_seguradora: sinistro.protocolo_seguradora,
    cobertura_codigo: sinistro.cobertura_codigo,
    cobertura_nome: sinistro.cobertura_nome,
    data_ocorrencia: sinistro.data_ocorrencia,
    data_aviso: sinistro.data_aviso,
    data_registro_aviso: sinistro.data_registro_aviso,
    tipo_sinistro: sinistro.tipo_sinistro,
    causa: sinistro.causa,
    descricao: sinistro.descricao,
    local_ocorrencia: sinistro.local_ocorrencia,
    valor_estimado: sinistro.valor_estimado,
    valor_pendente: sinistro.valor_pendente,
    regulador_nome: sinistro.regulador_nome,
    oficina_nome: sinistro.oficina_nome,
    observacoes: sinistro.observacoes,
  })

  const setText = (field: keyof SinistroMaintenancePatch, value: string) => {
    setPatch((current) => ({ ...current, [field]: value || null }))
  }
  const submit = () => onSave({
    sinistroId: sinistro.id,
    patch,
    envolvidos: sinistro.sinistro_envolvidos.map(toMaintenanceDraft),
  })
  const apolice = sinistro.apolices
  const segurado = apolice?.segurados

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
      <div className="space-y-6">
        <DetailCard title="Ocorrência e aviso" icon={AlertTriangle} action={<EditActions isSaving={isSaving} onCancel={onCancel} onSave={submit} />}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Número do aviso"><input value={valueOrEmpty(patch.numero_aviso ?? null)} onChange={(event) => setText('numero_aviso', event.target.value)} className={inputClass} /></Field>
            <Field label="Número do sinistro"><input value={valueOrEmpty(patch.numero_sinistro ?? null)} onChange={(event) => setText('numero_sinistro', event.target.value)} className={inputClass} /></Field>
            <Field label="Protocolo da seguradora"><input value={valueOrEmpty(patch.protocolo_seguradora ?? null)} onChange={(event) => setText('protocolo_seguradora', event.target.value)} className={inputClass} /></Field>
            <Field label="Data da ocorrência"><input type="date" value={valueOrEmpty(patch.data_ocorrencia ?? null)} onChange={(event) => setText('data_ocorrencia', event.target.value)} className={inputClass} /></Field>
            <Field label="Data do aviso"><input type="date" value={valueOrEmpty(patch.data_aviso ?? null)} onChange={(event) => setText('data_aviso', event.target.value)} className={inputClass} /></Field>
            <Field label="Registro do aviso"><input type="date" value={valueOrEmpty(patch.data_registro_aviso ?? null)} onChange={(event) => setText('data_registro_aviso', event.target.value)} className={inputClass} /></Field>
            <Field label="Tipo"><select value={patch.tipo_sinistro ?? 'administrativo'} onChange={(event) => setText('tipo_sinistro', event.target.value)} className={inputClass}><option value="administrativo">Administrativo</option><option value="judicial">Judicial</option></select></Field>
            <Field label="Responsável"><select value={patch.responsavel_id ?? ''} onChange={(event) => setText('responsavel_id', event.target.value)} className={inputClass}><option value="">Sem responsável</option>{responsaveis.map((profile) => <option key={profile.id} value={profile.id}>{profile.full_name ?? profile.email ?? profile.id}</option>)}</select></Field>
            <Field label="Causa" full><input value={valueOrEmpty(patch.causa ?? null)} onChange={(event) => setText('causa', event.target.value)} className={inputClass} /></Field>
            <Field label="Descrição" full><textarea rows={3} value={valueOrEmpty(patch.descricao ?? null)} onChange={(event) => setText('descricao', event.target.value)} className={inputClass} /></Field>
            <Field label="Local da ocorrência" full><input value={valueOrEmpty(patch.local_ocorrencia ?? null)} onChange={(event) => setText('local_ocorrencia', event.target.value)} className={inputClass} /></Field>
          </div>
        </DetailCard>

        <DetailCard title="Regulação e cobertura" icon={Wrench}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Cobertura"><input value={valueOrEmpty(patch.cobertura_nome ?? null)} onChange={(event) => setText('cobertura_nome', event.target.value)} className={inputClass} /></Field>
            <Field label="Código da cobertura"><input value={valueOrEmpty(patch.cobertura_codigo ?? null)} onChange={(event) => setText('cobertura_codigo', event.target.value)} className={inputClass} /></Field>
            <DetailField label="Documentação completa" mono>{safeDate(sinistro.data_documentacao_completa)}</DetailField>
            <Field label="Regulador"><input value={valueOrEmpty(patch.regulador_nome ?? null)} onChange={(event) => setText('regulador_nome', event.target.value)} className={inputClass} /></Field>
            <Field label="Oficina"><input value={valueOrEmpty(patch.oficina_nome ?? null)} onChange={(event) => setText('oficina_nome', event.target.value)} className={inputClass} /></Field>
            <DetailField label="Motivo de negativa" full>{sinistro.negativa_motivo}</DetailField>
          </div>
        </DetailCard>

        <DetailCard title="Observação contratual" icon={ClipboardList}>
          <Field label="Observação contratual" full><textarea rows={4} value={valueOrEmpty(patch.observacoes ?? null)} onChange={(event) => setText('observacoes', event.target.value)} className={inputClass} /></Field>
        </DetailCard>
      </div>

      <div className="space-y-6">
        <DetailCard title="Apólice vinculada" icon={ShieldCheck}>
          <div className="space-y-4">
            <DetailField label="Apólice" mono>{apolice?.numero_apolice}</DetailField>
            <DetailField label="Segurado">{segurado?.nome}</DetailField>
            <DetailField label="CPF/CNPJ" mono>{segurado?.cpf_cnpj}</DetailField>
            <DetailField label="Seguradora">{apolice?.seguradoras?.nome}</DetailField>
            <DetailField label="Ramo">{apolice?.ramos?.nome}</DetailField>
            <DetailField label="Vigência" mono>{apolice?.vigencia_inicio && apolice.vigencia_fim ? `${fmtDate(apolice.vigencia_inicio)} a ${fmtDate(apolice.vigencia_fim)}` : undefined}</DetailField>
          </div>
        </DetailCard>

        <DetailCard title="Valores" icon={Banknote}>
          <div className="grid grid-cols-2 gap-5">
            <Field label="Estimado"><input inputMode="decimal" value={valueOrEmpty(patch.valor_estimado ?? null)} onChange={(event) => setPatch((current) => ({ ...current, valor_estimado: numberOrNull(event.target.value) }))} className={inputClass} /></Field>
            <Field label="Pendente"><input inputMode="decimal" value={valueOrEmpty(patch.valor_pendente ?? null)} onChange={(event) => setPatch((current) => ({ ...current, valor_pendente: numberOrNull(event.target.value) }))} className={inputClass} /></Field>
            <DetailField label="Indenizado" mono>{formatCurrency(sinistro.valor_indenizado)}</DetailField>
            <DetailField label="Regulação" mono>{formatCurrency(sinistro.valor_despesas_regulacao)}</DetailField>
            <DetailField label="Salvado" mono>{formatCurrency(sinistro.valor_salvado)}</DetailField>
            <DetailField label="Ressarcimento" mono>{formatCurrency(sinistro.valor_ressarcimento)}</DetailField>
          </div>
        </DetailCard>
      </div>
    </div>
  )
}

export function SinistroEnvolvidosEditor({
  sinistro,
  isSaving,
  onCancel,
  onSave,
  onConfirmRemove,
  onLastInsuredBlocked,
}: EnvolvidosProps) {
  const [envolvidos, setEnvolvidos] = useState<EnvolvidoDraft[]>(() =>
    sinistro.sinistro_envolvidos.map((row) => ({ ...toMaintenanceDraft(row), clientKey: row.id })),
  )
  const itens = sinistro.apolices?.apolice_itens ?? []
  const insuredCount = useMemo(() => envolvidos.filter((row) => row.tipo === 'SEGURADO').length, [envolvidos])

  const update = (clientKey: string, field: keyof SinistroEnvolvidoMaintenanceDraft, value: string | boolean | number | null) => {
    setEnvolvidos((current) => current.map((row) => row.clientKey === clientKey ? { ...row, [field]: value } : row))
  }
  const add = (tipo: 'SEGURADO' | 'TERCEIRO') => {
    const segurado = sinistro.apolices?.segurados
    setEnvolvidos((current) => [...current, {
      clientKey: makeClientKey(),
      tipo,
      apolice_item_id: tipo === 'SEGURADO' ? itens[0]?.id ?? null : null,
      nome: tipo === 'SEGURADO' ? segurado?.nome ?? null : null,
      cpf_cnpj: tipo === 'SEGURADO' ? segurado?.cpf_cnpj ?? null : null,
      email: tipo === 'SEGURADO' ? segurado?.email ?? null : null,
      telefone: tipo === 'SEGURADO' ? segurado?.telefone ?? null : null,
      placa: null,
      seguradora_terceiro: null,
      apolice_terceiro: null,
      tipo_dano: null,
      valor_reclamado: null,
      responsavel_pelo_evento: false,
      observacoes: null,
    }])
  }
  const remove = async (row: EnvolvidoDraft) => {
    if (row.tipo === 'SEGURADO' && insuredCount === 1) {
      onLastInsuredBlocked()
      return
    }
    if (await onConfirmRemove(row.nome ?? 'envolvido')) {
      setEnvolvidos((current) => current.filter((item) => item.clientKey !== row.clientKey))
    }
  }
  const submit = () => onSave({ sinistroId: sinistro.id, patch: {}, envolvidos: envolvidos.map(toMaintenanceDraft) })

  return (
    <DetailCard title="Envolvidos" icon={Users} action={<EditActions isSaving={isSaving} onCancel={onCancel} onSave={submit} />}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border-1 pb-4">
        <p className="text-xs font-semibold text-fg-4">Terceiros permanecem somente neste Sinistro e não são adicionados ao cadastro de segurados.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => add('SEGURADO')} className="inline-flex items-center gap-2 rounded-full border border-border-1 px-3 py-2 text-xs font-bold text-fg-2 hover:bg-bg-surface-2"><ShieldCheck size={14} />Adicionar segurado</button>
          <button type="button" onClick={() => add('TERCEIRO')} className="inline-flex items-center gap-2 rounded-full bg-accent-primary-soft px-3 py-2 text-xs font-bold text-accent-primary hover:bg-accent-primary/10"><Plus size={14} />Adicionar terceiro</button>
        </div>
      </div>
      <div className="divide-y divide-border-1">
        {envolvidos.map((row, index) => (
          <article key={row.clientKey} className="grid gap-4 py-5 first:pt-0 last:pb-0 lg:grid-cols-[minmax(220px,0.8fr)_minmax(0,1.2fr)]">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-sm font-black text-fg-1"><UserRound size={16} />{row.tipo === 'TERCEIRO' ? 'Terceiro' : 'Segurado'} {index + 1}</h3>
                <button type="button" onClick={() => void remove(row)} className="rounded-[6px] p-2 text-fg-4 hover:bg-signal-danger/10 hover:text-signal-danger" aria-label={`Remover ${row.nome ?? 'envolvido'}`}><Trash2 size={15} /></button>
              </div>
              <Field label="Nome"><input value={valueOrEmpty(row.nome)} onChange={(event) => update(row.clientKey, 'nome', event.target.value)} className={inputClass} /></Field>
              <Field label="CPF/CNPJ"><input value={valueOrEmpty(row.cpf_cnpj)} onChange={(event) => update(row.clientKey, 'cpf_cnpj', event.target.value)} className={inputClass} /></Field>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {row.tipo === 'SEGURADO' ? (
                <Field label="Item segurado"><select value={row.apolice_item_id ?? ''} onChange={(event) => update(row.clientKey, 'apolice_item_id', event.target.value || null)} className={inputClass}><option value="">Sem item específico</option>{itens.map((item) => <option key={item.id} value={item.id}>Item {item.numero_item ?? '—'} · {item.descricao ?? item.identificador_externo ?? item.id}</option>)}</select></Field>
              ) : (
                <Field label="Seguradora do terceiro"><input value={valueOrEmpty(row.seguradora_terceiro)} onChange={(event) => update(row.clientKey, 'seguradora_terceiro', event.target.value)} className={inputClass} /></Field>
              )}
              <Field label="Placa"><input value={valueOrEmpty(row.placa)} onChange={(event) => update(row.clientKey, 'placa', event.target.value)} className={inputClass} /></Field>
              <Field label="Tipo de dano"><input value={valueOrEmpty(row.tipo_dano)} onChange={(event) => update(row.clientKey, 'tipo_dano', event.target.value)} className={inputClass} /></Field>
              <Field label="Contato"><div className="grid gap-2"><input aria-label="Telefone" value={valueOrEmpty(row.telefone)} onChange={(event) => update(row.clientKey, 'telefone', event.target.value)} placeholder="Telefone" className={inputClass} /><input aria-label="E-mail" type="email" value={valueOrEmpty(row.email)} onChange={(event) => update(row.clientKey, 'email', event.target.value)} placeholder="E-mail" className={inputClass} /></div></Field>
              {row.tipo === 'TERCEIRO' && <Field label="Apólice do terceiro"><input value={valueOrEmpty(row.apolice_terceiro)} onChange={(event) => update(row.clientKey, 'apolice_terceiro', event.target.value)} className={inputClass} /></Field>}
              <Field label="Valor reclamado"><input inputMode="decimal" value={valueOrEmpty(row.valor_reclamado)} onChange={(event) => update(row.clientKey, 'valor_reclamado', numberOrNull(event.target.value))} className={inputClass} /></Field>
              <label className="mt-6 flex items-center gap-2 text-xs font-bold text-fg-2"><input type="checkbox" checked={row.responsavel_pelo_evento ?? false} onChange={(event) => update(row.clientKey, 'responsavel_pelo_evento', event.target.checked)} />Responsável pelo evento</label>
              <Field label="Observações" full><textarea rows={2} value={valueOrEmpty(row.observacoes)} onChange={(event) => update(row.clientKey, 'observacoes', event.target.value)} className={inputClass} /></Field>
            </div>
          </article>
        ))}
      </div>
    </DetailCard>
  )
}
