import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import type { ReactElement } from 'react';

import type { ApiFailure } from '../../api';
import type { ProjectEstimateResult } from '../../estimation';
import type { Estimate } from '../../types';
import { formatCurrency } from '../../utils/format';
import { Button } from '../ui/Button';
import { LinkButton } from '../ui/LinkButton';
import { SectionCard } from '../ui/SectionCard';
import { CostBreakdownDonutChart, CostLinesBarChart } from '../ui/charts';

import styles from './EstimateResultCard.module.css';

export type ResultState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; estimate: Estimate; result: ProjectEstimateResult }
  | { kind: 'validation-error'; message: string }
  | { kind: 'error'; error: ApiFailure };

interface EstimateResultCardProps {
  state: ResultState;
  onRetry: () => void;
}

const numberFormatter = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 });

function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function EstimateResultCard({ state, onRetry }: EstimateResultCardProps): ReactElement {
  if (state.kind === 'loading') {
    return (
      <SectionCard title="Cost estimate">
        <div className={styles.busy} role="status">
          <Loader2 className={styles.spinner} size={18} aria-hidden="true" />
          <span>Calculating this estimate…</span>
        </div>
      </SectionCard>
    );
  }

  if (state.kind === 'validation-error') {
    return (
      <SectionCard title="Estimate not calculated">
        <div className={styles.errorBlock} role="alert">
          <AlertTriangle className={styles.errorIcon} size={18} aria-hidden="true" />
          <div>
            <p className={styles.errorTitle}>The estimation service rejected some values.</p>
            <p className={styles.errorText}>{state.message}</p>
            <p className={styles.errorText}>
              Check the highlighted lines and project details, then calculate again.
            </p>
          </div>
        </div>
      </SectionCard>
    );
  }

  if (state.kind === 'error') {
    return (
      <SectionCard title="Estimate not calculated">
        <div className={styles.errorBlock} role="alert">
          <AlertTriangle className={styles.errorIcon} size={18} aria-hidden="true" />
          <div>
            <p className={styles.errorTitle}>We couldn&rsquo;t calculate this estimate.</p>
            <p className={styles.errorText}>{state.error.message}</p>
            <div className={styles.errorActions}>
              <Button variant="secondary" onClick={onRetry}>
                Try again
              </Button>
            </div>
          </div>
        </div>
      </SectionCard>
    );
  }

  if (state.kind === 'idle') {
    return (
      <SectionCard title="Cost estimate">
        <p className={styles.idleText}>
          Add cost lines and choose a currency, then calculate to see the estimated total here.
        </p>
      </SectionCard>
    );
  }

  const { estimate, result } = state;

  return (
    <SectionCard
      title="Cost estimate"
      description={`${estimate.projectName} — ${formatCurrency(result.total, result.currency)}`}
    >
      <div role="status">
        <div className={styles.chartsSection}>
          <CostBreakdownDonutChart result={result} />
          <CostLinesBarChart result={result} />
        </div>

        <p className={styles.totalLabel}>Estimated total</p>
        <p className={styles.total}>{formatCurrency(result.total, result.currency)}</p>
        <p className={styles.totalMeta}>
          {result.lineCount} {result.lineCount === 1 ? 'cost line' : 'cost lines'} in{' '}
          {result.currency}. This is a transparent arithmetic total, not a prediction.
        </p>

        <div className={styles.scroll}>
          <table className={styles.table}>
            <caption className="visually-hidden">
              Cost lines grouped by category with subtotals and an estimated total
            </caption>
            <thead>
              <tr>
                <th scope="col">Cost line</th>
                <th scope="col">Details</th>
                <th scope="col" className={styles.amountHead}>
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {result.personnel.lines.map((line, index) => (
                <tr key={`personnel-${index}`}>
                  <td className={styles.lineCell}>
                    <span className={styles.lineName}>{line.role}</span>
                    <span className={styles.lineMeta}>Personnel</span>
                  </td>
                  <td>
                    {formatNumber(line.people)} people × {formatNumber(line.hours)} h ×{' '}
                    {formatCurrency(line.hourlyRate, result.currency)}
                  </td>
                  <td className={styles.amount}>
                    {formatCurrency(line.cost, result.currency)}
                  </td>
                </tr>
              ))}
              {result.tooling.lines.map((line, index) => (
                <tr key={`tooling-${index}`}>
                  <td className={styles.lineCell}>
                    <span className={styles.lineName}>{line.name}</span>
                    <span className={styles.lineMeta}>Tooling</span>
                  </td>
                  <td>One-off cost</td>
                  <td className={styles.amount}>
                    {formatCurrency(line.cost, result.currency)}
                  </td>
                </tr>
              ))}
              {result.infrastructure.lines.map((line, index) => (
                <tr key={`infrastructure-${index}`}>
                  <td className={styles.lineCell}>
                    <span className={styles.lineName}>{line.name}</span>
                    <span className={styles.lineMeta}>Infrastructure</span>
                  </td>
                  <td>
                    {formatCurrency(line.monthlyCost, result.currency)} / month ×{' '}
                    {formatNumber(line.months)} months
                  </td>
                  <td className={styles.amount}>
                    {formatCurrency(line.cost, result.currency)}
                  </td>
                </tr>
              ))}
              {result.other.lines.map((line, index) => (
                <tr key={`other-${index}`}>
                  <td className={styles.lineCell}>
                    <span className={styles.lineName}>{line.description}</span>
                    <span className={styles.lineMeta}>Other</span>
                  </td>
                  <td>One-off cost</td>
                  <td className={styles.amount}>
                    {formatCurrency(line.cost, result.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" colSpan={2}>
                  Estimated total
                </th>
                <td className={styles.totalCell}>
                  {formatCurrency(result.total, result.currency)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className={styles.assumptions}>
          <h3 className={styles.assumptionsTitle}>Assumptions</h3>
          <ul className={styles.assumptionsList}>
            {result.assumptions.map((assumption) => (
              <li key={assumption}>{assumption}</li>
            ))}
          </ul>
        </div>

        <p className={styles.saved}>
          <CheckCircle2 size={16} aria-hidden="true" />
          Draft &ldquo;{estimate.projectName}&rdquo; saved to this browser with the calculated
          total.
        </p>
        <div className={styles.savedActions}>
          <LinkButton to="/estimates" iconStart={<CheckCircle2 size={16} aria-hidden="true" />}>
            View estimates
          </LinkButton>
        </div>
      </div>
    </SectionCard>
  );
}
