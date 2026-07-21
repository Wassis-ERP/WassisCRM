import type { FinanceiroRepasse, RepasseReciboDetalhe } from './repasseDomain'

export interface ExportDocument {
  fileName: string
  blob: Blob
}

const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
const date = (value: string | null) => value ? new Intl.DateTimeFormat('pt-BR').format(new Date(`${value}T12:00:00`)) : '—'

function latin1(value: string): Uint8Array {
  const normalized = value
    .replaceAll('–', '-').replaceAll('—', '-').replaceAll('“', '"').replaceAll('”', '"')
    .replaceAll('’', "'").replaceAll('•', '-')
  const bytes = new Uint8Array(normalized.length)
  for (let index = 0; index < normalized.length; index += 1) {
    const code = normalized.charCodeAt(index)
    bytes[index] = code <= 255 ? code : 63
  }
  return bytes
}

function pdfEscape(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)')
}

function pdfLines(title: string, lines: readonly string[]): Blob {
  const pageLines = 43
  const pages = Array.from({ length: Math.max(1, Math.ceil(lines.length / pageLines)) }, (_, index) => lines.slice(index * pageLines, (index + 1) * pageLines))
  const objects: string[] = []
  const pageIds = pages.map((_, index) => 4 + index * 2)
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>'
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'
  pages.forEach((page, index) => {
    const pageId = pageIds[index]
    const contentId = pageId + 1
    const commands = [
      'BT', '/F1 14 Tf', '48 800 Td', `(${pdfEscape(title)}) Tj`,
      '/F1 8 Tf', '0 -24 Td',
      ...page.flatMap((line) => [`(${pdfEscape(line.slice(0, 118))}) Tj`, '0 -16 Td']),
      'ET',
    ].join('\n')
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`
    objects[contentId] = `<< /Length ${latin1(commands).length} >>\nstream\n${commands}\nendstream`
  })

  let content = '%PDF-1.4\n%WASSIS\n'
  const offsets = new Array(objects.length).fill(0)
  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = latin1(content).length
    content += `${id} 0 obj\n${objects[id]}\nendobj\n`
  }
  const xrefOffset = latin1(content).length
  content += `xref\n0 ${objects.length}\n0000000000 65535 f \n`
  for (let id = 1; id < objects.length; id += 1) content += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`
  content += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  const bytes = latin1(content)
  return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
}

function xmlEscape(value: string | number): string {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;')
}

function spreadsheet(headers: readonly string[], rows: readonly (readonly (string | number)[])[]): Blob {
  const cells = (values: readonly (string | number)[]) => values.map((value) => {
    const type = typeof value === 'number' ? 'Number' : 'String'
    return `<Cell><Data ss:Type="${type}">${xmlEscape(value)}</Data></Cell>`
  }).join('')
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles><Style ss:ID="Header"><Font ss:Bold="1"/><Interior ss:Color="#DCEBFF" ss:Pattern="Solid"/></Style></Styles>
<Worksheet ss:Name="Repasses"><Table>
<Row ss:StyleID="Header">${cells(headers)}</Row>
${rows.map((row) => `<Row>${cells(row)}</Row>`).join('\n')}
</Table></Worksheet></Workbook>`
  return new Blob([new TextEncoder().encode(xml)], { type: 'application/vnd.ms-excel' })
}

function safeName(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-|-$/g, '').toLowerCase()
}

export function createRepasseReportPdf(rows: readonly FinanceiroRepasse[]): ExportDocument {
  const generatedAt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date())
  const lines = [
    `Gerado em ${generatedAt} | ${rows.length} repasse(s) | Total previsto ${money(rows.reduce((total, row) => total + (row.valor_previsto ?? 0), 0))}`,
    '',
    ...rows.map((row) => [row.beneficiarioNome, row.documentoReferencia, row.seguradoNome, row.status ?? '—', money(row.valor_previsto ?? 0)].join(' | ')),
  ]
  return { fileName: `relatorio-repasses-${new Date().toISOString().slice(0, 10)}.pdf`, blob: pdfLines('W.Assis - Relatório de repasses (somente leitura)', lines) }
}

export function createRepasseReportExcel(rows: readonly FinanceiroRepasse[]): ExportDocument {
  const headers = ['Corretora', 'Beneficiário', 'Papel', 'Segurado', 'Documento', 'Seguradora', 'Ramo', 'Repasse', 'Origem', 'Previsto em', 'Liberado em', 'Pago em', 'Valor previsto', 'Valor pago', 'Diferença', 'Status', 'Recibo']
  const data = rows.map((row) => [
    row.filialNome, row.beneficiarioNome, row.papel_beneficiario ?? '', row.seguradoNome,
    row.documentoReferencia, row.seguradoraNome, row.ramoNome, row.numero ?? '', row.origem,
    row.previsto_em ?? '', row.liberado_em ?? '', row.pago_em ?? '', row.valor_previsto ?? 0,
    row.valor_pago ?? 0, row.valor_diferenca ?? 0, row.status ?? '', row.ultimoRecibo?.numero ?? '',
  ])
  return { fileName: `relatorio-repasses-${new Date().toISOString().slice(0, 10)}.xls`, blob: spreadsheet(headers, data) }
}

function receiptLines(detail: RepasseReciboDetalhe): string[] {
  const { recibo, itens } = detail
  return [
    `Recibo: ${recibo.numero} | Status: ${recibo.status} | Sentido: ${recibo.sentido}`,
    `Corretora: ${recibo.filial_nome_snapshot} | Beneficiário: ${recibo.beneficiario_nome_snapshot}`,
    `Pagamento: ${date(recibo.data_pagamento)} | Forma: ${recibo.forma_pagamento.replaceAll('_', ' ')}`,
    `Referência: ${recibo.comprovante_referencia ?? '—'} | Total: ${money(detail.total)}`,
    recibo.observacoes ? `Observações: ${recibo.observacoes}` : '',
    recibo.status === 'CANCELADO' ? `Cancelado: ${recibo.motivo_cancelamento ?? '—'}` : '',
    '',
    ...itens.map((item) => [
      `#${item.numero_repasse_snapshot ?? '—'}`, item.documento_referencia_snapshot,
      item.segurado_nome_snapshot, item.seguradora_nome_snapshot, item.ramo_nome_snapshot,
      money(item.valor_pago_snapshot),
    ].join(' | ')),
  ].filter(Boolean)
}

export function createReceiptPdf(detail: RepasseReciboDetalhe): ExportDocument {
  return { fileName: `${safeName(detail.recibo.numero)}.pdf`, blob: pdfLines(`W.Assis - ${detail.recibo.sentido === 'CREDITO' ? 'Recibo de repasse' : 'Demonstrativo de débito'}`, receiptLines(detail)) }
}

export function createReceiptExcel(detail: RepasseReciboDetalhe): ExportDocument {
  const headers = ['Recibo', 'Status', 'Corretora', 'Beneficiário', 'Sentido', 'Data', 'Forma', 'Repasse', 'Documento', 'Segurado', 'Seguradora', 'Ramo', 'Papel', 'Valor previsto', 'Valor pago']
  const rows = detail.itens.map((item) => [
    detail.recibo.numero, detail.recibo.status, detail.recibo.filial_nome_snapshot,
    detail.recibo.beneficiario_nome_snapshot, detail.recibo.sentido, detail.recibo.data_pagamento,
    detail.recibo.forma_pagamento, item.numero_repasse_snapshot ?? '', item.documento_referencia_snapshot,
    item.segurado_nome_snapshot, item.seguradora_nome_snapshot, item.ramo_nome_snapshot,
    item.papel_beneficiario_snapshot ?? '', item.valor_previsto_snapshot, item.valor_pago_snapshot,
  ])
  return { fileName: `${safeName(detail.recibo.numero)}.xls`, blob: spreadsheet(headers, rows) }
}

export function downloadExport(document: ExportDocument): void {
  const url = URL.createObjectURL(document.blob)
  const anchor = window.document.createElement('a')
  anchor.href = url
  anchor.download = document.fileName
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
