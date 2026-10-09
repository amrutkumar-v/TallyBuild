import type { BadgeTone, EstimateStatus, ProjectType } from '../types';

export const ESTIMATE_STATUS_LABELS: Record<EstimateStatus, string> = {
  draft: 'Draft',
  'in-review': 'In review',
  approved: 'Approved',
};

export const ESTIMATE_STATUS_TONES: Record<EstimateStatus, BadgeTone> = {
  draft: 'neutral',
  'in-review': 'info',
  approved: 'success',
};

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  residential: 'Residential',
  commercial: 'Commercial',
  industrial: 'Industrial',
  infrastructure: 'Infrastructure',
};

export const PROJECT_TYPE_OPTIONS: ReadonlyArray<{ value: ProjectType; label: string }> = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'infrastructure', label: 'Infrastructure' },
];

export function isProjectType(value: string): value is ProjectType {
  return (
    value === 'residential' ||
    value === 'commercial' ||
    value === 'industrial' ||
    value === 'infrastructure'
  );
}
