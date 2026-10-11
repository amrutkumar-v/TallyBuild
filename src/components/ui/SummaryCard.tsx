import type { ReactNode } from 'react';

import styles from './SummaryCard.module.css';
import { cn } from '../../utils/cn';
import type { SummaryCardTone } from './uiTypes';

export function SummaryCard({
  label,
  value,
  hint,
  icon,
  tone = 'neutral',
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: SummaryCardTone;
  className?: string;
}): React.JSX.Element {
  return (
    <div className={cn(styles.card, styles[tone], className)}>
      <div className={styles.top}>
        <span className={styles.label}>{label}</span>
        {icon ? (
          <span className={styles.icon} aria-hidden="true">
            {icon}
          </span>
        ) : null}
      </div>
      <p className={styles.value}>{value}</p>
      {hint ? <p className={styles.hint}>{hint}</p> : null}
    </div>
  );
}
