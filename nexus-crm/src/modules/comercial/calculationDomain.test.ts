import { platformDefaults } from '../../types/platformRows'
import { describe, expect, it } from 'vitest'
import type { ApoliceRow, CalculoForma, Database } from '../../types/database'
import { createEmptySpecialization } from './calculationForm'
import {
  addCalendarYear,
  buildCalculationVersionLabel,
  createCalculationAtomic,
  duplicateCalculationInput,
  getCalculationAggregate,
  listCalculationItems,
  type CalculationCreateInput,
  type CalculationStore,
} from './calculationDomain'

type OpportunityRow = Database['public']['Tables']['oportunidades']['Row']
type RamoRow = Database['public']['Tables']['ramos']['Row']
type SeguradoRow = Database['public']['Tables']['segurados']['Row']
type SeguradoraRow = Database['public']['Tables']['seguradoras']['Row']
type CoverageRow = Database['public']['Tables']['coberturas_catalogo']['Row']

const forms: CalculoForma[] = ['AUTO', 'RESIDENCIA', 'CONDOMINIO', 'VIDA', 'EMPRESA', 'DIVERSOS']

function opportunity(ramoId: string | null = 'line-AUTO', sourcePolicyId: string | null = null): OpportunityRow {
  return {
    id: 'opportunity-1', tenant_id: 'tenant-1', filial_id: 'branch-1', segurado_id: 'insured-1', ramo_id: ramoId,
    origem_id: null, apolice_origem_id: sourcePolicyId, responsavel_id: 'user-1', stage_id: 'stage-1', motivo_perda_id: null,
    lead_nome: null, lead_documento: null, lead_email: null, lead_telefone: null, titulo: 'Seguro teste', descricao: null,
    prioridade: null, valor_premio_estimado: null, valor_comissao_estimada: null, comissao_estimada_pct: null,
    agenciamento_pct: null, data_abertura: '2026-07-21', data_fechamento_prevista: null, ganha_em: null, perdida_em: null,
    motivo_perda_observacao: null, campanha: null, observacoes: null,
  }
}

function line(forma: CalculoForma): RamoRow {
  return {
    id: `line-${forma}`, tenant_id: 'tenant-1', nome: forma, codigo_susep: null, risk_type: forma,
    grupo_operacional: 'Teste', forma_calculo: forma, is_monthly: false, renovavel: true, permite_endosso: true,
    exige_item: true, exige_coberturas: false, ordem: 10, ativo: true, observacoes: null,
  }
}

function insured(id: string, branchId = 'branch-1'): SeguradoRow {
  return {
    ...platformDefaults.segurados,
    id, tenant_id: 'tenant-1', filial_id: branchId, nome: id, cpf_cnpj: null, tipo: 'PF', status: 'Prospecto',
    produtor_id: null, gerente_id: null, nome_fantasia: null, lgpd_autorizado: false, email: null, telefone: null,
    chatwoot_id: null, cep: null, logradouro: null, endereco: null, numero: null, complemento: null, bairro: null,
    cidade: null, estado: null, data_nascimento: null, sexo: null, estado_civil: null, cnae: null, porte: null,
    site: null, observacoes: null, created_at: '2026-07-21T12:00:00Z', updated_at: '2026-07-21T12:00:00Z',
  }
}

function insurer(): SeguradoraRow {
  return {
    id: 'insurer-1', tenant_id: 'tenant-1', nome: 'Seguradora', nome_curto: null, cnpj: null, codigo_susep: null,
    codigo_interno: null, site: null, portal_url: null, telefone_sac: null, telefone_assistencia: null, email: null,
    aceita_importacao_pdf: false, aceita_busca_automatica: false, ativo: true, observacoes: null,
  }
}

function policy(): ApoliceRow {
  return {
    id: 'policy-1', segurado_id: 'insured-1', seguradora_id: 'insurer-1', ramo_id: 'line-AUTO', status: 'VIGENTE',
    renovada_de_id: null, produtor_id: null, numero_apolice: 'AUTO-123', numero_controle_documento: null,
    tipo_contratacao: null, tipo_apolice: null, certificado_individual: null, processo_susep: null, estipulante_nome: null,
    estipulante_cpf_cnpj: null, subestipulante_nome: null, subestipulante_cpf_cnpj: null, vigencia_inicio: '2025-08-01',
    vigencia_fim: '2026-08-01', vigencia_inicio_hora: null, vigencia_fim_hora: null, data_emissao: null,
    data_recebimento_documento: null, premio_total: null, premio_liquido: null, iof: null, adicional_fracionamento: null,
    lmg_total: null, moeda: null, periodicidade_pagamento: null, motivo_status: null, canal_emissao: null, observacoes: null,
  }
}

function coverage(forma: CalculoForma): CoverageRow {
  return {
    id: `coverage-${forma}`, ramo_id: `line-${forma}`, codigo: `coverage-${forma}`, codigo_susep: null,
    nome: `Cobertura ${forma}`, descricao: null, tipo_cobertura: 'basica', caracteristica: null, tipo_risco: null,
    modalidade: null, capital_lmi_padrao: null, franquia_padrao: null, carencia_dias: null, obrigatoria: false,
    ordem: 10, ativo: true,
  }
}

function store(forma: CalculoForma = 'AUTO'): CalculationStore {
  return {
    opportunities: [opportunity(`line-${forma}`)], branches: [{ id: 'branch-1', tenant_id: 'tenant-1' }],
    lines: forms.map(line), insureds: [insured('insured-1'), insured('insured-2')], insurers: [insurer()], policies: [policy()],
    coverageCatalog: forms.map(coverage), calculations: [], autos: [], residences: [], condominiums: [], lives: [],
    companies: [], diverse: [], coverages: [],
  }
}

function input(forma: CalculoForma, insuredId: string | null = 'insured-1'): CalculationCreateInput {
  return {
    oportunidade_id: 'opportunity-1', ramo_id: `line-${forma}`, segurado_id: insuredId, seguradora_anterior_id: null,
    origem: 'MANUAL', comissao_sugerida_pct: 12.5, rotulo_versao: null, tipo_seguro: 'NOVO', bonus: null,
    qtd_sinistros: null, qtd_sinistros_perda_parcial: null, transferiu_titularidade: null,
    vigencia_inicio: '2026-08-01', vigencia_fim: '2027-08-01', vigencia_fim_anterior: null,
    numero_apolice_anterior: null, codigo_identificacao_anterior: null, status_apolice_anterior: null, nota_interna: null,
    specialization: createEmptySpecialization(forma),
    coverages: [{
      cobertura_id: `coverage-${forma}`, selecionada: true, limite_solicitado: 100000,
      percentual_fipe_solicitado: null, franquia_tipo_solicitado: 'REDUZIDA', opcao_solicitada: null,
      quantidade_solicitada: null, observacao_transmitida: 'Preferência do pedido',
    }],
  }
}

function ownRenewalInput(): CalculationCreateInput {
  return {
    ...input('AUTO'),
    origem: 'ASSISTIDA',
    tipo_seguro: 'RENOVACAO_PROPRIA',
    seguradora_anterior_id: 'insurer-1',
    bonus: 4,
    vigencia_inicio: '2026-08-01',
    vigencia_fim: '2027-08-01',
    vigencia_fim_anterior: '2026-08-01',
    numero_apolice_anterior: 'AUTO-123',
    status_apolice_anterior: 'VIGENTE',
  }
}

function dependencies() {
  let sequence = 0
  return { now: () => '2026-07-21T12:00:00.000Z', newId: () => `new-${++sequence}` }
}

describe('domínio de cálculos v3.0', () => {
  it.each(forms)('cria %s com uma especialização e apenas preferências de cobertura', (forma) => {
    const currentStore = store(forma)
    const aggregate = createCalculationAtomic(currentStore, input(forma), dependencies())
    expect(aggregate.calculation).toMatchObject({ origem: 'MANUAL', tipo_seguro: 'NOVO' })
    expect(aggregate.calculation.rotulo_versao).toContain('Novo · 01/08/2026')
    expect(aggregate.calculation).not.toHaveProperty('aggilizador_id')
    expect(aggregate.calculation).not.toHaveProperty('cotacao_encaminhada_em')
    expect(aggregate.specialization.forma).toBe(forma)
    expect(aggregate.coverages[0]).toMatchObject({ limite_solicitado: 100000, observacao_transmitida: 'Preferência do pedido' })
    expect(aggregate.coverages[0]).not.toHaveProperty('premio')
    expect(currentStore.autos.length + currentStore.residences.length + currentStore.condominiums.length + currentStore.lives.length + currentStore.companies.length + currentStore.diverse.length).toBe(1)
    expect(aggregate).not.toHaveProperty('cotacoes')
  })

  it('deriva um ano-calendário, inclusive para 29 de fevereiro, e gera o rótulo Auto', () => {
    expect(addCalendarYear('2024-02-29')).toBe('2025-02-28')
    const autoInput = input('AUTO')
    const autoSpecialization = createEmptySpecialization('AUTO')
    if (autoSpecialization.forma !== 'AUTO') throw new Error('Fixture Auto inválida.')
    autoInput.specialization = { forma: 'AUTO', data: { ...autoSpecialization.data, placa: 'BRA2E19' } }
    expect(buildCalculationVersionLabel(autoInput)).toBe('Auto · BRA-2E19 · Novo · 01/08/2026')
  })

  it('aceita cliente da oportunidade, outro cotado e lead ainda não qualificado', () => {
    expect(createCalculationAtomic(store('AUTO'), input('AUTO', 'insured-1'), dependencies()).calculation.segurado_id).toBe('insured-1')
    expect(createCalculationAtomic(store('AUTO'), input('AUTO', 'insured-2'), dependencies()).calculation.segurado_id).toBe('insured-2')
    expect(createCalculationAtomic(store('AUTO'), input('AUTO', null), dependencies()).calculation.segurado_id).toBeNull()
  })

  it('aplica os condicionais de novo, renovação própria e renovação externa', () => {
    expect(() => createCalculationAtomic(store('AUTO'), { ...input('AUTO'), bonus: 1 }, dependencies())).toThrow('Novo seguro')

    const ownStore = store('AUTO')
    ownStore.opportunities[0] = opportunity('line-AUTO', 'policy-1')
    const own = createCalculationAtomic(ownStore, ownRenewalInput(), dependencies())
    expect(own.calculation).toMatchObject({ tipo_seguro: 'RENOVACAO_PROPRIA', numero_apolice_anterior: 'AUTO-123' })

    const externalMissing = { ...input('AUTO'), tipo_seguro: 'RENOVACAO_OUTRA' as const, bonus: 0 }
    expect(() => createCalculationAtomic(store('AUTO'), externalMissing, dependencies())).toThrow('Informe seguradora')

    const external = {
      ...externalMissing,
      seguradora_anterior_id: 'insurer-1',
      numero_apolice_anterior: 'EXT-456',
      vigencia_fim_anterior: '2026-08-01',
    }
    expect(createCalculationAtomic(store('AUTO'), external, dependencies()).calculation.tipo_seguro).toBe('RENOVACAO_OUTRA')
  })

  it('bloqueia oportunidade sem ramo e especialização desconhecida ou incompatível', () => {
    const withoutLine = store('AUTO')
    withoutLine.opportunities[0] = opportunity(null)
    expect(() => createCalculationAtomic(withoutLine, input('AUTO'), dependencies())).toThrow('Defina o ramo')

    const incompatible = store('AUTO')
    const wrongInput = { ...input('AUTO'), specialization: createEmptySpecialization('VIDA') }
    expect(() => createCalculationAtomic(incompatible, wrongInput, dependencies())).toThrow('especialização não corresponde')

    const unknown = store('AUTO')
    unknown.lines[0] = { ...unknown.lines[0], forma_calculo: 'OUTRA' }
    expect(() => createCalculationAtomic(unknown, input('AUTO'), dependencies())).toThrow('forma de cálculo suportada')
  })

  it('valida datas, números, ownership e coberturas do ramo sem duplicidade', () => {
    expect(() => createCalculationAtomic(store('AUTO'), { ...input('AUTO'), vigencia_fim: '2026-01-01' }, dependencies())).toThrow('fim da vigência')
    expect(() => createCalculationAtomic(store('AUTO'), { ...input('AUTO'), comissao_sugerida_pct: Number.NaN }, dependencies())).toThrow('Comissão sugerida')
    expect(() => createCalculationAtomic(store('AUTO'), { ...input('AUTO'), bonus: 11, tipo_seguro: 'RENOVACAO_OUTRA' }, dependencies())).toThrow('classe de bônus')
    const wrongInsured = store('AUTO')
    wrongInsured.insureds.push(insured('outside', 'branch-2'))
    expect(() => createCalculationAtomic(wrongInsured, input('AUTO', 'outside'), dependencies())).toThrow('mesma corretora')
    const duplicatedCoverage = input('AUTO').coverages[0]
    expect(() => createCalculationAtomic(store('AUTO'), { ...input('AUTO'), coverages: [duplicatedCoverage, { ...duplicatedCoverage }] }, dependencies())).toThrow('mesma cobertura')
    expect(() => createCalculationAtomic(store('AUTO'), { ...input('AUTO'), coverages: [{ ...duplicatedCoverage, cobertura_id: 'coverage-VIDA' }] }, dependencies())).toThrow('incompatível com o ramo')
  })

  it('restaura o agregado quando uma etapa de persistência falha', () => {
    const currentStore = store('AUTO')
    currentStore.coverages.push = () => { throw new Error('falha simulada') }
    expect(() => createCalculationAtomic(currentStore, input('AUTO'), dependencies())).toThrow('falha simulada')
    expect(currentStore.calculations).toHaveLength(0)
    expect(currentStore.autos).toHaveLength(0)
    expect(currentStore.coverages).toHaveLength(0)
  })

  it('duplica como agregado independente e lista as versões mais recentes primeiro', () => {
    const currentStore = store('AUTO')
    const ids = dependencies()
    const first = createCalculationAtomic(currentStore, input('AUTO'), ids)
    const duplicateInput = duplicateCalculationInput(first)
    const second = createCalculationAtomic(currentStore, duplicateInput, ids)
    expect(second.calculation.id).not.toBe(first.calculation.id)
    expect(second.specialization.data.calculo_id).not.toBe(first.specialization.data.calculo_id)
    expect(second.coverages[0].id).not.toBe(first.coverages[0].id)
    expect(getCalculationAggregate(currentStore, first.calculation.id).coverages[0].id).toBe(first.coverages[0].id)
    expect(listCalculationItems(currentStore, 'opportunity-1')).toHaveLength(2)
  })
})
