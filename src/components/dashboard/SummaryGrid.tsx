import { ClipboardList, IndianRupee, Scale } from 'lucide-react';

import { SummaryCard } from '../ui/SummaryCard';
import { formatCurrencyShort } from '../../utils/format';
import type { Estimate } from '../../types';

import styles from './SummaryGrid.module.css';

interface SummaryGridProps {
  estimates: Estimate[];
}

export function SummaryGrid({ estimates }: SummaryGridProps) {
  const total = estimates.length;
  const valuedEstimates = estimates.filter((estimate) => estimate.estimatedAmount !== null);
  const totalValue = valuedEstimates.reduce(
    (sum, estimate) => sum + (estimate.estimatedAmount ?? 0),
    0,
  );

  return (
    <section className={styles.grid} aria-label="Estimate summary">
      <SummaryCard
        icon={ClipboardList}
        label="Total estimates"
        value={String(total)}
        hint={total === 1 ? '1 project in this workspace' : `${total} projects in this workspace`}
      />
      <SummaryCard
        icon={IndianRupee}
        label="Estimated project value"
        value={formatCurrencyShort(totalValue)}
        hint={
          valuedEstimates.length > 0
            ? `Across ${valuedEstimates.length} ${
                valuedEstimates.length === 1 ? 'estimate' : 'estimates'
              } · illustrative demo data`
            : 'No valued estimates yet'
        }
      />
      <SummaryCard
        icon={Scale}
        label="Saved comparisons"
        value="0"
        hint="Product comparison arrives in Phase 03"
      />
    </section>
  );
}
