import { platformDefaults } from '../../types/platformRows'
import { describe, expect, it } from 'vitest'
import type { ApoliceItemRow, ApoliceRow, ItemVeiculoRow } from '../../types/database'
import {
  findCepForCalculation,
  findInsuredForCalculation,
  findSourcePolicyForCalculation,
  findVehicleForCalculation,
  normalizeDigits,
  normalizeVehicleIdentifier,
  type CalculationAssistanceStore,
} from './calculationAssistance'

const policy: ApoliceRow = {
  id: 'policy-1', segurado_id: 'insured-1', seguradora_id: 'insurer-1', ramo_id: 'line-AUTO', status: 'VIGENTE',
  renovada_de_id: null, produtor_id: null, numero_apolice: 'AUTO-123', numero_controle_documento: null,
  tipo_contratacao: null, tipo_apolice: null, certificado_individual: null, processo_susep: null, estipulante_nome: null,
  estipulante_cpf_cnpj: null, subestipulante_nome: null, subestipulante_cpf_cnpj: null, vigencia_inicio: '2025-08-01',
  vigencia_fim: '2026-08-01', vigencia_inicio_hora: null, vigencia_fim_hora: null, data_emissao: null,
  data_recebimento_documento: null, premio_total: null, premio_liquido: null, iof: null, adicional_fracionamento: null,
  lmg_total: null, moeda: null, periodicidade_pagamento: null, motivo_status: null, canal_emissao: null, observacoes: null,
}

const policyItem: ApoliceItemRow = {
  id: 'item-1', apolice_id: 'policy-1', risk_type: 'VEICULO', incluido_por_proposta_id: null,
  excluido_por_proposta_id: null, numero_item: 1, descricao: 'Honda Civic', identificador_externo: null,
  valor_risco: null, endereco_risco_resumo: null, status: 'VIGENTE', observacoes: null,
}

const vehicle: ItemVeiculoRow = {
  apolice_item_id: 'item-1', codigo_fipe: '014070-1', marca: 'Honda', modelo: 'Civic', versao: 'Touring',
  ano_fabricacao: 2023, ano_modelo: 2024, placa: 'BRA2E19', chassi: '9BWZZZ377VT004251', renavam: '12345678901',
  zero_km: false, combustivel: 'FLEX', cambio: 'AUTOMATICO', categoria: 'PASSEIO', uso: 'PARTICULAR',
  cep_pernoite: '01415000', classe_bonus: 4, blindado: false, alienado: true, rastreador: true, antifurto: true,
  kit_gas: false, condutor_principal_nome: 'Cliente Demo', condutor_principal_cpf: '12345678909',
  condutor_principal_data_nascimento: '1990-01-10',
}

const assistanceStore: CalculationAssistanceStore = {
  insureds: [{
    ...platformDefaults.segurados,
    id: 'insured-1', tenant_id: 'tenant-1', filial_id: 'branch-1', nome: 'Cliente Demo', cpf_cnpj: '123.456.789-09',
    tipo: 'PF', status: 'Ativo', produtor_id: null, gerente_id: null, nome_fantasia: null, lgpd_autorizado: true,
    email: null, telefone: null, chatwoot_id: null, cep: null, logradouro: null, endereco: null, numero: null,
    complemento: null, bairro: null, cidade: null, estado: null, data_nascimento: '1990-01-10', sexo: 'F',
    estado_civil: 'Casado', cnae: null, porte: null, site: null, observacoes: null,
    created_at: '2026-07-22T12:00:00Z', updated_at: '2026-07-22T12:00:00Z',
  }],
  insurers: [{
    id: 'insurer-1', tenant_id: 'tenant-1', nome: 'Seguradora Demo', nome_curto: 'Demo', cnpj: null,
    codigo_susep: null, codigo_interno: null, site: null, portal_url: null, telefone_sac: null,
    telefone_assistencia: null, email: null, aceita_importacao_pdf: false, aceita_busca_automatica: false,
    ativo: true, observacoes: null,
  }],
  policies: [policy],
  policyItems: [policyItem],
  vehicles: [vehicle],
}

describe('assistência local do cálculo Auto', () => {
  it('normaliza documentos e identificadores de veículo', () => {
    expect(normalizeDigits('123.456.789-09')).toBe('12345678909')
    expect(normalizeVehicleIdentifier('bra-2e19')).toBe('BRA2E19')
  })

  it('localiza pessoa somente na corretora informada', () => {
    expect(findInsuredForCalculation(assistanceStore, '12345678909', 'branch-1')?.id).toBe('insured-1')
    expect(findInsuredForCalculation(assistanceStore, '12345678909', 'branch-2')).toBeNull()
  })

  it('localiza veículo por placa ou chassi e mantém fallback nulo', () => {
    expect(findVehicleForCalculation(assistanceStore, 'BRA-2E19')).toMatchObject({ marca: 'Honda', modelo: 'Civic' })
    expect(findVehicleForCalculation(assistanceStore, '9bwzzz377vt004251')).toMatchObject({ placa: 'BRA2E19' })
    expect(findVehicleForCalculation(assistanceStore, 'INEXISTENTE')).toBeNull()
  })

  it('usa fixture estável de CEP sem rede', () => {
    expect(findCepForCalculation('01415-000')).toMatchObject({ cidade: 'São Paulo', uf: 'SP' })
    expect(findCepForCalculation('99999-999')).toBeNull()
  })

  it('deriva a renovação própria da apólice e do veículo vigentes', () => {
    expect(findSourcePolicyForCalculation(assistanceStore, 'policy-1')).toMatchObject({
      segurado_id: 'insured-1', seguradora_nome: 'Seguradora Demo', numero_apolice: 'AUTO-123',
      vigencia_fim: '2026-08-01', bonus: 4, vehicle: { placa: 'BRA2E19', codigo_fipe: '014070-1' },
    })
  })
})
