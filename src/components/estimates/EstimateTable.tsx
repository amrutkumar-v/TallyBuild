import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Ban, RefreshCw } from 'lucide-react';

import { Badge } from '../ui/Badge';
import { StageBadge } from '../ui/EstimateBadges';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';
import { effectiveStage } from '../../utils/estimate';
import { formatCurrency, formatCurrencyShort, formatRelativeDays } from '../../utils/format';
import { projectTypeLabels } from '../../constants/labels';
import type { Estimate } from '../../types';
import styles from './EstimateTable.module.css';

export function EstimateTable({
  estimates,
  onDelete,
  deletingId,
}: {
  estimates: Estimate[];
  onDelete?: (id: string) => void;
  deletingId?: string | null;
}): React.JSX.Element {
  return (
    <div className={styles.scroll}>
      <table className={styles.table}>
        <caption className="visually-hidden">Saved estimates</caption>
        <thead>
          <tr>
            <th scope="col">Estimate</th>
            <th scope="col">Stage</th>
            <th scope="col">Team</th>
            <th scope="col">Likely cost</th>
            <th scope="col">Updated</th>
            <th scope="col">
              <span className="visually-hidden">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {estimates.map((estimate) => {
            const result = estimate.result;
            return (
              <tr key={estimate.id}>
                <th scope="row" className={styles.nameCell}>
                  <Link className={styles.name} to={`/estimates/${estimate.id}`}>
                    {estimate.input.projectName}
                  </Link>
                  <span className={styles.metaRow}>
                    <span className={styles.category}>
                      {projectTypeLabels[estimate.input.projectType]}
                    </span>
                    {estimate.origin === 'sample' ? (
                      <Badge tone="neutral" title="Ships with the demo build">
                        Sample
                      </Badge>
                    ) : null}
                  </span>
                </th>
                <td>
                  <StageBadge stage={effectiveStage(estimate)} />
                </td>
                <td className={styles.muted}>{estimate.input.teamSize} people</td>
                <td className={styles.cost}>
                  {result ? (
                    <span
                      title={`Likely ${formatCurrency(result.cost.likely, result.currency)} · illustrative`}
                    >
                      {formatCurrencyShort(result.cost.likely, result.currency)}
                    </span>
                  ) : (
                    <span className={styles.muted}>Not run</span>
                  )}
                </td>
                <td className={styles.muted}>{formatRelativeDays(estimate.updatedAt)}</td>
                <td className={styles.actions}>
                  <Link className={styles.open} to={`/estimates/${estimate.id}`}>
                    Open
                    <ArrowUpRight aria-hidden="true" />
                  </Link>
                  {onDelete ? (
                    <ConfirmDeleteButton
                      label={estimate.input.projectName}
                      busy={deletingId === estimate.id}
                      onConfirm={() => onDelete(estimate.id)}
                    />
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ConfirmDeleteButton({
  label,
  busy,
  onConfirm,
}: {
  label: string;
  busy: boolean;
  onConfirm: () => void;
}): React.JSX.Element {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        className={styles.delete}
        onClick={() => setConfirming(true)}
        aria-label={`Delete ${label}`}
      >
        <Ban aria-hidden="true" />
        Delete
      </button>
    );
  }

  return (
    <span className={styles.confirm} role="group" aria-label={`Confirm deleting ${label}`}>
      <span className={styles.confirmText}>Delete?</span>
      <Button
        variant="danger"
        size="sm"
        onClick={onConfirm}
        disabled={busy}
        aria-label={`Confirm delete ${label}`}
      >
        {busy ? <RefreshCw className={styles.spin} aria-hidden="true" /> : null}
        Yes
      </Button>
      <button
        type="button"
        className={cn(styles.delete, styles.cancel)}
        onClick={() => setConfirming(false)}
        disabled={busy}
      >
        No
      </button>
    </span>
  );
}
