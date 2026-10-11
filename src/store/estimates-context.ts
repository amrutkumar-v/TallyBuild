import { createContext, useContext } from 'react';
import type { Estimate, ProjectInput, ScenarioInput, ScenarioResult } from '../types';
import type { EstimatePatch } from '../services';

export type LoadStatus = 'loading' | 'ready' | 'error';

export interface EstimatesContextValue {
  status: LoadStatus;
  error: string | null;
  /** All estimates, newest first. */
  estimates: Estimate[];
  getEstimate(id: string): Estimate | undefined;
  reload(): Promise<void>;
  createEstimate(input: ProjectInput): Promise<Estimate>;
  updateEstimate(id: string, patch: EstimatePatch): Promise<Estimate>;
  removeEstimate(id: string): Promise<void>;
  runEstimate(id: string): Promise<Estimate>;
  runScenario(estimateId: string, input: ScenarioInput): Promise<ScenarioResult>;
  removeScenario(estimateId: string, scenarioId: string): Promise<void>;
}

export const EstimatesContext = createContext<EstimatesContextValue | null>(null);

export function useEstimates(): EstimatesContextValue {
  const value = useContext(EstimatesContext);
  if (!value) {
    throw new Error('useEstimates must be used inside <EstimatesProvider>.');
  }
  return value;
}
