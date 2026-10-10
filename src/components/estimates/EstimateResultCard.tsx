import { AlertTriangle, CheckCircle2, Loader2, Wallet } from 'lucide-react';
import type { ReactElement } from 'react';

import { getUnitLabel } from '../../estimation';
import type { EstimateResult } from '../../estimation';
import type { ApiFailure } from '../../api';
import { formatCurrency, formatDate } from '../../utils/format';
import type { Estimate } from '../../types';
import { Button } from '../ui/Button';
import { DemoNotice } from '../ui/DemoNotice';
import { LinkButton } from '../ui/LinkButton';
import { SectionCard } from '../ui/SectionCard';

import styles from './EstimateResultCard.module.css';

export type ResultState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; estimate: Estimate; result: EstimateResult }
  | { kind: 'validation-error'; message: string }
  | { kind: 'error'; error: ApiFailure };

interface EstimateResultCardProps {
  state: ResultState;
  onRetry: () => void;
}

const quantityFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 2,
});

function formatQuantity(value: number): string {
  return quantityFormatter.format(value);
}

function PriceSourceNotice({ result }: { result: EstimateResult }): ReactElement {
  const sources = result.priceSources.map(
    (source) => `${source.label} (dated ${formatDate(source.priceDate)})`,
  );
  const list =
    sources.length > 0 ? sources.join(' and ') : 'the service price catalogue';

  return (
    <DemoNotice>
      Prices in this estimate come from {list}. These are illustrative demo prices for the
      hackathon build, not verified market or supplier rates.
    </DemoNotice>
  );
}

export function EstimateResultCard({
  state,
  onRetry,
}: EstimateResultCardProps): ReactElement | null {
  if (state.kind === 'idle') {
    return null;
  }

  if (state.kind === 'loading') {
    return (
      <SectionCard title="Cost estimate">
        <div className={styles.busy} role="status">
          <Loader2 size={18} className={styles.spinner} aria-hidden="true" />
          <span>Calculating your estimate…</span>
        </div>
      </SectionCard>
    );
  }

  if (state.kind === 'validation-error') {
    return (
      <SectionCard title="Estimate not calculated">
        <div className={styles.errorBlock} role="alert">
          <AlertTriangle size={18} className={styles.errorIcon} aria-hidden="true" />
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
          <AlertTriangle size={18} className={styles.errorIcon} aria-hidden="true" />
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

  const { estimate, result } = state;

  return (
    <SectionCard
      title="Cost estimate"
      description={`${estimate.projectName} — ${formatCurrency(result.total)}`}
    >
      <div role="status">
        <p className={styles.totalLabel}>Estimated total</p>
        <p className={styles.total}>{formatCurrency(result.total)}</p>

        <div className={styles.scroll}>
          <table className={styles.table}>
            <caption className="visually-hidden">
              Material line items and cost totals
            </caption>
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">Quantity</th>
                <th scope="col">Unit price</th>
                <th scope="col">Line total</th>
              </tr>
            </thead>
            <tbody>
              {result.lineResults.map((line, index) => (
                <tr key={`${line.productId}-${index}`}>
                  <td>
                    <span className={styles.productName}>{line.productName}</span>
                    <span className={styles.productMeta}>{line.category}</span>
                  </td>
                  <td>
                    {formatQuantity(line.quantity)} {getUnitLabel(line.unit)}
                  </td>
                  <td>{formatCurrency(line.unitPrice)}</td>
                  <td className={styles.amount}>{formatCurrency(line.lineSubtotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" colSpan={3}>
                  Subtotal
                </th>
                <td>{formatCurrency(result.subtotal)}</td>
              </tr>
              <tr>
                <th scope="row" colSpan={3} className={styles.totalHeader}>
                  Estimated total
                </th>
                <td className={styles.totalCell}>{formatCurrency(result.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <PriceSourceNotice result={result} />

        <p className={styles.saved}>
          <CheckCircle2 size={16} aria-hidden="true" />
          Draft &ldquo;{estimate.projectName}&rdquo; saved to this browser with the calculated
          total.
        </p>
        <div className={styles.savedActions}>
          <LinkButton to="/estimates" iconStart={<Wallet size={16} aria-hidden="true" />}>
            View estimates
          </LinkButton>
        </div>
      </div>
    </SectionCard>
  );
}