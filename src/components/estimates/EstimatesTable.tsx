import { MapPin } from 'lucide-react';

import { Badge } from '../ui/Badge';
import {
  ESTIMATE_STATUS_LABELS,
  ESTIMATE_STATUS_TONES,
  PROJECT_TYPE_LABELS,
} from '../../constants/labels';
import { formatCurrency, formatDate } from '../../utils/format';
import type { Estimate } from '../../types';

import styles from './EstimatesTable.module.css';

interface EstimatesTableProps {
  estimates: Estimate[];
}

export function EstimatesTable({ estimates }: EstimatesTableProps) {
  return (
    <table className={styles.table} role="table">
      <caption className="visually-hidden">
        Estimates with project, type, creation date, estimated amount and status
      </caption>
      <thead role="rowgroup">
        <tr role="row">
          <th scope="col" role="columnheader">
            Project
          </th>
          <th scope="col" role="columnheader">
            Type
          </th>
          <th scope="col" role="columnheader">
            Created
          </th>
          <th scope="col" role="columnheader" className={styles.numeric}>
            Estimated amount
          </th>
          <th scope="col" role="columnheader">
            Status
          </th>
        </tr>
      </thead>
      <tbody role="rowgroup">
        {estimates.map((estimate) => (
          <tr key={estimate.id} role="row">
            <th scope="row" role="rowheader" data-label="Project" className={styles.projectCell}>
              <span className={styles.projectName}>{estimate.projectName}</span>
              <span className={styles.projectMeta}>
                <MapPin size={13} aria-hidden="true" />
                {estimate.location}
                {estimate.origin === 'local' ? (
                  <span className={styles.localTag}>Local draft</span>
                ) : null}
              </span>
            </th>
            <td role="cell" data-label="Type">
              {PROJECT_TYPE_LABELS[estimate.projectType]}
            </td>
            <td role="cell" data-label="Created">
              {formatDate(estimate.createdAt)}
            </td>
            <td role="cell" data-label="Estimated amount" className={styles.numeric}>
              {estimate.estimatedAmount === null ? (
                <span className={styles.pending}>Not estimated</span>
              ) : (
                formatCurrency(estimate.estimatedAmount)
              )}
            </td>
            <td role="cell" data-label="Status">
              <Badge tone={ESTIMATE_STATUS_TONES[estimate.status]}>
                {ESTIMATE_STATUS_LABELS[estimate.status]}
              </Badge>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
