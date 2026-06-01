import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, UserPlus, Edit, Eye, Loader2, Building2, User, Users } from 'lucide-react'
import { useSegurados, useCreateSegurado, useUpdateSegurado } from '../hooks/useSegurados'
import type { Segurado, StatusPessoa } from '../contexts/seguradosCore'
import {
  mapSeguradoRowToView,
  partialSeguradoToUpdate,
  buildCreateSeguradoInput,
} from '../lib/seguradoMapper'
import SeguradoModal from '../components/SeguradoModal'
import NovoSeguradoModal from '../components/NovoSeguradoModal'
import { StatusBadge } from '../components/detail/primitives'

type TipoFilter = 'Todos' | 'PF' | 'PJ'
type StatusFilter = 'Todos' | StatusPessoa

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
          <p className="text-[11px] font-bold uppercase tracking-widest text-accent-primary mb-1">
            Cadastro unificado
          </p>
          <h1 className="text-3xl font-bold mb-2">Segurados</h1>
          <p className="text-fg-3">
            Cadastro unificado de pessoas (PF/PJ). Gerencie clientes, prospects e contatos.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenNovo}
          className="flex items-center gap-2 px-6 py-2.5 bg-accent-primary text-fg-on-brand rounded-full text-sm font-semibold hover:bg-accent-primary-hover transition-colors shadow-[var(--shadow-brand)]"
        >
          <UserPlus size={16} />
          Novo Segurado
        </button>
      </div>

      {saveError && (
        <div className="mb-4 rounded-[10px] border border-signal-danger/30 bg-signal-danger/10 px-4 py-3 text-sm text-signal-danger">
          {saveError}
        </div>
      )}

      {/* Toolbar de filtros */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-4" />
          <input
            type="text"
            placeholder="Buscar por nome, razão social, documento, e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-bg-surface text-fg-1 placeholder:text-fg-4 border border-border-1 rounded-[10px] text-sm focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 transition-colors"
          />
        </div>
        <select
          value={tipoFilter}
          onChange={(e) => setTipoFilter(e.target.value as TipoFilter)}
          className="px-4 py-2 bg-bg-surface text-fg-1 border border-border-1 rounded-[10px] text-sm font-medium focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
        >
          <option value="Todos">Todos os tipos</option>
          <option value="PF">Pessoa Física</option>
          <option value="PJ">Pessoa Jurídica</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="px-4 py-2 bg-bg-surface text-fg-1 border border-border-1 rounded-[10px] text-sm font-medium focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
        >
          <option value="Todos">Todos os status</option>
          <option value="Ativo">Ativo</option>
          <option value="Inativo">Inativo</option>
          <option value="Prospecto">Prospecto</option>
        </select>
      </div>

      <div className="bg-bg-surface rounded-[14px] shadow-[var(--shadow-1)] border border-border-1 overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-fg-3">
              <Loader2 className="animate-spin" size={22} />
              <span className="text-sm">Carregando segurados…</span>
            </div>
          ) : isError ? (
            <div className="px-6 py-16 text-center text-sm text-fg-2">
              <p className="mb-3">Não foi possível carregar a lista.</p>
              <p className="mb-4 text-xs opacity-80">
                {error instanceof Error ? error.message : 'Erro desconhecido'}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="rounded-full bg-accent-primary px-4 py-2 text-sm font-semibold text-fg-on-brand hover:bg-accent-primary-hover"
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-surface-2 text-fg-4 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4 border-b border-border-1">Pessoa</th>
                  <th className="px-6 py-4 border-b border-border-1">Tipo</th>
                  <th className="px-6 py-4 border-b border-border-1">Status</th>
                  <th className="px-6 py-4 border-b border-border-1">Contato</th>
                  <th className="px-6 py-4 border-b border-border-1">Cidade/UF</th>
                  <th className="px-6 py-4 border-b border-border-1">Gerente</th>
                  <th className="px-6 py-4 border-b border-border-1 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-1">
                {filteredSegurados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-14 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-[12px] bg-bg-surface-2 text-fg-4 flex items-center justify-center">
                          <Users size={24} />
                        </div>
                        <p className="text-sm font-semibold text-fg-2">
                          {total === 0 ? 'Nenhum segurado cadastrado' : 'Nenhum resultado encontrado'}
                        </p>
                        <p className="text-xs text-fg-4">
                          {total === 0
                            ? 'Use «Novo Segurado» para incluir o primeiro cadastro.'
                            : 'Ajuste a busca ou os filtros para ver outros cadastros.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSegurados.map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-bg-surface-2 transition-colors cursor-pointer"
                      onClick={() => navigate(`/segurados/${s.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-accent-primary-soft text-accent-primary rounded-[10px] flex items-center justify-center shrink-0">
                            {s.tipo === 'PJ' ? <Building2 size={16} /> : <User size={16} />}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-fg-1">{s.nome}</p>
                            {s.tipo === 'PJ' && s.nomeFantasia && (
                              <p className="text-xs text-fg-4">{s.nomeFantasia}</p>
                            )}
                            <p className="text-xs text-fg-4">
                              {s.tipo === 'PJ' ? 'CNPJ' : 'CPF'}: {s.documento || '—'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-bg-surface-3 text-fg-3 text-[10px] font-bold rounded uppercase tracking-wide">
                          {s.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="px-6 py-4 text-xs text-fg-2">
                        <p>{s.email || <span className="italic text-fg-4">sem e-mail</span>}</p>
                        <p className="whitespace-nowrap">
                          {s.telefone || <span className="italic text-fg-4">sem telefone</span>}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-fg-2">
                        {s.cidade || s.estado ? (
                          <span>
                            {s.cidade}
                            {s.cidade && s.estado ? '/' : ''}
                            {s.estado}
                          </span>
                        ) : (
                          <span className="italic text-fg-4">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {s.gerenteNome ? (
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-6 h-6 ${s.gerenteCor ?? 'bg-bg-surface-3 text-fg-3'} rounded-full flex items-center justify-center text-[10px] font-bold`}
                            >
                              {s.gerenteInicial}
                            </div>
                            <span className="text-sm text-fg-1">{s.gerenteNome}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-fg-4 italic">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title="Ver detalhes"
                            className="p-2 text-fg-4 hover:text-accent-primary transition-colors"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/segurados/${s.id}`)
                            }}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            title="Editar cadastro"
                            className="p-2 text-fg-4 hover:text-accent-primary transition-colors"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenEdit(s)
                            }}
                          >
                            <Edit size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {!isLoading && !isError && (
          <div className="px-6 py-4 border-t border-border-1">
            <p className="text-sm text-fg-4">
              {filteredSegurados.length !== total ? (
                <>
                  Exibindo{' '}
                  <span className="font-medium text-fg-1">
                    {filteredSegurados.length}
                  </span>{' '}
                  de{' '}
                  <span className="font-medium text-fg-1">{total}</span>{' '}
                  segurado(s) com os filtros atuais.
                </>
              ) : (
                <>
                  Total:{' '}
                  <span className="font-medium text-fg-1">{total}</span>{' '}
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
