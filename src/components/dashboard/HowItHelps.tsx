import { Calculator, ClipboardList, Scale } from 'lucide-react';

import { SectionCard } from '../ui/SectionCard';

import styles from './HowItHelps.module.css';

const STEPS = [
  {
    icon: ClipboardList,
    phase: 'Available now',
    title: 'Capture the project',
    description:
      'Record the project name, scope, category and complexity so every estimate stays organised from the first draft.',
  },
  {
    icon: Calculator,
    phase: 'Available now',
    title: 'Total the cost lines',
    description:
      'Add personnel, tooling, infrastructure and other costs and let the estimation service total them transparently in one currency.',
  },
  {
    icon: Scale,
    phase: 'Phase 03',
    title: 'Compare and stress-test',
    description:
      'Compare project scenarios and run what-if analysis on rates and durations before committing.',
  },
];

export function HowItHelps() {
  return (
    <SectionCard
      title="How TallyBuild AI helps"
      description="A project cost-estimation workspace for KLE TECH HACKFEST 2026, Domain 4C — AI for cost estimation of building products."
    >
      <ol className={styles.steps}>
        {STEPS.map((step) => (
          <li key={step.title} className={styles.step}>
            <span className={styles.icon} aria-hidden="true">
              <step.icon size={18} />
            </span>
            <span className={styles.phase}>{step.phase}</span>
            <h3 className={styles.stepTitle}>{step.title}</h3>
            <p className={styles.stepText}>{step.description}</p>
          </li>
        ))}
      </ol>
    </SectionCard>
  );
}
