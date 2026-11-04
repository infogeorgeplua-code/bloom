import { describe, expect, it } from 'vitest'
import { EMPTY_FORM, fromRecord, parseNumber, todayISO, validateCoffeeForm } from '@/features/coffees/coffee-form'

const TODAY = '2026-11-04'

describe('parseNumber', () => {
  it.each([
    ['', null],
    ['  ', null],
    ['250', 250],
    ['1850 m', 1850],
    ['1.850', 1850],
    ['1,850', 1850],
    ['12,5', 12.5],
    ['250g', 250],
    ['abc', Number.NaN],
  ])('"%s" → %s', (s, n) => {
    expect(parseNumber(s)).toEqual(n)
  })
})

describe('validateCoffeeForm', () => {
  it('solo el nombre es obligatorio; vacío = null', () => {
    const r = validateCoffeeForm({ ...EMPTY_FORM, name: '  El Paraíso Sidra ' }, TODAY)
    expect(r).toEqual({
      ok: true,
      bagG: null,
      coffee: {
        name: 'El Paraíso Sidra', roaster: null, originCountry: null, variety: null,
        process: null, roastLevel: null, roastDateISO: null, altitudeM: null,
      },
    })
  })

  it('sin nombre: error claro', () => {
    const r = validateCoffeeForm(EMPTY_FORM, TODAY)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.name).toBe('Ponle un nombre para reconocerlo')
  })

  it('datos completos', () => {
    const r = validateCoffeeForm(
      { name: 'Yirgacheffe', roaster: 'Café X', originCountry: 'Etiopía', variety: 'Heirloom', altitudeM: '1.950',
        process: 'lavado', roastLevel: 'claro', roastDateISO: '2026-10-25', bagG: '340' },
      TODAY,
    )
    expect(r.ok && r.coffee.altitudeM).toBe(1950)
    expect(r.ok && r.bagG).toBe(340)
  })

  it.each([
    ['altitudeM', '9000'],
    ['altitudeM', 'alto'],
    ['bagG', '0'],
    ['bagG', '12,5'],
    ['roastDateISO', '2026-11-05'],
  ] as const)('%s = "%s" no pasa', (field, value) => {
    const r = validateCoffeeForm({ ...EMPTY_FORM, name: 'A', [field]: value }, TODAY)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors[field]).toBeTruthy()
  })

  it('fromRecord vuelve al formulario sin inventar valores', () => {
    const v = fromRecord({
      id: 'c', createdAtEpochMs: 1, archived: false, name: 'A', roaster: null, originCountry: null,
      variety: null, process: 'natural', roastLevel: null, roastDateISO: null, altitudeM: 1700,
    })
    expect(v).toMatchObject({ name: 'A', roaster: '', process: 'natural', altitudeM: '1700', roastDateISO: '' })
  })
})

it('todayISO usa la fecha local', () => {
  expect(todayISO(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05')
})
