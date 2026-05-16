import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, UserPlus, Edit, Loader2, Building2, User } from 'lucide-react'
import { useSegurados, useCreateSegurado, useUpdateSegurado } from '../hooks/useSegurados'
import type { Segurado, StatusPessoa } from '../contexts/seguradosCore'
import {
  mapSeguradoRowToView,
  partialSeguradoToUpdate,
  buildCreateSeguradoInput,
} from '../lib/seguradoMapper'
import SeguradoModal from '../components/SeguradoModal'
import NovoSeguradoModal from '../components/NovoSeguradoModal'

type TipoFilter = 'Todos' | 'PF' | 'PJ'
type StatusFilter = 'Todos' | StatusPessoa

const STATUS_BADGE: Record<StatusPessoa, string> = {
  Ativo: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  Inativo: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  Prospecto: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
}

/**
 * Página de listagem de Segurados (entidade unificada PF/PJ, PRD v1.0).
 */
export default function SeguradosPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [tipoFilter, setTipoFilter] = useState<TipoFilter>('Todos')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Todos')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isNovoModalOpen, setIsNovoModalOpen] = useState(false)
  const [selectedSegurado, setSelectedSegurado] = useState<Segurado | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const navigate = useNavigate()

  const { data: rows, isLoading, isError, error, refetch } = useSegurados()
  const createSegurado = useCreateSegurado()
  const updateSegurado = useUpdateSegurado()

  const segurados = useMemo(() => (rows ?? []).map(mapSeguradoRowToView), [rows])

  const filteredSegurados = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    const termDigits = term.replace(/\D+/g, '')
    return segurados.filter((s) => {
      if (tipoFilter !== 'Todos' && s.tipo !== tipoFilter) return false
      if (statusFilter !== 'Todos' && s.status !== statusFilter) return false
      if (!term) return true
      const haystack = [s.nome, s.nomeFantasia, s.email, s.cidade, s.estado]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (haystack.includes(term)) return true
      const docDigits = (s.documento ?? '').replace(/\D+/g, '')
      return Boolean(termDigits) && docDigits.includes(termDigits)
    })
  }, [segurados, searchTerm, tipoFilter, statusFilter])

  const total = segurados.length

  const handleOpenEdit = (segurado: Segurado) => {
    setSaveError(null)
    setSelectedSegurado(segurado)
    setIsEditModalOpen(true)
  }

  const handleOpenNovo = () => {
    setSaveError(null)
    setIsNovoModalOpen(true)
  }

  const handleSaveEdit = async (data: Partial<Segurado>) => {
    if (!selectedSegurado) return
    setSaveError(null)
    try {
      await updateSegurado.mutateAsync({
        id: selectedSegurado.id,
        patch: partialSeguradoToUpdate(data),
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao salvar cadastro'
      setSaveError(msg)
      throw e
    }
  }

  // Após criar, redireciona para o detalhe para o usuário completar o cadastro.
  const handleSaveNovo = async (data: Partial<Segurado>) => {
    setSaveError(null)
    try {
      const created = await createSegurado.mutateAsync(buildCreateSeguradoInput(data))
      navigate(`/segurados/${created.id}`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao salvar cadastro'
      setSaveError(msg)
      throw e
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Segurados</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Cadastro unificado de pessoas (PF/PJ). Gerencie clientes, prospects e contatos.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenNovo}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
        >
          <UserPlus size={16} />
          Novo Segurado
        </button>
      </div>

      {saveError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {saveError}
        </div>
      )}

      {/* Toolbar de filtros */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, razão social, documento, e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:border-primary focus:outline-none transition-colors"
          />
        </div>
        <select
          value={tipoFilter}
          onChange={(e) => setTipoFilter(e.target.value as TipoFilter)}
          className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium focus:border-primary focus:outline-none"
        >
          <option value="Todos">Todos os tipos</option>
          <option value="PF">Pessoa Física</option>
          <option value="PJ">Pessoa Jurídica</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium focus:border-primary focus:outline-none"
        >
          <option value="Todos">Todos os status</option>
          <option value="Ativo">Ativo</option>
          <option value="Inativo">Inativo</option>
          <option value="Prospecto">Prospecto</option>
        </select>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-slate-500">
              <Loader2 className="animate-spin" size={22} />
              <span className="text-sm">Carregando segurados…</span>
            </div>
          ) : isError ? (
            <div className="px-6 py-16 text-center text-sm text-slate-600 dark:text-slate-400">
              <p className="mb-3">Não foi possível carregar a lista.</p>
              <p className="mb-4 text-xs opacity-80">
                {error instanceof Error ? error.message : 'Erro desconhecido'}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Pessoa</th>
                  <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Tipo</th>
                  <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Status</th>
                  <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Contato</th>
                  <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Cidade/UF</th>
                  <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Gerente</th>
                  <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filteredSegurados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500">
                      {total === 0
                        ? 'Nenhum segurado cadastrado. Use «Novo Segurado» para incluir o primeiro.'
                        : 'Nenhum resultado para os filtros aplicados.'}
                    </td>
                  </tr>
                ) : (
                  filteredSegurados.map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/segurados/${s.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0">
                            {s.tipo === 'PJ' ? <Building2 size={16} /> : <User size={16} />}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{s.nome}</p>
                            {s.tipo === 'PJ' && s.nomeFantasia && (
                              <p className="text-xs text-slate-400">{s.nomeFantasia}</p>
                            )}
                            <p className="text-xs text-slate-400">
                              {s.tipo === 'PJ' ? 'CNPJ' : 'CPF'}: {s.documento || '—'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded uppercase tracking-wide">
                          {s.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wide ${STATUS_BADGE[s.status]}`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400">
                        <p>{s.email || <span className="italic text-slate-400">sem e-mail</span>}</p>
                        <p className="whitespace-nowrap">
                          {s.telefone || <span className="italic text-slate-400">sem telefone</span>}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {s.cidade || s.estado ? (
                          <span>
                            {s.cidade}
                            {s.cidade && s.estado ? '/' : ''}
                            {s.estado}
                          </span>
                        ) : (
                          <span className="italic text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {s.gerenteNome ? (
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-6 h-6 ${s.gerenteCor ?? 'bg-slate-200 text-slate-600'} rounded-full flex items-center justify-center text-[10px] font-bold`}
                            >
                              {s.gerenteInicial}
                            </div>
                            <span className="text-sm">{s.gerenteNome}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400 italic">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          className="p-2 text-slate-400 hover:text-primary transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenEdit(s)
                          }}
                        >
                          <Edit size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {!isLoading && !isError && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-sm text-slate-400">
              {filteredSegurados.length !== total ? (
                <>
                  Exibindo{' '}
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {filteredSegurados.length}
                  </span>{' '}
                  de{' '}
                  <span className="font-medium text-slate-900 dark:text-slate-100">{total}</span>{' '}
                  segurado(s) com os filtros atuais.
                </>
              ) : (
                <>
                  Total:{' '}
                  <span className="font-medium text-slate-900 dark:text-slate-100">{total}</span>{' '}
                  segurado(s).
                </>
              )}
            </p>
          </div>
        )}
      </div>

      <NovoSeguradoModal
        isOpen={isNovoModalOpen}
        onClose={() => setIsNovoModalOpen(false)}
        onSave={handleSaveNovo}
      />

      <SeguradoModal
        key={`edit-${isEditModalOpen}-${selectedSegurado?.id ?? ''}`}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        segurado={selectedSegurado}
        onSave={handleSaveEdit}
      />
    </div>
  )
}
