import { BadgeDollarSign, Edit, Link2, Plus, Search, Trash2, UserPlus } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useFiliais } from '../hooks/useFiliais'
import { useRamos } from '../hooks/useLookups'
import {
  useRepasseRegrasAdmin,
  type RepasseBase,
  type RepasseGatilho,
  type RepassePapel,
  type RepasseRegraRow,
  type RepasseTipoDocumento,
} from '../hooks/useLookupsAdmin'
import { useProdutoresAdmin } from '../hooks/useProdutoresAdmin'
import { useTeamAdmin } from '../hooks/useTeamAdmin'
import type { Produtor, ProdutorInput } from '../types/platform'
import { formatCpfCnpj } from '../utils/documento'
import { formatTelefone } from '../utils/masks'
import { useConfirm, useSystemFeedback } from '../components/feedback/systemFeedbackContext'
import { platformDefaults } from '../types/platformRows'
import './ProdutoresPage.css'

const EMPTY: ProdutorInput = {
  ...platformDefaults.produtores,
  profile_id: null,
  nome: '',
  cpf_cnpj: '',
  email: '',
  telefone: '',
  celular: '',
  banco: '',
  agencia: '',
  conta: '',
  chave_pix: '',
  percentual_repasse_padrao: null,
  ativo: true,
}

function toForm(produtor: Produtor | null): ProdutorInput {
  if (!produtor) return { ...EMPTY }
  const { id, tenant_id, ...rest } = produtor
  void id
  void tenant_id
  return { ...EMPTY, ...rest }
}

const inputClass =
  'w-full px-4 py-3 bg-bg-surface-2 text-fg-1 placeholder:text-fg-4 border border-border-1 rounded-[6px] text-sm focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 font-medium'

const REPASSE_PAPEIS: Array<{ value: RepassePapel; label: string }> = [
  { value: 'PRODUTOR', label: 'Produtor' },
  { value: 'GERENTE', label: 'Gerente' },
]

const REPASSE_DOCUMENTOS: Array<{ value: RepasseTipoDocumento | ''; label: string }> = [
  { value: '', label: 'Nova e renovação' },
  { value: 'NOVA', label: 'Nova' },
  { value: 'RENOVACAO', label: 'Renovação' },
]

const REPASSE_BASES: Array<{ value: RepasseBase; label: string }> = [
  { value: 'COMISSAO', label: 'Comissão' },
  { value: 'PREMIO_LIQUIDO', label: 'Prêmio líquido' },
  { value: 'VALOR_FIXO', label: 'Valor fixo' },
]

const REPASSE_GATILHOS: Array<{ value: RepasseGatilho; label: string }> = [
  { value: 'NA_EMISSAO', label: 'Na emissão' },
  { value: 'PRIMEIRA_COMISSAO', label: 'Primeira comissão' },
  { value: 'CONFORME_RECEBIMENTO', label: 'Conforme recebimento' },
  { value: 'PARCELADO', label: 'Parcelado' },
]

const moedaFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const labelFrom = <T extends string>(items: Array<{ value: T; label: string }>, value: T | null | undefined) =>
  items.find((item) => item.value === value)?.label ?? value ?? '-'

const repasseValorText = (regra: RepasseRegraRow) =>
  regra.base === 'VALOR_FIXO'
    ? moedaFormatter.format(regra.valor_fixo ?? 0)
    : `${regra.percentual ?? 0}%`

function ProdutorForm({
  onClose,
  produtor,
  onSave,
  isSaving,
  regras,
  isLoadingRegras,
  filialMap,
  ramoMap,
  onCreateRegra,
}: {
  onClose: () => void
  produtor: Produtor | null
  onSave: (values: ProdutorInput) => Promise<void>
  isSaving: boolean
  regras: RepasseRegraRow[]
  isLoadingRegras: boolean
  filialMap: Map<string, string>
  ramoMap: Map<string, string>
  onCreateRegra: (produtorId: string) => void
}) {
  const [form, setForm] = useState<ProdutorInput>(() => toForm(produtor))
  const { members } = useTeamAdmin()

  const confirm = useConfirm()
  const leave = async (destination: () => void) => {
    const dirty=JSON.stringify(form)!==JSON.stringify(toForm(produtor))
    if(dirty && !await confirm({title:'Descartar alterações?',description:'Os dados não salvos do produtor serão descartados.',confirmLabel:'Descartar',tone:'warning'}))return
    destination()
  }
  const close = () => leave(onClose)

  const set = <K extends keyof ProdutorInput,>(key: K, value: ProdutorInput[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const handleProfileChange = (profileId: string) => {
    const member = members.find((m) => m.id === profileId)
    set('profile_id', profileId || null)
    if (member && (!form.nome || form.profile_id)) {
      setForm((current) => ({
        ...current,
        profile_id: profileId,
        nome: member.nome_completo || current.nome,
        email: member.email || current.email,
      }))
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    await onSave({
      ...form,
      profile_id: form.profile_id || null,
      percentual_repasse_padrao:
        form.percentual_repasse_padrao === null || Number.isNaN(Number(form.percentual_repasse_padrao))
          ? null
          : Number(form.percentual_repasse_padrao),
    })
  }

  return (
    <section className="producer-form p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6"><h1 className="text-2xl font-bold text-fg-1">{produtor ? 'Editar produtor' : 'Novo produtor'}</h1><button type="button" disabled={isSaving} onClick={()=>void close()} className="px-4 py-2 rounded-md border border-border-1 text-fg-2">Voltar aos produtores</button></div>
      <form onSubmit={handleSubmit}>
          <div className="p-6 bg-bg-surface border border-border-1 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
            <h3 className="text-[11px] font-black text-fg-3 uppercase tracking-widest md:col-span-3">Vínculo</h3>
            <label className="space-y-1.5 md:col-span-3">
              <span className="text-[10px] font-black text-fg-4 uppercase tracking-widest ml-1">Membro interno</span>
              <select
                value={form.profile_id ?? ''}
                onChange={(e) => handleProfileChange(e.target.value)}
                className={inputClass}
              >
                <option value="">Produtor externo sem login</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome_completo || m.email} ({m.email})
                  </option>
                ))}
              </select>
            </label>

            <h3 className="text-[11px] font-black text-fg-3 uppercase tracking-widest md:col-span-3">Cadastro</h3>
            <label className="space-y-1.5 md:col-span-2">
              <span className="text-[10px] font-black text-fg-4 uppercase tracking-widest ml-1">Nome</span>
              <input className={inputClass} value={form.nome ?? ''} onChange={(e) => set('nome', e.target.value)} required />
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-black text-fg-4 uppercase tracking-widest ml-1">CPF/CNPJ</span>
              <input className={inputClass} value={formatCpfCnpj(form.cpf_cnpj ?? '')} onChange={(e) => set('cpf_cnpj', e.target.value)} />
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-black text-fg-4 uppercase tracking-widest ml-1">E-mail</span>
              <input type="email" className={inputClass} value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} />
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-black text-fg-4 uppercase tracking-widest ml-1">Telefone</span>
              <input className={inputClass} value={formatTelefone(form.telefone ?? '')} onChange={(e) => set('telefone', e.target.value)} />
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-black text-fg-4 uppercase tracking-widest ml-1">Celular</span>
              <input className={inputClass} value={formatTelefone(form.celular ?? '')} onChange={(e) => set('celular', e.target.value)} />
            </label>

            <label className="space-y-1.5"><span className="text-xs font-bold text-fg-3">Tipo de pessoa</span><select aria-label="Tipo de pessoa" value={form.tipo_pessoa??''} onChange={e=>set('tipo_pessoa',e.target.value==='PF'?'PF':e.target.value==='PJ'?'PJ':null)} className={inputClass}><option value="">Não informado</option><option value="PF">Pessoa física</option><option value="PJ">Pessoa jurídica</option></select></label>
            {([['nome_fantasia','Nome fantasia'],['rg_ie','RG / Inscrição estadual'],['susep','SUSEP'],['categoria_operacional','Categoria operacional']] as const).map(([key,label])=><label key={key} className="space-y-1.5"><span className="text-xs font-bold text-fg-3">{label}</span><input className={inputClass} value={form[key]??''} onChange={e=>set(key,e.target.value||null)}/></label>)}
            {form.tipo_pessoa==='PF'&&<label className="space-y-1.5"><span className="text-xs font-bold text-fg-3">Data de nascimento</span><input type="date" className={inputClass} value={form.data_nascimento??''} onChange={e=>set('data_nascimento',e.target.value||null)}/></label>}
            <h3 className="text-[11px] font-black text-fg-3 uppercase tracking-widest md:col-span-3">Pagamento e regras de repasse</h3>
            <div className="md:col-span-3 rounded-[8px] border border-border-1 bg-bg-surface-2 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-fg-4">Regras vinculadas</h4>
                  <p className="mt-1 text-xs font-semibold leading-relaxed text-fg-3">
                    Regras individuais deste produtor aparecem em Configurações &gt; Financeiro &gt; Regras de Repasse.
                  </p>
                </div>
                {produtor && (
                  <button
                    type="button"
                    onClick={() => void leave(() => onCreateRegra(produtor.id))}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-accent-primary px-4 py-2 text-xs font-black text-fg-on-brand shadow-[var(--shadow-brand)] transition-colors hover:bg-accent-primary-hover"
                  >
                    <Plus size={14} /> Nova regra para este produtor
                  </button>
                )}
              </div>

              {!produtor ? (
                <div className="mt-4 rounded-[6px] border border-dashed border-border-1 bg-bg-surface px-3 py-3 text-xs font-semibold text-fg-3">
                  Salve o produtor antes de vincular regras de repasse.
                </div>
              ) : isLoadingRegras ? (
                <div className="mt-4 rounded-[6px] border border-border-1 bg-bg-surface px-3 py-3 text-xs font-semibold text-fg-3">
                  Carregando regras vinculadas...
                </div>
              ) : regras.length === 0 ? (
                <div className="mt-4 rounded-[6px] border border-dashed border-border-1 bg-bg-surface px-3 py-3 text-xs font-semibold leading-relaxed text-fg-3">
                  Nenhuma regra individual ativa. Na geração futura, valerá a regra mais específica de grupo, corretora, ramo e documento.
                </div>
              ) : (
                <div className="mt-4 grid gap-2">
                  {regras.map((regra) => (
                    <div key={regra.id} className="rounded-[6px] border border-border-1 bg-bg-surface px-3 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black text-fg-1">{labelFrom(REPASSE_PAPEIS, regra.papel)}</span>
                        <span className="rounded-full bg-accent-primary-soft px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-accent-primary">
                          {labelFrom(REPASSE_DOCUMENTOS, regra.tipo_documento ?? '')}
                        </span>
                        <span className="rounded-full bg-bg-surface-2 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-fg-4">
                          prioridade {regra.prioridade}
                        </span>
                      </div>
                      <p className="mt-2 text-xs font-semibold text-fg-2">
                        {labelFrom(REPASSE_BASES, regra.base)} · {repasseValorText(regra)} · {labelFrom(REPASSE_GATILHOS, regra.gatilho)}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold text-fg-4">
                        {filialMap.get(regra.filial_id ?? '') ?? 'Grupo inteiro'} · {ramoMap.get(regra.ramo_id ?? '') ?? 'Todos os ramos'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <label className="space-y-1.5">
              <span className="text-[10px] font-black text-fg-4 uppercase tracking-widest ml-1">Banco</span>
              <input className={inputClass} value={form.banco ?? ''} onChange={(e) => set('banco', e.target.value)} />
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-black text-fg-4 uppercase tracking-widest ml-1">Agência</span>
              <input className={inputClass} value={form.agencia ?? ''} onChange={(e) => set('agencia', e.target.value)} />
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-black text-fg-4 uppercase tracking-widest ml-1">Conta</span>
              <input className={inputClass} value={form.conta ?? ''} onChange={(e) => set('conta', e.target.value)} />
            </label>
            <label className="space-y-1.5 md:col-span-2">
              <span className="text-[10px] font-black text-fg-4 uppercase tracking-widest ml-1">Chave Pix</span>
              <input className={inputClass} value={form.chave_pix ?? ''} onChange={(e) => set('chave_pix', e.target.value)} />
            </label>
            <label className="space-y-1.5"><span className="text-xs font-bold text-fg-3">Tipo de conta</span><select aria-label="Tipo de conta" className={inputClass} value={form.tipo_conta??''} onChange={e=>set('tipo_conta',e.target.value||null)}><option value="">Não informado</option><option value="CORRENTE">Corrente</option><option value="POUPANCA">Poupança</option><option value="PAGAMENTO">Pagamento</option></select></label>
            {([['favorecido_nome','Nome do favorecido'],['favorecido_cpf_cnpj','CPF/CNPJ do favorecido']] as const).map(([key,label])=><label key={key} className="space-y-1.5"><span className="text-xs font-bold text-fg-3">{label}</span><input className={inputClass} value={form[key]??''} onChange={e=>set(key,e.target.value||null)}/></label>)}
            <label className="flex gap-2 items-center text-sm text-fg-2"><input type="checkbox" checked={form.descontar_imposto===true} onChange={e=>set('descontar_imposto',e.target.checked)}/>Descontar imposto</label>
            <label className="space-y-1.5"><span className="text-xs font-bold text-fg-3">Imposto (%)</span><input type="number" min="0" max="100" step="0.01" className={inputClass} value={form.percentual_imposto??''} onChange={e=>set('percentual_imposto',e.target.value===''?null:Number(e.target.value))}/></label>
            <p className="md:col-span-3 text-xs text-fg-3">Dados fiscais de referência do cadastro. As regras de repasse continuam sendo configuradas na área financeira.</p>
            <h3 className="text-[11px] font-black text-fg-3 uppercase tracking-widest md:col-span-3">Endereço e informações adicionais</h3>
            {([['telefone2','Telefone adicional'],['cep','CEP'],['endereco','Endereço'],['numero','Número'],['complemento','Complemento'],['bairro','Bairro'],['cidade','Cidade'],['uf','UF'],['pais','País'],['observacoes','Observações']] as const).map(([key,label])=><label key={key} className="space-y-1.5"><span className="text-xs font-bold text-fg-3">{label}</span><input className={inputClass} value={form[key]??''} onChange={e=>set(key,e.target.value||null)}/></label>)}
          </div>

          <div className="px-8 py-6 border-t border-border-1 bg-bg-surface-2 flex justify-end gap-3">
            <button type="button" onClick={()=>void close()} disabled={isSaving} className="px-6 py-2.5 text-sm font-bold text-fg-3 hover:text-fg-1 hover:bg-bg-surface-3 rounded-[6px] transition-all disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={isSaving || !form.nome?.trim()} className="px-8 py-2.5 bg-accent-primary text-fg-on-brand rounded-full text-sm font-black hover:bg-accent-primary-hover transition-all shadow-[var(--shadow-brand)] disabled:opacity-50">
              {isSaving ? 'Salvando...' : produtor ? 'Atualizar' : 'Criar Produtor'}
            </button>
          </div>
      </form>
    </section>
  )
}

export default function ProdutoresPage() {
  const { produtores, isLoading, create, update, remove, isSaving, isRemoving } = useProdutoresAdmin()
  const { regras, isLoading: isLoadingRegras } = useRepasseRegrasAdmin()
  const { data: filiais } = useFiliais()
  const { data: ramos } = useRamos()
  const confirm = useConfirm()
  const { notify } = useSystemFeedback()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { produtorId } = useParams<{produtorId:string}>()
  const selected = produtores.find(p=>p.id===produtorId) ?? null

  const filialMap = useMemo(() => new Map((filiais ?? []).map((item) => [item.id, item.label])), [filiais])
  const ramoMap = useMemo(() => new Map((ramos ?? []).map((item) => [item.id, item.nome])), [ramos])
  const regrasAtivasPorProdutor = useMemo(() => {
    const map = new Map<string, RepasseRegraRow[]>()
    regras
      .filter((regra) => regra.ativo && regra.produtor_id)
      .forEach((regra) => {
        const produtorId = regra.produtor_id as string
        map.set(produtorId, [...(map.get(produtorId) ?? []), regra])
      })
    map.forEach((items, produtorId) => {
      map.set(produtorId, [...items].sort((a, b) => (b.prioridade ?? -Infinity) - (a.prioridade ?? -Infinity)))
    })
    return map
  }, [regras])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return produtores
    return produtores.filter((p) =>
      [p.nome, p.email, p.cpf_cnpj].some((value) => (value ?? '').toLowerCase().includes(q)),
    )
  }, [produtores, search])

  const openModal = (produtor?: Produtor) => {
    navigate('/produtores/'+(produtor?.id??'novo'))
  }

  const openRepasseRulesForProdutor = (produtorId: string) => {
    navigate(`/configuracoes?tab=financeiro_regras_repasse&produtorId=${encodeURIComponent(produtorId)}`)
  }

  const handleSave = async (values: ProdutorInput) => {
    try {
      if (selected) await update({ id: selected.id, patch: values })
      else await create(values)
      navigate('/configuracoes?tab=produtores')
    } catch (error) {
      notify({
        title: 'Erro ao salvar produtor',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        tone: 'danger',
      })
    }
  }

  const handleRemove = async (produtor: Produtor) => {
    const shouldRemove = await confirm({
      title: 'Inativar produtor',
      description: `Inativar o produtor ${produtor.nome}? Registros históricos continuam preservados.`,
      confirmLabel: 'Inativar',
      tone: 'danger',
    })
    if (!shouldRemove) return
    try {
      await remove(produtor.id)
    } catch (error) {
      notify({
        title: 'Erro ao inativar produtor',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        tone: 'danger',
      })
    }
  }

  if(produtorId && isLoading) return <p className="p-8 text-fg-3">Carregando produtor…</p>
  if(produtorId && produtorId!=='novo' && !selected) return <p className="p-8 text-fg-3">Produtor não encontrado.</p>
  if(produtorId) return (<ProdutorForm
        onClose={() => navigate('/configuracoes?tab=produtores')}
        key={selected?.id??'novo'}
        produtor={selected}
        onSave={handleSave}
        isSaving={isSaving}
        regras={selected ? regrasAtivasPorProdutor.get(selected.id) ?? [] : []}
        isLoadingRegras={isLoadingRegras}
        filialMap={filialMap}
        ramoMap={ramoMap}
        onCreateRegra={openRepasseRulesForProdutor}
      />)

  return (
    <div className="animate-fade-in flex flex-col h-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="text-xl font-bold text-fg-1 mb-1">Produtores</h2>
          <p className="text-sm text-fg-3 font-medium">
            Cadastre produtores internos e parceiros externos usados na carteira, vendas e repasses.
          </p>
        </div>
        <button onClick={() => openModal()} className="flex items-center gap-2 px-6 py-2.5 bg-accent-primary text-fg-on-brand rounded-full text-sm font-black hover:bg-accent-primary-hover transition-all shadow-[var(--shadow-brand)]">
          <UserPlus size={18} /> Novo Produtor
        </button>
      </div>

      <div className="mb-6 relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-4" />
        <input
          type="text"
          placeholder="Buscar por nome, documento ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-bg-surface text-fg-1 placeholder:text-fg-4 border border-border-1 rounded-[8px] text-sm focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 transition-all shadow-[var(--shadow-1)]"
        />
      </div>

      <div className="bg-bg-surface rounded-[8px] shadow-[var(--shadow-1)] border border-border-1 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-surface-2 text-fg-4 text-[10px] font-black uppercase tracking-widest border-b border-border-1">
                <th className="px-6 py-5">Produtor</th>
                <th className="px-6 py-5">Contato</th>
                <th className="px-6 py-5">Tipo</th>
                <th className="px-6 py-5 text-center">Regras</th>
                <th className="px-6 py-5 text-right w-32">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-1 font-medium">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-fg-4 text-sm">Carregando produtores...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-fg-4 text-sm">Nenhum produtor encontrado.</td></tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-bg-surface-2 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-accent-primary-soft rounded-[6px] flex items-center justify-center text-accent-primary">
                          <BadgeDollarSign size={18} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-fg-1 truncate">{p.nome}</div>
                          <div className="text-[11px] text-fg-4 font-bold">{formatCpfCnpj(p.cpf_cnpj ?? '') || 'Sem documento'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-xs text-fg-2 font-bold">{p.email || 'Sem email'}</div>
                      <div className="text-[11px] text-fg-4">{formatTelefone(p.celular || p.telefone || '') || 'Sem telefone'}</div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        p.profile_id ? 'bg-accent-primary-soft text-accent-primary' : 'bg-bg-surface-3 text-fg-3'
                      }`}>
                        {p.profile_id && <Link2 size={12} />}
                        {p.profile_id ? 'Interno' : 'Externo'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center text-sm font-black text-fg-1">
                      {(() => {
                        const regrasDoProdutor = regrasAtivasPorProdutor.get(p.id) ?? []
                        if (regrasDoProdutor.length > 0) return `${regrasDoProdutor.length} regra${regrasDoProdutor.length > 1 ? 's' : ''}`
                        return '-'
                      })()}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openModal(p)} className="p-2 text-fg-4 hover:text-accent-primary hover:bg-accent-primary-soft rounded-[6px] transition-all" title="Editar produtor" aria-label={`Editar produtor ${p.nome}`}>
                          <Edit size={18} />
                        </button>
                        <button disabled={isRemoving} onClick={() => handleRemove(p)} className="p-2 text-fg-4 hover:text-signal-danger hover:bg-signal-danger/10 rounded-[6px] transition-all disabled:opacity-50" title="Inativar produtor" aria-label={`Inativar produtor ${p.nome}`}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>


    </div>
  )
}
