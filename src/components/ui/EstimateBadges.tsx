import { Badge } from './Badge';
import type { BadgeTone } from './uiTypes';
import {
  confidenceLabels,
  featureStatusLabels,
  scopePriorityLabels,
  stageLabels,
} from '../../constants/labels';
import type {
  Confidence,
  DeadlineFit,
  EstimateStage,
  FeatureStatus,
  ResultSource,
  ScopePriority,
} from '../../types';

export function StageBadge({ stage }: { stage: EstimateStage }): React.JSX.Element {
  const tone: BadgeTone = stage === 'estimated' ? 'success' : stage === 'breakdown' ? 'warning' : 'neutral';
  return <Badge tone={tone}>{stageLabels[stage]}</Badge>;
}

/**
 * Makes the number's provenance explicit. `mock-adapter` results are
 * illustrative placeholders, never AI output or live prices.
 */
export function SourceBadge({ source }: { source: ResultSource }): React.JSX.Element {
  if (source === 'api') {
    return (
      <Badge tone="info" title="Figure returned by the estimation API">
        Live API
      </Badge>
    );
  }
  return (
    <Badge tone="accent" title="Illustrative placeholder from the local mock adapter">
      Illustrative (mock)
    </Badge>
  );
}

export function ConfidenceBadge({ confidence }: { confidence: Confidence }): React.JSX.Element {
  const tone: BadgeTone =
    confidence === 'high' ? 'success' : confidence === 'medium' ? 'info' : 'warning';
  return <Badge tone={tone}>{confidenceLabels[confidence]}</Badge>;
}

export function PriorityBadge({ priority }: { priority: ScopePriority }): React.JSX.Element {
  const tone: BadgeTone =
    priority === 'must' ? 'accent' : priority === 'should' ? 'info' : 'neutral';
  return <Badge tone={tone}>{scopePriorityLabels[priority]}</Badge>;
}

export function FeatureStatusBadge({ status }: { status: FeatureStatus }): React.JSX.Element {
  const tone: BadgeTone =
    status === 'accepted' ? 'success' : status === 'removed' ? 'danger' : 'neutral';
  return <Badge tone={tone}>{featureStatusLabels[status]}</Badge>;
}

export function DeadlineFitBadge({ fit }: { fit: DeadlineFit }): React.JSX.Element {
  const tone: BadgeTone = fit === 'feasible' ? 'success' : fit === 'tight' ? 'warning' : 'danger';
  const label = fit === 'feasible' ? 'Deadline feasible' : fit === 'tight' ? 'Deadline tight' : 'Deadline not feasible';
  return <Badge tone={tone}>{label}</Badge>;
}
