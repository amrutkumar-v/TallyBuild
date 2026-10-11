import type {
  BadgeTone,
  EstimateStatus,
  ProjectCategory,
  ProjectComplexity,
} from '../types';

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

export const PROJECT_CATEGORY_LABELS: Record<ProjectCategory, string> = {
  'new-product': 'New product',
  feature: 'Feature enhancement',
  platform: 'Platform migration',
  integration: 'Integration',
  maintenance: 'Maintenance',
};

export const PROJECT_CATEGORY_OPTIONS: ReadonlyArray<{ value: ProjectCategory; label: string }> = [
  { value: 'new-product', label: 'New product' },
  { value: 'feature', label: 'Feature enhancement' },
  { value: 'platform', label: 'Platform migration' },
  { value: 'integration', label: 'Integration' },
  { value: 'maintenance', label: 'Maintenance' },
];

export function isProjectCategory(value: string): value is ProjectCategory {
  return (
    value === 'new-product' ||
    value === 'feature' ||
    value === 'platform' ||
    value === 'integration' ||
    value === 'maintenance'
  );
}

export const PROJECT_COMPLEXITY_LABELS: Record<ProjectComplexity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const PROJECT_COMPLEXITY_OPTIONS: ReadonlyArray<{
  value: ProjectComplexity;
  label: string;
}> = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export function isProjectComplexity(value: string): value is ProjectComplexity {
  return value === 'low' || value === 'medium' || value === 'high';
}
