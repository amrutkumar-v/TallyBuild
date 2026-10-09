import { createContext, useContext } from 'react';

import type { Estimate, EstimateDraftInput } from '../types';

export interface EstimatesContextValue {
  estimates: Estimate[];
  sampleDataVisible: boolean;
  toggleSampleData: () => void;
  persistenceAvailable: boolean;
  addEstimate: (input: EstimateDraftInput) => Estimate;
}

export const EstimatesContext = createContext<EstimatesContextValue | null>(null);

export function useEstimates(): EstimatesContextValue {
  const value = useContext(EstimatesContext);
  if (!value) {
    throw new Error('useEstimates must be used inside an EstimatesProvider');
  }
  return value;
}
