export interface MeasurementUnit {
  label: string
  factor: number | null  // null = "por unidad", necesita gramsPerUnit
  abbrev: string
}

export const MEASUREMENT_UNITS: MeasurementUnit[] = [
  { label: 'g',           factor: 1,    abbrev: 'g'     },
  { label: 'ml',          factor: 1,    abbrev: 'ml'    },
  { label: 'cda. sopera', factor: 15,   abbrev: 'cdas.' },
  { label: 'cda. de té',  factor: 5,    abbrev: 'cdta.' },
  { label: 'taza',        factor: 240,  abbrev: 'taza'  },
  { label: 'unidad',      factor: null, abbrev: 'u'     },
]

export function toGrams(amount: number, unitLabel: string, gramsPerUnit = 1): number {
  const unit = MEASUREMENT_UNITS.find(u => u.label === unitLabel)
  if (!unit) return amount
  return unit.factor === null ? amount * gramsPerUnit : amount * unit.factor
}

export function formatDisplayUnit(amount: string, unitLabel: string): string {
  if (unitLabel === 'g') return `${amount}g`
  const unit = MEASUREMENT_UNITS.find(u => u.label === unitLabel)
  return `${amount} ${unit?.abbrev ?? unitLabel}`
}
