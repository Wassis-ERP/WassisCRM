import { useParams, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import {
  ArrowLeft, ChevronRight, Phone, Mail, MapPin, Edit, Clock, TrendingUp,
  ShieldCheck, ShieldAlert, Users, Building2, User, Globe, Star, Plus, Trash2,
  CalendarDays, MessageCircle, Bell, Sliders, Pin, Link2,
} from 'lucide-react'
import {
  useSegurado,
  useUpdateSegurado,
  usePessoaContatos,
  useCreatePessoaContato,
  useUpdatePessoaContato,
  useDeletePessoaContato,
} from '../hooks/useSegurados'
import type { PessoaContato, Segurado } from '../contexts/seguradosCore'
import {
  useOportunidadesBySegurado,
  useApolicesBySegurado,
  type OportunidadeResumo,
  type ApoliceResumo,
} from '../hooks/useSeguradoNegocios'
import { mapSeguradoRowToView, partialSeguradoToUpdate } from '../lib/seguradoMapper'
import SeguradoModal from '../components/SeguradoModal'
import PessoaContatoModal, { type PessoaContatoFormValue } from '../components/PessoaContatoModal'
import { calcIdade } from '../utils/idade'
import { fmtDate, fmtDateTime } from '../utils/date'
import { DetailCard, DetailField, StatusBadge, EmptyState, GhostButton } from '../components/detail/primitives'
import { EntityTabsBar, type EntityTab } from '../components/detail/EntityTabsBar'
import { useEntityTabsState } from '../components/detail/useEntityTabsState'
import TarefasTab from '../components/detail/tabs/TarefasTab'
import CamposPersonalizadosTab from '../components/detail/tabs/CamposPersonalizadosTab'
import AnexosLogsTab from '../components/detail/tabs/AnexosLogsTab'
import ObservacoesTab from '../components/detail/tabs/ObservacoesTab'
import ApolicesTab from '../components/detail/tabs/ApolicesTab'
import { usePropostas } from '../contexts/usePropostas'

const ESTADO_CIVIL_LABEL: Record<NonNullable<Segurado['estadoCivil']>, string> = {
  Solteiro: 'Solteiro(a)',
  Casado: 'Casado(a)',
  Divorciado: 'Divorciado(a)',
  Viuvo: 'Viúvo(a)',
  UniaoEstavel: 'União Estável',
}
const PORTE_LABEL: Record<NonNullable<Segurado['porte']>, string> = {
  MEI: 'MEI',
  Microempresa: 'Microempresa',
  PequenoPorte: 'Pequeno Porte',
  MedioPorte: 'Médio Porte',
  GrandePorte: 'Grande Porte',
}
const SEXO_LABEL: Record<NonNullable<Segurado['sexo']>, string> = {
  M: 'Masculino',
  F: 'Feminino',
  Outro: 'Outro',
}

type TabId = 'visao' | 'apolices' | 'cadastrais' | 'corretora' | 'tarefas' | 'personalizados' | 'anexos' | 'observacoes'

function enderecoFormatado(s: Segurado): string {
  const linha1 = [s.logradouro, s.numero].filter(Boolean).join(', ')
  const linha2 = [s.bairro, s.cidade, s.estado].filter(Boolean).join(' · ')
  return [linha1, s.complemento, linha2].filter(Boolean).join(' — ')
}

function onlyDigits(v?: string): string {
  return (v ?? '').replace(/\D+/g, '')
}

/**
 * Página de detalhe de uma pessoa (segurado), reorganizada em 7 guias:
 * Visão geral, Dados cadastrais, Controle da corretora + as 4 guias padrão
 * reutilizáveis (Tarefas, Campos personalizados, Anexos e logs, Observações).
 */
export default function SeguradoDetalhePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: row, isLoading, isError, refetch } = useSegurado(id)
  const updateSegurado = useUpdateSegurado()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [vinculoEdit, setVinculoEdit] = useState<PessoaContato | null>(null)
  const [vinculoModalOpen, setVinculoModalOpen] = useState(false)
  const [tab, setTab] = useState<TabId>('visao')

  const segurado = useMemo(() => (row ? mapSeguradoRowToView(row) : undefined), [row])

  const { data: vinculos = [] } = usePessoaContatos(id)
  const createVinculo = useCreatePessoaContato()
  const updateVinculo = useUpdatePessoaContato()
  const deleteVinculo = useDeletePessoaContato()

  const tabsState = useEntityTabsState(id)
  const { data: oportunidades = [] } = useOportunidadesBySegurado(id)
  const { data: apolices = [] } = useApolicesBySegurado(id)
  const { proposals } = usePropostas()
  const apolicesCount = useMemo(() => proposals.filter((p) => p.seguradoId === id).length, [proposals, id])

  if (!id) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-fg-3">
        <p>Identificador inválido.</p>
        <button type="button" onClick={() => navigate('/segurados')} className="mt-4 text-accent-primary font-bold">
          Voltar para a lista
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-fg-3 gap-2">
        <p className="text-sm">Carregando cadastro…</p>
      </div>
    )
  }

  if (isError || !segurado) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-fg-3">
        <p>Segurado não encontrado ou sem permissão de acesso.</p>
        <button type="button" onClick={() => refetch()} className="mt-2 text-sm text-accent-primary font-semibold">
          Tentar novamente
        </button>
        <button type="button" onClick={() => navigate('/segurados')} className="mt-4 text-accent-primary font-bold">
          Voltar para a lista
        </button>
      </div>
    )
  }

  const handleSave = async (data: Partial<Segurado>) => {
    setSaveError(null)
    try {
      await updateSegurado.mutateAsync({ id: segurado.id, patch: partialSeguradoToUpdate(data) })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao salvar cadastro'
      setSaveError(msg)
      throw e
    }
  }

  const isPJ = segurado.tipo === 'PJ'
  const isPF = segurado.tipo === 'PF'
  const contatosDaPJ = isPJ ? vinculos.filter((v) => v.pjId === segurado.id) : []
  const empresasDaPF = isPF ? vinculos.filter((v) => v.pfId === segurado.id) : []
  const idsJaVinculados = isPJ ? contatosDaPJ.map((v) => v.pfId) : empresasDaPF.map((v) => v.pjId)

  const handleSubmitVinculo = async (value: PessoaContatoFormValue) => {
    if (vinculoEdit) {
      await updateVinculo.mutateAsync({
        id: vinculoEdit.id,
        pjId: vinculoEdit.pjId,
        cargo: value.cargo || null,
        principal: value.principal,
      })
    } else {
      const pjId = isPJ ? segurado.id : value.contatoId
      const pfId = isPJ ? value.contatoId : segurado.id
      await createVinculo.mutateAsync({ pjId, pfId, cargo: value.cargo || null, principal: value.principal })
    }
    setVinculoEdit(null)
  }

  const handleRemoveVinculo = async (v: PessoaContato) => {
    if (!window.confirm('Remover este vínculo? O cadastro da pessoa permanece intacto.')) return
    await deleteVinculo.mutateAsync(v.id)
  }

  const openVinculoModal = (v: PessoaContato | null) => {
    setVinculoEdit(v)
    setVinculoModalOpen(true)
  }

  const pendentes = tabsState.tarefas.filter((t) => t.status !== 'Concluída').length
  const tabs: EntityTab<TabId>[] = [
    { id: 'visao', label: 'Visão geral' },
    { id: 'apolices', label: 'Apólices', badge: apolicesCount || undefined },
    { id: 'cadastrais', label: 'Dados cadastrais' },
    { id: 'corretora', label: 'Controle da corretora' },
    { id: 'tarefas', label: 'Tarefas', badge: pendentes || undefined },
    { id: 'personalizados', label: 'Campos personalizados' },
    { id: 'anexos', label: 'Anexos e logs', badge: tabsState.anexos.length || undefined },
    { id: 'observacoes', label: 'Observações', badge: tabsState.observacoes.length || undefined },
  ]

  const telDigits = onlyDigits(segurado.telefone)

  return (
    <div className="animate-fade-in">
      {saveError && (
        <div className="mb-4 rounded-[10px] border border-signal-danger/30 bg-signal-danger/10 px-4 py-3 text-sm text-signal-danger">
          {saveError}
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-fg-3 mb-5">
        <button
          type="button"
          onClick={() => navigate('/segurados')}
          className="flex items-center gap-1.5 hover:text-accent-primary transition-colors"
        >
          <ArrowLeft size={15} /> Segurados
        </button>
        <ChevronRight size={14} className="text-fg-4" />
        <span className="text-fg-1 font-medium truncate">{segurado.nome}</span>
      </div>

      {/* Hero */}
      <div className="bg-bg-surface rounded-[14px] shadow-[var(--shadow-1)] border border-border-1 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-16 h-16 bg-gradient-to-br from-accent-primary to-brand-primary-deep rounded-[14px] flex items-center justify-center text-fg-on-brand shrink-0">
              {isPJ ? <Building2 size={26} /> : <User size={26} />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold truncate">{segurado.nome}</h1>
                <span className="px-2.5 py-0.5 bg-bg-surface-3 text-fg-3 rounded text-[10px] font-bold uppercase tracking-wide">
                  {isPJ ? 'Pessoa Jurídica' : 'Pessoa Física'}
                </span>
                <StatusBadge status={segurado.status} />
              </div>
              {isPJ && segurado.nomeFantasia && (
                <p className="text-sm text-fg-3 mt-0.5">{segurado.nomeFantasia}</p>
              )}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-3 mt-2">
                <span className="font-mono">
                  {isPJ ? 'CNPJ' : 'CPF'} {segurado.documento || '—'}
                </span>
                {(segurado.cidade || segurado.estado) && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} /> {[segurado.cidade, segurado.estado].filter(Boolean).join('/')}
                  </span>
                )}
                {segurado.lgpdAutorizado ? (
                  <span className="inline-flex items-center gap-1 text-signal-success font-semibold">
                    <ShieldCheck size={12} /> LGPD autorizada
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-signal-warning font-semibold">
                    <ShieldAlert size={12} /> LGPD pendente
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {telDigits && (
              <a
                href={`https://wa.me/55${telDigits}`}
                target="_blank"
                rel="noreferrer"
                title="WhatsApp"
                className="w-9 h-9 rounded-full bg-signal-success/15 text-signal-success flex items-center justify-center hover:brightness-95 transition"
              >
                <MessageCircle size={18} />
              </a>
            )}
            {segurado.telefone && (
              <a
                href={`tel:${telDigits}`}
                title="Ligar"
                className="w-9 h-9 rounded-full bg-bg-surface-2 text-fg-2 flex items-center justify-center hover:text-accent-primary transition"
              >
                <Phone size={18} />
              </a>
            )}
            {segurado.email && (
              <a
                href={`mailto:${segurado.email}`}
                title="E-mail"
                className="w-9 h-9 rounded-full bg-bg-surface-2 text-fg-2 flex items-center justify-center hover:text-accent-primary transition"
              >
                <Mail size={18} />
              </a>
            )}
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-accent-primary text-fg-on-brand rounded-full text-sm font-semibold hover:bg-accent-primary-hover transition-colors shadow-[var(--shadow-brand)]"
            >
              <Edit size={16} /> Editar
            </button>
          </div>
        </div>
      </div>

      {/* Guias */}
      <EntityTabsBar tabs={tabs} active={tab} onChange={setTab} />

      <div role="tabpanel">
        {tab === 'visao' && (
          <TabVisaoGeral
            s={segurado}
            vinculos={isPJ ? contatosDaPJ : empresasDaPF}
            tarefas={tabsState.tarefas}
            observacoes={tabsState.observacoes}
            logs={tabsState.logs}
            oportunidades={oportunidades}
            apolices={apolices}
            onOpenOportunidade={(oppId) => navigate(`/oportunidades/${oppId}`)}
            onGoTab={setTab}
          />
        )}
        {tab === 'apolices' && <ApolicesTab seguradoId={id} />}
        {tab === 'cadastrais' && (
          <TabCadastrais
            s={segurado}
            isPJ={isPJ}
            contatosDaPJ={contatosDaPJ}
            empresasDaPF={empresasDaPF}
            onAddVinculo={() => openVinculoModal(null)}
            onEditVinculo={openVinculoModal}
            onRemoveVinculo={handleRemoveVinculo}
          />
        )}
        {tab === 'corretora' && <TabCorretora s={segurado} />}
        {tab === 'tarefas' && (
          <TarefasTab tarefas={tabsState.tarefas} onAdd={tabsState.addTarefa} onToggle={tabsState.toggleTarefa} />
        )}
        {tab === 'personalizados' && (
          <CamposPersonalizadosTab campos={tabsState.campos} onAdd={tabsState.addCampo} tipoEntidade={segurado.tipo} />
        )}
        {tab === 'anexos' && (
          <AnexosLogsTab
            anexos={tabsState.anexos}
            logs={tabsState.logs}
            onAddAnexo={tabsState.addAnexo}
            onAddLog={tabsState.addLog}
          />
        )}
        {tab === 'observacoes' && (
          <ObservacoesTab
            observacoes={tabsState.observacoes}
            onAdd={tabsState.addObservacao}
            onTogglePin={tabsState.togglePin}
          />
        )}
      </div>

      <SeguradoModal
        key={`${isModalOpen}-${segurado.id}`}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        segurado={segurado}
        onSave={handleSave}
      />

      <PessoaContatoModal
        key={`${vinculoModalOpen}-${vinculoEdit?.id ?? 'novo'}`}
        isOpen={vinculoModalOpen}
        onClose={() => setVinculoModalOpen(false)}
        pessoaAtualId={segurado.id}
        ladoAtual={segurado.tipo}
        vinculo={vinculoEdit}
        idsJaVinculados={idsJaVinculados}
        onSubmit={handleSubmitVinculo}
      />
    </div>
  )
}

// ===========================================================================
// GUIA: Visão geral
// ===========================================================================
function TabVisaoGeral({
  s,
  vinculos,
  tarefas,
  observacoes,
  logs,
  oportunidades,
  apolices,
  onOpenOportunidade,
  onGoTab,
}: {
  s: Segurado
  vinculos: PessoaContato[]
  tarefas: import('../components/detail/types').Tarefa[]
  observacoes: import('../components/detail/types').Observacao[]
  logs: import('../components/detail/types').LogEntry[]
  oportunidades: OportunidadeResumo[]
  apolices: ApoliceResumo[]
  onOpenOportunidade: (id: string) => void
  onGoTab: (t: TabId) => void
}) {
  const isPJ = s.tipo === 'PJ'
  const idade = !isPJ ? calcIdade(s.dataNascimento) : null
  const pinned = observacoes.find((o) => o.pinned)
  const proximas = [...tarefas]
    .filter((t) => t.status !== 'Concluída')
    .sort((a, b) => (a.prazo ?? '').localeCompare(b.prazo ?? ''))
    .slice(0, 3)

  const alertas: { tone: 'warning' | 'danger' | 'info'; texto: string }[] = []
  if (!s.lgpdAutorizado)
    alertas.push({ tone: 'danger', texto: 'Consentimento LGPD pendente — coletar termo antes da próxima emissão.' })
  const enderecoLinha = enderecoFormatado(s)

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 space-y-6">
        {alertas.length > 0 && (
          <DetailCard title="Alertas & pendências" icon={Bell}>
            <div className="space-y-2">
              {alertas.map((a, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm ${
                    a.tone === 'danger'
                      ? 'bg-signal-danger/10 text-signal-danger'
                      : a.tone === 'warning'
                        ? 'bg-signal-warning/10 text-signal-warning'
                        : 'bg-accent-primary-soft text-accent-primary'
                  }`}
                >
                  <ShieldAlert size={16} className="shrink-0" />
                  <span>{a.texto}</span>
                </div>
              ))}
            </div>
          </DetailCard>
        )}

        <DetailCard
          title="Apólices & oportunidades"
          icon={TrendingUp}
          action={
            oportunidades.length + apolices.length > 0 ? (
              <span className="text-xs font-semibold text-fg-4">
                {oportunidades.length + apolices.length} vínculo(s)
              </span>
            ) : undefined
          }
        >
          {oportunidades.length === 0 && apolices.length === 0 ? (
            <p className="text-sm text-fg-3 italic">
              Não há apólices ou oportunidades vinculadas a este segurado no momento.
            </p>
          ) : (
            <div className="space-y-2">
              {apolices.map((a) => (
                <NegocioRow
                  key={`ap-${a.id}`}
                  titulo={a.numero ? `Apólice ${a.numero}` : 'Apólice'}
                  ramo={a.ramo}
                  seguradora={a.seguradora}
                  premio={a.premio}
                  badge={{ texto: a.status ?? 'Vigente', tone: 'success' }}
                  vencimento={a.vigenciaFim}
                />
              ))}
              {oportunidades.map((o) => (
                <NegocioRow
                  key={`op-${o.id}`}
                  titulo={o.ramo ? `${o.ramo} — ${o.nome}` : o.nome}
                  ramo={o.ramo}
                  seguradora={o.seguradora}
                  premio={o.premio}
                  badge={OPP_BADGE[o.status]}
                  vencimento={o.vigenciaFim}
                  onClick={() => onOpenOportunidade(o.id)}
                />
              ))}
            </div>
          )}
        </DetailCard>

        <DetailCard
          title="Atividade recente"
          icon={Clock}
          action={
            <button
              type="button"
              onClick={() => onGoTab('anexos')}
              className="flex items-center gap-1 text-xs font-semibold text-accent-primary"
            >
              Linha do tempo <ChevronRight size={14} />
            </button>
          }
        >
          {logs.length ? (
            <ul className="space-y-3">
              {logs.slice(0, 3).map((l) => (
                <li key={l.id} className="flex items-baseline justify-between gap-3">
                  <span className="text-sm text-fg-1">{l.titulo}</span>
                  <span className="text-xs text-fg-4 shrink-0">{fmtDateTime(l.quando)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-fg-3 italic">Sem atividade registrada ainda.</p>
          )}
        </DetailCard>
      </div>

      <div className="space-y-6">
        {proximas.length > 0 && (
          <DetailCard
            title="Próximas tarefas"
            icon={Clock}
            action={
              <button
                type="button"
                onClick={() => onGoTab('tarefas')}
                className="text-xs font-semibold text-accent-primary"
              >
                Ver todas
              </button>
            }
          >
            <ul className="space-y-2">
              {proximas.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-fg-1 truncate">{t.titulo}</span>
                  {t.prazo && <span className="text-xs text-fg-4 shrink-0">{fmtDate(t.prazo)}</span>}
                </li>
              ))}
            </ul>
          </DetailCard>
        )}

        <DetailCard title="Contato" icon={Phone}>
          <div className="space-y-3">
            <ContatoLinha icon={Phone} label="Telefone / WhatsApp" valor={s.telefone} />
            <ContatoLinha icon={Mail} label="E-mail" valor={s.email} />
            {isPJ && <ContatoLinha icon={Globe} label="Site" valor={s.site} />}
            <ContatoLinha icon={MapPin} label="Endereço" valor={enderecoLinha} />
          </div>
        </DetailCard>

        {vinculos.length > 0 && (
          <DetailCard
            title={isPJ ? 'Pessoas de contato' : 'Empresas vinculadas'}
            icon={isPJ ? Users : Building2}
            action={
              <button type="button" onClick={() => onGoTab('cadastrais')} className="text-xs font-semibold text-accent-primary">
                Ver
              </button>
            }
          >
            <div className="space-y-2">
              {vinculos.map((v) => {
                const nome = isPJ ? v.pfNome || 'Pessoa' : v.pjNomeFantasia || v.pjNome || 'Empresa'
                return (
                  <div key={v.id} className="flex items-center gap-2 text-sm">
                    <span className="w-7 h-7 rounded-lg bg-accent-primary-soft text-accent-primary flex items-center justify-center shrink-0">
                      {isPJ ? <User size={14} /> : <Building2 size={14} />}
                    </span>
                    <span className="text-fg-1 truncate flex-1">{nome}</span>
                    {v.cargo && <span className="text-xs text-fg-4 truncate">{v.cargo}</span>}
                  </div>
                )
              })}
            </div>
          </DetailCard>
        )}

        <DetailCard title="Dados-chave" icon={isPJ ? Building2 : User}>
          <div className="grid grid-cols-2 gap-4">
            <DetailField label={isPJ ? 'CNPJ' : 'CPF'} mono>
              {s.documento}
            </DetailField>
            {isPJ ? (
              <DetailField label="Porte">{s.porte ? PORTE_LABEL[s.porte] : undefined}</DetailField>
            ) : (
              <DetailField label="Nascimento">
                {s.dataNascimento ? `${fmtDate(s.dataNascimento)}${idade != null ? ` (${idade})` : ''}` : undefined}
              </DetailField>
            )}
            <DetailField label="Produtor">{s.produtorNome}</DetailField>
            <DetailField label="Status">
              <StatusBadge status={s.status} />
            </DetailField>
          </div>
        </DetailCard>

        {pinned && (
          <DetailCard
            title="Observação fixada"
            icon={Pin}
            action={
              <button type="button" onClick={() => onGoTab('observacoes')} className="text-xs font-semibold text-accent-primary">
                Todas
              </button>
            }
          >
            <p className="text-sm text-fg-1 whitespace-pre-wrap">{pinned.texto}</p>
            <p className="text-xs text-fg-4 mt-2">
              {[pinned.autor, fmtDateTime(pinned.data)].filter(Boolean).join(' · ')}
            </p>
          </DetailCard>
        )}
      </div>
    </div>
  )
}

const OPP_BADGE: Record<OportunidadeResumo['status'], { texto: string; tone: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }> = {
  pending: { texto: 'Em andamento', tone: 'info' },
  won: { texto: 'Ganha', tone: 'success' },
  lost: { texto: 'Perdida', tone: 'neutral' },
}

function formatBRL(value?: number | null): string | null {
  if (value == null) return null
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function NegocioRow({
  titulo,
  ramo,
  seguradora,
  premio,
  badge,
  vencimento,
  onClick,
}: {
  titulo: string
  ramo?: string | null
  seguradora?: string | null
  premio?: number | null
  badge: { texto: string; tone: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }
  vencimento?: string | null
  onClick?: () => void
}) {
  const premioFmt = formatBRL(premio)
  const inner = (
    <>
      <span className="w-9 h-9 rounded-lg bg-accent-primary-soft text-accent-primary flex items-center justify-center shrink-0">
        <ShieldCheck size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-fg-1 truncate">{titulo}</p>
        <p className="text-xs text-fg-4 truncate">
          {[seguradora, ramo].filter(Boolean).join(' · ') || '—'}
        </p>
      </div>
      <div className="text-right shrink-0">
        {premioFmt && <p className="text-sm font-semibold text-fg-1">{premioFmt}</p>}
        {vencimento ? (
          <p className="text-xs text-fg-4">vence {fmtDate(vencimento)}</p>
        ) : (
          <StatusBadge status={badge.texto} tone={badge.tone} dot={false} />
        )}
      </div>
    </>
  )
  const base = 'w-full flex items-center gap-3 px-4 py-3 bg-bg-surface-2 rounded-xl text-left'
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${base} hover:bg-bg-surface-3 transition-colors cursor-pointer`}>
        {inner}
      </button>
    )
  }
  return <div className={base}>{inner}</div>
}

function ContatoLinha({
  icon: Icon,
  label,
  valor,
}: {
  icon: typeof Phone
  label: string
  valor?: string | null
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 bg-accent-primary-soft rounded-lg shrink-0">
        <Icon size={15} className="text-accent-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-fg-4 uppercase tracking-widest font-bold">{label}</p>
        <p className="text-sm font-medium text-fg-1 break-words">
          {valor || <span className="italic text-fg-4">Não informado</span>}
        </p>
      </div>
    </div>
  )
}

// ===========================================================================
// GUIA: Dados cadastrais
// ===========================================================================
function TabCadastrais({
  s,
  isPJ,
  contatosDaPJ,
  empresasDaPF,
  onAddVinculo,
  onEditVinculo,
  onRemoveVinculo,
}: {
  s: Segurado
  isPJ: boolean
  contatosDaPJ: PessoaContato[]
  empresasDaPF: PessoaContato[]
  onAddVinculo: () => void
  onEditVinculo: (v: PessoaContato) => void
  onRemoveVinculo: (v: PessoaContato) => void
}) {
  const idade = !isPJ ? calcIdade(s.dataNascimento) : null
  const vinculos = isPJ ? contatosDaPJ : empresasDaPF

  return (
    <div className="space-y-6">
      <DetailCard title="Identificação" icon={isPJ ? Building2 : User}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DetailField label={isPJ ? 'Razão social' : 'Nome completo'} full>
            {s.nome}
          </DetailField>
          {isPJ && <DetailField label="Nome fantasia">{s.nomeFantasia}</DetailField>}
          <DetailField label={isPJ ? 'CNPJ' : 'CPF'} mono>
            {s.documento}
          </DetailField>
          {!isPJ ? (
            <>
              <DetailField label="Data de nascimento">
                {s.dataNascimento ? `${fmtDate(s.dataNascimento)}${idade != null ? ` (${idade} anos)` : ''}` : undefined}
              </DetailField>
              <DetailField label="Sexo">{s.sexo ? SEXO_LABEL[s.sexo] : undefined}</DetailField>
              <DetailField label="Estado civil">{s.estadoCivil ? ESTADO_CIVIL_LABEL[s.estadoCivil] : undefined}</DetailField>
            </>
          ) : (
            <>
              <DetailField label="CNAE">{s.cnae}</DetailField>
              <DetailField label="Porte">{s.porte ? PORTE_LABEL[s.porte] : undefined}</DetailField>
            </>
          )}
        </div>
      </DetailCard>

      <DetailCard title={isPJ ? 'Contato da empresa' : 'Contato'} icon={Phone}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DetailField label="Telefone / WhatsApp" mono>
            {s.telefone}
          </DetailField>
          <DetailField label="E-mail">{s.email}</DetailField>
          {isPJ && (
            <DetailField label="Site">
              {s.site ? (
                <a
                  href={s.site.startsWith('http') ? s.site : `https://${s.site}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-accent-primary hover:underline"
                >
                  <Globe size={12} /> {s.site}
                </a>
              ) : undefined}
            </DetailField>
          )}
        </div>
      </DetailCard>

      <DetailCard
        title={isPJ ? 'Pessoas de contato' : 'Empresas vinculadas'}
        icon={isPJ ? Users : Building2}
        action={
          <GhostButton icon={Plus} onClick={onAddVinculo}>
            {isPJ ? 'Adicionar contato' : 'Vincular empresa'}
          </GhostButton>
        }
      >
        {vinculos.length === 0 ? (
          <EmptyState
            icon={Link2}
            title={isPJ ? 'Nenhum contato vinculado' : 'Nenhuma empresa vinculada'}
            hint={
              isPJ
                ? 'Vincule pessoas físicas como contatos desta empresa.'
                : 'Vincule esta pessoa às empresas em que atua.'
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {vinculos.map((v) => (
              <VinculoCard
                key={v.id}
                lado={isPJ ? 'PF' : 'PJ'}
                vinculo={v}
                onEdit={() => onEditVinculo(v)}
                onRemove={() => onRemoveVinculo(v)}
              />
            ))}
          </div>
        )}
      </DetailCard>

      <DetailCard title="Endereço" icon={MapPin}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DetailField label="CEP" mono>
            {s.cep}
          </DetailField>
          <DetailField label="Logradouro" full>
            {s.logradouro}
          </DetailField>
          <DetailField label="Número">{s.numero}</DetailField>
          <DetailField label="Complemento">{s.complemento}</DetailField>
          <DetailField label="Bairro">{s.bairro}</DetailField>
          <DetailField label="Cidade">{s.cidade}</DetailField>
          <DetailField label="Estado">{s.estado}</DetailField>
        </div>
      </DetailCard>
    </div>
  )
}

function VinculoCard({
  vinculo,
  lado,
  onEdit,
  onRemove,
}: {
  vinculo: PessoaContato
  lado: 'PJ' | 'PF'
  onEdit: () => void
  onRemove: () => void
}) {
  const nome =
    lado === 'PJ' ? vinculo.pjNomeFantasia || vinculo.pjNome || 'Empresa' : vinculo.pfNome || 'Pessoa'
  return (
    <div className="flex items-start justify-between gap-3 p-4 bg-bg-surface-2 rounded-xl border border-border-1">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-accent-primary-soft text-accent-primary flex items-center justify-center shrink-0">
          {lado === 'PJ' ? <Building2 size={18} /> : <User size={18} />}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold truncate">{nome}</p>
            {vinculo.principal && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-signal-warning/15 text-signal-warning rounded-full text-[10px] font-bold uppercase">
                <Star size={10} /> Principal
              </span>
            )}
          </div>
          {vinculo.cargo && <p className="text-xs text-fg-3 mt-0.5">{vinculo.cargo}</p>}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button type="button" onClick={onEdit} className="p-1.5 text-fg-4 hover:text-accent-primary transition-colors" title="Editar vínculo">
          <Edit size={14} />
        </button>
        <button type="button" onClick={onRemove} className="p-1.5 text-fg-4 hover:text-signal-danger transition-colors" title="Remover vínculo">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

// ===========================================================================
// GUIA: Controle da corretora
// ===========================================================================
function TabCorretora({ s }: { s: Segurado }) {
  return (
    <div className="space-y-6">
      <DetailCard title="Responsáveis" icon={Users}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PessoaAtribuida label="Produtor responsável" nome={s.produtorNome} />
          <PessoaAtribuida label="Gerente de contas" nome={s.gerenteNome} />
        </div>
      </DetailCard>

      <DetailCard title="Classificação & atendimento" icon={Sliders}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DetailField label="Status do cadastro">
            <StatusBadge status={s.status} />
          </DetailField>
          <DetailField label="Tipo">{s.tipo === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}</DetailField>
          <DetailField label="ID de atendimento (Chatwoot)" mono>
            {s.chatwootId}
          </DetailField>
        </div>
      </DetailCard>

      <DetailCard title="Conformidade LGPD" icon={s.lgpdAutorizado ? ShieldCheck : ShieldAlert}>
        <div
          className={`flex items-center gap-3 p-4 rounded-xl ${
            s.lgpdAutorizado
              ? 'bg-signal-success/10 text-signal-success'
              : 'bg-signal-warning/10 text-signal-warning'
          }`}
        >
          {s.lgpdAutorizado ? <ShieldCheck size={22} /> : <ShieldAlert size={22} />}
          <div>
            <p className="font-bold text-sm">
              {s.lgpdAutorizado ? 'Consentimento coletado' : 'Consentimento pendente'}
            </p>
            <p className="text-xs opacity-90">
              {s.lgpdAutorizado
                ? 'Termo de consentimento aceito.'
                : 'Coletar termo de consentimento antes da próxima emissão.'}
            </p>
          </div>
        </div>
      </DetailCard>

      <DetailCard title="Auditoria" icon={CalendarDays}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DetailField label="Criado em">{s.createdAt ? fmtDateTime(s.createdAt) : undefined}</DetailField>
          <DetailField label="Última atualização">{s.updatedAt ? fmtDateTime(s.updatedAt) : undefined}</DetailField>
          <DetailField label="ID interno" mono>
            {s.id}
          </DetailField>
        </div>
      </DetailCard>
    </div>
  )
}

function PessoaAtribuida({ label, nome }: { label: string; nome?: string | null }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-bg-surface-2 rounded-xl">
      <div className="w-9 h-9 rounded-full bg-accent-primary-soft text-accent-primary flex items-center justify-center font-bold text-xs shrink-0">
        {nome ? nome.slice(0, 2).toUpperCase() : '—'}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-fg-4 uppercase tracking-widest font-bold">{label}</p>
        <p className="text-sm font-medium truncate">
          {nome || <span className="italic text-fg-4">Não atribuído</span>}
        </p>
      </div>
    </div>
  )
}
