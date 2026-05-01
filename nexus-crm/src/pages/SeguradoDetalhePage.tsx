import { useParams, useNavigate } from 'react-router-dom'
import { useState, useMemo } from 'react'
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Edit,
  FileText,
  Clock,
  TrendingUp,
  Upload,
  Download,
  Eye,
  Hash,
} from 'lucide-react'
import { useSegurado, useUpdateSegurado } from '../hooks/useSegurados'
import type { Segurado } from '../contexts/seguradosCore'
import { mapSeguradoRowToView, partialSeguradoToUpdate } from '../lib/seguradoMapper'
import SeguradoModal from '../components/SeguradoModal'

/**
 * Dados fictícios de anexos (documentos) do segurado.
 */
const anexos = [
  { nome: 'CNH_frente.pdf', tipo: 'PDF', tamanho: '1.2 MB', data: '15/03/2026' },
  { nome: 'Comprovante_endereco.pdf', tipo: 'PDF', tamanho: '856 KB', data: '15/03/2026' },
  { nome: 'Foto_veiculo.jpg', tipo: 'Imagem', tamanho: '3.4 MB', data: '10/02/2026' },
]

/**
 * Timeline de atividades/histórico do segurado.
 * Filtrado para mostrar apenas atualizações de cadastro conforme solicitado.
 */
const historico = [
  { acao: 'Dados cadastrais atualizados', data: '10/03/2026 14:22', usuario: 'Hicila' },
  { acao: 'Cadastro inicial efetuado', data: '01/03/2026 10:00', usuario: 'Vinícius' },
]

/**
 * Página de detalhe de um Segurado.
 * Telas 2, 5 e 9 do Stitch: Detalhe-Segurados, Anexos e Anexos/histórico.
 * Exibe dados pessoais, anexos e histórico de atividades de cadastro.
 */
export default function SeguradoDetalhePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: row, isLoading, isError, refetch } = useSegurado(id)
  const updateSegurado = useUpdateSegurado()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const segurado = useMemo(() => (row ? mapSeguradoRowToView(row) : undefined), [row])

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

  return (
    <div className="animate-fade-in">
      {saveError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {saveError}
        </div>
      )}
      {/* Breadcrumb / Voltar */}
      <button
        type="button"
        onClick={() => navigate('/segurados')}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Voltar para Segurados
      </button>

      {/* Cabeçalho do Perfil */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 mb-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-light rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {segurado.nome.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-1">
                {segurado.nome}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs font-bold uppercase">
                  {segurado.tipo}
                </span>
                <span>{segurado.tipo === 'PJ' ? 'CNPJ' : 'CPF'}: {segurado.documento}</span>
                {segurado.chatwootId && (
                  <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-semibold">
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

        {/* Info de Contato */}
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
              <p className="text-sm font-medium">{segurado.email || 'Não informado'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MapPin size={16} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Endereço</p>
              <p className="text-sm font-medium">{segurado.endereco || 'Não informado'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Hash size={16} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-slate-400">ChatWoot ID</p>
              <p className="text-sm font-medium">{segurado.chatwootId || 'Não vinculado'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-primary" />
              <h2 className="font-bold">Oportunidades de Venda</h2>
            </div>
            <p className="text-sm text-slate-500 italic">
              Não há oportunidades ativas para este segurado no momento.
            </p>
          </div>

          {/* Anexos */}
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
                <div key={i} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
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

        {/* Coluna Lateral - Histórico */}
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
    </div>
  )
}

