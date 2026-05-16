import { useParams, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import {
  ArrowLeft, Phone, Mail, MapPin, Edit, FileText, Clock, TrendingUp,
  Upload, Download, Eye, ShieldCheck, Users, Building2, User,
  CalendarDays, Briefcase, Globe, Star, Plus, Trash2,
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
import { mapSeguradoRowToView, partialSeguradoToUpdate } from '../lib/seguradoMapper'
import SeguradoModal from '../components/SeguradoModal'
import PessoaContatoModal, { type PessoaContatoFormValue } from '../components/PessoaContatoModal'
import { calcIdade } from '../utils/idade'

// Anexos e histórico continuam mockados — fora do escopo do PRD de cadastro
// de pessoa (cobertos em PRD próprio de Gestão de Documentos / Audit Log).
const anexos = [
  { nome: 'CNH_frente.pdf', tipo: 'PDF', tamanho: '1.2 MB', data: '15/03/2026' },
  { nome: 'Comprovante_endereco.pdf', tipo: 'PDF', tamanho: '856 KB', data: '15/03/2026' },
  { nome: 'Foto_veiculo.jpg', tipo: 'Imagem', tamanho: '3.4 MB', data: '10/02/2026' },
]
const historico = [
  { acao: 'Dados cadastrais atualizados', data: '10/03/2026 14:22', usuario: 'Hicila' },
  { acao: 'Cadastro inicial efetuado', data: '01/03/2026 10:00', usuario: 'Vinícius' },
]

const STATUS_BADGE: Record<Segurado['status'], string> = {
  Ativo: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  Inativo: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  Prospecto: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
}

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

function enderecoFormatado(s: Segurado): string {
  const linha1 = [s.logradouro, s.numero].filter(Boolean).join(', ')
  const linha2 = [s.bairro, s.cidade, s.estado].filter(Boolean).join(' · ')
  const linha = [linha1, s.complemento, linha2].filter(Boolean).join(' — ')
  return linha || ''
}

/**
 * Página de detalhe de uma pessoa (segurado). Alinhada ao PRD v1.0 do
 * Cadastro de Pessoas — exibe identificação, contato, endereço estruturado,
 * dados específicos por tipo (PF/PJ), atribuição (produtor/gerente) e
 * vínculos PJ↔PF via `pessoa_contato`.
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

  const segurado = useMemo(() => (row ? mapSeguradoRowToView(row) : undefined), [row])

  const { data: vinculos = [] } = usePessoaContatos(id)
  const createVinculo = useCreatePessoaContato()
  const updateVinculo = useUpdatePessoaContato()
  const deleteVinculo = useDeletePessoaContato()

  if (!id) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <p>Identificador inválido.</p>
        <button type="button" onClick={() => navigate('/segurados')} className="mt-4 text-primary font-bold">
          Voltar para a lista
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-slate-500 gap-2">
        <p className="text-sm">Carregando cadastro…</p>
      </div>
    )
  }

  if (isError || !segurado) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <p>Segurado não encontrado ou sem permissão de acesso.</p>
        <button type="button" onClick={() => refetch()} className="mt-2 text-sm text-primary font-semibold">
          Tentar novamente
        </button>
        <button type="button" onClick={() => navigate('/segurados')} className="mt-4 text-primary font-bold">
          Voltar para a lista
        </button>
      </div>
    )
  }

  const handleSave = async (data: Partial<Segurado>) => {
    setSaveError(null)
    try {
      await updateSegurado.mutateAsync({
        id: segurado.id,
        patch: partialSeguradoToUpdate(data),
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao salvar cadastro'
      setSaveError(msg)
      throw e
    }
  }

  const idade = segurado.tipo === 'PF' ? calcIdade(segurado.dataNascimento) : null
  const enderecoLinha = enderecoFormatado(segurado)
  const isPJ = segurado.tipo === 'PJ'
  const isPF = segurado.tipo === 'PF'

  // Quando a pessoa atual é PJ, vínculos = lista de PFs (contatos).
  // Quando é PF, vínculos = lista de PJs onde a PF aparece.
  const contatosDaPJ = isPJ ? vinculos.filter((v) => v.pjId === segurado.id) : []
  const empresasDaPF = isPF ? vinculos.filter((v) => v.pfId === segurado.id) : []

  const idsJaVinculados = isPJ
    ? contatosDaPJ.map((v) => v.pfId)
    : empresasDaPF.map((v) => v.pjId)

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
      await createVinculo.mutateAsync({
        pjId,
        pfId,
        cargo: value.cargo || null,
        principal: value.principal,
      })
    }
    setVinculoEdit(null)
  }

  const handleRemoveVinculo = async (v: PessoaContato) => {
    if (!window.confirm('Remover este vínculo? O cadastro da pessoa permanece intacto.')) return
    await deleteVinculo.mutateAsync(v.id)
  }

  return (
    <div className="animate-fade-in">
      {saveError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {saveError}
        </div>
      )}

      <button
        type="button"
        onClick={() => navigate('/segurados')}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Voltar para Segurados
      </button>

      {/* Cabeçalho do perfil */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 mb-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-light rounded-2xl flex items-center justify-center text-white shrink-0">
              {isPJ ? <Building2 size={26} /> : <User size={26} />}
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-1">{segurado.nome}</h1>
              {isPJ && segurado.nomeFantasia && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                  {segurado.nomeFantasia}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-bold uppercase">
                  {segurado.tipo}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide ${STATUS_BADGE[segurado.status]}`}>
                  {segurado.status}
                </span>
                {segurado.lgpdAutorizado && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-primary/10 text-primary rounded-full font-semibold">
                    <ShieldCheck size={12} /> LGPD autorizada
                  </span>
                )}
                <span className="text-slate-500 dark:text-slate-400">
                  {isPJ ? 'CNPJ' : 'CPF'}: {segurado.documento || '—'}
                </span>
                {segurado.chatwootId && (
                  <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-semibold">
                    ChatWoot ID: {segurado.chatwootId}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
          >
            <Edit size={16} />
            Editar Cadastro
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Phone size={16} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Telefone</p>
              <p className="text-sm font-medium">{segurado.telefone || 'Não informado'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Mail size={16} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-slate-400">E-mail</p>
              <p className="text-sm font-medium break-all">{segurado.email || 'Não informado'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 md:col-span-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MapPin size={16} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Endereço</p>
              <p className="text-sm font-medium">{enderecoLinha || 'Não informado'}</p>
              {segurado.cep && (
                <p className="text-xs text-slate-400">CEP {segurado.cep}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Coluna principal */}
        <div className="xl:col-span-2 space-y-6">
          {/* Atribuição */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users size={18} className="text-primary" />
              <h2 className="font-bold">Atribuição</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AtribuicaoItem label="Produtor" nome={segurado.produtorNome} />
              <AtribuicaoItem label="Gerente de contas" nome={segurado.gerenteNome} />
            </div>
          </div>

          {/* Dados específicos por tipo */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              {isPJ ? (
                <Briefcase size={18} className="text-primary" />
              ) : (
                <CalendarDays size={18} className="text-primary" />
              )}
              <h2 className="font-bold">
                {isPJ ? 'Dados da Empresa' : 'Dados Pessoais'}
              </h2>
            </div>

            {isPF && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DadoItem
                  label="Data de nascimento"
                  valor={segurado.dataNascimento}
                  sufixo={idade != null ? `(${idade} anos)` : undefined}
                />
                <DadoItem label="Sexo" valor={segurado.sexo ? SEXO_LABEL[segurado.sexo] : undefined} />
                <DadoItem
                  label="Estado civil"
                  valor={segurado.estadoCivil ? ESTADO_CIVIL_LABEL[segurado.estadoCivil] : undefined}
                />
              </div>
            )}

            {isPJ && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DadoItem label="CNAE" valor={segurado.cnae} />
                <DadoItem label="Porte" valor={segurado.porte ? PORTE_LABEL[segurado.porte] : undefined} />
                <DadoItem label="Site" valor={segurado.site} link />
              </div>
            )}
          </div>

          {/* Vínculos PJ↔PF */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isPJ ? (
                  <Users size={18} className="text-primary" />
                ) : (
                  <Building2 size={18} className="text-primary" />
                )}
                <h2 className="font-bold">
                  {isPJ ? 'Contatos da empresa' : 'Empresas vinculadas'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setVinculoEdit(null)
                  setVinculoModalOpen(true)
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-semibold hover:bg-primary/20 transition-colors"
              >
                <Plus size={14} />
                {isPJ ? 'Adicionar contato' : 'Vincular empresa'}
              </button>
            </div>

            <div className="p-6">
              {(isPJ ? contatosDaPJ : empresasDaPF).length === 0 ? (
                <p className="text-sm text-slate-500 italic">
                  {isPJ
                    ? 'Nenhum contato vinculado a esta empresa.'
                    : 'Esta pessoa não está vinculada a nenhuma empresa.'}
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(isPJ ? contatosDaPJ : empresasDaPF).map((v) => (
                    <VinculoCard
                      key={v.id}
                      lado={isPJ ? 'PF' : 'PJ'}
                      vinculo={v}
                      onEdit={() => {
                        setVinculoEdit(v)
                        setVinculoModalOpen(true)
                      }}
                      onRemove={() => handleRemoveVinculo(v)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Oportunidades — placeholder mantido (fora do escopo do PRD) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-primary" />
              <h2 className="font-bold">Oportunidades de Venda</h2>
            </div>
            <p className="text-sm text-slate-500 italic">
              Não há oportunidades ativas para este segurado no momento.
            </p>
          </div>

          {/* Anexos — mockado (PRD próprio de Gestão de Documentos) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-primary" />
                <h2 className="font-bold">Anexos</h2>
              </div>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-semibold hover:bg-primary/20 transition-colors">
                <Upload size={14} />
                Upload
              </button>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {anexos.map((a, i) => (
                <div
                  key={i}
                  className="px-6 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center">
                      <FileText size={14} className="text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{a.nome}</p>
                      <p className="text-xs text-slate-400">{a.tamanho} · {a.data}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 text-slate-400 hover:text-primary transition-colors">
                      <Eye size={14} />
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-primary transition-colors">
                      <Download size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Coluna lateral — Histórico */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 h-fit">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Clock size={18} className="text-primary" />
            <h2 className="font-bold">Histórico</h2>
          </div>
          <div className="p-6">
            <div className="relative">
              <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-800" />
              <div className="space-y-6">
                {historico.map((h, i) => (
                  <div key={i} className="relative pl-6">
                    <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full bg-primary border-2 border-white dark:border-slate-900" />
                    <p className="text-sm font-medium">{h.acao}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {h.data} · {h.usuario}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <SeguradoModal
        key={`${isModalOpen}-${segurado?.id ?? 'new'}`}
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

function AtribuicaoItem({ label, nome }: { label: string; nome?: string | null }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
        {nome ? nome.slice(0, 2).toUpperCase() : '—'}
      </div>
      <div>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{label}</p>
        <p className="text-sm font-medium">{nome || <span className="italic text-slate-400">Não atribuído</span>}</p>
      </div>
    </div>
  )
}

function DadoItem({
  label,
  valor,
  sufixo,
  link,
}: {
  label: string
  valor?: string | null
  sufixo?: string
  link?: boolean
}) {
  return (
    <div>
      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">{label}</p>
      <div className="text-sm font-medium flex items-center gap-2 flex-wrap">
        {valor ? (
          link ? (
            <a
              href={valor.startsWith('http') ? valor : `https://${valor}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <Globe size={12} /> {valor}
            </a>
          ) : (
            <span>{valor}</span>
          )
        ) : (
          <span className="italic text-slate-400">Não informado</span>
        )}
        {sufixo && <span className="text-xs text-slate-400">{sufixo}</span>}
      </div>
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
  const nome = lado === 'PJ'
    ? vinculo.pjNomeFantasia || vinculo.pjNome || 'Empresa'
    : vinculo.pfNome || 'Pessoa'
  return (
    <div className="flex items-start justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          {lado === 'PJ' ? <Building2 size={18} /> : <User size={18} />}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold truncate">{nome}</p>
            {vinculo.principal && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 rounded-full text-[10px] font-bold uppercase">
                <Star size={10} /> Principal
              </span>
            )}
          </div>
          {vinculo.cargo && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{vinculo.cargo}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onEdit}
          className="p-1.5 text-slate-400 hover:text-primary transition-colors"
          title="Editar vínculo"
        >
          <Edit size={14} />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
          title="Remover vínculo"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}
