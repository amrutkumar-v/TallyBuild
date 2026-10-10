import type { LucideIcon } from 'lucide-react';

export type EstimateStatus = 'draft' | 'in-review' | 'approved';

export type ProjectType = 'residential' | 'commercial' | 'industrial' | 'infrastructure';

export type EstimateOrigin = 'sample' | 'local';

export type BadgeTone = 'neutral' | 'accent' | 'info' | 'success' | 'warning';

export interface Estimate {
  id: string;
  projectName: string;
  location: string;
  projectType: ProjectType;
  createdAt: string;
  estimatedAmount: number | null;
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
  location: string;
  projectType: ProjectType | '';
  notes: string;
}

export interface NewEstimateFormErrors {
  projectName?: string;
  location?: string;
  projectType?: string;
  notes?: string;
}

export interface EstimateDraftInput {
  projectName: string;
  location: string;
  projectType: ProjectType;
  notes?: string;
  estimatedAmount?: number | null;
}
