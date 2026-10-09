import type { LucideIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import styles from './SummaryCard.module.css';

interface SummaryCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
}

export function SummaryCard({ icon: Icon, label, value, hint }: SummaryCardProps): ReactElement {
  return (
    <article className={styles.card}>
      <span className={styles.iconWrap} aria-hidden="true">
        <Icon size={18} strokeWidth={2} />
      </span>
      <p className={styles.label}>{label}</p>
      <p className={styles.value}>{value}</p>
      {hint ? <p className={styles.hint}>{hint}</p> : null}
    </article>
  );
}
