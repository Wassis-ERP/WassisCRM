import { useState, type FormEvent, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, CheckCircle2, Clock3, Loader2, Save, ShieldCheck, Target, Users } from 'lucide-react'
import {
  getAdministrationOrganization,
  getAdministrationStatistics,
  updateAdministrationOrganization,
  type AdministrationOrganization,
} from '../../lib/backendAdministrationApi'
import { usesBackendData } from '../../lib/dataMode'
import { useSystemFeedback } from '../feedback/systemFeedbackContext'
import { formatCpfCnpj } from '../../utils/documento'
import { formatTelefone } from '../../utils/masks'

type EditableOrganization = Omit<AdministrationOrganization, 'id' | 'status' | 'isActive'>

const EMPTY: EditableOrganization = {
  legalName: '', tradeName: '', documentNumber: '', email: '', phone: '', mobile: '',
  website: '', timeZone: 'America/Sao_Paulo', defaultCurrency: 'BRL',
}

const inputClass = 'w-full px-4 py-3 bg-bg-surface-2 text-fg-1 placeholder:text-fg-4 border border-border-1 rounded-[6px] text-sm focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 font-medium'

export default function OrganizationManagementTab() {
  const organization = useQuery({
    queryKey: ['administration', 'organization'],
    enabled: usesBackendData,
    queryFn: getAdministrationOrganization,
  })
  const statistics = useQuery({
    queryKey: ['administration', 'statistics'],
    enabled: usesBackendData,
    queryFn: getAdministrationStatistics,
  })

  if (!usesBackendData) return (
    <div className="rounded-[8px] border border-signal-warning/30 bg-signal-warning/10 p-5 text-sm text-fg-2">
      A gestão da empresa e suas estatísticas ficam disponíveis no modo conectado ao WAssisBE.
    </div>
  )

  if (organization.isLoading) return <div className="flex justify-center gap-2 py-12 text-fg-3"><Loader2 className="animate-spin" size={18} /> Carregando empresa...</div>

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-xl font-bold text-fg-1 mb-1">Empresa e indicadores</h2>
        <p className="text-sm text-fg-3 font-medium">Dados do grupo contratante e visão rápida da utilização do CRM.</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3" aria-label="Indicadores da empresa">
        <Metric icon={Users} label="Usuários ativos" value={statistics.data?.activeUsers} detail={`${statistics.data?.inactiveUsers ?? 0} inativos`} />
        <Metric icon={Clock3} label="Convites pendentes" value={statistics.data?.pendingInvitations} detail="aguardando identidade" />
        <Metric icon={Building2} label="Corretoras ativas" value={statistics.data?.activeBranches} detail="matriz e filiais" />
        <Metric icon={Target} label="Oportunidades abertas" value={statistics.data?.openOpportunities} detail={`${statistics.data?.wonOpportunities ?? 0} ganhas`} />
      </div>

      {organization.data && <OrganizationForm organization={organization.data} />}
    </div>
  )
}

function OrganizationForm({ organization }: { organization: AdministrationOrganization }) {
  const queryClient = useQueryClient()
  const { notify } = useSystemFeedback()
  const [form, setForm] = useState<EditableOrganization>(() => {
    const { id: _id, status: _status, isActive: _isActive, ...editable } = organization
    void _id; void _status; void _isActive
    return { ...EMPTY, ...editable }
  })
  const save = useMutation({
    mutationFn: updateAdministrationOrganization,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['administration', 'organization'] })
      notify({ title: 'Dados da empresa atualizados', description: 'As configurações do grupo foram salvas.', tone: 'success' })
    },
    onError: (error) => notify({
      title: 'Erro ao salvar empresa', description: error instanceof Error ? error.message : 'Tente novamente.', tone: 'danger',
    }),
  })
  const set = <K extends keyof EditableOrganization>(key: K, value: EditableOrganization[K]) =>
    setForm((current) => ({ ...current, [key]: value }))
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!form.legalName?.trim()) {
      notify({ title: 'Razão social obrigatória', description: 'Informe a identificação jurídica do grupo.', tone: 'warning' })
      return
    }
    await save.mutateAsync(form)
  }

  return (
    <form onSubmit={submit} className="bg-bg-surface border border-border-1 rounded-[8px] shadow-[var(--shadow-1)] overflow-hidden">
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <Field label="Razão social" span="xl:col-span-2">
            <input className={inputClass} value={form.legalName ?? ''} onChange={(e) => set('legalName', e.target.value)} required />
          </Field>
          <Field label="Nome fantasia">
            <input className={inputClass} value={form.tradeName ?? ''} onChange={(e) => set('tradeName', e.target.value)} />
          </Field>
          <Field label="CNPJ / CPF">
            <input className={inputClass} value={formatCpfCnpj(form.documentNumber ?? '')} onChange={(e) => set('documentNumber', e.target.value)} />
          </Field>
          <Field label="E-mail">
            <input type="email" className={inputClass} value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} />
          </Field>
          <Field label="Site">
            <input type="url" className={inputClass} placeholder="https://" value={form.website ?? ''} onChange={(e) => set('website', e.target.value)} />
          </Field>
          <Field label="Telefone">
            <input className={inputClass} value={formatTelefone(form.phone ?? '')} onChange={(e) => set('phone', e.target.value)} />
          </Field>
          <Field label="Celular">
            <input className={inputClass} value={formatTelefone(form.mobile ?? '')} onChange={(e) => set('mobile', e.target.value)} />
          </Field>
          <Field label="Fuso horário">
            <select className={inputClass} value={form.timeZone ?? 'America/Sao_Paulo'} onChange={(e) => set('timeZone', e.target.value)}>
              <option value="America/Sao_Paulo">Brasília (São Paulo)</option>
              <option value="America/Manaus">Manaus</option>
              <option value="America/Cuiaba">Cuiabá</option>
              <option value="America/Rio_Branco">Rio Branco</option>
            </select>
          </Field>
          <Field label="Moeda padrão">
            <select className={inputClass} value={form.defaultCurrency ?? 'BRL'} onChange={(e) => set('defaultCurrency', e.target.value)}>
              <option value="BRL">Real brasileiro (BRL)</option>
            </select>
          </Field>
        </div>
        <div className="px-6 py-4 border-t border-border-1 bg-bg-surface-2 flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-xs text-fg-3">
            <ShieldCheck size={14} className="text-accent-primary" /> Alterações são isoladas por grupo e auditadas pelo backend.
          </span>
          <button type="submit" disabled={save.isPending} className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent-primary text-fg-on-brand rounded-full text-sm font-black hover:bg-accent-primary-hover disabled:opacity-50">
            {save.isPending ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
            {save.isPending ? 'Salvando...' : 'Salvar empresa'}
          </button>
        </div>
    </form>
  )
}

function Field({ label, span = '', children }: { label: string; span?: string; children: ReactNode }) {
  return <label className={`space-y-1.5 ${span}`}><span className="block text-[10px] font-black text-fg-4 uppercase tracking-widest ml-1">{label}</span>{children}</label>
}

function Metric({ icon: Icon, label, value, detail }: { icon: typeof Users; label: string; value?: number; detail: string }) {
  return <div className="bg-bg-surface border border-border-1 rounded-[8px] p-4 shadow-[var(--shadow-1)]">
    <div className="flex items-center justify-between gap-2"><Icon size={18} className="text-accent-primary" /><CheckCircle2 size={13} className="text-signal-success" /></div>
    <div className="mt-3 text-2xl font-black text-fg-1">{value ?? '—'}</div>
    <div className="text-xs font-bold text-fg-2">{label}</div>
    <div className="text-[10px] text-fg-4 mt-1">{detail}</div>
  </div>
}
