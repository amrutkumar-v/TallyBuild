import type { MeasurementUnit } from './units';

export type CurrencyCode = 'INR';

export interface PriceSource {
  label: string;
  priceDate: string;
  currency: CurrencyCode;
  isIllustrative: true;
}

export interface MaterialProduct {
  id: string;
  name: string;
  category: string;
  unit: MeasurementUnit;
  unitPrice: number;
  priceSource: PriceSource;
}

export interface EstimateLineItem {
  productId: string;
  quantity: number;
  unit?: MeasurementUnit;
  label?: string;
}

export interface EstimateRequest {
  projectName?: string;
  lines: EstimateLineItem[];
}

export interface LineCalculationResult {
  productId: string;
  productName: string;
  category: string;
  unit: MeasurementUnit;
  quantity: number;
  unitPrice: number;
  lineSubtotal: number;
  priceSource: PriceSource;
  label?: string;
}

export interface EstimateResult {
  projectName?: string;
  currency: CurrencyCode;
  itemCount: number;
  lineResults: LineCalculationResult[];
  subtotal: number;
  total: number;
  priceSources: PriceSource[];
}

export type EstimateErrorCode =
  | 'EMPTY_REQUEST'
  | 'MISSING_PRODUCT'
  | 'INVALID_QUANTITY'
  | 'INVALID_UNIT'
  | 'INCOMPATIBLE_UNIT'
  | 'UNIT_CONVERSION_UNSUPPORTED'
  | 'INVALID_PRICE'
  | 'INVALID_PRICE_SOURCE'
  | 'NON_FINITE_RESULT';

export interface EstimateValidationError {
  code: EstimateErrorCode;
  message: string;
  lineIndex?: number;
  productId?: string;
}

export type EstimateCalculation =
  | { ok: true; result: EstimateResult }
  | { ok: false; errors: EstimateValidationError[] };
