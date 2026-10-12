import { CalendarClock, ChevronRight } from 'lucide-react';

import { Badge } from '../ui/Badge';
import {
  ESTIMATE_STATUS_LABELS,
  ESTIMATE_STATUS_TONES,
  PROJECT_CATEGORY_LABELS,
  PROJECT_COMPLEXITY_LABELS,
} from '../../constants/labels';
import { formatCurrency, formatDate } from '../../utils/format';
import type { Estimate } from '../../types';

import styles from './EstimatesTable.module.css';

interface EstimatesTableProps {
  estimates: ReadonlyArray<Estimate>;
  onRowClick?: (estimate: Estimate) => void;
}

export function EstimatesTable({
  estimates,
  onRowClick,
}: EstimatesTableProps) {
  const isClickable = Boolean(onRowClick);

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <caption className="visually-hidden">
          Project estimates with category, complexity, planned start, estimated and actual
          amounts, and status
        </caption>
        <thead>
          <tr>
            <th scope="col">Project</th>
            <th scope="col">Category</th>
            <th scope="col">Complexity</th>
            <th scope="col">Planned start</th>
            <th scope="col" className={styles.numeric}>
              Estimated
            </th>
            <th scope="col" className={styles.numeric}>
              Actual
            </th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {estimates.map((estimate) => (
            <tr
              key={estimate.id}
              className={isClickable ? styles.clickableRow : ''}
              onClick={isClickable ? () => onRowClick!(estimate) : undefined}
              tabIndex={isClickable ? 0 : undefined}
              onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') onRowClick!(estimate); } : undefined}
            >
              <th scope="row" data-label="Project" className={styles.projectCell}>
                <span className={styles.projectName}>{estimate.projectName}</span>
                <span className={styles.projectMeta}>
                  {estimate.scope}
                  {estimate.origin === 'local' ? (
                    <span className={styles.localTag}>Local draft</span>
                  ) : null}
                </span>
              </th>
              <td data-label="Category">{PROJECT_CATEGORY_LABELS[estimate.category]}</td>
              <td data-label="Complexity">{PROJECT_COMPLEXITY_LABELS[estimate.complexity]}</td>
              <td data-label="Planned start">
                {estimate.plannedStartDate === null ? (
                  <span className={styles.pending}>Not planned</span>
                ) : (
                  <span className={styles.dateCell}>
                    <CalendarClock size={13} aria-hidden="true" />
                    {formatDate(estimate.plannedStartDate)}
                  </span>
                )}
              </td>
              <td data-label="Estimated" className={styles.numeric}>
                {estimate.estimatedAmount === null ? (
                  <span className={styles.pending}>Not estimated</span>
                ) : (
                  formatCurrency(estimate.estimatedAmount, estimate.currency)
                )}
              </td>
              <td data-label="Actual" className={styles.numeric}>
                {estimate.actualAmount === null ? (
                  <span className={styles.pending}>Not recorded</span>
                ) : (
                  formatCurrency(estimate.actualAmount, estimate.currency)
                )}
              </td>
              <td data-label="Status">
                <Badge tone={ESTIMATE_STATUS_TONES[estimate.status]}>
                  {ESTIMATE_STATUS_LABELS[estimate.status]}
                </Badge>
              </td>
              {isClickable && (
                <td className={styles.clickHint}>
                  <ChevronRight size={14} aria-hidden="true" />
                  <span className="visually-hidden">Click to select</span>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}