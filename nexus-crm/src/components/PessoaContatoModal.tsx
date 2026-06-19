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
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[var(--bg-overlay)] backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-bg-surface w-full max-w-lg rounded-[12px] shadow-[var(--shadow-3)] border border-border-1 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-border-1 flex items-center justify-between bg-bg-surface-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-primary-soft rounded-[6px] text-accent-primary">
              <Link2 size={18} />
            </div>
            <h2 className="text-lg font-black text-fg-1 uppercase tracking-tight">
              {titulo}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-bg-surface-3 rounded-full transition-colors text-fg-4"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-fg-4 uppercase tracking-widest ml-1">
                {tipoContraparte === 'PF' ? 'Pessoa física' : 'Empresa'}
              </label>
              <select
                value={contatoId}
                onChange={(e) => setContatoId(e.target.value)}
                disabled={!!vinculo}
                className="w-full px-4 py-3 bg-bg-surface-2 text-fg-1 border border-border-1 rounded-[6px] text-sm focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 font-medium disabled:opacity-60"
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
                <p className="text-[11px] text-fg-4 ml-1">
                  Nenhum cadastro disponível. Crie um {tipoContraparte === 'PF' ? 'PF' : 'PJ'} primeiro.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-fg-4 uppercase tracking-widest ml-1">
                Cargo
              </label>
              <input
                type="text"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="Ex: Diretor Financeiro"
                className="w-full px-4 py-3 bg-bg-surface-2 text-fg-1 border border-border-1 rounded-[6px] text-sm focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 font-medium"
              />
            </div>

            <label className="flex items-start gap-3 px-4 py-3 bg-bg-surface-2 border border-border-1 rounded-[6px] cursor-pointer">
              <input
                type="checkbox"
                checked={principal}
                onChange={(e) => setPrincipal(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border-2 text-accent-primary focus:ring-accent-primary"
              />
              <span className="text-xs text-fg-2 leading-relaxed">
                Definir como contato principal. Apenas um contato pode ser
                principal por empresa — marcar este removerá a flag dos demais.
              </span>
            </label>

            {error && (
              <p className="text-xs text-signal-danger">{error}</p>
            )}
          </div>

          <div className="px-6 py-5 border-t border-border-1 bg-bg-surface-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-sm font-bold text-fg-3 hover:text-fg-1 hover:bg-bg-surface-3 rounded-[6px] transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-accent-primary text-fg-on-brand rounded-full text-sm font-black hover:bg-accent-primary-hover transition-all shadow-[var(--shadow-brand)] disabled:opacity-50"
            >
              {submitting ? 'Salvando…' : vinculo ? 'Atualizar vínculo' : 'Vincular'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
