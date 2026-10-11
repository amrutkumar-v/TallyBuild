import { CheckCircle2, Scale } from 'lucide-react';

import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/SectionCard';

import styles from './ComparisonPage.module.css';

const CAPABILITIES = [
  'Line up two or more project scenarios side by side.',
  'Compare estimated totals, currency, duration and complexity on like-for-like terms.',
  'See which option best fits the budget — without leaving the workspace.',
];

const PREVIEW_ROWS = [
  { label: 'Estimated total', value: '—' },
  { label: 'Currency', value: '—' },
  { label: 'Duration (weeks)', value: '—' },
  { label: 'Complexity', value: '—' },
  { label: 'Category', value: '—' },
];

export default function ComparisonPage() {
  return (
    <>
      <PageHeader
        eyebrow="Phase 03 preview"
        title="Scenario Comparison"
        description="Weigh project cost scenarios on the factors that move a budget."
        actions={<Badge tone="accent">Coming soon</Badge>}
      />

      <SectionCard
        title="What comparison will do"
        description="This screen will compare saved project estimates on like-for-like terms."
      >
        <ul className={styles.list}>
          {CAPABILITIES.map((item) => (
            <li key={item} className={styles.listItem}>
              <CheckCircle2 size={18} className={styles.check} aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard
        title="Comparison workspace preview"
        description="A placeholder layout to show the intended structure."
        actions={<Badge tone="neutral">Illustrative layout</Badge>}
      >
        <div className={styles.preview} role="group" aria-label="Illustrative comparison layout">
          <div className={styles.previewHeader}>
            <span className={styles.previewCorner}>Attribute</span>
            <div className={styles.option}>
              <span className={styles.optionName}>Scenario A</span>
              <span className={styles.optionState}>No scenario selected</span>
            </div>
            <div className={styles.option}>
              <span className={styles.optionName}>Scenario B</span>
              <span className={styles.optionState}>No scenario selected</span>
            </div>
          </div>
          {PREVIEW_ROWS.map((row) => (
            <div key={row.label} className={styles.previewRow}>
              <span className={styles.rowLabel}>{row.label}</span>
              <span className={styles.rowValue} aria-hidden="true">
                {row.value}
              </span>
              <span className={styles.rowValue} aria-hidden="true">
                {row.value}
              </span>
            </div>
          ))}
        </div>
        <div className={styles.previewFooter}>
          <Button variant="secondary" disabled>
            Compare scenarios
          </Button>
          <p className={styles.disabledNote}>Available once scenario tooling lands in Phase 03.</p>
        </div>
      </SectionCard>

      <SectionCard
        title="Honest status"
        description="No totals, durations or specifications are fabricated on this screen."
      >
        <p className={styles.note}>
          <Scale size={16} aria-hidden="true" />
          Scenario comparison will be added in Phase 03. Until then, every comparison value stays
          empty rather than guessed.
        </p>
      </SectionCard>
    </>
  );
}
