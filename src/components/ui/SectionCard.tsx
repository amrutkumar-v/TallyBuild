import type { ReactElement, ReactNode } from 'react';

import { cn } from '../../utils/cn';

import styles from './SectionCard.module.css';

interface SectionCardProps {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  flush?: boolean;
  as?: 'section' | 'div';
}

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
  flush = false,
  as: Element = 'section',
}: SectionCardProps): ReactElement {
  const hasHeader = Boolean(title) || Boolean(actions);
  return (
    <Element className={cn(styles.card, className)}>
      {hasHeader ? (
        <div className={styles.header}>
          <div className={styles.heading}>
            {title ? <h2 className={styles.title}>{title}</h2> : null}
            {description ? <p className={styles.description}>{description}</p> : null}
          </div>
          {actions ? <div className={styles.actions}>{actions}</div> : null}
        </div>
      ) : null}
      <div className={flush ? styles.bodyFlush : styles.body}>{children}</div>
    </Element>
  );
}
