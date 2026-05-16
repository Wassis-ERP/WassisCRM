import { useMemo, useState } from 'react'
import { X, Link2 } from 'lucide-react'
import { useSegurados } from '../hooks/useSegurados'
import type { PessoaContato } from '../contexts/seguradosCore'
import { mapSeguradoRowToView } from '../lib/seguradoMapper'

export interface PessoaContatoFormValue {
  contatoId: string // id da contraparte (PJ se ladoAtual=PF; PF se ladoAtual=PJ)
  cargo: string
  principal: boolean
}

interface Props {
  isOpen: boolean
  onClose: () => void
  /** Pessoa atual (lado conhecido do vínculo). */
  pessoaAtualId: string
  ladoAtual: 'PF' | 'PJ'
  /** Quando informado, edita um vínculo existente. */
  vinculo?: PessoaContato | null
  /** IDs que já estão vinculados (para esconder duplicatas no select). */
  idsJaVinculados: string[]
  onSubmit: (value: PessoaContatoFormValue) => Promise<void> | void
}

/**
 * Modal para criar/editar um vínculo PJ↔PF (`pessoa_contato`).
 * O lado conhecido é fixado pelo contexto (página de detalhe da pessoa atual)
 * e o usuário seleciona apenas a contraparte.
 */
export default function PessoaContatoModal({
  isOpen,
  onClose,
  pessoaAtualId,
  ladoAtual,
  vinculo,
  idsJaVinculados,
  onSubmit,
}: Props) {
  const tipoContraparte: 'PF' | 'PJ' = ladoAtual === 'PJ' ? 'PF' : 'PJ'
  const { data: rows } = useSegurados()
  const opcoes = useMemo(() => {
    const ja = new Set(idsJaVinculados)
    return (rows ?? [])
      .map(mapSeguradoRowToView)
      .filter((s) => s.tipo === tipoContraparte && s.id !== pessoaAtualId)
      .filter((s) => !ja.has(s.id) || s.id === (vinculo ? (ladoAtual === 'PJ' ? vinculo.pfId : vinculo.pjId) : ''))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [rows, tipoContraparte, idsJaVinculados, pessoaAtualId, vinculo, ladoAtual])

  const initialContatoId = vinculo
    ? ladoAtual === 'PJ'
      ? vinculo.pfId
      : vinculo.pjId
    : ''

  const [contatoId, setContatoId] = useState<string>(initialContatoId)
  const [cargo, setCargo] = useState<string>(vinculo?.cargo ?? '')
  const [principal, setPrincipal] = useState<boolean>(vinculo?.principal ?? false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!contatoId) {
      setError(`Selecione a ${tipoContraparte === 'PF' ? 'pessoa física' : 'empresa'}.`)
      return
    }
    setSubmitting(true)
    try {
      await onSubmit({ contatoId, cargo: cargo.trim(), principal })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar vínculo')
    } finally {
      setSubmitting(false)
    }
  }

  const titulo = vinculo
    ? 'Editar vínculo'
    : ladoAtual === 'PJ'
      ? 'Adicionar contato à empresa'
      : 'Vincular pessoa a uma empresa'

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <Link2 size={18} />
            </div>
            <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">
              {titulo}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                {tipoContraparte === 'PF' ? 'Pessoa física' : 'Empresa'}
              </label>
              <select
                value={contatoId}
                onChange={(e) => setContatoId(e.target.value)}
                disabled={!!vinculo}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm focus:border-primary focus:outline-none font-medium disabled:opacity-60"
              >
                <option value="">Selecione…</option>
                {opcoes.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nome}
                    {o.tipo === 'PJ' && o.nomeFantasia ? ` (${o.nomeFantasia})` : ''}
                  </option>
                ))}
              </select>
              {opcoes.length === 0 && (
                <p className="text-[11px] text-slate-400 ml-1">
                  Nenhum cadastro disponível. Crie um {tipoContraparte === 'PF' ? 'PF' : 'PJ'} primeiro.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Cargo
              </label>
              <input
                type="text"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="Ex: Diretor Financeiro"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm focus:border-primary focus:outline-none font-medium"
              />
            </div>

            <label className="flex items-start gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={principal}
                onChange={(e) => setPrincipal(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
              />
              <span className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Definir como contato principal. Apenas um contato pode ser
                principal por empresa — marcar este removerá a flag dos demais.
              </span>
            </label>

            {error && (
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>

          <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-black hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {submitting ? 'Salvando…' : vinculo ? 'Atualizar vínculo' : 'Vincular'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
