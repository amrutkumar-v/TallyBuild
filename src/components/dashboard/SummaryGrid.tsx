import { Coins, ClipboardList, Scale } from 'lucide-react';

import { SUPPORTED_CURRENCIES } from '../../estimation';
import type { CurrencyCode } from '../../estimation';
import { formatCurrencyShort } from '../../utils/format';
import type { Estimate } from '../../types';
import { SummaryCard } from '../ui/SummaryCard';

import styles from './SummaryGrid.module.css';

interface SummaryGridProps {
  estimates: Estimate[];
}

export function SummaryGrid({ estimates }: SummaryGridProps) {
  const total = estimates.length;
  const valuedEstimates = estimates.filter((estimate) => estimate.estimatedAmount !== null);

  const totalsByCurrency = SUPPORTED_CURRENCIES.map((currency) => {
    const sum = valuedEstimates
      .filter((estimate) => estimate.currency === currency)
      .reduce((accumulator, estimate) => accumulator + (estimate.estimatedAmount ?? 0), 0);
    const count = valuedEstimates.filter((estimate) => estimate.currency === currency).length;
    return { currency, sum, count };
  }).filter((entry) => entry.count > 0);

  const valueText =
    totalsByCurrency.length > 0
      ? totalsByCurrency
          .map((entry) => formatCurrencyShort(entry.sum, entry.currency as CurrencyCode))
          .join(' · ')
      : '—';

  const valueHint =
    totalsByCurrency.length > 0
      ? `Across ${valuedEstimates.length} ${
          valuedEstimates.length === 1 ? 'estimate' : 'estimates'
        } · shown per currency · illustrative demo data`
      : 'No valued estimates yet';

  return (
    <section className={styles.grid} aria-label="Estimate summary">
      <SummaryCard
        icon={ClipboardList}
        label="Total estimates"
        value={String(total)}
        hint={total === 1 ? '1 project in this workspace' : `${total} projects in this workspace`}
      />
      <SummaryCard
        icon={Coins}
        label="Estimated project value"
        value={valueText}
        hint={valueHint}
      />
      <SummaryCard
        icon={Scale}
        label="Scenario comparison"
        value="Not configured"
        hint="Scenario comparison arrives in Phase 03"
      />
    </section>
  );
}
