/**
 * ⚠️ MOCK ADAPTER — ILLUSTRATIVE DATA ONLY ⚠️
 *
 * This module is the frontend's current data source while the backend API is
 * being built. Everything it returns is a *transparent placeholder projection*:
 *
 * - It is NOT an AI engine and NOT the product's estimation methodology.
 * - It never invents prices: money is always (user-supplied daily rate) × effort.
 * - Effort comes from a small, documented arithmetic table so the UI has
 *   three-point numbers to render, clearly badged as `source: 'mock-adapter'`.
 *
 * To go live: configure `VITE_API_BASE_URL` and the HTTP adapter takes over
 * (`src/services/index.ts`). No UI code changes are required.
 */
import { sampleEstimateSpecs, type SampleEstimateSpec } from '../data/sampleEstimates';
import type {
  Confidence,
  Estimate,
  EstimateResult,
  Feature,
  FeatureComplexity,
  FeatureCost,
  Milestone,
  Range,
  ResultSource,
  ScenarioInput,
  ScenarioResult,
  TeamAssumption,
} from '../types';
import { newId } from '../utils/id';
import { delay } from './api';
import type { EstimatePatch, EstimateService } from './api';

const MOCK_SOURCE: ResultSource = 'mock-adapter';
const STORAGE_KEY = 'tallybuild.mock.estimates.v1';

/** Placeholder person-day anchors per feature complexity. */
const FEATURE_BASE_DAYS: Record<FeatureComplexity, number> = {
  trivial: 3,
  moderate: 8,
  complex: 18,
  epic: 34,
};

/** Placeholder uncertainty multipliers applied to the baseline likely effort. */
const LOW_FACTOR = 0.82;
const HIGH_FACTOR = 1.35;

/** Focus factor: not every working day is delivery work. */
const FOCUS_FACTOR = 0.85;
/** Coordination overhead that grows with team size. */
const COORDINATION_FACTOR = 0.75;

/** Productive days per person per week assumed by the placeholder. */
const PRODUCTIVE_DAYS_PER_WEEK = 4;
/** Ramp-up week added to every duration. */
const RAMP_UP_WEEKS = 1;

interface MilestonePlan {
  name: string;
  summary: string;
  costShare: number;
}

const MILESTONE_PLAN: MilestonePlan[] = [
  {
    name: 'Discovery & design',
    summary: 'Scope confirmation, interaction design and technical approach.',
    costShare: 0.15,
  },
  {
    name: 'Core build',
    summary: 'Primary features implemented and reviewable internally.',
    costShare: 0.45,
  },
  {
    name: 'Integration & QA',
    summary: 'Integrations, end-to-end testing and defect burn-down.',
    costShare: 0.25,
  },
  {
    name: 'Hardening & release',
    summary: 'Performance, security pass, rollout and handover.',
    costShare: 0.15,
  },
];

const ROLE_SPLIT: Array<{ role: string; allocationPercent: number }> = [
  { role: 'Engineer', allocationPercent: 60 },
  { role: 'QA / test engineer', allocationPercent: 15 },
  { role: 'Designer', allocationPercent: 10 },
  { role: 'Delivery / product', allocationPercent: 15 },
];

function round(value: number): number {
  return Math.round(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function rangeFrom(likely: number, lowFactor: number, highFactor: number): Range {
  return {
    low: round(likely * lowFactor),
    likely: round(likely),
    high: round(likely * highFactor),
  };
}

/**
 * Placeholder duration model: capacity-limited weeks plus a ramp-up week.
 * Coordination efficiency drops as the team grows (Brooks's-law flavour).
 */
function durationFor(effort: Range, teamSize: number): Range {
  const size = Math.max(1, teamSize);
  const efficiency = COORDINATION_FACTOR + (1 - COORDINATION_FACTOR) / size;
  const capacity = size * PRODUCTIVE_DAYS_PER_WEEK * FOCUS_FACTOR * efficiency;
  return {
    low: Math.max(1, round(effort.low / capacity) + RAMP_UP_WEEKS),
    likely: Math.max(1, round(effort.likely / capacity) + RAMP_UP_WEEKS),
    high: Math.max(1, round(effort.high / capacity) + RAMP_UP_WEEKS),
  };
}

function teamAssumptionsFor(teamSize: number): TeamAssumption[] {
  const size = Math.max(1, teamSize);
  let assigned = 0;
  return ROLE_SPLIT.map((entry, index) => {
    const isLast = index === ROLE_SPLIT.length - 1;
    const count = isLast ? Math.max(1, size - assigned) : Math.max(1, round((size * entry.allocationPercent) / 100));
    assigned += count;
    return { role: entry.role, count, allocationPercent: entry.allocationPercent };
  });
}

function milestonesFor(weeks: Range): Milestone[] {
  let cursorWeek = 1;
  return MILESTONE_PLAN.map((plan, index) => {
    const span = Math.max(1, round((plan.costShare * weeks.likely) * 1.2));
    const startWeek = index === 0 ? 1 : cursorWeek;
    const endWeek = Math.max(startWeek, startWeek + span - 1);
    cursorWeek = endWeek;
    return {
      id: `ms-${index + 1}`,
      name: plan.name,
      summary: plan.summary,
      startWeek,
      endWeek,
      costShare: plan.costShare,
    };
  });
}

function confidenceFor(
  requirementsLength: number,
  constraintCount: number,
  missingCount: number,
  complexity: Estimate['input']['complexity'],
): Confidence {
  let score = 1;
  if (requirementsLength > 220) score += 1;
  if (constraintCount > 0) score += 1;
  if (missingCount === 0) score += 1;
  else score -= 1;
  if (complexity === 'high') score -= 1;
  if (complexity === 'expert') score -= 2;
  if (score >= 3) return 'high';
  if (score <= 1) return 'low';
  return 'medium';
}

interface MockProjection {
  effortDays: Range;
  durationWeeks: Range;
  cost: Range;
  featureCosts: FeatureCost[];
  milestones: Milestone[];
  teamAssumptions: TeamAssumption[];
  assumptions: string[];
  confidence: Confidence;
}

/** The (deliberately simple) placeholder projection. Documented, deterministic. */
function project(
  input: Estimate['input'],
  features: Feature[],
  missingCount: number,
): MockProjection {
  const activeFeatures = features.filter((feature) => feature.status !== 'removed');
  const baseDaysPerFeature = activeFeatures.map(
    (feature) => FEATURE_BASE_DAYS[feature.complexity],
  );
  const likelyDays = Math.max(5, baseDaysPerFeature.reduce((sum, days) => sum + days, 0));
  const effortDays = rangeFrom(likelyDays, LOW_FACTOR, HIGH_FACTOR);
  const durationWeeks = durationFor(effortDays, input.teamSize);

  const featureCosts: FeatureCost[] = activeFeatures.map((feature, index) => {
    const share = baseDaysPerFeature[index] / likelyDays;
    const effort = {
      low: round(effortDays.low * share),
      likely: round(effortDays.likely * share),
      high: round(effortDays.high * share),
    };
    return {
      featureId: feature.id,
      name: feature.name,
      effortDays: effort,
      cost: {
        low: round(effort.low * input.blendedRatePerDay),
        likely: round(effort.likely * input.blendedRatePerDay),
        high: round(effort.high * input.blendedRatePerDay),
      },
    };
  });

  const mustCount = activeFeatures.filter((feature) => feature.priority === 'must').length;
  const assumptions = [
    `Team of ${input.teamSize}; ${PRODUCTIVE_DAYS_PER_WEEK} productive days per person per week, ${round(FOCUS_FACTOR * 100)}% focus factor.`,
    `Coordination efficiency of ${round((COORDINATION_FACTOR + (1 - COORDINATION_FACTOR) / Math.max(1, input.teamSize)) * 100)}% applied for a team of ${input.teamSize}.`,
    `${RAMP_UP_WEEKS} week of ramp-up included in every duration.`,
    `Scope modelled as ${activeFeatures.length} delivered features (${mustCount} must-have).`,
    'Cost is derived only from the daily rate you entered — no market rates are assumed.',
  ];
  if (input.constraints.length > 0) {
    assumptions.push(`Constraints acknowledged: ${input.constraints.join('; ')}.`);
  }
  assumptions.push(
    'Illustrative placeholder produced by the local mock adapter — not AI output. Replace with API results.',
  );

  return {
    effortDays,
    durationWeeks,
    cost: {
      low: round(effortDays.low * input.blendedRatePerDay),
      likely: round(effortDays.likely * input.blendedRatePerDay),
      high: round(effortDays.high * input.blendedRatePerDay),
    },
    featureCosts,
    milestones: milestonesFor(durationWeeks),
    teamAssumptions: teamAssumptionsFor(input.teamSize),
    assumptions,
    confidence: confidenceFor(
      input.requirements.length,
      input.constraints.length,
      missingCount,
      input.complexity,
    ),
  };
}

function toResult(input: Estimate['input'], projection: MockProjection): EstimateResult {
  return {
    effortDays: projection.effortDays,
    durationWeeks: projection.durationWeeks,
    cost: projection.cost,
    currency: input.currency,
    blendedRatePerDay: input.blendedRatePerDay,
    teamAssumptions: projection.teamAssumptions,
    featureCosts: projection.featureCosts,
    milestones: projection.milestones,
    assumptions: projection.assumptions,
    confidence: projection.confidence,
    generatedAt: new Date().toISOString(),
    source: MOCK_SOURCE,
  };
}

function specToEstimate(spec: SampleEstimateSpec): Estimate {
  const projection = project(spec.input, spec.features, spec.missingRequirements.length);
  return {
    id: spec.id,
    origin: 'sample',
    stage: 'estimated',
    createdAt: spec.createdAt,
    updatedAt: spec.updatedAt,
    input: spec.input,
    features: spec.features,
    assumptions: spec.assumptions,
    missingRequirements: spec.missingRequirements,
    result: toResult(spec.input, projection),
    scenarios: [],
  };
}

/* ------------------------------------------------------------------ */
/* localStorage-backed collection                                       */
/* ------------------------------------------------------------------ */

function readStore(): Estimate[] | null {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed as Estimate[];
  } catch {
    return null;
  }
}

function writeStore(estimates: Estimate[]): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(estimates));
  } catch {
    // Storage unavailable (private mode / quota). The app still works in-memory.
  }
}

function seed(): Estimate[] {
  return sampleEstimateSpecs.map(specToEstimate);
}

function ensureStore(): Estimate[] {
  const existing = readStore();
  if (existing) return existing;
  const seeded = seed();
  writeStore(seeded);
  return seeded;
}

function sortNewestFirst(estimates: Estimate[]): Estimate[] {
  return [...estimates].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function requireEstimate(estimates: Estimate[], id: string): { next: Estimate[]; estimate: Estimate } {
  const index = estimates.findIndex((estimate) => estimate.id === id);
  if (index === -1) throw new Error('Estimate not found. It may have been deleted.');
  return { next: estimates, estimate: estimates[index] };
}

function replaceAt(estimates: Estimate[], updated: Estimate): Estimate[] {
  return estimates.map((estimate) => (estimate.id === updated.id ? updated : estimate));
}

/* ------------------------------------------------------------------ */
/* Public adapter                                                      */
/* ------------------------------------------------------------------ */

export const mockEstimateService: EstimateService = {
  async listEstimates(): Promise<Estimate[]> {
    await delay(320);
    return sortNewestFirst(ensureStore());
  },

  async getEstimate(id: string): Promise<Estimate | null> {
    await delay(240);
    const { estimate } = requireEstimate(ensureStore(), id);
    return estimate;
  },

  async createEstimate(input: Estimate['input']): Promise<Estimate> {
    await delay(420);
    const estimates = ensureStore();
    const now = new Date().toISOString();
    const estimate: Estimate = {
      id: newId('est'),
      origin: 'user',
      stage: 'draft',
      createdAt: now,
      updatedAt: now,
      input,
      features: [],
      assumptions: [],
      missingRequirements: [],
      result: null,
      scenarios: [],
    };
    writeStore([estimate, ...estimates]);
    return estimate;
  },

  async updateEstimate(id: string, patch: EstimatePatch): Promise<Estimate> {
    await delay(260);
    const estimates = ensureStore();
    const { estimate } = requireEstimate(estimates, id);
    const hasScopeChange =
      patch.features !== undefined ||
      patch.assumptions !== undefined ||
      patch.missingRequirements !== undefined;
    const updated: Estimate = {
      ...estimate,
      input: patch.input ? { ...estimate.input, ...patch.input } : estimate.input,
      features: patch.features ?? estimate.features,
      assumptions: patch.assumptions ?? estimate.assumptions,
      missingRequirements: patch.missingRequirements ?? estimate.missingRequirements,
      // Editing the scope invalidates the previous projection.
      result: hasScopeChange && patch.features !== undefined ? null : estimate.result,
      stage:
        hasScopeChange && patch.features !== undefined && estimate.result
          ? 'breakdown'
          : estimate.stage,
      updatedAt: new Date().toISOString(),
    };
    writeStore(replaceAt(estimates, updated));
    return updated;
  },

  async deleteEstimate(id: string): Promise<void> {
    await delay(260);
    const estimates = ensureStore();
    requireEstimate(estimates, id);
    writeStore(estimates.filter((estimate) => estimate.id !== id));
  },

  async runEstimate(id: string): Promise<Estimate> {
    await delay(760);
    const estimates = ensureStore();
    const { estimate } = requireEstimate(estimates, id);
    const active = estimate.features.filter((feature) => feature.status !== 'removed');
    if (active.length === 0) {
      throw new Error('Add at least one feature to the scope before running the estimate.');
    }
    const projection = project(estimate.input, estimate.features, estimate.missingRequirements.length);
    const updated: Estimate = {
      ...estimate,
      stage: 'estimated',
      result: toResult(estimate.input, projection),
      updatedAt: new Date().toISOString(),
    };
    writeStore(replaceAt(estimates, updated));
    return updated;
  },

  async runScenario(id: string, input: ScenarioInput): Promise<ScenarioResult> {
    await delay(620);
    const estimates = ensureStore();
    const { estimate } = requireEstimate(estimates, id);
    if (!estimate.result) {
      throw new Error('Run the baseline estimate before evaluating a what-if scenario.');
    }
    const base = estimate.result;
    const scopeFactor = clamp(1 + input.scopeDeltaPercent / 100, 0.1, 3);
    const effort: Range = {
      low: round(base.effortDays.low * scopeFactor),
      likely: round(base.effortDays.likely * scopeFactor),
      high: round(base.effortDays.high * scopeFactor),
    };
    const durationWeeks = durationFor(effort, input.teamSize);
    const cost: Range = {
      low: round(effort.low * input.blendedRatePerDay),
      likely: round(effort.likely * input.blendedRatePerDay),
      high: round(effort.high * input.blendedRatePerDay),
    };

    const percentDelta = (value: number, baseline: number): number =>
      baseline === 0 ? 0 : round(((value - baseline) / baseline) * 1000) / 10;

    let deadlineFit: ScenarioResult['deadlineFit'] = null;
    if (input.targetWeeks !== null && input.targetWeeks > 0) {
      const ratio = durationWeeks.likely / input.targetWeeks;
      deadlineFit = ratio <= 0.9 ? 'feasible' : ratio <= 1.05 ? 'tight' : 'infeasible';
    }

    const scenario: ScenarioResult = {
      id: newId('scn'),
      input,
      effortDays: effort,
      durationWeeks,
      cost,
      currency: estimate.input.currency,
      deltas: {
        costPercent: percentDelta(cost.likely, base.cost.likely),
        effortPercent: percentDelta(effort.likely, base.effortDays.likely),
        durationPercent: percentDelta(durationWeeks.likely, base.durationWeeks.likely),
      },
      deadlineFit,
      source: MOCK_SOURCE,
      createdAt: new Date().toISOString(),
    };

    const updated: Estimate = {
      ...estimate,
      scenarios: [scenario, ...estimate.scenarios],
      updatedAt: new Date().toISOString(),
    };
    writeStore(replaceAt(estimates, updated));
    return scenario;
  },

  async removeScenario(estimateId: string, scenarioId: string): Promise<void> {
    await delay(220);
    const estimates = ensureStore();
    const { estimate } = requireEstimate(estimates, estimateId);
    const updated: Estimate = {
      ...estimate,
      scenarios: estimate.scenarios.filter((scenario) => scenario.id !== scenarioId),
      updatedAt: new Date().toISOString(),
    };
    writeStore(replaceAt(estimates, updated));
  },
};
