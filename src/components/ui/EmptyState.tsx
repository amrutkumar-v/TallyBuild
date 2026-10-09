import type { LucideIcon } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';

import styles from './EmptyState.module.css';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
}: EmptyStateProps): ReactElement {
  return (
    <div className={compact ? styles.compact : styles.panel}>
      <span className={styles.iconWrap} aria-hidden="true">
        <Icon size={22} strokeWidth={1.8} />
      </span>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
