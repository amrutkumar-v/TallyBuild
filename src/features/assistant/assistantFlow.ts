import {
  complexityOptions,
  projectTypeOptions,
  teamLocationOptions,
} from '../../constants/labels';
import type {
  Complexity,
  CurrencyCode,
  Estimate,
  ProjectInput,
  ProjectType,
  TeamLocation,
} from '../../types';
import { newId } from '../../utils/id';

/**
 * Guided estimation conversation for the floating assistant.
 *
 * This is a DETERMINISTIC, state-driven flow — it is NOT an AI model. It only
 * collects the existing `ProjectInput` contract, validates it, and hands the
 * numbers off to the approved estimation service. It never invents totals and
 * it never calls a network endpoint of its own.
 */

export type AssistantStage =
  | 'overview'
  | 'inputs'
  | 'review'
  | 'calculating'
  | 'result'
  | 'error';

export type AssistantFieldId =
  | 'requirements'
  | 'name'
  | 'projectType'
  | 'teamSize'
  | 'teamLocation'
  | 'complexity'
  | 'rate'
  | 'deadline';

export type AssistantKind = 'textarea' | 'text' | 'choice' | 'number' | 'date';

export interface AssistantChoice {
  value: string;
  label: string;
}

export interface AssistantStep {
  id: AssistantFieldId;
  stage: 'overview' | 'inputs';
  prompt: string;
  kind: AssistantKind;
  required: boolean;
  placeholder?: string;
  help?: string;
  choices?: AssistantChoice[];
}

/** Draft held while the conversation runs; numeric fields stay strings. */
export interface AssistantDraft {
  requirements: string;
  name: string;
  projectType: ProjectType | '';
  teamSize: string;
  teamLocation: TeamLocation | '';
  complexity: Complexity | '';
  rate: string;
  currency: CurrencyCode;
  deadline: string;
}

export interface AssistantMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
}

export interface AssistantState {
  stage: AssistantStage;
  stepIndex: number;
  draft: AssistantDraft;
  messages: AssistantMessage[];
  fieldError: string | null;
  result: Estimate | null;
  error: string | null;
  busy: boolean;
}

export const WELCOME_MESSAGE =
  'Hi — I am the TallyBuild estimation assistant. I help you scope a software project and produce a transparent effort, cost and timeline estimate. I only use the information you give me and the day rate you provide — nothing is invented. Shall we start?';

export const ASSISTANT_SUGGESTIONS: Array<{ label: string; brief: string }> = [
  {
    label: 'Estimate a food delivery app.',
    brief:
      'A customer-facing food delivery product: people browse restaurants, place orders and track delivery, couriers accept and fulfil jobs, and an admin back office manages restaurants, menus and payouts.',
  },
  {
    label: 'Plan a college management system.',
    brief:
      'A college management system covering admissions, attendance, exam records and fees, with separate student, faculty and administrator portals and role-based access.',
  },
  {
    label: 'Estimate a SaaS dashboard.',
    brief:
      'A multi-tenant SaaS analytics dashboard with subscription billing, team accounts with roles, and configurable reports and exports.',
  },
  {
    label: 'Help me define my project requirements.',
    brief:
      'We need a web application that [problem it solves]. The main users are [audience]. The must-have features are [feature one], [feature two] and [feature three].',
  },
];

export const ASSISTANT_STEPS: AssistantStep[] = [
  {
    id: 'requirements',
    stage: 'overview',
    prompt:
      'Tell me about the software you want to build. The problem it solves, who uses it and the must-have features is plenty.',
    kind: 'textarea',
    required: true,
    placeholder: 'e.g. A web dashboard for regional managers to track daily sales…',
    help: 'This becomes the brief on the estimate and can be refined later.',
  },
  {
    id: 'name',
    stage: 'overview',
    prompt: 'What should I call this estimate?',
    kind: 'text',
    required: true,
    placeholder: 'e.g. RetailOps store dashboard',
  },
  {
    id: 'projectType',
    stage: 'overview',
    prompt: 'Which category fits best?',
    kind: 'choice',
    required: true,
    choices: projectTypeOptions,
  },
  {
    id: 'teamSize',
    stage: 'inputs',
    prompt: 'How many people will deliver it?',
    kind: 'number',
    required: true,
    placeholder: 'e.g. 4',
    help: 'Used only to shape the indicative timeline and is never invented.',
  },
  {
    id: 'teamLocation',
    stage: 'inputs',
    prompt: 'Where is the delivery team based?',
    kind: 'choice',
    required: true,
    choices: teamLocationOptions,
  },
  {
    id: 'complexity',
    stage: 'inputs',
    prompt: 'How well understood is the build?',
    kind: 'choice',
    required: true,
    choices: complexityOptions,
  },
  {
    id: 'rate',
    stage: 'inputs',
    prompt: 'What blended cost per person-day should I apply?',
    kind: 'number',
    required: true,
    placeholder: 'e.g. 9000',
    help: 'Cost is derived only from the rate you enter — no market rates are assumed.',
  },
  {
    id: 'deadline',
    stage: 'inputs',
    prompt: 'Is there a target deadline?',
    kind: 'date',
    required: false,
    help: 'Optional. Skip it and a 16-week reference deadline is assumed.',
  },
];

export const ASSISTANT_TOTAL_STEPS = ASSISTANT_STEPS.length;

/** Stage B cost categories, shown explicitly in review and results. */
export interface CostSection {
  id: 'personnel' | 'tooling' | 'infrastructure' | 'other';
  label: string;
  detail: string;
  status: 'modelled' | 'pending';
}

export function costSections(): CostSection[] {
  return [
    {
      id: 'personnel',
      label: 'Personnel & labour',
      detail: 'Effort person-days × your blended day rate.',
      status: 'modelled',
    },
    {
      id: 'tooling',
      label: 'Tooling & licences',
      detail: 'Not in the current contract; itemised tooling needs the backend expense schema.',
      status: 'pending',
    },
    {
      id: 'infrastructure',
      label: 'Infrastructure & hosting',
      detail: 'Not in the current contract; will be itemised once the expense schema exists.',
      status: 'pending',
    },
    {
      id: 'other',
      label: 'Other costs',
      detail: 'Not in the current contract; no placeholder money is shown.',
      status: 'pending',
    },
  ];
}

export function createAssistantDraft(currency: CurrencyCode = 'INR'): AssistantDraft {
  return {
    requirements: '',
    name: '',
    projectType: '',
    teamSize: '',
    teamLocation: '',
    complexity: '',
    rate: '',
    currency,
    deadline: '',
  };
}

function assistantMessage(text: string): AssistantMessage {
  return { id: newId('amsg'), role: 'assistant', text };
}

export function createInitialAssistantState(): AssistantState {
  return {
    stage: ASSISTANT_STEPS[0].stage,
    stepIndex: 0,
    draft: createAssistantDraft(),
    messages: [assistantMessage(WELCOME_MESSAGE), assistantMessage(ASSISTANT_STEPS[0].prompt)],
    fieldError: null,
    result: null,
    error: null,
    busy: false,
  };
}

export function currentStep(state: AssistantState): AssistantStep | null {
  if (state.stage !== 'overview' && state.stage !== 'inputs') return null;
  return ASSISTANT_STEPS[state.stepIndex] ?? null;
}

function applyAnswer(draft: AssistantDraft, id: AssistantFieldId, value: string): AssistantDraft {
  switch (id) {
    case 'requirements':
      return { ...draft, requirements: value };
    case 'name':
      return { ...draft, name: value };
    case 'projectType':
      return { ...draft, projectType: value as AssistantDraft['projectType'] };
    case 'teamSize':
      return { ...draft, teamSize: value };
    case 'teamLocation':
      return { ...draft, teamLocation: value as AssistantDraft['teamLocation'] };
    case 'complexity':
      return { ...draft, complexity: value as AssistantDraft['complexity'] };
    case 'rate':
      return { ...draft, rate: value };
    case 'deadline':
      return { ...draft, deadline: value };
    default:
      return draft;
  }
}

export function validateAssistantField(
  step: AssistantStep,
  draft: AssistantDraft,
): string | null {
  switch (step.id) {
    case 'requirements':
      return draft.requirements.trim().length < 20
        ? 'Please add a little more detail (at least 20 characters).'
        : null;
    case 'name':
      return draft.name.trim() ? null : 'Give the estimate a name.';
    case 'projectType':
      return draft.projectType ? null : 'Choose a project category.';
    case 'teamLocation':
      return draft.teamLocation ? null : 'Choose a team location.';
    case 'complexity':
      return draft.complexity ? null : 'Choose a complexity level.';
    case 'teamSize': {
      if (!draft.teamSize.trim()) return 'Enter a team size.';
      const size = Number(draft.teamSize);
      if (!Number.isFinite(size) || size < 1) return 'Team size must be at least 1.';
      if (size > 100) return 'Team size looks too large — enter 100 or fewer.';
      return null;
    }
    case 'rate': {
      if (!draft.rate.trim()) return 'Enter a blended day rate.';
      const rate = Number(draft.rate);
      if (!Number.isFinite(rate) || rate <= 0) return 'Day rate must be greater than zero.';
      return null;
    }
    default:
      return null;
  }
}

function labelFor(options: AssistantChoice[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function formatAssistantAnswer(step: AssistantStep, draft: AssistantDraft): string {
  switch (step.id) {
    case 'requirements':
      return draft.requirements.trim();
    case 'name':
      return draft.name.trim();
    case 'projectType':
      return labelFor(projectTypeOptions, draft.projectType);
    case 'teamSize':
      return `${draft.teamSize.trim()} ${Number(draft.teamSize) === 1 ? 'person' : 'people'}`;
    case 'teamLocation':
      return labelFor(teamLocationOptions, draft.teamLocation);
    case 'complexity':
      return labelFor(complexityOptions, draft.complexity);
    case 'rate':
      return `${draft.currency} ${draft.rate.trim()} per person-day`;
    case 'deadline':
      return draft.deadline ? draft.deadline : 'No deadline';
    default:
      return '';
  }
}

export function defaultReferenceDeadline(): string {
  const date = new Date();
  date.setDate(date.getDate() + 16 * 7);
  return date.toISOString().slice(0, 10);
}

/** Map the draft onto the real `ProjectInput` contract. */
export function buildAssistantProjectInput(draft: AssistantDraft): ProjectInput {
  const teamSize = Math.min(100, Math.max(1, Math.round(Number(draft.teamSize) || 1)));
  return {
    projectName: draft.name.trim() || 'Untitled estimate',
    requirements: draft.requirements.trim(),
    projectType: draft.projectType as ProjectType,
    complexity: draft.complexity as Complexity,
    targetDeadline: draft.deadline || defaultReferenceDeadline(),
    teamSize,
    teamLocation: draft.teamLocation as TeamLocation,
    blendedRatePerDay: Math.max(0, Number(draft.rate) || 0),
    currency: draft.currency,
    constraints: [],
  };
}

export function deriveAssistantAssumptions(draft: AssistantDraft): string[] {
  const assumptions: string[] = [
    'Captured through the guided floating assistant — a deterministic flow, not an AI model.',
  ];
  if (!draft.deadline) {
    assumptions.push('No target deadline supplied; a 16-week reference deadline is assumed.');
  }
  return assumptions;
}

/* ------------------------------------------------------------------ */
/* Reducer — pure, deterministic transitions                           */
/* ------------------------------------------------------------------ */

export type AssistantAction =
  | { type: 'answer'; value: string }
  | { type: 'back' }
  | { type: 'editStep'; stepId: AssistantFieldId }
  | { type: 'setCurrency'; currency: CurrencyCode }
  | { type: 'startCalculation' }
  | { type: 'calculationResolved'; estimate: Estimate }
  | { type: 'calculationFailed'; message: string }
  | { type: 'retry' }
  | { type: 'reset' };

export function assistantReducer(
  state: AssistantState,
  action: AssistantAction,
): AssistantState {
  switch (action.type) {
    case 'answer': {
      const step = currentStep(state);
      if (!step) return state;
      const nextDraft = applyAnswer(state.draft, step.id, action.value);
      const error = validateAssistantField(step, nextDraft);
      if (error) {
        return { ...state, draft: nextDraft, fieldError: error };
      }

      const nextIndex = state.stepIndex + 1;
      const userBubble: AssistantMessage = {
        id: newId('amsg'),
        role: 'user',
        text: formatAssistantAnswer(step, nextDraft),
      };

      if (nextIndex < ASSISTANT_STEPS.length) {
        const nextStep = ASSISTANT_STEPS[nextIndex];
        return {
          ...state,
          draft: nextDraft,
          stepIndex: nextIndex,
          stage: nextStep.stage,
          fieldError: null,
          messages: [...state.messages, userBubble, assistantMessage(nextStep.prompt)],
        };
      }

      return {
        ...state,
        draft: nextDraft,
        stepIndex: nextIndex,
        stage: 'review',
        fieldError: null,
        messages: [
          ...state.messages,
          userBubble,
          assistantMessage(
            'That is everything I need. Review the summary below, then ask me to calculate the estimate.',
          ),
        ],
      };
    }

    case 'back': {
      if (state.stage === 'error') {
        return {
          ...state,
          stage: 'review',
          error: null,
          messages: [
            ...state.messages,
            assistantMessage('No problem — adjust any input below and try again.'),
          ],
        };
      }
      if (state.stage === 'review') {
        const lastIndex = ASSISTANT_STEPS.length - 1;
        return {
          ...state,
          stage: ASSISTANT_STEPS[lastIndex].stage,
          stepIndex: lastIndex,
          fieldError: null,
          messages: [...state.messages, assistantMessage(`Let's revisit: ${ASSISTANT_STEPS[lastIndex].prompt}`)],
        };
      }
      if (state.stepIndex === 0) return state;
      const prevIndex = state.stepIndex - 1;
      return {
        ...state,
        stage: ASSISTANT_STEPS[prevIndex].stage,
        stepIndex: prevIndex,
        fieldError: null,
        messages: [...state.messages, assistantMessage(`Let's revisit: ${ASSISTANT_STEPS[prevIndex].prompt}`)],
      };
    }

    case 'editStep': {
      const index = ASSISTANT_STEPS.findIndex((step) => step.id === action.stepId);
      if (index < 0) return state;
      return {
        ...state,
        stage: ASSISTANT_STEPS[index].stage,
        stepIndex: index,
        fieldError: null,
        messages: [...state.messages, assistantMessage(`Let's revisit: ${ASSISTANT_STEPS[index].prompt}`)],
      };
    }

    case 'setCurrency':
      return { ...state, draft: { ...state.draft, currency: action.currency } };

    case 'startCalculation':
      if (state.busy) return state;
      return { ...state, stage: 'calculating', busy: true, error: null };

    case 'retry':
      if (state.busy) return state;
      return { ...state, stage: 'calculating', busy: true, error: null };

    case 'calculationResolved':
      return {
        ...state,
        stage: 'result',
        busy: false,
        error: null,
        result: action.estimate,
        messages: [
          ...state.messages,
          assistantMessage('Here is the estimate your inputs produced.'),
        ],
      };

    case 'calculationFailed':
      return { ...state, stage: 'error', busy: false, error: action.message };

    case 'reset':
      return createInitialAssistantState();

    default:
      return state;
  }
}
