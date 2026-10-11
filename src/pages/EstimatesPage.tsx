import { useMemo, useState } from 'react';
import { ClipboardList, Plus, SearchX } from 'lucide-react';

import { Button } from '../components/ui/Button';
import { DemoNotice } from '../components/ui/DemoNotice';
import { EmptyState } from '../components/ui/EmptyState';
import { LinkButton } from '../components/ui/LinkButton';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/SectionCard';
import { EstimatesTable } from '../components/estimates/EstimatesTable';
import { EstimatesToolbar } from '../components/estimates/EstimatesToolbar';
import type { StatusFilterValue } from '../components/estimates/EstimatesToolbar';
import type { FilterOption } from '../components/ui/FilterChips';
import { PROJECT_CATEGORY_LABELS } from '../constants/labels';
import { useEstimates } from '../store/estimates-context';

import styles from './EstimatesPage.module.css';

export default function EstimatesPage() {
  const { estimates, sampleDataVisible, toggleSampleData, persistenceAvailable } = useEstimates();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilterValue>('all');

  const statusOptions = useMemo<ReadonlyArray<FilterOption<StatusFilterValue>>>(
    () => [
      { value: 'all', label: 'All', count: estimates.length },
      {
        value: 'draft',
        label: 'Draft',
        count: estimates.filter((estimate) => estimate.status === 'draft').length,
      },
      {
        value: 'in-review',
        label: 'In review',
        count: estimates.filter((estimate) => estimate.status === 'in-review').length,
      },
      {
        value: 'approved',
        label: 'Approved',
        count: estimates.filter((estimate) => estimate.status === 'approved').length,
      },
    ],
    [estimates],
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return estimates.filter((estimate) => {
      const matchesStatus = status === 'all' || estimate.status === status;
      const matchesQuery =
        normalized === '' ||
        [
          estimate.projectName,
          estimate.scope,
          PROJECT_CATEGORY_LABELS[estimate.category],
        ].some((field) => field.toLowerCase().includes(normalized));
      return matchesStatus && matchesQuery;
    });
  }, [estimates, query, status]);

  const hasActiveFilters = query.trim() !== '' || status !== 'all';

  const clearFilters = () => {
    setQuery('');
    setStatus('all');
  };

  const renderBody = () => {
    if (estimates.length === 0) {
      return (
        <EmptyState
          icon={ClipboardList}
          title="No estimates yet"
          description={
            sampleDataVisible
              ? 'Create your first estimate to start building a project workspace.'
              : 'Sample data is hidden, so there is nothing to show yet.'
          }
          action={
            <LinkButton to="/new-estimate" iconStart={<Plus size={16} aria-hidden="true" />}>
              New Estimate
            </LinkButton>
          }
        />
      );
    }

    if (filtered.length === 0) {
      return (
        <EmptyState
          icon={SearchX}
          title="No matching estimates"
          description="No estimates match the current search and status filter. Try a different term or clear the filters."
          action={
            <Button variant="secondary" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      );
    }

    return <EstimatesTable estimates={filtered} />;
  };

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Estimates"
        description="Search and filter your project cost estimates. New drafts are stored in this browser only."
        actions={
          <LinkButton to="/new-estimate" iconStart={<Plus size={16} aria-hidden="true" />}>
            New Estimate
          </LinkButton>
        }
      />

      <DemoNotice
        action={
          <Button
            variant="ghost"
            size="sm"
            aria-pressed={sampleDataVisible}
            onClick={toggleSampleData}
          >
            {sampleDataVisible ? 'Hide sample data' : 'Show sample data'}
          </Button>
        }
      >
        Sample estimates are illustrative demo data. Drafts you create live only in this browser —
        there is no server yet.
      </DemoNotice>

      {!persistenceAvailable ? (
        <p className={styles.storageWarning} role="alert">
          Browser storage is unavailable, so new drafts will not be saved on this device.
        </p>
      ) : null}

      <EstimatesToolbar
        query={query}
        onQueryChange={setQuery}
        status={status}
        onStatusChange={setStatus}
        statusOptions={statusOptions}
        resultCount={filtered.length}
        totalCount={estimates.length}
        hasActiveFilters={hasActiveFilters}
        onClear={clearFilters}
      />

      <SectionCard flush>{renderBody()}</SectionCard>
    </>
  );
}
