import { describe, expect, it } from 'vitest'
import {
  formatCep,
  formatCurrency,
  formatPlate,
  formatVehicleIdentifier,
  normalizeVehicleIdentifier,
  parseCurrencyInput,
} from './masks'

describe('máscaras brasileiras', () => {
  it('formata CEP sem alterar a representação normalizada', () => {
    expect(formatCep('01415000')).toBe('01415-000')
  })

  it('formata placas antigas e Mercosul', () => {
    expect(formatPlate('FVR5I05')).toBe('FVR-5I05')
    expect(formatPlate('ABC1234')).toBe('ABC-1234')
    expect(normalizeVehicleIdentifier('fvr-5i05')).toBe('FVR5I05')
  })

  it('mantém chassi sem hífen de placa', () => {
    expect(formatVehicleIdentifier('93HGN2840RZ100321')).toBe('93HGN2840RZ100321')
  })

  it('formata e interpreta moeda em reais', () => {
    expect(formatCurrency(150000)).toBe('R$ 150.000,00')
    expect(parseCurrencyInput('R$ 150.000,00')).toBe(150000)
    expect(parseCurrencyInput('')).toBeNull()
  })
})
