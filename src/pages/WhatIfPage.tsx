import { ArrowRight, CalendarClock, Coins, SlidersHorizontal, Users } from 'lucide-react';

import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/SectionCard';

import styles from './WhatIfPage.module.css';

const SCENARIOS = [
  {
    icon: Users,
    title: 'Team scenarios',
    description:
      'Change team size or hours — for example a 20% effort buffer — and see how the estimate responds.',
  },
  {
    icon: Coins,
    title: 'Rate scenarios',
    description:
      'Stress-test the budget against hourly rate or monthly infrastructure cost shifts before you commit.',
  },
  {
    icon: CalendarClock,
    title: 'Duration scenarios',
    description:
      'Adjust the number of months of infrastructure or the project length and watch the total move.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Budget outcomes',
    description:
      'Compare baseline versus scenario totals side by side so trade-offs are easy to explain.',
  },
];

const FLOW = [
  { label: 'Your inputs', note: 'Cost lines, currency and timing' },
  { label: 'Estimation service', note: 'Available now' },
  { label: 'Scenario outcomes', note: 'Planned for Phase 03' },
];

export default function WhatIfPage() {
  return (
    <>
      <PageHeader
        eyebrow="Phase 03 preview"
        title="What-if Analysis"
        description="Explore how team, rate and duration changes ripple through a project cost estimate."
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

      <SectionCard title="Honest status" description="No scenario calculations run yet.">
        <p className={styles.note}>
          Scenario inputs and results stay disabled until the what-if tooling (Phase 03) is built,
          so no numbers here are invented.
        </p>
      </SectionCard>
    </>
  );
}
