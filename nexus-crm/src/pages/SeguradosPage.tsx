import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, UserPlus, Edit, Loader2 } from 'lucide-react'
import { useSegurados, useCreateSegurado, useUpdateSegurado } from '../hooks/useSegurados'
import type { Segurado } from '../contexts/seguradosCore'
import {
  mapSeguradoRowToView,
  partialSeguradoToUpdate,
  buildCreateSeguradoInput,
} from '../lib/seguradoMapper'
import SeguradoModal from '../components/SeguradoModal'

/**
 * Página de listagem de Segurados (fonte: `public.segurados` no Supabase).
 */
export default function SeguradosPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSegurado, setSelectedSegurado] = useState<Segurado | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const navigate = useNavigate()

  const { data: rows, isLoading, isError, error, refetch } = useSegurados()
  const createSegurado = useCreateSegurado()
  const updateSegurado = useUpdateSegurado()

  const segurados = useMemo(() => (rows ?? []).map(mapSeguradoRowToView), [rows])

  const filteredSegurados = useMemo(
    () =>
      segurados.filter(
        (s) =>
          s.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (s.documento && s.documento.includes(searchTerm))
      ),
    [segurados, searchTerm]
  )

  const total = segurados.length

  const handleOpenModal = (segurado?: Segurado) => {
    setSaveError(null)
    setSelectedSegurado(segurado || null)
    setIsModalOpen(true)
  }

  const handleSave = async (data: Partial<Segurado>) => {
    setSaveError(null)
    try {
      if (selectedSegurado) {
        await updateSegurado.mutateAsync({
          id: selectedSegurado.id,
          patch: partialSeguradoToUpdate(data),
        })
      } else {
        await createSegurado.mutateAsync(buildCreateSeguradoInput(data))
      }
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
            Gerencie seus contatos e oportunidades em um só lugar.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Filter size={16} className="text-slate-400" />
            Filtros Avançados
          </button>
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
          >
            <UserPlus size={16} />
            Novo Cliente
          </button>
        </div>
      </div>

      {saveError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          {saveError}
        </div>
      )}

      <div className="mb-4 relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Filtrar segurados..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:border-primary focus:outline-none transition-colors"
        />
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
              <p className="mb-4 text-xs opacity-80">{error instanceof Error ? error.message : 'Erro desconhecido'}</p>
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
                  <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Cliente / Empresa</th>
                  <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Tipo</th>
                  <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">E-mail</th>
                  <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Telefone</th>
                  <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">Gerente</th>
                  <th className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filteredSegurados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                      {total === 0
                        ? 'Nenhum segurado cadastrado. Use «Novo Cliente» para incluir o primeiro.'
                        : 'Nenhum resultado para o filtro informado.'}
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
                        <p className="font-semibold text-sm">{s.nome}</p>
                        <p className="text-xs text-slate-400">
                          {s.tipo === 'PJ' ? 'CNPJ' : 'CPF'}: {s.documento || '—'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded uppercase tracking-wide">
                          {s.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {s.email || <span className="italic text-slate-400">Não informado</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {s.telefone || <span className="italic text-slate-400">Não informado</span>}
                      </td>
                      <td className="px-6 py-4">
                        {s.gerente ? (
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-6 h-6 ${s.gerenteCor} rounded-full flex items-center justify-center text-[10px] font-bold`}
                            >
                              {s.gerenteInicial}
                            </div>
                            <span className="text-sm">{s.gerente}</span>
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
                            handleOpenModal(s)
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
              {searchTerm.trim() ? (
                <>
                  Exibindo <span className="font-medium text-slate-900 dark:text-slate-100">{filteredSegurados.length}</span> de{' '}
                  <span className="font-medium text-slate-900 dark:text-slate-100">{total}</span> segurado(s) com o filtro atual.
                </>
              ) : (
                <>
                  Total: <span className="font-medium text-slate-900 dark:text-slate-100">{total}</span> segurado(s).
                </>
              )}
            </p>
          </div>
        )}
      </div>

      <SeguradoModal
        key={`${isModalOpen}-${selectedSegurado?.id ?? 'new'}`}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        segurado={selectedSegurado}
        onSave={handleSave}
      />
    </div>
  )
}
