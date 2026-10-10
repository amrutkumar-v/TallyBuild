import { describe, expect, it } from 'vitest';
import { calculateEstimate, validateEstimateRequest } from './calculate';
import { createCatalogue, findProduct, SAMPLE_PRODUCT_CATALOGUE } from './catalogue';
import type { ProductCatalogue } from './catalogue';
import { ILLUSTRATIVE_PRICE_SOURCE_LABEL, SAMPLE_PRICE_DATE, SAMPLE_PRODUCTS } from './data/sampleProducts';
import type { MaterialProduct, PriceSource } from './types';
import type { MeasurementUnit } from './units';

const VALID_SOURCE: PriceSource = {
  label: ILLUSTRATIVE_PRICE_SOURCE_LABEL,
  priceDate: SAMPLE_PRICE_DATE,
  currency: 'INR',
  isIllustrative: true,
};

function makeProduct(overrides: Partial<MaterialProduct>): MaterialProduct {
  return {
    id: 'test-product',
    name: 'Test Product',
    category: 'Test',
    unit: 'piece',
    unitPrice: 10,
    priceSource: VALID_SOURCE,
    ...overrides,
  };
}

function catalogueOf(...products: MaterialProduct[]): ProductCatalogue {
  return createCatalogue(products);
}

describe('sample catalogue', () => {
  it('exposes products with illustrative price metadata', () => {
    expect(SAMPLE_PRODUCTS.length).toBeGreaterThanOrEqual(8);
    for (const product of SAMPLE_PRODUCTS) {
      expect(product.unitPrice).toBeGreaterThan(0);
      expect(product.priceSource.isIllustrative).toBe(true);
      expect(product.priceSource.priceDate).toBe(SAMPLE_PRICE_DATE);
      expect(product.priceSource.label).toBe(ILLUSTRATIVE_PRICE_SOURCE_LABEL);
    }
  });

  it('looks products up by id', () => {
    expect(findProduct(SAMPLE_PRODUCT_CATALOGUE, 'cement-opc-53-grade')?.unit).toBe('bag');
    expect(findProduct(SAMPLE_PRODUCT_CATALOGUE, 'does-not-exist')).toBeUndefined();
  });
});

describe('calculateEstimate — happy path', () => {
  it('computes a single line subtotal', () => {
    const calculation = calculateEstimate({
      lines: [{ productId: 'cement-opc-53-grade', quantity: 10 }],
    });

    expect(calculation.ok).toBe(true);
    if (!calculation.ok) return;
    expect(calculation.result.itemCount).toBe(1);
    expect(calculation.result.lineResults[0].lineSubtotal).toBe(4100);
    expect(calculation.result.subtotal).toBe(4100);
    expect(calculation.result.total).toBe(4100);
    expect(calculation.result.currency).toBe('INR');
  });

  it('sums the documented multi-line example', () => {
    const calculation = calculateEstimate({
      projectName: 'Demo villa',
      lines: [
        { productId: 'cement-opc-53-grade', quantity: 320 },
        { productId: 'steel-tmt-fe500', quantity: 4.5 },
        { productId: 'brick-red-clay', quantity: 12000 },
      ],
    });

    expect(calculation.ok).toBe(true);
    if (!calculation.ok) return;
    expect(calculation.result.projectName).toBe('Demo villa');
    expect(calculation.result.lineResults.map((line) => line.lineSubtotal)).toEqual([
      131200, 306000, 108000,
    ]);
    expect(calculation.result.total).toBe(545200);
  });

  it('accepts zero quantity as a valid line', () => {
    const calculation = calculateEstimate({
      lines: [{ productId: 'brick-red-clay', quantity: 0 }],
    });

    expect(calculation.ok).toBe(true);
    if (!calculation.ok) return;
    expect(calculation.result.lineResults[0].quantity).toBe(0);
    expect(calculation.result.lineResults[0].lineSubtotal).toBe(0);
    expect(calculation.result.total).toBe(0);
  });

  it('requires an explicit unit only when it conflicts', () => {
    const calculation = calculateEstimate({
      lines: [{ productId: 'cement-opc-53-grade', quantity: 1, unit: 'bag' }],
    });

    expect(calculation.ok).toBe(true);
    if (!calculation.ok) return;
    expect(calculation.result.lineResults[0].unit).toBe('bag');
  });
});

describe('calculateEstimate — quantity validation', () => {
  it('rejects negative quantities', () => {
    const calculation = calculateEstimate({
      lines: [{ productId: 'brick-red-clay', quantity: -5 }],
    });

    expect(calculation.ok).toBe(false);
    if (calculation.ok) return;
    expect(calculation.errors[0].code).toBe('INVALID_QUANTITY');
    expect(calculation.errors[0].lineIndex).toBe(0);
  });

  it('rejects non-finite quantities', () => {
    for (const quantity of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      const calculation = calculateEstimate({
        lines: [{ productId: 'brick-red-clay', quantity }],
      });
      expect(calculation.ok).toBe(false);
      if (calculation.ok) continue;
      expect(calculation.errors.some((error) => error.code === 'INVALID_QUANTITY')).toBe(true);
    }
  });

  it('reports an empty request', () => {
    const errors = validateEstimateRequest({ lines: [] });
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe('EMPTY_REQUEST');
  });
});

describe('calculateEstimate — unit validation', () => {
  it('rejects unsupported units', () => {
    const calculation = calculateEstimate({
      lines: [
        {
          productId: 'cement-opc-53-grade',
          quantity: 1,
          unit: 'litre' as unknown as MeasurementUnit,
        },
      ],
    });

    expect(calculation.ok).toBe(false);
    if (calculation.ok) return;
    expect(calculation.errors[0].code).toBe('INVALID_UNIT');
  });

  it('rejects incompatible units', () => {
    const calculation = calculateEstimate({
      lines: [{ productId: 'cement-opc-53-grade', quantity: 1, unit: 'kg' }],
    });

    expect(calculation.ok).toBe(false);
    if (calculation.ok) return;
    expect(calculation.errors[0].code).toBe('INCOMPATIBLE_UNIT');
  });

  it('flags same-family conversions as unsupported', () => {
    const calculation = calculateEstimate({
      lines: [{ productId: 'steel-tmt-fe500', quantity: 1, unit: 'kg' }],
    });

    expect(calculation.ok).toBe(false);
    if (calculation.ok) return;
    expect(calculation.errors[0].code).toBe('UNIT_CONVERSION_UNSUPPORTED');
  });
});

describe('calculateEstimate — product and price validation', () => {
  it('rejects unknown products', () => {
    const calculation = calculateEstimate({
      lines: [{ productId: 'does-not-exist', quantity: 1 }],
    });

    expect(calculation.ok).toBe(false);
    if (calculation.ok) return;
    expect(calculation.errors[0].code).toBe('MISSING_PRODUCT');
    expect(calculation.errors[0].productId).toBe('does-not-exist');
  });

  it('rejects non-positive or non-finite prices', () => {
    const catalogue = catalogueOf(
      makeProduct({ id: 'zero-price', unitPrice: 0 }),
      makeProduct({ id: 'negative-price', unitPrice: -5 }),
      makeProduct({ id: 'infinite-price', unitPrice: Number.POSITIVE_INFINITY }),
    );

    for (const id of ['zero-price', 'negative-price', 'infinite-price']) {
      const calculation = calculateEstimate({ lines: [{ productId: id, quantity: 1 }] }, catalogue);
      expect(calculation.ok).toBe(false);
      if (calculation.ok) continue;
      expect(calculation.errors.some((error) => error.code === 'INVALID_PRICE')).toBe(true);
    }
  });

  it('rejects products without price source metadata', () => {
    const productWithoutSource = makeProduct({
      id: 'no-source',
      priceSource: undefined as unknown as PriceSource,
    });
    const calculation = calculateEstimate(
      { lines: [{ productId: 'no-source', quantity: 1 }] },
      catalogueOf(productWithoutSource),
    );

    expect(calculation.ok).toBe(false);
    if (calculation.ok) return;
    expect(calculation.errors[0].code).toBe('INVALID_PRICE_SOURCE');
  });
});

describe('calculateEstimate — rounding policy', () => {
  it('rounds each line subtotal before summing', () => {
    const catalogue = catalogueOf(
      makeProduct({ id: 'half-paise', unitPrice: 0.005 }),
      makeProduct({ id: 'small-paise', unitPrice: 0.004 }),
    );

    const calculation = calculateEstimate(
      {
        lines: [
          { productId: 'half-paise', quantity: 1 },
          { productId: 'half-paise', quantity: 1 },
        ],
      },
      catalogue,
    );

    expect(calculation.ok).toBe(true);
    if (!calculation.ok) return;
    expect(calculation.result.lineResults.map((line) => line.lineSubtotal)).toEqual([0.01, 0.01]);
    expect(calculation.result.total).toBe(0.02);

    const single = calculateEstimate({ lines: [{ productId: 'small-paise', quantity: 1 }] }, catalogue);
    expect(single.ok).toBe(true);
    if (!single.ok) return;
    expect(single.result.total).toBe(0);
  });

  it('rounds fractional quantities to paise', () => {
    const catalogue = catalogueOf(makeProduct({ id: 'metre', unit: 'm', unitPrice: 33.333 }));
    const calculation = calculateEstimate(
      { lines: [{ productId: 'metre', quantity: 3 }] },
      catalogue,
    );

    expect(calculation.ok).toBe(true);
    if (!calculation.ok) return;
    expect(calculation.result.lineResults[0].lineSubtotal).toBe(100);
    expect(calculation.result.total).toBe(100);
  });
});

describe('calculateEstimate — metadata', () => {
  it('preserves price source and date metadata', () => {
    const calculation = calculateEstimate({
      lines: [{ productId: 'cement-opc-53-grade', quantity: 1 }],
    });

    expect(calculation.ok).toBe(true);
    if (!calculation.ok) return;
    const [source] = calculation.result.priceSources;
    expect(source.label).toBe(ILLUSTRATIVE_PRICE_SOURCE_LABEL);
    expect(source.priceDate).toBe(SAMPLE_PRICE_DATE);
    expect(source.isIllustrative).toBe(true);
    expect(calculation.result.lineResults[0].priceSource).toEqual(VALID_SOURCE);
  });
});
