import type { LucideIcon } from 'lucide-react';

import type { CurrencyCode } from '../estimation/currencies';

export type EstimateStatus = 'draft' | 'in-review' | 'approved';

export type ProjectCategory =
  | 'new-product'
  | 'feature'
  | 'platform'
  | 'integration'
  | 'maintenance';

export type ProjectComplexity = 'low' | 'medium' | 'high';

export type EstimateOrigin = 'sample' | 'local';

export type BadgeTone = 'neutral' | 'accent' | 'info' | 'success' | 'warning';

export interface Estimate {
  id: string;
  projectName: string;
  scope: string;
  category: ProjectCategory;
  complexity: ProjectComplexity;
  currency: CurrencyCode;
  createdAt: string;
  plannedStartDate: string | null;
  durationWeeks: number | null;
  estimatedAmount: number | null;
  actualAmount: number | null;
  status: EstimateStatus;
  origin: EstimateOrigin;
  notes?: string;
}

export interface NavigationItem {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
}

export interface NewEstimateFormValues {
  projectName: string;
  scope: string;
  category: ProjectCategory | '';
  complexity: ProjectComplexity | '';
  currency: CurrencyCode;
  plannedStartDate: string;
  durationWeeks: string;
  notes: string;
}

export interface NewEstimateFormErrors {
  projectName?: string;
  scope?: string;
  category?: string;
  complexity?: string;
  plannedStartDate?: string;
  durationWeeks?: string;
  notes?: string;
}

export interface EstimateDraftInput {
  projectName: string;
  scope: string;
  category: ProjectCategory;
  complexity: ProjectComplexity;
  currency: CurrencyCode;
  plannedStartDate?: string | null;
  durationWeeks?: number | null;
  notes?: string;
  estimatedAmount?: number | null;
}
