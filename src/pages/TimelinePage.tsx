import { useState } from 'react';
import { CalendarRange, Clock, RefreshCw, Sparkles } from 'lucide-react';

import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { SectionCard } from '../components/ui/SectionCard';
import { errorMessage } from '../services';
import { useEstimates } from '../store/estimates-context';
import { formatCurrency, formatDate, formatWeeks, weeksBetween } from '../utils/format';
import { useEstimateRoute } from './estimateRoute';
import type { Estimate } from '../types';
import styles from './TimelinePage.module.css';

export function TimelinePage(): React.JSX.Element {
  const { estimate } = useEstimateRoute();
  return <TimelineWorkspace key={estimate.id} estimate={estimate} />;
}

function TimelineWorkspace({ estimate }: { estimate: Estimate }): React.JSX.Element {
  const { runEstimate } = useEstimates();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const result = estimate.result;

  if (!result) {
    return (
      <SectionCard title="Timeline & spending">
        <EmptyState
          icon={<CalendarRange />}
          title="No timeline yet"
          description="Run the estimate to generate milestones and an indicative schedule."
        />
        <div className={styles.centerAction}>
          <Button
            onClick={() => {
              setRunning(true);
              setError(null);
              void runEstimate(estimate.id)
                .catch((caught: unknown) => setError(errorMessage(caught)))
                .finally(() => setRunning(false));
            }}
            disabled={running}
          >
            {running ? (
              <RefreshCw className={styles.spin} aria-hidden="true" />
            ) : (
              <Sparkles aria-hidden="true" />
            )}
            Run estimate
          </Button>
        </div>
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
      </SectionCard>
    );
  }

  const currency = result.currency;
  const totalWeeks = Math.max(
    result.durationWeeks.high,
    ...result.milestones.map((milestone) => milestone.endWeek),
  );
  const deadlineWeeks = estimate.input.targetDeadline
    ? weeksBetween(new Date().toISOString(), estimate.input.targetDeadline)
    : 0;

  return (
    <div className={styles.page}>
      <SectionCard
        title="Indicative timeline"
        description="Sequenced milestones for the likely scope. Week numbers are relative to start."
      >
        <div className={styles.facts}>
          <Fact label="Duration" value={formatWeeks(result.durationWeeks)} icon={<Clock />} />
          <Fact label="Likely duration" value={`${result.durationWeeks.likely} weeks`} />
          <Fact label="Start" value={formatDate(new Date().toISOString().slice(0, 10))} />
          <Fact
            label="Target deadline"
            value={estimate.input.targetDeadline ? formatDate(estimate.input.targetDeadline) : 'Not set'}
          />
          <Fact
            label="Weeks to deadline"
            value={deadlineWeeks > 0 ? `${deadlineWeeks} weeks` : '—'}
          />
        </div>

        <ol className={styles.timeline}>
          {result.milestones.map((milestone) => {
            const left = ((milestone.startWeek - 1) / totalWeeks) * 100;
            const width = ((milestone.endWeek - milestone.startWeek + 1) / totalWeeks) * 100;
            return (
              <li key={milestone.id} className={styles.milestone}>
                <div className={styles.milestoneHead}>
                  <span className={styles.milestoneName}>{milestone.name}</span>
                  <Badge tone="neutral">
                    Week {milestone.startWeek}–{milestone.endWeek}
                  </Badge>
                </div>
                <p className={styles.milestoneSummary}>{milestone.summary}</p>
                <div className={styles.track} aria-hidden="true">
                  <span
                    className={styles.bar}
                    style={{ left: `${left}%`, width: `${width}%` }}
                  />
                </div>
                <p className={styles.milestoneCost}>
                  ≈ {Math.round(milestone.costShare * 100)}% of cost ·{' '}
                  {formatCurrency(result.cost.likely * milestone.costShare, currency)}
                </p>
              </li>
            );
          })}
        </ol>
      </SectionCard>

      <SectionCard
        title="Spending profile"
        description="How the likely labour cost is spread across the milestones."
      >
        <ul className={styles.spend}>
          {result.milestones.map((milestone) => (
            <li key={milestone.id} className={styles.spendRow}>
              <span className={styles.spendName}>{milestone.name}</span>
              <span className={styles.spendBarWrap} aria-hidden="true">
                <span
                  className={styles.spendBar}
                  style={{ width: `${Math.round(milestone.costShare * 100)}%` }}
                />
              </span>
              <span className={styles.spendValue}>
                {formatCurrency(result.cost.likely * milestone.costShare, currency)}
              </span>
            </li>
          ))}
        </ul>
        <p className={styles.footNote}>
          Illustrative sequencing from the mock adapter — not a committed project plan.
        </p>
      </SectionCard>
    </div>
  );
}

function Fact({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className={styles.fact}>
      <span className={styles.factLabel}>
        {icon ? <span className={styles.factIcon}>{icon}</span> : null}
        {label}
      </span>
      <span className={styles.factValue}>{value}</span>
    </div>
  );
}
