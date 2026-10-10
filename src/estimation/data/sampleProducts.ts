import type { MaterialProduct, PriceSource } from '../types';

export const ILLUSTRATIVE_PRICE_SOURCE_LABEL =
  'Illustrative demo data — not a verified market price';

export const SAMPLE_PRICE_DATE = '2026-09-01';

function illustrativeSource(priceDate: string): PriceSource {
  return {
    label: ILLUSTRATIVE_PRICE_SOURCE_LABEL,
    priceDate,
    currency: 'INR',
    isIllustrative: true,
  };
}

export const SAMPLE_PRODUCTS: readonly MaterialProduct[] = [
  {
    id: 'cement-opc-53-grade',
    name: 'OPC 53 Grade Cement',
    category: 'Cement',
    unit: 'bag',
    unitPrice: 410,
    priceSource: illustrativeSource(SAMPLE_PRICE_DATE),
  },
  {
    id: 'steel-tmt-fe500',
    name: 'TMT Steel Bar Fe500',
    category: 'Steel',
    unit: 'tonne',
    unitPrice: 68000,
    priceSource: illustrativeSource(SAMPLE_PRICE_DATE),
  },
  {
    id: 'brick-red-clay',
    name: 'Red Clay Brick',
    category: 'Masonry',
    unit: 'piece',
    unitPrice: 9,
    priceSource: illustrativeSource(SAMPLE_PRICE_DATE),
  },
  {
    id: 'block-aac-600x200x100',
    name: 'AAC Block 600×200×100 mm',
    category: 'Masonry',
    unit: 'piece',
    unitPrice: 55,
    priceSource: illustrativeSource(SAMPLE_PRICE_DATE),
  },
  {
    id: 'sand-river',
    name: 'River Sand',
    category: 'Aggregates',
    unit: 'm3',
    unitPrice: 2400,
    priceSource: illustrativeSource(SAMPLE_PRICE_DATE),
  },
  {
    id: 'aggregate-20mm',
    name: 'Coarse Aggregate 20 mm',
    category: 'Aggregates',
    unit: 'm3',
    unitPrice: 1900,
    priceSource: illustrativeSource(SAMPLE_PRICE_DATE),
  },
  {
    id: 'tile-ceramic-floor',
    name: 'Ceramic Floor Tile',
    category: 'Finishes',
    unit: 'm2',
    unitPrice: 620,
    priceSource: illustrativeSource(SAMPLE_PRICE_DATE),
  },
  {
    id: 'binding-wire-18g',
    name: 'Binding Wire 18 G',
    category: 'Steel',
    unit: 'kg',
    unitPrice: 78,
    priceSource: illustrativeSource(SAMPLE_PRICE_DATE),
  },
  {
    id: 'door-frame-teak',
    name: 'Teak Door Frame',
    category: 'Joinery',
    unit: 'each',
    unitPrice: 3600,
    priceSource: illustrativeSource(SAMPLE_PRICE_DATE),
  },
];
