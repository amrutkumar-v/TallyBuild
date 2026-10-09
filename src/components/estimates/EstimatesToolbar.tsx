import { Button } from '../ui/Button';
import { FilterChips } from '../ui/FilterChips';
import { SearchField } from '../ui/SearchField';
import type { FilterOption } from '../ui/FilterChips';
import type { EstimateStatus } from '../../types';

import styles from './EstimatesToolbar.module.css';

export type StatusFilterValue = EstimateStatus | 'all';

interface EstimatesToolbarProps {
  query: string;
  onQueryChange: (value: string) => void;
  status: StatusFilterValue;
  onStatusChange: (value: StatusFilterValue) => void;
  statusOptions: ReadonlyArray<FilterOption<StatusFilterValue>>;
  resultCount: number;
  totalCount: number;
  hasActiveFilters: boolean;
  onClear: () => void;
}

export function EstimatesToolbar({
  query,
  onQueryChange,
  status,
  onStatusChange,
  statusOptions,
  resultCount,
  totalCount,
  hasActiveFilters,
  onClear,
}: EstimatesToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.controls}>
        <SearchField
          id="estimate-search"
          label="Search estimates"
          value={query}
          onChange={onQueryChange}
          placeholder="Search by project, location or type"
        />
        <FilterChips
          legend="Filter estimates by status"
          options={statusOptions}
          value={status}
          onChange={onStatusChange}
        />
      </div>
      <div className={styles.summary}>
        <p className={styles.count} aria-live="polite">
          Showing {resultCount} of {totalCount} {totalCount === 1 ? 'estimate' : 'estimates'}
        </p>
        {hasActiveFilters ? (
          <Button variant="ghost" size="sm" onClick={onClear}>
            Clear filters
          </Button>
        ) : null}
      </div>
    </div>
  );
}
