import type { ReactNode } from 'react';

import styles from './SectionCard.module.css';
import { cn } from '../../utils/cn';

export function SectionCard({
  title,
  description,
  actions,
  icon,
  flush = false,
  className,
  bodyClassName,
  children,
  headingId,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  icon?: ReactNode;
  /** Remove body padding (tables manage their own). */
  flush?: boolean;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
  headingId?: string;
}): React.JSX.Element {
  return (
    <section className={cn(styles.card, className)}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <div className={styles.titleRow}>
            {icon}
            <h2 className={styles.title} id={headingId}>
              {title}
            </h2>
          </div>
          {description ? <p className={styles.description}>{description}</p> : null}
        </div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </header>
      <div className={cn(flush ? styles.bodyFlush : styles.body, bodyClassName)}>{children}</div>
    </section>
  );
}
