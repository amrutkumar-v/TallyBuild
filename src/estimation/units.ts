export const SUPPORTED_UNITS = ['bag', 'piece', 'each', 'kg', 'tonne', 'm', 'm2', 'm3'] as const;

export type MeasurementUnit = (typeof SUPPORTED_UNITS)[number];

export type UnitFamily = 'discrete' | 'mass' | 'length' | 'area' | 'volume';

const UNIT_FAMILY: Record<MeasurementUnit, UnitFamily> = {
  bag: 'discrete',
  piece: 'discrete',
  each: 'discrete',
  kg: 'mass',
  tonne: 'mass',
  m: 'length',
  m2: 'area',
  m3: 'volume',
};

const UNIT_LABEL: Record<MeasurementUnit, string> = {
  bag: 'bag',
  piece: 'piece',
  each: 'each',
  kg: 'kg',
  tonne: 'tonne',
  m: 'm',
  m2: 'm²',
  m3: 'm³',
};

export function isSupportedUnit(value: unknown): value is MeasurementUnit {
  return typeof value === 'string' && (SUPPORTED_UNITS as readonly string[]).includes(value);
}

export function getUnitFamily(unit: MeasurementUnit): UnitFamily {
  return UNIT_FAMILY[unit];
}

export function getUnitLabel(unit: MeasurementUnit): string {
  return UNIT_LABEL[unit];
}

export function areUnitsCompatible(a: MeasurementUnit, b: MeasurementUnit): boolean {
  return getUnitFamily(a) === getUnitFamily(b);
}
