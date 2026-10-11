import type { Estimate, EstimateStage } from '../types';

/** Stage as shown in the UI, derived from the estimate's actual contents. */
export function effectiveStage(estimate: Estimate): EstimateStage {
  if (estimate.result) return 'estimated';
  if (estimate.features.length > 0) return 'breakdown';
  return estimate.stage;
}

export function activeFeatures(estimate: Estimate) {
  return estimate.features.filter((feature) => feature.status !== 'removed');
}

export function estimatedCount(estimates: Estimate[]): number {
  return estimates.filter((estimate) => estimate.result !== null).length;
}
