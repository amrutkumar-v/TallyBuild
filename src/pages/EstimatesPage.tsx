import { useMemo, useState } from 'react';
import { FilePlus2, FolderOpen, Search, TriangleAlert, X } from 'lucide-react';

import { DemoNotice } from '../components/ui/DemoNotice';
import { EmptyState } from '../components/ui/EmptyState';
import { FilterChips } from '../components/ui/FilterChips';
import { LinkButton } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/SectionCard';
import { EstimateTable } from '../components/estimates/EstimateTable';
import { stageLabels } from '../constants/labels';
import { errorMessage } from '../services';
import { useEstimates } from '../store/estimates-context';
import { effectiveStage } from '../utils/estimate';
import type { EstimateStage } from '../types';
import styles from './EstimatesPage.module.css';

type OriginFilter = 'user' | 'sample';

const stageOptions = (Object.keys(stageLabels) as EstimateStage[]).map((value) => ({
  value,
  label: stageLabels[value],
}));

const originOptions: Array<{ value: OriginFilter; label: string }> = [
  { value: 'user', label: 'Created here' },
  { value: 'sample', label: 'Demo samples' },
];

export function EstimatesPage(): React.JSX.Element {
  const { estimates, status, error, removeEstimate } = useEstimates();
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState<EstimateStage | null>(null);
  const [origin, setOrigin] = useState<OriginFilter | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return estimates.filter((estimate) => {
      if (stage && effectiveStage(estimate) !== stage) return false;
      if (origin && estimate.origin !== origin) return false;
      if (!needle) return true;
      const haystack = [
        estimate.input.projectName,
        estimate.input.requirements,
        estimate.input.constraints.join(' '),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [estimates, query, stage, origin]);

  const hasFilters = Boolean(query.trim() || stage || origin);

  const clearFilters = (): void => {
    setQuery('');
    setStage(null);
    setOrigin(null);
  };

  const handleDelete = async (id: string): Promise<void> => {
    setDeletingId(id);
    setActionError(null);
    try {
      await removeEstimate(id);
    } catch (caught) {
      setActionError(errorMessage(caught));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Saved estimates"
        description="Every estimate stored in this browser, including the demo samples."
        actions={
          <LinkButton to="/estimates/new">
            <FilePlus2 aria-hidden="true" />
            New estimate
          </LinkButton>
        }
      />

      <DemoNotice />

      {actionError ? (
        <div className={styles.actionError} role="alert">
          <TriangleAlert aria-hidden="true" />
          <span>{actionError}</span>
        </div>
      ) : null}

      <SectionCard
        title="All estimates"
        description={
          status === 'ready'
            ? `${filtered.length} of ${estimates.length} shown`
            : undefined
        }
        actions={
          hasFilters ? (
            <button type="button" className={styles.clear} onClick={clearFilters}>
              Clear filters
            </button>
          ) : undefined
        }
        flush
      >
        <div className={styles.toolbar}>
          <div className={styles.search}>
            <Search className={styles.searchIcon} aria-hidden="true" />
            <input
              className={styles.searchInput}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, brief or constraint…"
              aria-label="Search estimates"
            />
            {query ? (
              <button
                type="button"
                className={styles.searchClear}
                onClick={() => setQuery('')}
                aria-label="Clear search"
              >
                <X aria-hidden="true" />
              </button>
            ) : null}
          </div>

          <div className={styles.filters}>
            <FilterChips
              label="Filter by stage"
              allLabel="All stages"
              options={stageOptions}
              value={stage}
              onChange={setStage}
            />
            <FilterChips
              label="Filter by origin"
              allLabel="All sources"
              options={originOptions}
              value={origin}
              onChange={setOrigin}
            />
          </div>
        </div>

        {status === 'loading' ? (
          <p className={styles.loading}>Loading estimates…</p>
        ) : status === 'error' ? (
          <EmptyState
            icon={<TriangleAlert />}
            title="Could not load estimates"
            description={error ?? 'Something went wrong while loading the saved estimates.'}
          />
        ) : estimates.length === 0 ? (
          <EmptyState
            icon={<FolderOpen />}
            title="No estimates yet"
            description="Create your first estimate and it will appear here."
            action={
              <LinkButton to="/estimates/new">
                <FilePlus2 aria-hidden="true" />
                New estimate
              </LinkButton>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Search />}
            title="No estimates match"
            description="Try a different search term or clear the filters."
            action={
              <button type="button" className={styles.clearButton} onClick={clearFilters}>
                Clear filters
              </button>
            }
          />
        ) : (
          <EstimateTable
            estimates={filtered}
            onDelete={(id) => void handleDelete(id)}
            deletingId={deletingId}
          />
        )}
      </SectionCard>
    </>
  );
}
