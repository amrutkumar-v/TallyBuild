import type {
  Confidence,
  Complexity,
  CurrencyCode,
  EstimateStage,
  FeatureComplexity,
  FeatureStatus,
  ProjectType,
  ScopePriority,
  TeamLocation,
} from '../types';

export const projectTypeLabels: Record<ProjectType, string> = {
  'web-app': 'Web application',
  'mobile-app': 'Mobile app',
  'backend-api': 'Backend / API',
  'data-ml': 'Data / ML pipeline',
  'internal-tool': 'Internal tool',
  other: 'Other',
};

export const projectTypeOptions: Array<{ value: ProjectType; label: string }> = (
  Object.keys(projectTypeLabels) as ProjectType[]
).map((value) => ({ value, label: projectTypeLabels[value] }));

export const complexityLabels: Record<Complexity, string> = {
  low: 'Low — well understood, few unknowns',
  medium: 'Medium — some unknowns, standard stack',
  high: 'High — new tech or heavy integration',
  expert: 'Expert — research-heavy, many unknowns',
};

export const complexityShortLabels: Record<Complexity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  expert: 'Expert',
};

export const complexityOptions: Array<{ value: Complexity; label: string }> = (
  Object.keys(complexityLabels) as Complexity[]
).map((value) => ({ value, label: complexityLabels[value] }));

export const teamLocationLabels: Record<TeamLocation, string> = {
  india: 'In-house team, India',
  'north-america': 'In-house team, North America',
  europe: 'In-house team, Europe',
  latam: 'In-house team, Latin America',
  distributed: 'Distributed / multi-region team',
};

export const teamLocationOptions: Array<{ value: TeamLocation; label: string }> = (
  Object.keys(teamLocationLabels) as TeamLocation[]
).map((value) => ({ value, label: teamLocationLabels[value] }));

export const currencyLabels: Record<CurrencyCode, string> = {
  INR: 'INR — Indian Rupee',
  USD: 'USD — US Dollar',
  EUR: 'EUR — Euro',
  GBP: 'GBP — British Pound',
  AED: 'AED — UAE Dirham',
};

export const currencyOptions: Array<{ value: CurrencyCode; label: string }> = (
  Object.keys(currencyLabels) as CurrencyCode[]
).map((value) => ({ value, label: currencyLabels[value] }));

export const scopePriorityLabels: Record<ScopePriority, string> = {
  must: 'Must have',
  should: 'Should have',
  could: 'Could have',
};

export const scopePriorityOptions: Array<{ value: ScopePriority; label: string }> = (
  Object.keys(scopePriorityLabels) as ScopePriority[]
).map((value) => ({ value, label: scopePriorityLabels[value] }));

export const featureComplexityLabels: Record<FeatureComplexity, string> = {
  trivial: 'Trivial',
  moderate: 'Moderate',
  complex: 'Complex',
  epic: 'Epic',
};

export const featureComplexityOptions: Array<{ value: FeatureComplexity; label: string }> = (
  Object.keys(featureComplexityLabels) as FeatureComplexity[]
).map((value) => ({ value, label: featureComplexityLabels[value] }));

export const featureStatusLabels: Record<FeatureStatus, string> = {
  proposed: 'Proposed',
  accepted: 'Accepted',
  removed: 'Excluded',
};

export const stageLabels: Record<EstimateStage, string> = {
  draft: 'Inputs saved',
  breakdown: 'Scope in progress',
  estimated: 'Estimated',
};

export const confidenceLabels: Record<Confidence, string> = {
  low: 'Low confidence',
  medium: 'Medium confidence',
  high: 'High confidence',
};
