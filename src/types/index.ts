/**
 * Shared types for TallyBuild AI (software-project effort/cost/timeline estimation).
 *
 * These types describe the data shape the FRONTEND expects from the backend API.
 * See `docs/frontend-api-contract.md` for the accompanying endpoint contract.
 * Nothing here is persisted server-side yet — the mock adapter is the current
 * source of truth and can be swapped for the HTTP adapter without UI changes.
 */

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED';

export type ProjectType =
  | 'web-app'
  | 'mobile-app'
  | 'backend-api'
  | 'data-ml'
  | 'internal-tool'
  | 'other';

export type Complexity = 'low' | 'medium' | 'high' | 'expert';

export type TeamLocation =
  | 'india'
  | 'north-america'
  | 'europe'
  | 'latam'
  | 'distributed';

export type ScopePriority = 'must' | 'should' | 'could';

export type FeatureComplexity = 'trivial' | 'moderate' | 'complex' | 'epic';

export type FeatureStatus = 'proposed' | 'accepted' | 'removed';

export type EstimateStage = 'draft' | 'breakdown' | 'estimated';

/** Where a number came from. `mock-adapter` values are illustrative, never AI output. */
export type ResultSource = 'mock-adapter' | 'api';

export type Confidence = 'low' | 'medium' | 'high';

/** A three-point estimate. `likely` is the planning number; low/high show uncertainty. */
export interface Range {
  low: number;
  likely: number;
  high: number;
}

/** Everything the user supplies on the New Estimate screen. */
export interface ProjectInput {
  projectName: string;
  requirements: string;
  projectType: ProjectType;
  complexity: Complexity;
  /** ISO date (yyyy-mm-dd) the project is due. */
  targetDeadline: string;
  teamSize: number;
  teamLocation: TeamLocation;
  /** User-provided blended cost per developer per day, used only to convert effort to money. */
  blendedRatePerDay: number;
  currency: CurrencyCode;
  constraints: string[];
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  priority: ScopePriority;
  complexity: FeatureComplexity;
  status: FeatureStatus;
}

export interface FeatureCost {
  featureId: string;
  name: string;
  effortDays: Range;
  cost: Range;
}

export interface TeamAssumption {
  role: string;
  count: number;
  allocationPercent: number;
}

export interface Milestone {
  id: string;
  name: string;
  summary: string;
  /** 1-based week index relative to the estimate start. */
  startWeek: number;
  endWeek: number;
  /** Share of total likely cost consumed by this milestone (0–1). */
  costShare: number;
}

export interface EstimateResult {
  effortDays: Range;
  durationWeeks: Range;
  cost: Range;
  currency: CurrencyCode;
  blendedRatePerDay: number;
  teamAssumptions: TeamAssumption[];
  featureCosts: FeatureCost[];
  milestones: Milestone[];
  /** Engine-level assumptions (how the numbers were produced). */
  assumptions: string[];
  confidence: Confidence;
  generatedAt: string;
  source: ResultSource;
}

export type DeadlineFit = 'feasible' | 'tight' | 'infeasible';

export interface ScenarioInput {
  label: string;
  /** Change to delivered scope versus the baseline, e.g. -20 or +15. */
  scopeDeltaPercent: number;
  teamSize: number;
  blendedRatePerDay: number;
  /** Optional deadline the scenario must land in, in weeks from start. */
  targetWeeks: number | null;
}

export interface ScenarioResult {
  id: string;
  input: ScenarioInput;
  effortDays: Range;
  durationWeeks: Range;
  cost: Range;
  currency: CurrencyCode;
  deltas: {
    costPercent: number;
    effortPercent: number;
    durationPercent: number;
  };
  deadlineFit: DeadlineFit | null;
  source: ResultSource;
  createdAt: string;
}

export interface Estimate {
  id: string;
  /** `sample` records are illustrative demo data shipped with the app. */
  origin: 'user' | 'sample';
  stage: EstimateStage;
  createdAt: string;
  updatedAt: string;
  input: ProjectInput;
  features: Feature[];
  /** Assumptions the *user* wants recorded. */
  assumptions: string[];
  /** Gaps the user flagged for follow-up. */
  missingRequirements: string[];
  result: EstimateResult | null;
  scenarios: ScenarioResult[];
}
