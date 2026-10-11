import type { CurrencyCode } from './currencies';

export type CostSectionKey = 'personnel' | 'tooling' | 'infrastructure' | 'other';

export interface PersonnelLine {
  role: string;
  people: number;
  hours: number;
  hourlyRate: number;
}

export interface ToolingLine {
  name: string;
  amount: number;
}

export interface InfrastructureLine {
  name: string;
  monthlyCost: number;
  months: number;
}

export interface OtherCostLine {
  description: string;
  amount: number;
}

export interface ProjectEstimateRequest {
  projectName?: string;
  currency: CurrencyCode;
  personnel: PersonnelLine[];
  tooling: ToolingLine[];
  infrastructure: InfrastructureLine[];
  other: OtherCostLine[];
}

export interface PersonnelResult extends PersonnelLine {
  cost: number;
}

export interface ToolingResult extends ToolingLine {
  cost: number;
}

export interface InfrastructureResult extends InfrastructureLine {
  cost: number;
}

export interface OtherCostResult extends OtherCostLine {
  cost: number;
}

export interface CostSection<T> {
  lines: T[];
  subtotal: number;
}

export interface ProjectEstimateResult {
  projectName?: string;
  currency: CurrencyCode;
  personnel: CostSection<PersonnelResult>;
  tooling: CostSection<ToolingResult>;
  infrastructure: CostSection<InfrastructureResult>;
  other: CostSection<OtherCostResult>;
  personnelCost: number;
  toolingCost: number;
  infrastructureCost: number;
  otherCost: number;
  lineCount: number;
  total: number;
  assumptions: string[];
}

export type EstimateErrorCode =
  | 'EMPTY_REQUEST'
  | 'UNSUPPORTED_CURRENCY'
  | 'INVALID_PERSONNEL'
  | 'INVALID_TOOLING'
  | 'INVALID_INFRASTRUCTURE'
  | 'INVALID_OTHER'
  | 'NON_FINITE_RESULT';

export interface EstimateValidationError {
  code: EstimateErrorCode;
  message: string;
  section?: CostSectionKey;
  lineIndex?: number;
}

export type EstimateCalculation =
  | { ok: true; result: ProjectEstimateResult }
  | { ok: false; errors: EstimateValidationError[] };
