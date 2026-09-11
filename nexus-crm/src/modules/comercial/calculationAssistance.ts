import type {
  ApoliceItemRow,
  ApoliceRow,
  CalcAutoRow,
  Database,
  ItemVeiculoRow,
} from '../../types/database'

type SeguradoRow = Database['public']['Tables']['segurados']['Row']
type SeguradoraRow = Database['public']['Tables']['seguradoras']['Row']

export type AutoVehicleAssistance = Partial<Omit<CalcAutoRow, 'calculo_id'>>

export type CepAssistance = {
  cep: string
  logradouro: string
  bairro: string
  cidade: string
  uf: string
}

export type SourcePolicyAssistance = {
  id: string
  segurado_id: string
  seguradora_id: string | null
  seguradora_nome: string | null
  numero_apolice: string | null
  vigencia_fim: string | null
  status: string | null
  bonus: number | null
  vehicle: AutoVehicleAssistance | null
}

export type CalculationAssistanceStore = {
  insureds: SeguradoRow[]
  insurers: SeguradoraRow[]
  policies: ApoliceRow[]
  policyItems: ApoliceItemRow[]
  vehicles: ItemVeiculoRow[]
}

export const CEP_ASSISTANCE_FIXTURES: readonly CepAssistance[] = [
  { cep: '01415000', logradouro: 'Rua das Acácias', bairro: 'Jardim Paulista', cidade: 'São Paulo', uf: 'SP' },
  { cep: '01310100', logradouro: 'Avenida Paulista', bairro: 'Bela Vista', cidade: 'São Paulo', uf: 'SP' },
  { cep: '01001000', logradouro: 'Praça da Sé', bairro: 'Sé', cidade: 'São Paulo', uf: 'SP' },
]

export function normalizeDigits(value: string): string {
  return value.replace(/\D/g, '')
}

export function normalizeVehicleIdentifier(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
}

export function findInsuredForCalculation(
  store: Pick<CalculationAssistanceStore, 'insureds'>,
  document: string,
  branchId: string,
): SeguradoRow | null {
  const normalized = normalizeDigits(document)
  if (!normalized) return null
  return store.insureds.find((row) => row.filial_id === branchId && normalizeDigits(row.cpf_cnpj ?? '') === normalized) ?? null
}

function vehicleToCalculation(row: ItemVeiculoRow): AutoVehicleAssistance {
  return {
    codigo_fipe: row.codigo_fipe,
    marca: row.marca,
    modelo: row.modelo,
    versao: row.versao,
    ano_fabricacao: row.ano_fabricacao,
    ano_modelo: row.ano_modelo,
    placa: row.placa,
    chassi: row.chassi,
    renavam: row.renavam,
    zero_km: row.zero_km,
    combustivel: row.combustivel,
    cambio: row.cambio,
    categoria: row.categoria,
    uso: row.uso,
    cep_pernoite: row.cep_pernoite,
    blindado: row.blindado,
    alienado: row.alienado,
    rastreador: row.rastreador,
    antifurto: row.antifurto,
    kit_gas: row.kit_gas,
  }
}

export function findVehicleForCalculation(
  store: Pick<CalculationAssistanceStore, 'vehicles'>,
  identifier: string,
): AutoVehicleAssistance | null {
  const normalized = normalizeVehicleIdentifier(identifier)
  if (!normalized) return null
  const vehicle = store.vehicles.find((row) => (
    normalizeVehicleIdentifier(row.placa ?? '') === normalized
    || normalizeVehicleIdentifier(row.chassi ?? '') === normalized
  ))
  return vehicle ? vehicleToCalculation(vehicle) : null
}

export function findCepForCalculation(cep: string): CepAssistance | null {
  const normalized = normalizeDigits(cep)
  return CEP_ASSISTANCE_FIXTURES.find((fixture) => fixture.cep === normalized) ?? null
}

export function findSourcePolicyForCalculation(
  store: CalculationAssistanceStore,
  policyId: string,
): SourcePolicyAssistance | null {
  const policy = store.policies.find((row) => row.id === policyId)
  if (!policy) return null
  const insurer = policy.seguradora_id
    ? store.insurers.find((row) => row.id === policy.seguradora_id)
    : null
  const currentVehicleItem = store.policyItems.find((row) => (
    row.apolice_id === policy.id
    && row.risk_type === 'VEICULO'
    && row.excluido_por_proposta_id === null
  ))
  const vehicle = currentVehicleItem
    ? store.vehicles.find((row) => row.apolice_item_id === currentVehicleItem.id)
    : null
  return {
    id: policy.id,
    segurado_id: policy.segurado_id,
    seguradora_id: policy.seguradora_id,
    seguradora_nome: insurer?.nome ?? null,
    numero_apolice: policy.numero_apolice,
    vigencia_fim: policy.vigencia_fim,
    status: policy.status,
    bonus: vehicle?.classe_bonus ?? null,
    vehicle: vehicle ? vehicleToCalculation(vehicle) : null,
  }
}
