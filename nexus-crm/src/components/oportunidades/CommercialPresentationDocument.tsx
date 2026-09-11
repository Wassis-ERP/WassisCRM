import { createPortal } from 'react-dom'
import { Check, Minus } from 'lucide-react'
import logo from '../../assets/brand/wassis-logo-full_sidebar_clean.png'
import { presentationCoverage, presentationDate, presentationMoney, presentationPayment } from '../../modules/comercial/commercialPresentationFormat'
import type { CommercialPresentationCandidate, CommercialPresentationItemInput, CommercialPresentationComparisonRow } from '../../modules/comercial/commercialPresentationDomain'
import type { ApresentacaoLayout } from '../../types/database'
import './commercialPresentationDocument.css'

type ItemView = { item: CommercialPresentationItemInput; candidate: CommercialPresentationCandidate }
type Settings = {
  title: string; layout: ApresentacaoLayout; selectedQuoteId: string | null
  showFipe: boolean; showCommission: boolean; showAdvantages: boolean
  showNotes: boolean; showLegend: boolean; commercialNotes: string
}

export default function CommercialPresentationDocument({ title, insuredName, draft, selectedViews, comparison, generatedAt }: {
  title: string | null; insuredName: string; draft: Settings
  selectedViews: ItemView[]; comparison: CommercialPresentationComparisonRow[]; generatedAt: string | null
}) {
  const document = (
    <article className={`commercial-presentation-print ${draft.layout === 'HORIZONTAL' ? 'presentation-horizontal' : 'presentation-vertical'}`}>
      <header className="presentation-header">
        <div>
          <img src={logo} alt="W.Assis Corretora de Seguros" className="presentation-logo" />
          <h1>{draft.title || 'Comparativo comercial'}</h1>
          <p>{title}</p>
          <p><strong>Preparado para:</strong> {insuredName}</p>
        </div>
        <div className="presentation-meta">
          <strong>{selectedViews.length} opções de seguro</strong>
          <p>{generatedAt ? `Gerado em ${new Date(generatedAt).toLocaleString('pt-BR')}` : 'Prévia para conferência'}</p>
          <p>Simulação com dados demonstrativos</p>
        </div>
      </header>

      <section className="presentation-summary" aria-label="Resumo das opções">
        <h2>Compare as opções</h2>
        <table>
          <thead><tr><th>Opção e seguradora</th><th>Prêmio total</th><th>Pagamento escolhido</th><th>Validade da cotação</th></tr></thead>
          <tbody>{selectedViews.map(({ item, candidate }, index) => (
            <tr key={candidate.quote.id}>
              <th scope="row">{index + 1}. {candidate.insurerShortName}{item.recommended && <span className="presentation-recommendation">Recomendado</span>}{draft.selectedQuoteId === candidate.quote.id && <span className="presentation-choice">Escolha do cliente</span>}</th>
              <td className="presentation-money">{presentationMoney(candidate.quote.premio_total)}</td>
              <td>{presentationPayment(candidate.installments.find((row) => row.id === item.installmentId) ?? candidate.primaryInstallment)}</td>
              <td>{presentationDate(candidate.quote.validade)}</td>
            </tr>
          ))}</tbody>
        </table>
      </section>

      <div className="presentation-products">
        {selectedViews.map((view, index) => <Product key={view.candidate.quote.id} {...view} index={index} settings={draft} />)}
      </div>

      {draft.showLegend && comparison.some((row) => row.differs) && (
        <section className="presentation-differences">
          <h2>Diferenças entre as coberturas</h2>
          {comparison.filter((row) => row.differs).map((row) => (
            <div key={row.key} className="presentation-difference">
              <h3>{row.name}</h3>
              {row.cells.map(({ candidate, coverage }, index) => <p key={candidate.quote.id}><strong>{index + 1}. {candidate.insurerShortName}:</strong> {coverage ? presentationCoverage(coverage, draft.showFipe) : 'Não oferecida'}</p>)}
            </div>
          ))}
        </section>
      )}
      {draft.showNotes && draft.commercialNotes && <section className="presentation-notes"><h2>Observações comerciais</h2><p>{draft.commercialNotes}</p></section>}
      <footer className="presentation-footer">
        <p>Valores sujeitos à validade, análise e condições oficiais de cada seguradora. Confira coberturas, franquias e condições antes de escolher.</p>
        <p>Simulação demonstrativa. Não constitui proposta emitida nem confirmação de cobertura.</p>
      </footer>
    </article>
  )
  return <>{document}{createPortal(<div className="commercial-print-root">{document}</div>, window.document.body)}</>
}

function Product({ item, candidate, index, settings }: ItemView & { index: number; settings: Settings }) {
  const selected = settings.selectedQuoteId === candidate.quote.id
  return (
    <section className={`presentation-product ${selected ? 'is-selected' : item.recommended ? 'is-recommended' : ''}`}>
      <header>
        <p className="presentation-option">Opção {index + 1}</p>
        <h2>{item.commercialTitle || candidate.insurerName}</h2>
        {item.commercialTitle && <p>{candidate.insurerName}</p>}
        <p>{candidate.profileLabel}</p>
        {item.recommended && <span className="presentation-recommendation">Recomendado</span>}
        {selected && <span className="presentation-choice">Escolha do cliente</span>}
      </header>
      <div className="presentation-price"><span>Prêmio total</span><strong>{presentationMoney(candidate.quote.premio_total)}</strong></div>
      <dl>
        <div><dt>Vigência</dt><dd>{presentationDate(candidate.calculation.vigencia_inicio)} a {presentationDate(candidate.calculation.vigencia_fim)}</dd></div>
        <div><dt>Cotação</dt><dd>{candidate.quote.numero_cotacao_seguradora ?? 'Número não informado'}</dd></div>
        <div><dt>Válida até</dt><dd>{presentationDate(candidate.quote.validade)}</dd></div>
        <div><dt>Franquia principal</dt><dd>{presentationMoney(candidate.franchiseValue)}</dd></div>
        {settings.showCommission && <div><dt>Comissão</dt><dd>{candidate.execution.comissao_pct_aplicada === null ? 'Percentual não informado' : `${candidate.execution.comissao_pct_aplicada}%`} · {presentationMoney(candidate.quote.comissao_valor)}</dd></div>}
      </dl>
      <h3>Coberturas e condições</h3>
      {candidate.coverages.length === 0 ? <p>Coberturas não informadas.</p> : <ul>{candidate.coverages.map((coverage) => (
        <li key={coverage.id}>
          {coverage.incluida === false ? <Minus size={13} /> : <Check size={13} />}
          <span><strong>{coverage.name}</strong><br />{presentationCoverage(coverage, settings.showFipe)}</span>
        </li>
      ))}</ul>}
      {candidate.quote.restricoes && <div className="presentation-conditions"><h3>Restrições da seguradora</h3><p>{candidate.quote.restricoes}</p></div>}
      {candidate.quote.mensagem_seguradora && <p className="presentation-conditions">{candidate.quote.mensagem_seguradora}</p>}
      {settings.showAdvantages && item.advantagesText && <div className="presentation-advantages"><h3>Vantagens</h3><p>{item.advantagesText}</p></div>}
      {settings.showNotes && item.commercialNote && <p className="presentation-notes">{item.commercialNote}</p>}
    </section>
  )
}
