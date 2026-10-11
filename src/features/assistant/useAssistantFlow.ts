import { useCallback, useMemo, useReducer, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { errorMessage } from '../../services';
import { useEstimates } from '../../store/estimates-context';
import { newId } from '../../utils/id';
import { starterScopeFor } from '../intake/intakeFlow';
import type { CurrencyCode, Feature } from '../../types';
import {
  ASSISTANT_SUGGESTIONS,
  ASSISTANT_TOTAL_STEPS,
  assistantReducer,
  buildAssistantProjectInput,
  createInitialAssistantState,
  currentStep,
  deriveAssistantAssumptions,
} from './assistantFlow';
import type { AssistantFieldId, AssistantState, AssistantStep } from './assistantFlow';

export interface UseAssistantFlow {
  state: AssistantState;
  step: AssistantStep | null;
  totalSteps: number;
  suggestions: typeof ASSISTANT_SUGGESTIONS;
  showSuggestions: boolean;
  answer(value: string): void;
  useSuggestion(index: number): void;
  back(): void;
  editStep(fieldId: AssistantFieldId): void;
  setCurrency(currency: CurrencyCode): void;
  confirm(): void;
  retry(): void;
  reset(): void;
  openWorkspace(): void;
}

/**
 * Owns the guided conversation state and performs the single async operation
 * (creating + running the estimate through the active `EstimateService`).
 * Calculation logic is never duplicated here — it is delegated to the service.
 */
export function useAssistantFlow(): UseAssistantFlow {
  const navigate = useNavigate();
  const { createEstimate, updateEstimate, runEstimate } = useEstimates();
  const [state, dispatch] = useReducer(assistantReducer, undefined, createInitialAssistantState);
  const inFlight = useRef(false);

  const step = useMemo(() => currentStep(state), [state]);

  const answer = useCallback((value: string) => {
    dispatch({ type: 'answer', value });
  }, []);

  const useSuggestion = useCallback((index: number) => {
    const suggestion = ASSISTANT_SUGGESTIONS[index];
    if (!suggestion) return;
    dispatch({ type: 'answer', value: suggestion.brief });
  }, []);

  const back = useCallback(() => {
    dispatch({ type: 'back' });
  }, []);

  const editStep = useCallback((fieldId: AssistantFieldId) => {
    dispatch({ type: 'editStep', stepId: fieldId });
  }, []);

  const setCurrency = useCallback((currency: CurrencyCode) => {
    dispatch({ type: 'setCurrency', currency });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'reset' });
  }, []);

  const confirm = useCallback(() => {
    if (inFlight.current || state.busy) return;
    inFlight.current = true;
    dispatch({ type: 'startCalculation' });

    const run = async (): Promise<void> => {
      try {
        const input = buildAssistantProjectInput(state.draft);
        const created = await createEstimate(input);
        const features: Feature[] = starterScopeFor(input.projectType).map((feature) => ({
          ...feature,
          id: newId('feat'),
        }));
        await updateEstimate(created.id, {
          features,
          assumptions: deriveAssistantAssumptions(state.draft),
          missingRequirements: [],
        });
        const estimate = await runEstimate(created.id);
        dispatch({ type: 'calculationResolved', estimate });
      } catch (caught) {
        dispatch({ type: 'calculationFailed', message: errorMessage(caught) });
      } finally {
        inFlight.current = false;
      }
    };

    void run();
  }, [state.busy, state.draft, createEstimate, updateEstimate, runEstimate]);

  const retry = useCallback(() => {
    confirm();
  }, [confirm]);

  const openWorkspace = useCallback(() => {
    if (!state.result) return;
    navigate(`/estimates/${state.result.id}/results`);
    dispatch({ type: 'reset' });
  }, [navigate, state.result]);

  const showSuggestions =
    (state.stage === 'overview' || state.stage === 'inputs') &&
    state.stepIndex === 0 &&
    state.draft.requirements.trim() === '';

  return {
    state,
    step,
    totalSteps: ASSISTANT_TOTAL_STEPS,
    suggestions: ASSISTANT_SUGGESTIONS,
    showSuggestions,
    answer,
    useSuggestion,
    back,
    editStep,
    setCurrency,
    confirm,
    retry,
    reset,
    openWorkspace,
  };
}
