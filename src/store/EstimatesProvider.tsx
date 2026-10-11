import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { errorMessage, estimateService } from '../services';
import type { Estimate, ProjectInput, ScenarioInput } from '../types';
import { EstimatesContext } from './estimates-context';
import type { EstimatesContextValue, LoadStatus } from './estimates-context';

function sortNewestFirst(estimates: Estimate[]): Estimate[] {
  return [...estimates].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/**
 * Loads estimates through the active service adapter, tracks loading/error
 * state, and exposes the mutations the UI needs. The mock adapter persists to
 * localStorage; the HTTP adapter will persist server-side — the UI is agnostic.
 */
export function EstimatesProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const applyList = useCallback((list: Estimate[]) => {
    setEstimates(sortNewestFirst(list));
    setError(null);
    setStatus('ready');
  }, []);

  const applyError = useCallback((message: string) => {
    setError(message);
    setStatus('error');
  }, []);

  // Initial load. State is updated from the promise callbacks (never
  // synchronously inside the effect), so it cannot cascade renders.
  useEffect(() => {
    let active = true;
    estimateService.listEstimates().then(
      (list) => {
        if (active) applyList(list);
      },
      (caught: unknown) => {
        if (active) applyError(errorMessage(caught));
      },
    );
    return () => {
      active = false;
    };
  }, [applyList, applyError]);

  /** Public refresh used by UI controls; shows the loading state first. */
  const reload = useCallback(async () => {
    setStatus('loading');
    try {
      const list = await estimateService.listEstimates();
      if (!mounted.current) return;
      applyList(list);
    } catch (caught) {
      if (!mounted.current) return;
      applyError(errorMessage(caught));
    }
  }, [applyList, applyError]);

  const upsert = useCallback((updated: Estimate) => {
    setEstimates((current) =>
      sortNewestFirst(
        current.some((estimate) => estimate.id === updated.id)
          ? current.map((estimate) => (estimate.id === updated.id ? updated : estimate))
          : [...current, updated],
      ),
    );
  }, []);

  const value = useMemo<EstimatesContextValue>(() => {
    return {
      status,
      error,
      estimates,
      getEstimate: (id: string) => estimates.find((estimate) => estimate.id === id),
      reload,
      createEstimate: async (input: ProjectInput) => {
        const created = await estimateService.createEstimate(input);
        upsert(created);
        return created;
      },
      updateEstimate: async (id: string, patch) => {
        const updated = await estimateService.updateEstimate(id, patch);
        upsert(updated);
        return updated;
      },
      removeEstimate: async (id: string) => {
        await estimateService.deleteEstimate(id);
        setEstimates((current) => current.filter((estimate) => estimate.id !== id));
      },
      runEstimate: async (id: string) => {
        const updated = await estimateService.runEstimate(id);
        upsert(updated);
        return updated;
      },
      runScenario: async (estimateId: string, input: ScenarioInput) => {
        const scenario = await estimateService.runScenario(estimateId, input);
        setEstimates((current) =>
          sortNewestFirst(
            current.map((estimate) =>
              estimate.id === estimateId
                ? { ...estimate, scenarios: [scenario, ...estimate.scenarios] }
                : estimate,
            ),
          ),
        );
        return scenario;
      },
      removeScenario: async (estimateId: string, scenarioId: string) => {
        await estimateService.removeScenario(estimateId, scenarioId);
        setEstimates((current) =>
          current.map((estimate) =>
            estimate.id === estimateId
              ? { ...estimate, scenarios: estimate.scenarios.filter((s) => s.id !== scenarioId) }
              : estimate,
          ),
        );
      },
    };
  }, [status, error, estimates, reload, upsert]);

  return <EstimatesContext.Provider value={value}>{children}</EstimatesContext.Provider>;
}
