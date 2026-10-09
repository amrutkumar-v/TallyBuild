import { ArrowRight, IndianRupee, Package, SlidersHorizontal } from 'lucide-react';

import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/SectionCard';

import styles from './WhatIfPage.module.css';

const SCENARIOS = [
  {
    icon: Package,
    title: 'Quantity scenarios',
    description:
      'Change line-item quantities — for example a 10% material buffer — and see how the estimate responds.',
  },
  {
    icon: IndianRupee,
    title: 'Material price scenarios',
    description:
      'Stress-test the budget against supplier price shifts before you lock in a product choice.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Budget outcomes',
    description:
      'Compare baseline versus scenario totals side by side so trade-offs are easy to explain.',
  },
];

const FLOW = [
  { label: 'Your inputs', note: 'Quantities and material choices' },
  { label: 'Estimation engine', note: 'Arrives in Phase 02' },
  { label: 'Scenario outcomes', note: 'Planned for Phase 03' },
];

export default function WhatIfPage() {
  return (
    <>
      <PageHeader
        eyebrow="Phase 03 preview"
        title="What-if Analysis"
        description="Explore how quantity and material-price changes ripple through a building-product estimate."
        actions={<Badge tone="accent">Coming soon</Badge>}
      />

      <SectionCard
        title="What scenario analysis will cover"
        description="Planned capabilities, listed honestly ahead of implementation."
      >
        <ul className={styles.scenarios}>
          {SCENARIOS.map((scenario) => (
            <li key={scenario.title} className={styles.scenario}>
              <span className={styles.icon} aria-hidden="true">
                <scenario.icon size={18} />
              </span>
              <h3 className={styles.scenarioTitle}>{scenario.title}</h3>
              <p className={styles.scenarioText}>{scenario.description}</p>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Planned flow">
        <div className={styles.flow}>
          {FLOW.map((node, index) => (
            <div key={node.label} className={styles.flowItem}>
              <div className={styles.flowNode}>
                <span className={styles.flowLabel}>{node.label}</span>
                <span className={styles.flowNote}>{node.note}</span>
              </div>
              {index < FLOW.length - 1 ? (
                <ArrowRight size={18} className={styles.flowArrow} aria-hidden="true" />
              ) : null}
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Honest status"
        description="No scenario calculations run yet."
      >
        <p className={styles.note}>
          Scenario inputs and results stay disabled until the estimation engine (Phase 02) and the
          what-if tooling (Phase 03) are built, so no numbers here are invented.
        </p>
      </SectionCard>
    </>
  );
}
