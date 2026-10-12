import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';

import { SAMPLE_ESTIMATES } from '../data/sampleEstimates';
import { EstimatesContext } from './estimates-context';
import type { EstimatesContextValue } from './estimates-context';
import type { Estimate } from '../types';

const LOCAL_ESTIMATES_KEY = 'tallybuild.local-estimates.v2';
const SAMPLE_TOGGLE_KEY = 'tallybuild.sample-data.v1';
const STORAGE_PROBE_KEY = 'tallybuild.storage-probe';

function storageAvailable(): boolean {
  try {
    window.localStorage.setItem(STORAGE_PROBE_KEY, '1');
    window.localStorage.removeItem(STORAGE_PROBE_KEY);
    return true;
  } catch {
    return false;
  }
}

function isEstimate(value: unknown): value is Estimate {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.projectName === 'string' &&
    typeof candidate.scope === 'string' &&
    typeof candidate.category === 'string' &&
    typeof candidate.complexity === 'string' &&
    typeof candidate.currency === 'string' &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.status === 'string' &&
    (candidate.plannedStartDate === null || typeof candidate.plannedStartDate === 'string') &&
    (candidate.durationWeeks === null || typeof candidate.durationWeeks === 'number') &&
    (candidate.estimatedAmount === null || typeof candidate.estimatedAmount === 'number') &&
    (candidate.actualAmount === null || typeof candidate.actualAmount === 'number') &&
    candidate.origin === 'local'
  );
}

function readLocalEstimates(): Estimate[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_ESTIMATES_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isEstimate);
  } catch {
    return [];
  }
}

function readSampleToggle(): boolean {
  try {
    const raw = window.localStorage.getItem(SAMPLE_TOGGLE_KEY);
    return raw === null ? true : raw !== 'false';
  } catch {
    return true;
  }
}

function persist(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
}

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `local-${crypto.randomUUID()}`;
  }
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

interface EstimatesProviderProps {
  children: ReactNode;
}

export function EstimatesProvider({ children }: EstimatesProviderProps): ReactElement {
  const [localEstimates, setLocalEstimates] = useState<Estimate[]>(readLocalEstimates);
  const [sampleDataVisible, setSampleDataVisible] = useState<boolean>(readSampleToggle);
  const [persistenceAvailable] = useState<boolean>(storageAvailable);

  useEffect(() => {
    persist(LOCAL_ESTIMATES_KEY, localEstimates);
  }, [localEstimates]);

  useEffect(() => {
    persist(SAMPLE_TOGGLE_KEY, sampleDataVisible);
  }, [sampleDataVisible]);

  const addEstimate = useCallback<EstimatesContextValue['addEstimate']>((input) => {
    const estimate: Estimate = {
      id: createId(),
      projectName: input.projectName,
      scope: input.scope,
      category: input.category,
      complexity: input.complexity,
      currency: input.currency,
      createdAt: new Date().toISOString(),
      plannedStartDate: input.plannedStartDate ?? null,
      durationWeeks: input.durationWeeks ?? null,
      estimatedAmount: input.estimatedAmount ?? null,
      actualAmount: null,
      status: 'draft',
      origin: 'local',
      notes: input.notes,
    };
    setLocalEstimates((current) => [estimate, ...current]);
    return estimate;
  }, []);

  const clearAllDrafts = useCallback(() => {
    try {
      window.localStorage.removeItem(LOCAL_ESTIMATES_KEY);
      setLocalEstimates([]);
    } catch {
      // ignore
    }
  }, []);

  const toggleSampleData = useCallback(() => {
    setSampleDataVisible((current) => !current);
  }, []);

  const estimates = useMemo(() => {
    const combined = sampleDataVisible
      ? [...SAMPLE_ESTIMATES, ...localEstimates]
      : [...localEstimates];
    return combined.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }, [localEstimates, sampleDataVisible]);

  const value = useMemo<EstimatesContextValue>(
    () => ({
      estimates,
      sampleDataVisible,
      toggleSampleData,
      persistenceAvailable,
      addEstimate,
      clearAllDrafts,
    }),
    [estimates, sampleDataVisible, toggleSampleData, persistenceAvailable, addEstimate, clearAllDrafts],
  );

  return <EstimatesContext.Provider value={value}>{children}</EstimatesContext.Provider>;
}