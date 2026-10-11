import { useOutletContext } from 'react-router-dom';

import type { Estimate } from '../types';

export interface EstimateRouteContext {
  estimate: Estimate;
}

/** Reads the estimate passed down by `EstimateLayout` through the router outlet. */
export function useEstimateRoute(): EstimateRouteContext {
  return useOutletContext<EstimateRouteContext>();
}
