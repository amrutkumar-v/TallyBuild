import { describe, expect, it } from 'vitest';
import {
  areUnitsCompatible,
  getUnitFamily,
  getUnitLabel,
  isSupportedUnit,
  SUPPORTED_UNITS,
} from './units';

describe('units', () => {
  it('recognises supported units only', () => {
    expect(isSupportedUnit('bag')).toBe(true);
    expect(isSupportedUnit('tonne')).toBe(true);
    expect(isSupportedUnit('litre')).toBe(false);
    expect(isSupportedUnit('')).toBe(false);
    expect(isSupportedUnit(42)).toBe(false);
    expect(isSupportedUnit(null)).toBe(false);
  });

  it('maps every supported unit to a family', () => {
    expect(SUPPORTED_UNITS.every((unit) => typeof getUnitFamily(unit) === 'string')).toBe(true);
    expect(getUnitFamily('bag')).toBe('discrete');
    expect(getUnitFamily('kg')).toBe('mass');
    expect(getUnitFamily('tonne')).toBe('mass');
    expect(getUnitFamily('m')).toBe('length');
    expect(getUnitFamily('m2')).toBe('area');
    expect(getUnitFamily('m3')).toBe('volume');
  });

  it('reports cross-unit compatibility by family', () => {
    expect(areUnitsCompatible('kg', 'tonne')).toBe(true);
    expect(areUnitsCompatible('m', 'm')).toBe(true);
    expect(areUnitsCompatible('bag', 'kg')).toBe(false);
    expect(areUnitsCompatible('m2', 'm3')).toBe(false);
  });

  it('provides display labels for units', () => {
    expect(getUnitLabel('m2')).toBe('m²');
    expect(getUnitLabel('m3')).toBe('m³');
    expect(getUnitLabel('bag')).toBe('bag');
  });
});
