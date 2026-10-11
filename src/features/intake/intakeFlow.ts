import {
  complexityOptions,
  projectTypeOptions,
  teamLocationOptions,
} from '../../constants/labels';
import type {
  Complexity,
  CurrencyCode,
  Feature,
  FeatureComplexity,
  ProjectInput,
  ProjectType,
  ScopePriority,
  TeamLocation,
} from '../../types';

/**
 * Guided intake flow for the New Estimate chat.
 *
 * This is a deterministic, local question flow — it is NOT an AI model and it
 * never invents prices. Its only job is to turn a short brief into the existing
 * `ProjectInput` contract plus a list of open questions the user can confirm
 * later in the breakdown editor.
 */

export type IntakeFieldId =
  | 'requirements'
  | 'name'
  | 'projectType'
  | 'complexity'
  | 'teamSize'
  | 'teamLocation'
  | 'rate'
  | 'deadline'
  | 'constraints'
  | 'openQuestions';

export type IntakeKind =
  | 'textarea'
  | 'text'
  | 'choice'
  | 'number'
  | 'date'
  | 'constraints'
  | 'open-questions';

export interface IntakeChoice {
  value: string;
  label: string;
}

export interface IntakeField {
  id: IntakeFieldId;
  prompt: string;
  kind: IntakeKind;
  required: boolean;
  placeholder?: string;
  help?: string;
  choices?: IntakeChoice[];
}

/** Draft held while the conversation runs; numeric fields stay strings. */
export interface IntakeDraft {
  requirements: string;
  name: string;
  projectType: ProjectType | '';
  complexity: Complexity | '';
  teamSize: string;
  teamLocation: TeamLocation | '';
  rate: string;
  currency: CurrencyCode;
  deadline: string;
  constraints: string[];
  openQuestions: string[];
}

export const INTAKE_STEPS: IntakeField[] = [
  {
    id: 'requirements',
    prompt:
      'Tell me about the software you want to build. A few sentences on the problem, the main users and the must-have capabilities is plenty.',
    kind: 'textarea',
    required: true,
    placeholder: 'e.g. A web dashboard for regional managers to track daily sales…',
    help: 'This becomes the brief on the estimate. You can refine it later.',
  },
  {
    id: 'name',
    prompt: 'What should I call this estimate?',
    kind: 'text',
    required: true,
    placeholder: 'e.g. RetailOps store dashboard',
  },
  {
    id: 'projectType',
    prompt: 'Which category fits best?',
    kind: 'choice',
    required: true,
    choices: projectTypeOptions,
  },
  {
    id: 'complexity',
    prompt: 'How well understood is the build?',
    kind: 'choice',
    required: true,
    choices: complexityOptions,
  },
  {
    id: 'teamSize',
    prompt: 'How many people will work on it?',
    kind: 'number',
    required: true,
    placeholder: 'e.g. 4',
    help: 'Used only to shape the indicative timeline.',
  },
  {
    id: 'teamLocation',
    prompt: 'Where is the delivery team based?',
    kind: 'choice',
    required: true,
    choices: teamLocationOptions,
  },
  {
    id: 'rate',
    prompt: 'What blended cost per person-day should I apply?',
    kind: 'number',
    required: true,
    placeholder: 'e.g. 9000',
    help: 'Costs are derived only from the rate you enter — no market rates are assumed.',
  },
  {
    id: 'deadline',
    prompt: 'Is there a target deadline?',
    kind: 'date',
    required: false,
    help: 'Optional. If you skip it, a reference deadline is assumed.',
  },
  {
    id: 'constraints',
    prompt: 'Any constraints or non-negotiables I should record?',
    kind: 'constraints',
    required: false,
    help: 'Optional. Pick any that apply, or add your own.',
  },
  {
    id: 'openQuestions',
    prompt: 'What is still unclear? I will keep these as open questions on the estimate.',
    kind: 'open-questions',
    required: false,
    help: 'Optional. Add each open question and press Enter.',
  },
];

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
}

export const constraintPresets: string[] = [
  'Fixed deadline',
  'Fixed budget',
  'Regulatory / compliance',
  'Security review required',
  'Offline support needed',
  'Integrates with existing systems',
  'Must use existing stack',
  'Accessibility requirements',
];

export function createInitialDraft(currency: CurrencyCode = 'INR'): IntakeDraft {
  return {
    requirements: '',
    name: '',
    projectType: '',
    complexity: '',
    teamSize: '',
    teamLocation: '',
    rate: '',
    currency,
    deadline: '',
    constraints: [],
    openQuestions: [],
  };
}

export function defaultDeadline(): string {
  const date = new Date();
  date.setDate(date.getDate() + 16 * 7);
  return date.toISOString().slice(0, 10);
}

/** Suggested estimate name derived from the first words of the brief. */
export function suggestName(requirements: string): string {
  const cleaned = requirements.replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  const firstLine = cleaned.split(/[.!?]/)[0] ?? cleaned;
  const words = firstLine.split(' ').slice(0, 6).join(' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function validateField(field: IntakeField, draft: IntakeDraft): string | null {
  switch (field.id) {
    case 'requirements':
      return draft.requirements.trim().length < 20
        ? 'Please add a little more detail (at least 20 characters).'
        : null;
    case 'name':
      return draft.name.trim() ? null : 'Give the estimate a name.';
    case 'projectType':
      return draft.projectType ? null : 'Choose a project category.';
    case 'complexity':
      return draft.complexity ? null : 'Choose a complexity level.';
    case 'teamSize': {
      const size = Number(draft.teamSize);
      if (!draft.teamSize.trim()) return 'Enter a team size.';
      if (!Number.isFinite(size) || size < 1) return 'Team size must be at least 1.';
      if (size > 100) return 'Team size looks too large — enter 100 or fewer.';
      return null;
    }
    case 'teamLocation':
      return draft.teamLocation ? null : 'Choose a team location.';
    case 'rate': {
      const rate = Number(draft.rate);
      if (!draft.rate.trim()) return 'Enter a blended day rate.';
      if (!Number.isFinite(rate) || rate <= 0) return 'Day rate must be greater than zero.';
      return null;
    }
    default:
      return null;
  }
}

/** Human-readable answer used for the user's chat bubble. */
export function formatAnswer(field: IntakeField, draft: IntakeDraft): string {
  switch (field.id) {
    case 'requirements':
      return draft.requirements.trim();
    case 'name':
      return draft.name.trim();
    case 'projectType':
      return labelFor(projectTypeOptions, draft.projectType);
    case 'complexity':
      return labelFor(complexityOptions, draft.complexity);
    case 'teamSize':
      return `${draft.teamSize.trim()} ${Number(draft.teamSize) === 1 ? 'person' : 'people'}`;
    case 'teamLocation':
      return labelFor(teamLocationOptions, draft.teamLocation);
    case 'rate':
      return `${draft.currency} ${draft.rate.trim()} per person-day`;
    case 'deadline':
      return draft.deadline ? draft.deadline : 'No deadline';
    case 'constraints':
      return draft.constraints.length ? draft.constraints.join(', ') : 'None';
    case 'openQuestions':
      return draft.openQuestions.length ? draft.openQuestions.join('; ') : 'None';
    default:
      return '';
  }
}

function labelFor(options: IntakeChoice[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

/** True once every required field has a valid value. */
export function isDraftComplete(draft: IntakeDraft): boolean {
  return INTAKE_STEPS.filter((field) => field.required).every(
    (field) => validateField(field, draft) === null,
  );
}

/** Map the draft onto the real `ProjectInput` contract. */
export function buildProjectInput(draft: IntakeDraft): ProjectInput {
  const teamSize = Math.min(100, Math.max(1, Math.round(Number(draft.teamSize) || 1)));
  return {
    projectName: draft.name.trim(),
    requirements: draft.requirements.trim(),
    projectType: draft.projectType as ProjectType,
    complexity: draft.complexity as Complexity,
    targetDeadline: draft.deadline || defaultDeadline(),
    teamSize,
    teamLocation: draft.teamLocation as TeamLocation,
    blendedRatePerDay: Math.max(0, Number(draft.rate) || 0),
    currency: draft.currency,
    constraints: draft.constraints,
  };
}

/** Assumptions implied by choices made (or skipped) during the intake. */
export function deriveAssumptions(draft: IntakeDraft): string[] {
  const assumptions: string[] = [];
  if (!draft.deadline) {
    assumptions.push(
      'No target deadline was supplied during intake; a 16-week reference deadline is assumed.',
    );
  }
  assumptions.push(
    'The brief was captured through a guided intake, not an AI model — confirm scope in the breakdown editor.',
  );
  return assumptions;
}

export function deriveMissingRequirements(draft: IntakeDraft): string[] {
  return [...draft.openQuestions];
}

/* ------------------------------------------------------------------ */
/* Starter scope templates (explicitly labelled, fully editable)        */
/* ------------------------------------------------------------------ */

interface StarterFeature {
  name: string;
  description: string;
  priority: ScopePriority;
  complexity: FeatureComplexity;
}

const STARTER_SCOPE: Record<ProjectType, StarterFeature[]> = {
  'web-app': [
    { name: 'Authentication & accounts', description: 'Sign-up, sign-in and role-based access.', priority: 'must', complexity: 'moderate' },
    { name: 'Core dashboard', description: 'Primary data views and navigation shell.', priority: 'must', complexity: 'moderate' },
    { name: 'Data ingest / integration', description: 'Bring source data in reliably.', priority: 'must', complexity: 'complex' },
    { name: 'Reporting & export', description: 'Filterable reports and CSV export.', priority: 'should', complexity: 'moderate' },
    { name: 'Notifications', description: 'Email or in-app alerts for key events.', priority: 'could', complexity: 'trivial' },
  ],
  'mobile-app': [
    { name: 'Onboarding & auth', description: 'Account creation, sign-in and permissions.', priority: 'must', complexity: 'moderate' },
    { name: 'Primary task flow', description: 'The main jobs users perform in the app.', priority: 'must', complexity: 'complex' },
    { name: 'Offline support', description: 'Local storage and sync on reconnect.', priority: 'must', complexity: 'epic' },
    { name: 'Media capture', description: 'Camera / photo upload where relevant.', priority: 'should', complexity: 'moderate' },
    { name: 'Push notifications', description: 'Timely alerts to the device.', priority: 'could', complexity: 'moderate' },
  ],
  'backend-api': [
    { name: 'Core domain APIs', description: 'CRUD endpoints for the primary entities.', priority: 'must', complexity: 'complex' },
    { name: 'Auth & authorisation', description: 'Token issue/validation and scopes.', priority: 'must', complexity: 'moderate' },
    { name: 'Third-party integration', description: 'Connect to external systems.', priority: 'must', complexity: 'complex' },
    { name: 'Audit logging', description: 'Traceability for sensitive actions.', priority: 'should', complexity: 'moderate' },
    { name: 'Rate limiting & quotas', description: 'Per-consumer throttling.', priority: 'could', complexity: 'moderate' },
  ],
  'data-ml': [
    { name: 'Data pipeline', description: 'Ingest, clean and transform source data.', priority: 'must', complexity: 'complex' },
    { name: 'Feature store / preprocessing', description: 'Prepare inputs for modelling.', priority: 'must', complexity: 'complex' },
    { name: 'Model training & evaluation', description: 'Train and validate the model.', priority: 'must', complexity: 'epic' },
    { name: 'Inference API / batch scoring', description: 'Serve predictions.', priority: 'should', complexity: 'complex' },
    { name: 'Monitoring & drift alerts', description: 'Track model health over time.', priority: 'could', complexity: 'moderate' },
  ],
  'internal-tool': [
    { name: 'Admin CRUD screens', description: 'Manage the core records.', priority: 'must', complexity: 'moderate' },
    { name: 'Search & filtering', description: 'Find records quickly.', priority: 'must', complexity: 'moderate' },
    { name: 'Import / export', description: 'Spreadsheet and file handling.', priority: 'should', complexity: 'moderate' },
    { name: 'Roles & permissions', description: 'Restrict actions by role.', priority: 'should', complexity: 'moderate' },
    { name: 'Activity log', description: 'See who changed what.', priority: 'could', complexity: 'trivial' },
  ],
  other: [
    { name: 'Discovery & design', description: 'Confirm scope and interaction design.', priority: 'must', complexity: 'moderate' },
    { name: 'Core build', description: 'Implement the primary capability.', priority: 'must', complexity: 'complex' },
    { name: 'Integration', description: 'Connect the necessary external pieces.', priority: 'should', complexity: 'complex' },
    { name: 'QA & hardening', description: 'Testing, fixes and performance.', priority: 'should', complexity: 'moderate' },
    { name: 'Rollout', description: 'Release and handover.', priority: 'could', complexity: 'trivial' },
  ],
};

/**
 * Documented starter scope so the demo has something to estimate. Clearly a
 * template, not AI output; every entry is editable or removable.
 */
export function starterScopeFor(projectType: ProjectType | ''): Array<Omit<Feature, 'id'>> {
  const template = STARTER_SCOPE[projectType || 'other'];
  return template.map((feature) => ({ ...feature, status: 'proposed' as const }));
}
