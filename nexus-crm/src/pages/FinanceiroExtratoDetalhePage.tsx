import { Link, useParams } from 'react-router-dom'
import {
  AlertCircle, ArrowLeft, CheckCircle2, ExternalLink, FileClock, FileText,
  Link2, ShieldAlert, TriangleAlert,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useFinanceiroExtrato } from '../hooks/useFinanceiroExtratos'
import { usePermission } from '../hooks/usePermission'

const money = (value: number | null, currency = 'BRL') => new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: currency || 'BRL',
}).format(value ?? 0)
const date = (value: string | null) => value
  ? new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T12:00:00`))
  : '—'
const dateTime = (value: string | null) => value
  ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
  : '—'
const label = (value: string) => value.toLocaleLowerCase('pt-BR').replaceAll('_', ' ').replace(/^./, (letter) => letter.toLocaleUpperCase('pt-BR'))

function StatusPill({ value, warning = false, success = false }: { value: string; warning?: boolean; success?: boolean }) {
  const Icon = warning ? TriangleAlert : success ? CheckCircle2 : FileClock
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black ${warning ? 'bg-signal-warning/12 text-signal-warning' : success ? 'bg-signal-success/12 text-signal-success' : 'bg-bg-surface-3 text-fg-2'}`}><Icon size={12} />{label(value)}</span>
}

export default function FinanceiroExtratoDetalhePage() {
  const { id } = useParams()
  const { user, activeBranchId } = useAuth()
  const { can } = usePermission('financeiro')
  const branchIds = activeBranchId ? [activeBranchId] : user?.branchIds ?? null
  const query = useFinanceiroExtrato(id, branchIds)

  if (!can('read')) return <div className="p-8 text-center"><ShieldAlert className="mx-auto text-signal-warning" size={30} /><h1 className="mt-4 text-xl font-black text-fg-1">Sem permissão para consultar este extrato</h1></div>
  if (query.isLoading) return <div className="space-y-4 p-6"><div className="h-24 animate-pulse rounded-[8px] bg-bg-surface-2" /><div className="h-40 animate-pulse rounded-[8px] bg-bg-surface-2" /><div className="h-72 animate-pulse rounded-[8px] bg-bg-surface-2" /></div>
  if (query.isError) return <div className="p-12 text-center"><AlertCircle className="mx-auto text-signal-danger" size={30} /><h1 className="mt-4 text-xl font-black text-fg-1">Não foi possível carregar o extrato</h1><button type="button" onClick={() => void query.refetch()} className="mt-5 rounded-full bg-accent-primary px-5 py-2.5 text-sm font-black text-fg-on-brand">Tentar novamente</button></div>
  if (!query.data) return <div className="p-12 text-center"><FileClock className="mx-auto text-fg-4" size={30} /><h1 className="mt-4 text-xl font-black text-fg-1">Extrato não encontrado</h1><p className="mt-2 text-sm text-fg-3">O demonstrativo não existe ou não pertence às corretoras acessíveis.</p><Link to="/financeiro/extratos" className="mt-5 inline-flex rounded-full bg-accent-primary px-5 py-2.5 text-sm font-black text-fg-on-brand">Voltar ao histórico</Link></div>

  const { resumo, itens, conciliacoes, ocorrencias } = query.data
  const currency = resumo.moeda ?? 'BRL'
  const headerFields = [
    ['Referência externa', resumo.identificacao_externa ?? '—'],
    ['Competência', date(resumo.competencia)],
    ['Período', `${date(resumo.periodo_inicio)} a ${date(resumo.periodo_fim)}`],
    ['Emissão', date(resumo.data_emissao)],
    ['Crédito / recebimento', date(resumo.data_recebimento)],
    ['Origem', `${label(resumo.origem_tipo)} · ${resumo.origem_formato ?? 'sem formato'}`],
    ['Parser', resumo.parser_identificador ? `${resumo.parser_identificador} · ${resumo.parser_versao ?? 'sem versão'}` : 'Não informado'],
    ['Tentativa', String(resumo.tentativa_processamento)],
    ['Recebido por', resumo.recebidoPorNome ?? 'Sistema'],
    ['Processado por', resumo.processadoPorNome ?? 'Sistema'],
    ['Recebido em', dateTime(resumo.recebido_em)],
    ['Concluído em', dateTime(resumo.processamento_concluido_em)],
  ]

  return <div className="min-h-full animate-fade-in">
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border-1 px-5 pb-5 pt-7 lg:px-7">
      <div><p className="text-xs text-fg-4">Financeiro &rsaquo; Comissões &rsaquo; Extratos &rsaquo; Conferência</p><div className="mt-2 flex items-start gap-3"><div className="rounded-[6px] bg-accent-primary-soft p-2.5 text-accent-primary"><FileText size={22} /></div><div><h1 className="text-2xl font-black tracking-tight text-fg-1">{resumo.identificacao_externa ?? 'Extrato sem referência externa'}</h1><p className="mt-1 text-sm text-fg-3">{resumo.seguradoraNome} · {resumo.filialNome}</p><div className="mt-2 flex flex-wrap gap-2"><StatusPill value={resumo.status_processamento} success={resumo.status_processamento === 'NORMALIZADO'} warning={resumo.status_processamento === 'ERRO'} /><StatusPill value={resumo.status_conciliacao} success={resumo.status_conciliacao === 'CONCILIADO'} warning={resumo.status_conciliacao === 'COM_OCORRENCIAS'} /></div></div></div></div>
      <Link to="/financeiro/extratos" className="inline-flex items-center gap-2 rounded-full border border-border-1 bg-bg-surface px-4 py-2.5 text-xs font-black text-fg-2 hover:bg-bg-surface-2"><ArrowLeft size={14} />Histórico de extratos</Link>
    </header>

    <section className="grid divide-y divide-border-1 border-b border-border-1 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
      {[['Bruto informado', money(resumo.valor_bruto_total, currency)], ['Descontos informados', money(resumo.valor_descontos_total, currency)], ['Líquido informado', money(resumo.valor_liquido_total, currency)], ['Soma líquida dos itens', money(resumo.somaItensLiquido, currency)]].map(([name, value]) => <div key={name} className="px-5 py-4"><p className="text-[9px] font-black uppercase tracking-wider text-fg-3">{name}</p><p className="mt-1 font-mono text-lg font-black text-fg-1">{value}</p></div>)}
    </section>
    <div className={`flex flex-wrap items-center gap-3 border-b px-5 py-3 text-xs lg:px-7 ${resumo.totalizacaoCompativel ? 'border-signal-success/25 bg-signal-success/8 text-signal-success' : 'border-signal-warning/30 bg-signal-warning/8 text-signal-warning'}`}>
      {resumo.totalizacaoCompativel ? <CheckCircle2 size={16} /> : <TriangleAlert size={16} />}
      <strong className="font-black">{resumo.totalizacaoCompativel ? 'Total líquido compatível com a soma dos itens' : `Diferença de totalização: ${money(resumo.diferencaTotalizacao, currency)}`}</strong>
      {!resumo.totalizacaoCompativel && resumo.observacoes && <span className="text-fg-2">{resumo.observacoes}</span>}
    </div>

    <section className="border-b border-border-1 px-5 py-5 lg:px-7">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-base font-black text-fg-1">Cabeçalho do demonstrativo</h2><p className="mt-1 text-xs text-fg-3">Dados informados e rastreabilidade do processamento.</p></div><div className="inline-flex max-w-full items-center gap-2 rounded-[6px] border border-border-1 bg-bg-surface-2 px-3 py-2 text-xs text-fg-3"><FileText size={14} /><span className="truncate font-mono">{resumo.arquivo_nome ?? 'Sem arquivo associado'}</span><span className="shrink-0">· referência somente leitura</span></div></div>
      <dl className="mt-4 grid gap-px overflow-hidden rounded-[8px] border border-border-1 bg-border-1 sm:grid-cols-2 lg:grid-cols-4">{headerFields.map(([name, value]) => <div key={name} className="bg-bg-surface px-4 py-3"><dt className="text-[9px] font-black uppercase tracking-wider text-fg-3">{name}</dt><dd className="mt-1 break-words text-xs font-bold text-fg-1">{value}</dd></div>)}</dl>
    </section>

    <section className="border-b border-border-1">
      <div className="flex flex-wrap items-end justify-between gap-3 px-5 py-4 lg:px-7"><div><h2 className="text-base font-black text-fg-1">Itens normalizados</h2><p className="mt-1 text-xs text-fg-3">Referências originais, valores e situação de cada linha.</p></div><p className="text-xs font-bold text-fg-3">{itens.length} item(ns) · {resumo.contagens.prontos} pronto(s) · {resumo.contagens.semVinculo} sem vínculo</p></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[1460px] border-collapse text-left"><thead className="bg-bg-surface-2 text-[9px] font-black uppercase tracking-wider text-fg-3"><tr><th className="px-5 py-3">Linha / referência</th><th className="px-3 py-3">Segurado / documento informado</th><th className="px-3 py-3">Apólice / proposta / parcela</th><th className="px-3 py-3">Competência / crédito</th><th className="px-3 py-3 text-right">Bruto</th><th className="px-3 py-3 text-right">Descontos</th><th className="px-3 py-3 text-right">Líquido</th><th className="px-3 py-3 text-right">Percentual</th><th className="px-3 py-3">Tipo</th><th className="px-5 py-3">Situação</th></tr></thead><tbody className="divide-y divide-border-1">
        {itens.map((item) => <tr key={item.id} className="hover:bg-bg-surface-2/70"><td className="px-5 py-3"><p className="font-mono text-xs font-black text-fg-1">{item.identificacao_externa ?? `Linha ${item.sequencia_externa ?? '—'}`}</p><p className="mt-1 max-w-[220px] text-[10px] text-fg-3">{item.descricao_original ?? 'Sem descrição original'}</p></td><td className="px-3 py-3"><p className="text-xs font-black text-fg-1">{item.segurado_nome_informado ?? 'Não informado'}</p><p className="mt-1 font-mono text-[10px] text-fg-3">{item.documento_numero_informado ?? 'Documento não informado'}</p></td><td className="px-3 py-3 font-mono text-[11px] text-fg-2"><p>Apólice {item.apolice_numero_informado ?? '—'}</p><p className="mt-1">Proposta {item.proposta_numero_informado ?? '—'} · Parcela {item.parcela_numero_informado ?? '—'}</p></td><td className="px-3 py-3 font-mono text-xs font-bold text-fg-1">{date(item.competencia)}<span className="mt-1 block text-[10px] text-fg-3">crédito {date(item.data_credito)}</span></td><td className="px-3 py-3 text-right font-mono text-xs font-black text-fg-1">{money(item.valor_bruto_informado, currency)}</td><td className="px-3 py-3 text-right font-mono text-xs font-bold text-fg-2">{money(item.valor_descontos_informado, currency)}</td><td className="px-3 py-3 text-right font-mono text-xs font-black text-fg-1">{money(item.valor_liquido_informado, currency)}</td><td className="px-3 py-3 text-right font-mono text-xs font-bold text-fg-2">{item.percentual_informado === null ? '—' : `${item.percentual_informado.toLocaleString('pt-BR')}%`}</td><td className="px-3 py-3 text-[11px] font-bold text-fg-2">{item.tipo_comissao ? label(item.tipo_comissao) : '—'}</td><td className="px-5 py-3"><StatusPill value={item.status_conciliacao} success={['CONCILIADO', 'PRONTO_PARA_BAIXAR'].includes(item.status_conciliacao)} warning={['PARCIAL', 'AMBIGUO', 'DIVERGENTE', 'NAO_ENCONTRADO'].includes(item.status_conciliacao)} /><p className="mt-1 text-[10px] text-fg-3">{item.conciliacoes.length} vínculo(s) · {item.ocorrencias.length} ocorrência(s)</p></td></tr>)}
      </tbody></table></div>
    </section>

    <section className="grid border-b border-border-1 xl:grid-cols-2 xl:divide-x xl:divide-border-1">
      <div><div className="px-5 py-4 lg:px-7"><h2 className="text-base font-black text-fg-1">Conciliações</h2><p className="mt-1 text-xs text-fg-3">Associações confirmadas ou sugeridas; nenhuma cria baixa automaticamente.</p></div>{conciliacoes.length === 0 ? <p className="px-5 pb-8 text-sm text-fg-3 lg:px-7">Nenhuma conciliação registrada.</p> : <div className="divide-y divide-border-1">{conciliacoes.map((row) => <article key={row.id} className="px-5 py-4 lg:px-7"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-xs font-black text-fg-1">Item {row.itemReferencia}</p><p className="mt-1 text-[11px] text-fg-3">{label(row.tipo_associacao)} · confiança {row.confianca_pct === null ? '—' : `${row.confianca_pct}%`}</p></div><StatusPill value={row.status} success={row.status === 'CONFIRMADA'} warning={row.status === 'SUGERIDA'} /></div><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 font-mono text-xs"><span className="text-fg-2">Previsto {money(row.valor_previsto_snapshot, currency)}</span><span className="text-fg-1">Conciliado {money(row.valor_conciliado, currency)}</span><span className={Math.abs(row.valor_diferenca ?? 0) <= 0.01 ? 'text-signal-success' : 'text-signal-warning'}>Diferença {money(row.valor_diferenca, currency)}</span></div>{row.link ? <div className="mt-3 flex flex-wrap gap-2"><Link to={`/financeiro?visao=comissoes&comissao=${row.link.comissaoId}`} className="inline-flex items-center gap-1 rounded-[6px] border border-border-1 px-2.5 py-1.5 text-[11px] font-black text-accent-primary"><Link2 size={12} />Comissão</Link><Link to={`/apolices/${row.link.apoliceId}?documento=${row.link.propostaId}`} className="inline-flex items-center gap-1 rounded-[6px] border border-border-1 px-2.5 py-1.5 text-[11px] font-black text-accent-primary"><ExternalLink size={12} />Documento</Link><Link to={`/apolices/${row.link.apoliceId}`} className="inline-flex items-center gap-1 rounded-[6px] border border-border-1 px-2.5 py-1.5 text-[11px] font-black text-accent-primary"><ExternalLink size={12} />Apólice</Link><Link to={`/segurados/${row.link.seguradoId}`} className="inline-flex items-center gap-1 rounded-[6px] border border-border-1 px-2.5 py-1.5 text-[11px] font-black text-accent-primary"><ExternalLink size={12} />Segurado</Link></div> : <p className="mt-3 text-xs text-fg-4">Comissão vinculada fora do escopo acessível.</p>}</article>)}</div>}</div>
      <div><div className="px-5 py-4 lg:px-7"><h2 className="text-base font-black text-fg-1">Ocorrências</h2><p className="mt-1 text-xs text-fg-3">Divergências preservadas com situação, motivo e resolução.</p></div>{ocorrencias.length === 0 ? <p className="px-5 pb-8 text-sm text-fg-3 lg:px-7">Nenhuma ocorrência registrada.</p> : <div className="divide-y divide-border-1">{ocorrencias.map((row) => <article key={row.id} className="px-5 py-4 lg:px-7"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black text-fg-1">{label(row.tipo)}</p><p className="mt-1 font-mono text-[10px] text-fg-3">Item {row.itemReferencia}</p></div><StatusPill value={row.status} success={row.status === 'RESOLVIDA'} warning={['ABERTA', 'EM_ANALISE'].includes(row.status)} /></div><p className="mt-3 text-xs leading-5 text-fg-2">{row.motivo ?? 'Sem motivo informado.'}</p>{row.resolucao_tipo && <p className="mt-2 text-[11px] font-bold text-fg-3">{label(row.resolucao_tipo)} · {row.resolucao_observacao ?? 'sem observação'}</p>}</article>)}</div>}</div>
    </section>

    <footer className="flex flex-wrap items-center justify-between gap-2 bg-bg-surface-2 px-5 py-3 text-xs font-bold text-fg-3 lg:px-7"><span>{itens.length} itens · {conciliacoes.length} conciliações · {ocorrencias.length} ocorrências</span><span>Arquivo original disponível somente como referência neste frontend</span></footer>
  </div>
}
