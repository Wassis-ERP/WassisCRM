/**
 * Guia "Campos personalizados" baseada no contrato EAV tipado.
 *
 * A definição do campo nasce em Configurações (`campo_definicoes` +
 * `campo_opcoes`). Aqui o usuário apenas preenche valores do registro atual
 * (`campo_valores` + `campo_valor_opcoes`).
 */
import { useMemo, useState } from 'react'
import { Calendar, Check, Hash, ListChecks, Loader2, Save, ShieldCheck, Sliders, X } from 'lucide-react'
import { DetailCard, EmptyState } from '../primitives'
import {
  isCampoValorInputEmpty,
  type CampoPersonalizadoOperacional,
  type CampoValorInput,
  useCamposPersonalizados,
} from '../../../hooks/useCamposPersonalizados'
import type { CampoEntidadeTipo } from '../../../hooks/useLookupsAdmin'

const inputCls =
  'w-full px-3 py-2.5 bg-bg-surface text-fg-1 border border-border-1 rounded-[6px] text-sm font-semibold placeholder:text-fg-4 focus:border-accent-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/30 disabled:opacity-50'

const chipClass = 'inline-flex h-6 items-center justify-center rounded-full px-2.5 text-[10px] font-black uppercase leading-none tracking-widest'

function valueFromCampo(campo: CampoPersonalizadoOperacional): CampoValorInput {
  const valor = campo.valor
  if (!valor) return campo.tipo_dado === 'LISTA_MULTIPLA' ? [] : null

  switch (campo.tipo_dado) {
    case 'TEXTO_CURTO':
    case 'TEXTO_LONGO':
      return valor.valor_texto ?? ''
    case 'INTEIRO':
    case 'DECIMAL':
      return valor.valor_numero ?? ''
    case 'BOOLEANO':
      return valor.valor_booleano
    case 'DATA':
      return valor.valor_data ?? ''
    case 'DATA_HORA':
      return valor.valor_datahora ? valor.valor_datahora.slice(0, 16) : ''
    case 'LISTA_UNICA':
      return valor.valor_opcao_id ?? ''
    case 'LISTA_MULTIPLA':
      return campo.valorOpcoes.map((opcao) => opcao.campo_opcao_id)
    default:
      return null
  }
}

function tipoLabel(tipo: string) {
  const labels: Record<string, string> = {
    TEXTO_CURTO: 'Texto',
    TEXTO_LONGO: 'Texto longo',
    INTEIRO: 'Número inteiro',
    DECIMAL: 'Número decimal',
    BOOLEANO: 'Sim/Não',
    DATA: 'Data',
    DATA_HORA: 'Data e hora',
    LISTA_UNICA: 'Seleção única',
    LISTA_MULTIPLA: 'Seleção múltipla',
  }
  return labels[tipo] ?? tipo
}

function CampoIcon({ tipo }: { tipo: string }) {
  if (tipo === 'DATA' || tipo === 'DATA_HORA') return <Calendar size={16} />
  if (tipo === 'BOOLEANO') return <ShieldCheck size={16} />
  if (tipo === 'LISTA_UNICA' || tipo === 'LISTA_MULTIPLA') return <ListChecks size={16} />
  return <Hash size={16} />
}

function CampoEditor({
  campo,
  isSaving,
  onSave,
  onClear,
  readOnly = false,
}: {
  campo: CampoPersonalizadoOperacional
  isSaving: boolean
  onSave: (campo: CampoPersonalizadoOperacional, value: CampoValorInput) => Promise<unknown>
  onClear: (campoDefinicaoId: string) => Promise<unknown>
  readOnly?: boolean
}) {
  const [value, setValue] = useState<CampoValorInput>(() => valueFromCampo(campo))
  const [error, setError] = useState<string | null>(null)

  const selectedIds = Array.isArray(value) ? value : []
  const visibleOpcoes = campo.opcoes.filter((opcao) => opcao.ativo || selectedIds.includes(opcao.id) || value === opcao.id)
  const hasValue = !isCampoValorInputEmpty(campo, value)

  const save = async () => {
    if (campo.obrigatorio && isCampoValorInputEmpty(campo, value)) {
      setError('Campo obrigatório.')
      return
    }
    setError(null)
    await onSave(campo, value)
  }

  const clear = async () => {
    setError(null)
    setValue(campo.tipo_dado === 'LISTA_MULTIPLA' ? [] : null)
    await onClear(campo.id)
  }

  const toggleOption = (optionId: string) => {
    setValue((prev) => {
      const current = Array.isArray(prev) ? prev : []
      return current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId]
    })
  }

  const renderInput = () => {
    switch (campo.tipo_dado) {
      case 'TEXTO_LONGO':
        return (
          <textarea
            disabled={readOnly}
            value={typeof value === 'string' ? value : ''}
            onChange={(event) => setValue(event.target.value)}
            rows={3}
            maxLength={campo.tamanho_max ?? undefined}
            placeholder={campo.placeholder ?? 'Texto'}
            className={`${inputCls} resize-none`}
          />
        )
      case 'INTEIRO':
      case 'DECIMAL':
        return (
          <input
            disabled={readOnly}
            type="number"
            step={campo.tipo_dado === 'INTEIRO' ? 1 : 'any'}
            min={campo.min_valor ?? undefined}
            max={campo.max_valor ?? undefined}
            value={typeof value === 'number' || typeof value === 'string' ? value : ''}
            onChange={(event) => setValue(event.target.value)}
            placeholder={campo.placeholder ?? (campo.formato === 'PERCENTUAL' ? 'Ex: 12,5' : '0')}
            className={inputCls}
          />
        )
      case 'BOOLEANO':
        return (
          <label className="flex h-[42px] items-center gap-2 rounded-[6px] border border-border-1 bg-bg-surface px-3 text-sm font-black text-fg-2">
            <input
              type="checkbox"
              disabled={readOnly}
              checked={Boolean(value)}
              onChange={(event) => setValue(event.target.checked)}
              className="h-4 w-4 accent-accent-primary"
            />
            Sim
          </label>
        )
      case 'DATA':
        return (
          <input
            type="date"
            disabled={readOnly}
            value={typeof value === 'string' ? value : ''}
            onChange={(event) => setValue(event.target.value)}
            className={inputCls}
          />
        )
      case 'DATA_HORA':
        return (
          <input
            type="datetime-local"
            disabled={readOnly}
            value={typeof value === 'string' ? value : ''}
            onChange={(event) => setValue(event.target.value)}
            className={inputCls}
          />
        )
      case 'LISTA_UNICA':
        return (
          <select
            disabled={readOnly}
            value={typeof value === 'string' ? value : ''}
            onChange={(event) => setValue(event.target.value)}
            className={inputCls}
          >
            <option value="">Selecione</option>
            {visibleOpcoes.map((opcao) => (
              <option key={opcao.id} value={opcao.id} disabled={!opcao.ativo}>
                {opcao.rotulo}{!opcao.ativo ? ' (inativa)' : ''}
              </option>
            ))}
          </select>
        )
      case 'LISTA_MULTIPLA':
        return (
          <div className="rounded-[6px] border border-border-1 bg-bg-surface p-3">
            {visibleOpcoes.length ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {visibleOpcoes.map((opcao) => (
                  <label key={opcao.id} className="flex items-center gap-2 text-sm font-semibold text-fg-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(opcao.id)}
                      disabled={readOnly || (!opcao.ativo && !selectedIds.includes(opcao.id))}
                      onChange={() => toggleOption(opcao.id)}
                      className="h-4 w-4 accent-accent-primary"
                    />
                    {opcao.rotulo}{!opcao.ativo ? ' (inativa)' : ''}
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm font-semibold text-fg-4">Nenhuma opção ativa para este campo.</p>
            )}
          </div>
        )
      case 'TEXTO_CURTO':
      default:
        return (
          <input
            disabled={readOnly}
            value={typeof value === 'string' ? value : ''}
            onChange={(event) => setValue(event.target.value)}
            maxLength={campo.tamanho_max ?? undefined}
            placeholder={campo.placeholder ?? 'Texto'}
            className={inputCls}
          />
        )
    }
  }

  return (
    <div className="rounded-[8px] border border-border-1 bg-bg-surface-2 p-4">
      <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-accent-primary-soft text-accent-primary">
            <CampoIcon tipo={campo.tipo_dado} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-black text-fg-1">{campo.nome}</h4>
              {campo.obrigatorio && <span className={`${chipClass} bg-signal-warning/15 text-signal-warning`}>Obrigatório</span>}
              {campo.valor?.validado_em && <span className={`${chipClass} bg-signal-success/15 text-signal-success`}>Validado</span>}
            </div>
            <p className="mt-1 font-mono text-[11px] font-semibold text-fg-4">{campo.chave}</p>
            {campo.ajuda && <p className="mt-1 text-xs font-semibold text-fg-3">{campo.ajuda}</p>}
          </div>
        </div>
        <span className={`${chipClass} w-fit bg-bg-surface text-fg-3`}>{tipoLabel(campo.tipo_dado)}</span>
      </div>

      {renderInput()}

      {error && (
        <div className="mt-3 rounded-[6px] border border-signal-danger/30 bg-signal-danger/10 px-3 py-2 text-xs font-semibold text-signal-danger">
          {error}
        </div>
      )}

      {!readOnly && <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={clear}
          disabled={isSaving || !hasValue}
          className="inline-flex items-center justify-center gap-2 rounded-[6px] px-3 py-2 text-xs font-black text-fg-3 transition-colors hover:bg-bg-surface-3 hover:text-fg-1 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <X size={14} /> Limpar
        </button>
        <button
          type="button"
          onClick={save}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-accent-primary px-4 py-2 text-xs font-black text-fg-on-brand shadow-[var(--shadow-brand)] transition-colors hover:bg-accent-primary-hover disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={15} className="animate-spin" /> : hasValue ? <Save size={15} /> : <Check size={15} />}
          Salvar
        </button>
      </div>}
    </div>
  )
}

export default function CamposPersonalizadosTab({
  entidadeTipo,
  entidadeId,
  readOnly = false,
}: {
  entidadeTipo: CampoEntidadeTipo
  entidadeId: string
  readOnly?: boolean
}) {
  const { campos, isLoading, isSaving, saveValue, clearValue } = useCamposPersonalizados(entidadeTipo, entidadeId)
  const grupos = useMemo(() => {
    const map = new Map<string, CampoPersonalizadoOperacional[]>()
    campos.forEach((campo) => {
      const key = campo.agrupamento?.trim() || 'Campos gerais'
      map.set(key, [...(map.get(key) ?? []), campo])
    })
    return Array.from(map.entries())
  }, [campos])

  return (
    <div className="space-y-4">
      <DetailCard title="Campos personalizados" icon={Sliders}>
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm font-semibold text-fg-3">
            <Loader2 className="animate-spin" size={18} /> Carregando campos personalizados...
          </div>
        ) : campos.length ? (
          <div className="space-y-5">
            {grupos.map(([grupo, itens]) => (
              <section key={grupo} className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-fg-4">{grupo}</h4>
                  <span className="text-[10px] font-black uppercase tracking-widest text-fg-4">
                    {itens.length} campos
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                  {itens.map((campo) => (
                    <CampoEditor
                      key={`${campo.id}-${campo.valor?.id ?? 'novo'}-${campo.valor?.preenchido_em ?? ''}-${campo.valorOpcoes.map((item) => item.campo_opcao_id).join('.')}`}
                      campo={campo}
                      isSaving={isSaving}
                      onSave={(definicao, value) => saveValue({ definicao, value })}
                      onClear={clearValue}
                      readOnly={readOnly}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Sliders}
            title="Nenhum campo personalizado configurado"
            hint="Crie campos em Configurações > Campos para que apareçam nesta guia."
          />
        )}
      </DetailCard>
      <p className="flex items-start gap-2 px-1 text-xs text-fg-4">
        <Sliders size={14} className="mt-0.5 shrink-0" />
        Campos e opções são definidos em Configurações. Esta guia preenche apenas os valores deste registro.
      </p>
    </div>
  )
}
