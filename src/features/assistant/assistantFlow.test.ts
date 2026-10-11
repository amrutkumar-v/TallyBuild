import { describe, expect, it } from 'vitest';

import {
  ASSISTANT_STEPS,
  assistantReducer,
  buildAssistantProjectInput,
  costSections,
  createInitialAssistantState,
  validateAssistantField,
} from './assistantFlow';
import type { AssistantState } from './assistantFlow';

function answer(state: AssistantState, value: string): AssistantState {
  return assistantReducer(state, { type: 'answer', value });
}

function completeValidDraft(): AssistantState {
  let state = createInitialAssistantState();
  state = answer(state, 'A customer-facing food delivery app with courier tracking and admin.');
  state = answer(state, 'Delivery app');
  state = answer(state, 'web-app');
  state = answer(state, '4');
  state = answer(state, 'india');
  state = answer(state, 'medium');
  state = answer(state, '9000');
  state = answer(state, '');
  return state;
}

describe('assistantFlow initial state', () => {
  it('starts on the first overview step with a welcome and first prompt', () => {
    const state = createInitialAssistantState();
    expect(state.stage).toBe('overview');
    expect(state.stepIndex).toBe(0);
    expect(state.messages).toHaveLength(2);
    expect(state.messages[0].role).toBe('assistant');
    expect(state.messages[0].text).toMatch(/estimation assistant/i);
    expect(state.messages[1].text).toBe(ASSISTANT_STEPS[0].prompt);
  });
});

describe('assistantFlow validation', () => {
  it('rejects a brief that is too short without advancing', () => {
    const state = createInitialAssistantState();
    const next = answer(state, 'too short');
    expect(next.stepIndex).toBe(0);
    expect(next.stage).toBe('overview');
    expect(next.fieldError).toMatch(/more detail/i);
  });

  it('accepts a valid brief and advances, recording the user answer', () => {
    const state = createInitialAssistantState();
    const next = answer(state, 'A mobile app for booking home services in three cities.');
    expect(next.stepIndex).toBe(1);
    expect(next.fieldError).toBeNull();
    expect(next.messages.at(-2)).toMatchObject({ role: 'user' });
    expect(next.messages.at(-1)).toMatchObject({ role: 'assistant' });
  });

  it('enforces team size and rate bounds', () => {
    const teamStep = ASSISTANT_STEPS.find((step) => step.id === 'teamSize');
    const rateStep = ASSISTANT_STEPS.find((step) => step.id === 'rate');
    expect(teamStep && validateAssistantField(teamStep, { ...createInitialAssistantState().draft, teamSize: '0' })).toMatch(/at least 1/i);
    expect(teamStep && validateAssistantField(teamStep, { ...createInitialAssistantState().draft, teamSize: '1000' })).toMatch(/100 or fewer/i);
    expect(rateStep && validateAssistantField(rateStep, { ...createInitialAssistantState().draft, rate: '-5' })).toMatch(/greater than zero/i);
  });
});

describe('assistantFlow progression', () => {
  it('reaches review once every required field is valid', () => {
    const state = completeValidDraft();
    expect(state.stage).toBe('review');
    expect(state.stepIndex).toBe(ASSISTANT_STEPS.length);
    expect(state.fieldError).toBeNull();
  });

  it('can step back from review to the last input', () => {
    const review = completeValidDraft();
    const back = assistantReducer(review, { type: 'back' });
    expect(back.stage).toBe('inputs');
    expect(back.stepIndex).toBe(ASSISTANT_STEPS.length - 1);
  });

  it('can edit a specific step from review', () => {
    const review = completeValidDraft();
    const edited = assistantReducer(review, { type: 'editStep', stepId: 'projectType' });
    expect(edited.stepIndex).toBe(2);
    expect(edited.stage).toBe('overview');
  });

  it('updates the currency without advancing', () => {
    const state = createInitialAssistantState();
    const next = assistantReducer(state, { type: 'setCurrency', currency: 'USD' });
    expect(next.draft.currency).toBe('USD');
    expect(next.stepIndex).toBe(0);
  });
});

describe('assistantFlow calculation transitions', () => {
  it('prevents duplicate submission while busy', () => {
    const review = completeValidDraft();
    const calculating = assistantReducer(review, { type: 'startCalculation' });
    expect(calculating.stage).toBe('calculating');
    expect(calculating.busy).toBe(true);
    const second = assistantReducer(calculating, { type: 'startCalculation' });
    expect(second).toBe(calculating);
  });

  it('stores the resolved estimate and moves to result', () => {
    const review = completeValidDraft();
    const calculating = assistantReducer(review, { type: 'startCalculation' });
    const estimate = buildAssistantProjectInput(calculating.draft);
    const resolved = assistantReducer(calculating, {
      type: 'calculationResolved',
      estimate: {
        id: 'est-1',
        origin: 'user',
        stage: 'estimated',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        input: estimate,
        features: [],
        assumptions: [],
        missingRequirements: [],
        result: null,
        scenarios: [],
      },
    });
    expect(resolved.stage).toBe('result');
    expect(resolved.busy).toBe(false);
    expect(resolved.result?.id).toBe('est-1');
  });

  it('moves to an error state and can return to review', () => {
    const review = completeValidDraft();
    const calculating = assistantReducer(review, { type: 'startCalculation' });
    const failed = assistantReducer(calculating, { type: 'calculationFailed', message: 'Backend unavailable' });
    expect(failed.stage).toBe('error');
    expect(failed.error).toBe('Backend unavailable');
    const back = assistantReducer(failed, { type: 'back' });
    expect(back.stage).toBe('review');
  });

  it('resets back to the initial state', () => {
    const review = completeValidDraft();
    const reset = assistantReducer(review, { type: 'reset' });
    const initial = createInitialAssistantState();
    expect(reset.stage).toBe(initial.stage);
    expect(reset.stepIndex).toBe(initial.stepIndex);
    expect(reset.draft).toEqual(initial.draft);
    expect(reset.result).toBeNull();
    expect(reset.messages.map((message) => message.role)).toEqual(
      initial.messages.map((message) => message.role),
    );
  });
});

describe('assistantFlow contract mapping', () => {
  it('maps the draft onto ProjectInput', () => {
    const state = completeValidDraft();
    const input = buildAssistantProjectInput(state.draft);
    expect(input).toMatchObject({
      projectName: 'Delivery app',
      projectType: 'web-app',
      teamSize: 4,
      teamLocation: 'india',
      complexity: 'medium',
      blendedRatePerDay: 9000,
      currency: 'INR',
    });
    expect(input.requirements.length).toBeGreaterThan(20);
    expect(input.targetDeadline).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('models only personnel cost and marks expense categories as pending', () => {
    const sections = costSections();
    const personnel = sections.find((section) => section.id === 'personnel');
    const tooling = sections.find((section) => section.id === 'tooling');
    expect(personnel?.status).toBe('modelled');
    expect(tooling?.status).toBe('pending');
  });
});
