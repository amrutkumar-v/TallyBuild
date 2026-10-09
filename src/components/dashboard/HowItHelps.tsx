import { Calculator, ClipboardList, Scale } from 'lucide-react';

import { SectionCard } from '../ui/SectionCard';

import styles from './HowItHelps.module.css';

const STEPS = [
  {
    icon: ClipboardList,
    phase: 'Available now',
    title: 'Capture the project',
    description:
      'Record the project name, location and type so every estimate stays organised from the first draft.',
  },
  {
    icon: Calculator,
    phase: 'Phase 02',
    title: 'Estimate product costs',
    description:
      'The estimation engine will turn quantities and material choices into transparent building-product cost estimates.',
  },
  {
    icon: Scale,
    phase: 'Phase 03',
    title: 'Compare and stress-test',
    description:
      'Compare product alternatives and run what-if scenarios on quantities and material prices before committing.',
  },
];

export function HowItHelps() {
  return (
    <SectionCard
      title="How TallyBuild AI helps"
      description="A construction-tech workspace for KLE TECH HACKFEST 2026, Domain 4C — AI for cost estimation of building products."
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
