import { useState } from 'react';
import {
  BarChart3,
  CircleAlert,
  Clock,
  Coins,
  Gauge,
  RefreshCw,
  Server,
  Sparkles,
  Users,
  Wrench,
} from 'lucide-react';

import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { DemoNotice } from '../components/ui/DemoNotice';
import { EmptyState } from '../components/ui/EmptyState';
import { SectionCard } from '../components/ui/SectionCard';
import { SummaryCard } from '../components/ui/SummaryCard';
import { ConfidenceBadge, SourceBadge } from '../components/ui/EstimateBadges';
import { errorMessage } from '../services';
import { useEstimates } from '../store/estimates-context';
import {
  formatCurrency,
  formatCurrencyShort,
  formatHours,
  formatRelativeDays,
  formatWeeks,
} from '../utils/format';
import { useEstimateRoute } from './estimateRoute';
import type { Estimate } from '../types';
import styles from './ResultsPage.module.css';

const SEGMENT_COLOURS = [
  'var(--color-accent)',
  'var(--color-info)',
  'var(--color-success)',
  'var(--color-warning)',
  'var(--color-accent-strong)',
  'var(--color-ink-muted)',
];

export function ResultsPage(): React.JSX.Element {
  const { estimate } = useEstimateRoute();
  return <ResultsWorkspace key={estimate.id} estimate={estimate} />;
}

function ResultsWorkspace({ estimate }: { estimate: Estimate }): React.JSX.Element {
  const { runEstimate } = useEstimates();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const result = estimate.result;

  if (!result) {
    return (
      <SectionCard title="Results">
        <EmptyState
          icon={<BarChart3 />}
          title="No numbers yet"
          description="Add at least one feature to the scope, then run the estimate to see effort, cost and timeline."
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
            disabled={running || estimate.features.filter((f) => f.status !== 'removed').length === 0}
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
  const activeCosts = result.featureCosts;
  const total = activeCosts.reduce((sum, cost) => sum + cost.cost.likely, 0) || result.cost.likely;

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <div className={styles.headMeta}>
          <SourceBadge source={result.source} />
          <ConfidenceBadge confidence={result.confidence} />
          <Badge tone="neutral">Generated {formatRelativeDays(result.generatedAt)}</Badge>
        </div>
        <p className={styles.headNote}>
          {result.source === 'mock-adapter'
            ? 'Figures below are illustrative placeholders from the local mock adapter.'
            : 'Figures below were returned by the estimation API.'}
        </p>
      </div>

      <div className={styles.summaryGrid}>
        <SummaryCard
          label="Likely effort"
          value={`${result.effortDays.likely} person-days`}
          hint={formatHours(result.effortDays)}
          icon={<Gauge />}
        />
        <SummaryCard
          label="Likely labour cost"
          value={formatCurrency(result.cost.likely, currency)}
          hint="Derived from your day rate only"
          tone="accent"
          icon={<Coins />}
        />
        <SummaryCard
          label="Indicative duration"
          value={formatWeeks(result.durationWeeks)}
          hint={`Likely ${result.durationWeeks.likely} weeks`}
          tone="info"
          icon={<Clock />}
        />
        <SummaryCard
          label="Confidence"
          value={result.confidence.charAt(0).toUpperCase() + result.confidence.slice(1)}
          hint="Based on how complete the brief is"
          tone={result.confidence === 'high' ? 'success' : result.confidence === 'low' ? 'warning' : 'info'}
          icon={<BarChart3 />}
        />
      </div>

      <SectionCard
        title="Cost range"
        description="A three-point estimate: optimistic, likely and conservative."
      >
        <div className={styles.range}>
          <RangeStat label="Low" value={formatCurrency(result.cost.low, currency)} />
          <RangeStat label="Likely" value={formatCurrency(result.cost.likely, currency)} highlight />
          <RangeStat label="High" value={formatCurrency(result.cost.high, currency)} />
        </div>
        <div className={styles.rangeBar} aria-hidden="true">
          <span className={styles.rangeLow} />
          <span className={styles.rangeLikely} />
          <span className={styles.rangeHigh} />
        </div>
        <p className={styles.rangeNote}>
          Effort range {result.effortDays.low}–{result.effortDays.high} person-days at{' '}
          {formatCurrency(result.blendedRatePerDay, currency)} per person-day.
        </p>
      </SectionCard>

      <SectionCard
        title="Cost breakdown by feature"
        description="Each feature's share of the likely labour cost after the last run."
      >
        {activeCosts.length === 0 ? (
          <p className={styles.muted}>No active features in scope.</p>
        ) : (
          <>
            <div className={styles.stack} role="img" aria-label="Relative labour cost by feature">
              {activeCosts.map((cost, index) => (
                <span
                  key={cost.featureId}
                  className={styles.stackSegment}
                  style={{
                    width: `${(cost.cost.likely / total) * 100}%`,
                    background: SEGMENT_COLOURS[index % SEGMENT_COLOURS.length],
                  }}
                  title={`${cost.name}: ${formatCurrency(cost.cost.likely, currency)} likely`}
                />
              ))}
            </div>
            <ul className={styles.legend}>
              {activeCosts.map((cost, index) => (
                <li key={cost.featureId} className={styles.legendItem}>
                  <span
                    className={styles.legendSwatch}
                    style={{ background: SEGMENT_COLOURS[index % SEGMENT_COLOURS.length] }}
                    aria-hidden="true"
                  />
                  <span className={styles.legendName}>{cost.name}</span>
                  <span className={styles.legendValue}>
                    {cost.effortDays.likely} days · {formatCurrencyShort(cost.cost.likely, currency)}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </SectionCard>

      <div className={styles.twoUp}>
        <SectionCard title="Assumptions" description="How these numbers were produced.">
          <ul className={styles.assumptions}>
            {result.assumptions.map((assumption, index) => (
              <li key={`${assumption}-${index}`} className={styles.assumption}>
                <CircleAlert className={styles.assumptionIcon} aria-hidden="true" />
                <span>{assumption}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Team assumptions" description="Illustrative role split for the timeline.">
          <ul className={styles.team}>
            {result.teamAssumptions.map((member) => (
              <li key={member.role} className={styles.teamRow}>
                <Users className={styles.teamIcon} aria-hidden="true" />
                <span className={styles.teamRole}>{member.role}</span>
                <Badge tone="neutral">
                  {member.count} · {member.allocationPercent}%
                </Badge>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <SectionCard
        title="Tooling, infrastructure & other expenses"
        description="Separate from labour cost."
      >
        <DemoNotice tone="warning">
          <p className={styles.notModelledTitle}>Not modelled yet</p>
          <p>
            The current API contract returns a single labour figure only. Itemised tooling,
            infrastructure and third-party expenses are pending the backend expense contract — no
            placeholder money is shown so the estimate is never overstated.
          </p>
        </DemoNotice>
        <div className={styles.expensePlaceholders}>
          <ExpenseRow icon={<Wrench />} label="Tooling & licences" />
          <ExpenseRow icon={<Server />} label="Infrastructure & hosting" />
          <ExpenseRow icon={<Coins />} label="Other expenses" />
        </div>
      </SectionCard>
    </div>
  );
}

function RangeStat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}): React.JSX.Element {
  return (
    <div className={highlight ? styles.rangeStatHighlight : styles.rangeStat}>
      <span className={styles.rangeLabel}>{label}</span>
      <span className={styles.rangeValue}>{value}</span>
    </div>
  );
}

function ExpenseRow({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}): React.JSX.Element {
  return (
    <div className={styles.expenseRow}>
      <span className={styles.expenseIcon} aria-hidden="true">
        {icon}
      </span>
      <span className={styles.expenseLabel}>{label}</span>
      <span className={styles.expenseValue}>Pending API</span>
    </div>
  );
}
