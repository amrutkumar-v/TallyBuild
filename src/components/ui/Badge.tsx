import type { ReactNode } from 'react';

import styles from './Badge.module.css';
import { cn } from '../../utils/cn';
import type { BadgeTone } from './uiTypes';

export function Badge({
  tone = 'neutral',
  children,
  className,
  title,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
  title?: string;
}): React.JSX.Element {
  return (
    <span className={cn(styles.badge, styles[tone], className)} title={title}>
      {children}
    </span>
  );
}
