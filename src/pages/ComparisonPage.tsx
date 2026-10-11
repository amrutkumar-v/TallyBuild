import { useMemo, useState } from 'react';
import { ChevronLeft, Scale, X } from 'lucide-react';

import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/SectionCard';
import { EstimatesTable } from '../components/estimates/EstimatesTable';
import { ComparisonBarChart } from '../components/ui/charts';
import { useEstimates } from '../store/estimates-context';
import { formatCurrency } from '../utils/format';
import { PROJECT_CATEGORY_LABELS, PROJECT_COMPLEXITY_LABELS } from '../constants/labels';
import type { Estimate } from '../types';

import styles from './ComparisonPage.module.css';

const COMPARISON_ATTRIBUTES = [
  { key: 'projectName', label: 'Project name', getValue: (e: Estimate) => e.projectName },
  { key: 'scope', label: 'Scope', getValue: (e: Estimate) => e.scope },
  { key: 'category', label: 'Category', getValue: (e: Estimate) => PROJECT_CATEGORY_LABELS[e.category] },
  { key: 'complexity', label: 'Complexity', getValue: (e: Estimate) => PROJECT_COMPLEXITY_LABELS[e.complexity] },
  { key: 'currency', label: 'Currency', getValue: (e: Estimate) => e.currency },
  { key: 'plannedStartDate', label: 'Planned start', getValue: (e: Estimate) => e.plannedStartDate ?? 'Not set' },
  { key: 'durationWeeks', label: 'Duration (weeks)', getValue: (e: Estimate) => e.durationWeeks?.toString() ?? 'Not set' },
  { key: 'estimatedAmount', label: 'Estimated total', getValue: (e: Estimate) => e.estimatedAmount === null ? 'Not estimated' : formatCurrency(e.estimatedAmount, e.currency) },
  { key: 'actualAmount', label: 'Actual total', getValue: (e: Estimate) => e.actualAmount === null ? 'Not recorded' : formatCurrency(e.actualAmount, e.currency) },
  { key: 'status', label: 'Status', getValue: (e: Estimate) => e.status },
];

function ComparisonCard({
  estimate,
  onRemove,
  isEmpty,
}: {
  estimate: Estimate | null;
  onRemove: () => void;
  isEmpty: boolean;
}) {
  if (isEmpty || !estimate) {
    return (
      <div className={styles.emptyCard}>
        <div className={styles.emptyIcon}>
          <Scale size={32} aria-hidden="true" />
        </div>
        <h3 className={styles.emptyTitle}>No estimate selected</h3>
        <p className={styles.emptyText}>
          Pick an estimate from the list to add it to the comparison.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>{estimate.projectName}</h3>
        <Button
          variant="ghost"
          size="sm"
          iconStart={<X size={14} aria-hidden="true" />}
          onClick={onRemove}
          aria-label={`Remove ${estimate.projectName} from comparison`}
        />
      </div>
      <dl className={styles.attributes}>
        {COMPARISON_ATTRIBUTES.map((attr) => (
          <div key={attr.key} className={styles.attrRow}>
            <dt className={styles.attrLabel}>{attr.label}</dt>
            <dd className={styles.attrValue}>{attr.getValue(estimate)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function ComparisonPage() {
  const { estimates } = useEstimates();
  const [selectedA, setSelectedA] = useState<Estimate | null>(null);
  const [selectedB, setSelectedB] = useState<Estimate | null>(null);

  const availableEstimates = useMemo(() => {
    const picked = new Set([selectedA?.id, selectedB?.id].filter(Boolean));
    return estimates.filter((e) => !picked.has(e.id));
  }, [estimates, selectedA, selectedB]);

  const hasComparison = selectedA && selectedB;

  const handleSelectA = (estimate: Estimate) => {
    setSelectedA(estimate);
  };

  const handleSelectB = (estimate: Estimate) => {
    setSelectedB(estimate);
  };

  const handleClear = (slot: 'A' | 'B') => {
    if (slot === 'A') {
      setSelectedA(null);
    } else {
      setSelectedB(null);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Scenario Comparison"
        description="Place two estimates side by side to compare costs, timelines and scope on like-for-like terms."
        actions={
          <Badge tone="accent">Phase 03 preview</Badge>
        }
      />

      <SectionCard
        title="Select estimates to compare"
        description="Choose up to two estimates from your workspace. Estimates already in the comparison are hidden from the list."
      >
        {estimates.length === 0 ? (
          <div className={styles.emptyState}>
            <Scale size={48} className={styles.emptyIcon} aria-hidden="true" />
            <p className={styles.emptyTitle}>No estimates available</p>
            <p className={styles.emptyText}>
              Create estimates on the <strong>New Estimate</strong> page to enable comparison.
            </p>
            <Button
              variant="secondary"
              iconStart={<ChevronLeft size={16} aria-hidden="true" />}
              onClick={() => window.location.href = '/new-estimate'}
            >
              Create an estimate
            </Button>
          </div>
        ) : (
          <>
            <p className={styles.selectHint}>
              <strong>Slot A:</strong> {selectedA ? selectedA.projectName : 'Click an estimate to select'}
            </p>
            <EstimatesTable
              estimates={availableEstimates}
              onRowClick={handleSelectA}
            />
            <p className={styles.selectHint}>
              <strong>Slot B:</strong> {selectedB ? selectedB.projectName : 'Click an estimate to select'}
            </p>
            <EstimatesTable
              estimates={availableEstimates}
              onRowClick={handleSelectB}
            />
          </>
        )}
      </SectionCard>

      <SectionCard
        title="Comparison"
        description={hasComparison
          ? 'Review the two scenarios side by side. Differences in scope, cost or timing are easy to spot.'
          : 'Select two estimates above to see a detailed attribute-by-attribute comparison.'}
      >
        {hasComparison && (
          <div className={styles.chartSection} aria-labelledby="comparison-chart-title">
            <h3 id="comparison-chart-title" className={styles.chartTitle}>Cost comparison</h3>
            <ComparisonBarChart estimates={[selectedA!, selectedB!]} />
          </div>
        )}

        <div className={styles.comparisonGrid}>
          <ComparisonCard
            estimate={selectedA}
            onRemove={() => handleClear('A')}
            isEmpty={!selectedA}
          />
          <div className={styles.vs}>
            <Scale size={24} aria-hidden="true" />
            <span className={styles.vsLabel}>VS</span>
          </div>
          <ComparisonCard
            estimate={selectedB}
            onRemove={() => handleClear('B')}
            isEmpty={!selectedB}
          />
        </div>

        {hasComparison && (
          <div className={styles.diffSection}>
            <h3 className={styles.diffTitle}>Key differences</h3>
            <ul className={styles.diffList}>
              {COMPARISON_ATTRIBUTES.map((attr) => {
                const valA = attr.getValue(selectedA!);
                const valB = attr.getValue(selectedB!);
                const isDifferent = valA !== valB;
                return isDifferent ? (
                  <li key={attr.key} className={styles.diffItem}>
                    <span className={styles.diffLabel}>{attr.label}</span>
                    <div className={styles.diffValues}>
                      <span className={styles.diffValue}>
                        <strong>{selectedA!.projectName}:</strong> {valA}
                      </span>
                      <span className={styles.diffValue}>
                        <strong>{selectedB!.projectName}:</strong> {valB}
                      </span>
                    </div>
                  </li>
                ) : null;
              })}
            </ul>
            {COMPARISON_ATTRIBUTES.every((attr) => attr.getValue(selectedA!) === attr.getValue(selectedB!)) && (
              <p className={styles.noDiff}>No differences found between the selected estimates.</p>
            )}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Honest status"
        description="Scenario comparison tooling is planned for Phase 03."
      >
        <p className={styles.note}>
          <Scale size={16} aria-hidden="true" />
          Comparison features like scenario naming, saving comparisons, and export will be added in Phase 03.
          Until then, this screen provides a manual side-by-side view using your existing estimates.
        </p>
      </SectionCard>
    </>
  );
}