import { SAMPLE_PRODUCT_CATALOGUE, findProduct } from './catalogue';
import type { ProductCatalogue } from './catalogue';
import { roundCurrency } from './money';
import { areUnitsCompatible, isSupportedUnit } from './units';
import type {
  EstimateCalculation,
  EstimateLineItem,
  EstimateRequest,
  EstimateResult,
  EstimateValidationError,
  LineCalculationResult,
  PriceSource,
} from './types';

function isValidPriceSource(value: unknown): value is PriceSource {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const source = value as Partial<PriceSource>;
  return (
    typeof source.label === 'string' &&
    source.label.trim() !== '' &&
    typeof source.priceDate === 'string' &&
    source.priceDate.trim() !== '' &&
    source.currency === 'INR' &&
    source.isIllustrative === true
  );
}

function validateLine(
  line: EstimateLineItem,
  index: number,
  catalogue: ProductCatalogue,
): EstimateValidationError[] {
  const errors: EstimateValidationError[] = [];
  const lineNumber = index + 1;
  const product = findProduct(catalogue, line.productId);

  if (!product) {
    errors.push({
      code: 'MISSING_PRODUCT',
      message: `Line ${lineNumber}: product "${line.productId}" is not in the catalogue.`,
      lineIndex: index,
      productId: line.productId,
    });
    return errors;
  }

  if (typeof line.quantity !== 'number' || !Number.isFinite(line.quantity)) {
    errors.push({
      code: 'INVALID_QUANTITY',
      message: `Line ${lineNumber}: quantity must be a finite number.`,
      lineIndex: index,
      productId: product.id,
    });
  } else if (line.quantity < 0) {
    errors.push({
      code: 'INVALID_QUANTITY',
      message: `Line ${lineNumber}: quantity must not be negative.`,
      lineIndex: index,
      productId: product.id,
    });
  }

  if (line.unit !== undefined) {
    if (!isSupportedUnit(line.unit)) {
      errors.push({
        code: 'INVALID_UNIT',
        message: `Line ${lineNumber}: unit "${String(line.unit)}" is not supported.`,
        lineIndex: index,
        productId: product.id,
      });
    } else if (line.unit !== product.unit) {
      if (areUnitsCompatible(line.unit, product.unit)) {
        errors.push({
          code: 'UNIT_CONVERSION_UNSUPPORTED',
          message: `Line ${lineNumber}: unit "${line.unit}" is compatible with "${product.unit}" but unit conversion is not supported yet.`,
          lineIndex: index,
          productId: product.id,
        });
      } else {
        errors.push({
          code: 'INCOMPATIBLE_UNIT',
          message: `Line ${lineNumber}: unit "${line.unit}" is incompatible with "${product.unit}".`,
          lineIndex: index,
          productId: product.id,
        });
      }
    }
  }

  if (
    typeof product.unitPrice !== 'number' ||
    !Number.isFinite(product.unitPrice) ||
    product.unitPrice <= 0
  ) {
    errors.push({
      code: 'INVALID_PRICE',
      message: `Line ${lineNumber}: product "${product.id}" has an invalid unit price.`,
      lineIndex: index,
      productId: product.id,
    });
  }

  if (!isValidPriceSource(product.priceSource)) {
    errors.push({
      code: 'INVALID_PRICE_SOURCE',
      message: `Line ${lineNumber}: product "${product.id}" is missing price source metadata.`,
      lineIndex: index,
      productId: product.id,
    });
  }

  return errors;
}

function collectPriceSources(lineResults: LineCalculationResult[]): PriceSource[] {
  const sources: PriceSource[] = [];
  for (const line of lineResults) {
    const exists = sources.some(
      (source) =>
        source.label === line.priceSource.label &&
        source.priceDate === line.priceSource.priceDate &&
        source.currency === line.priceSource.currency,
    );
    if (!exists) {
      sources.push(line.priceSource);
    }
  }
  return sources;
}

export function validateEstimateRequest(
  request: EstimateRequest,
  catalogue: ProductCatalogue = SAMPLE_PRODUCT_CATALOGUE,
): EstimateValidationError[] {
  const lines = Array.isArray(request.lines) ? request.lines : [];
  if (lines.length === 0) {
    return [
      {
        code: 'EMPTY_REQUEST',
        message: 'Add at least one line item to calculate an estimate.',
      },
    ];
  }

  const errors: EstimateValidationError[] = [];
  lines.forEach((line, index) => {
    errors.push(...validateLine(line, index, catalogue));
  });
  return errors;
}

export function calculateEstimate(
  request: EstimateRequest,
  catalogue: ProductCatalogue = SAMPLE_PRODUCT_CATALOGUE,
): EstimateCalculation {
  const errors = validateEstimateRequest(request, catalogue);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const lineResults: LineCalculationResult[] = [];
  const resultErrors: EstimateValidationError[] = [];

  request.lines.forEach((line, index) => {
    const product = findProduct(catalogue, line.productId);
    if (!product) {
      resultErrors.push({
        code: 'MISSING_PRODUCT',
        message: `Line ${index + 1}: product "${line.productId}" is not in the catalogue.`,
        lineIndex: index,
        productId: line.productId,
      });
      return;
    }

    const lineSubtotal = roundCurrency(line.quantity * product.unitPrice);
    if (!Number.isFinite(lineSubtotal)) {
      resultErrors.push({
        code: 'NON_FINITE_RESULT',
        message: `Line ${index + 1}: subtotal is not a finite number.`,
        lineIndex: index,
        productId: product.id,
      });
      return;
    }

    lineResults.push({
      productId: product.id,
      productName: product.name,
      category: product.category,
      unit: line.unit ?? product.unit,
      quantity: line.quantity,
      unitPrice: product.unitPrice,
      lineSubtotal,
      priceSource: product.priceSource,
      label: line.label,
    });
  });

  if (resultErrors.length > 0) {
    return { ok: false, errors: resultErrors };
  }

  const subtotal = roundCurrency(
    lineResults.reduce((sum, line) => sum + line.lineSubtotal, 0),
  );
  if (!Number.isFinite(subtotal)) {
    return {
      ok: false,
      errors: [{ code: 'NON_FINITE_RESULT', message: 'Estimate total is not a finite number.' }],
    };
  }

  const result: EstimateResult = {
    projectName: request.projectName,
    currency: 'INR',
    itemCount: lineResults.length,
    lineResults,
    subtotal,
    total: subtotal,
    priceSources: collectPriceSources(lineResults),
  };

  return { ok: true, result };
}
