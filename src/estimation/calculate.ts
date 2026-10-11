import { SUPPORTED_CURRENCIES, isSupportedCurrency } from './currencies';
import type { CurrencyCode } from './currencies';
import { roundCurrency } from './money';
import type {
  EstimateCalculation,
  EstimateValidationError,
  InfrastructureResult,
  OtherCostResult,
  PersonnelResult,
  ProjectEstimateRequest,
  ProjectEstimateResult,
  ToolingResult,
} from './types';

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isNonEmptyText(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

function buildAssumptions(currency: CurrencyCode): string[] {
  return [
    `All amounts are calculated in ${currency}. Live currency conversion is not configured, so each estimate stays in the currency you choose.`,
    'Personnel cost = people × hours × hourly rate per team line.',
    'Infrastructure cost = monthly cost × months per resource line.',
    'Excludes taxes, duties and contingency unless you add them as an "other" cost line.',
  ];
}

export function validateEstimateRequest(
  request: ProjectEstimateRequest,
): EstimateValidationError[] {
  const errors: EstimateValidationError[] = [];

  if (!isSupportedCurrency(request.currency)) {
    errors.push({
      code: 'UNSUPPORTED_CURRENCY',
      message: `Currency "${String(
        request.currency,
      )}" is not supported. Choose one of ${SUPPORTED_CURRENCIES.join(', ')}.`,
    });
  }

  const personnel = Array.isArray(request.personnel) ? request.personnel : [];
  const tooling = Array.isArray(request.tooling) ? request.tooling : [];
  const infrastructure = Array.isArray(request.infrastructure) ? request.infrastructure : [];
  const other = Array.isArray(request.other) ? request.other : [];

  if (
    personnel.length === 0 &&
    tooling.length === 0 &&
    infrastructure.length === 0 &&
    other.length === 0
  ) {
    errors.push({
      code: 'EMPTY_REQUEST',
      message:
        'Add at least one cost line (personnel, tooling, infrastructure or other) to calculate an estimate.',
    });
    return errors;
  }

  personnel.forEach((line, index) => {
    const lineNumber = index + 1;
    if (!isNonEmptyText(line.role)) {
      errors.push({
        code: 'INVALID_PERSONNEL',
        message: `Personnel line ${lineNumber}: role is required.`,
        section: 'personnel',
        lineIndex: index,
      });
    }
    if (!isFiniteNonNegative(line.people)) {
      errors.push({
        code: 'INVALID_PERSONNEL',
        message: `Personnel line ${lineNumber}: number of people must be a finite number that is 0 or more.`,
        section: 'personnel',
        lineIndex: index,
      });
    }
    if (!isFiniteNonNegative(line.hours)) {
      errors.push({
        code: 'INVALID_PERSONNEL',
        message: `Personnel line ${lineNumber}: hours must be a finite number that is 0 or more.`,
        section: 'personnel',
        lineIndex: index,
      });
    }
    if (!isFiniteNonNegative(line.hourlyRate)) {
      errors.push({
        code: 'INVALID_PERSONNEL',
        message: `Personnel line ${lineNumber}: hourly rate must be a finite number that is 0 or more.`,
        section: 'personnel',
        lineIndex: index,
      });
    }
  });

  tooling.forEach((line, index) => {
    const lineNumber = index + 1;
    if (!isNonEmptyText(line.name)) {
      errors.push({
        code: 'INVALID_TOOLING',
        message: `Tooling line ${lineNumber}: name is required.`,
        section: 'tooling',
        lineIndex: index,
      });
    }
    if (!isFiniteNonNegative(line.amount)) {
      errors.push({
        code: 'INVALID_TOOLING',
        message: `Tooling line ${lineNumber}: cost must be a finite number that is 0 or more.`,
        section: 'tooling',
        lineIndex: index,
      });
    }
  });

  infrastructure.forEach((line, index) => {
    const lineNumber = index + 1;
    if (!isNonEmptyText(line.name)) {
      errors.push({
        code: 'INVALID_INFRASTRUCTURE',
        message: `Infrastructure line ${lineNumber}: name is required.`,
        section: 'infrastructure',
        lineIndex: index,
      });
    }
    if (!isFiniteNonNegative(line.monthlyCost)) {
      errors.push({
        code: 'INVALID_INFRASTRUCTURE',
        message: `Infrastructure line ${lineNumber}: monthly cost must be a finite number that is 0 or more.`,
        section: 'infrastructure',
        lineIndex: index,
      });
    }
    if (!isFiniteNonNegative(line.months)) {
      errors.push({
        code: 'INVALID_INFRASTRUCTURE',
        message: `Infrastructure line ${lineNumber}: months must be a finite number that is 0 or more.`,
        section: 'infrastructure',
        lineIndex: index,
      });
    }
  });

  other.forEach((line, index) => {
    const lineNumber = index + 1;
    if (!isNonEmptyText(line.description)) {
      errors.push({
        code: 'INVALID_OTHER',
        message: `Other cost line ${lineNumber}: description is required.`,
        section: 'other',
        lineIndex: index,
      });
    }
    if (!isFiniteNonNegative(line.amount)) {
      errors.push({
        code: 'INVALID_OTHER',
        message: `Other cost line ${lineNumber}: cost must be a finite number that is 0 or more.`,
        section: 'other',
        lineIndex: index,
      });
    }
  });

  return errors;
}

export function calculateEstimate(request: ProjectEstimateRequest): EstimateCalculation {
  const errors = validateEstimateRequest(request);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const resultErrors: EstimateValidationError[] = [];

  const personnelResults: PersonnelResult[] = [];
  request.personnel.forEach((line, index) => {
    const cost = roundCurrency(line.people * line.hours * line.hourlyRate);
    if (!Number.isFinite(cost)) {
      resultErrors.push({
        code: 'NON_FINITE_RESULT',
        message: `Personnel line ${index + 1}: cost is not a finite number.`,
        section: 'personnel',
        lineIndex: index,
      });
      return;
    }
    personnelResults.push({ ...line, cost });
  });

  const toolingResults: ToolingResult[] = [];
  request.tooling.forEach((line, index) => {
    const cost = roundCurrency(line.amount);
    if (!Number.isFinite(cost)) {
      resultErrors.push({
        code: 'NON_FINITE_RESULT',
        message: `Tooling line ${index + 1}: cost is not a finite number.`,
        section: 'tooling',
        lineIndex: index,
      });
      return;
    }
    toolingResults.push({ ...line, cost });
  });

  const infrastructureResults: InfrastructureResult[] = [];
  request.infrastructure.forEach((line, index) => {
    const cost = roundCurrency(line.monthlyCost * line.months);
    if (!Number.isFinite(cost)) {
      resultErrors.push({
        code: 'NON_FINITE_RESULT',
        message: `Infrastructure line ${index + 1}: cost is not a finite number.`,
        section: 'infrastructure',
        lineIndex: index,
      });
      return;
    }
    infrastructureResults.push({ ...line, cost });
  });

  const otherResults: OtherCostResult[] = [];
  request.other.forEach((line, index) => {
    const cost = roundCurrency(line.amount);
    if (!Number.isFinite(cost)) {
      resultErrors.push({
        code: 'NON_FINITE_RESULT',
        message: `Other cost line ${index + 1}: cost is not a finite number.`,
        section: 'other',
        lineIndex: index,
      });
      return;
    }
    otherResults.push({ ...line, cost });
  });

  if (resultErrors.length > 0) {
    return { ok: false, errors: resultErrors };
  }

  const personnelCost = roundCurrency(
    personnelResults.reduce((sum, line) => sum + line.cost, 0),
  );
  const toolingCost = roundCurrency(toolingResults.reduce((sum, line) => sum + line.cost, 0));
  const infrastructureCost = roundCurrency(
    infrastructureResults.reduce((sum, line) => sum + line.cost, 0),
  );
  const otherCost = roundCurrency(otherResults.reduce((sum, line) => sum + line.cost, 0));
  const total = roundCurrency(personnelCost + toolingCost + infrastructureCost + otherCost);

  if (!Number.isFinite(total)) {
    return {
      ok: false,
      errors: [
        {
          code: 'NON_FINITE_RESULT',
          message: 'Estimate total is not a finite number.',
        },
      ],
    };
  }

  const result: ProjectEstimateResult = {
    projectName: request.projectName,
    currency: request.currency,
    personnel: { lines: personnelResults, subtotal: personnelCost },
    tooling: { lines: toolingResults, subtotal: toolingCost },
    infrastructure: { lines: infrastructureResults, subtotal: infrastructureCost },
    other: { lines: otherResults, subtotal: otherCost },
    personnelCost,
    toolingCost,
    infrastructureCost,
    otherCost,
    lineCount:
      personnelResults.length +
      toolingResults.length +
      infrastructureResults.length +
      otherResults.length,
    total,
    assumptions: buildAssumptions(request.currency),
  };

  return { ok: true, result };
}
