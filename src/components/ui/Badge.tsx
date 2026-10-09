import type { ReactElement, ReactNode } from 'react';

import { cn } from '../../utils/cn';
import type { BadgeTone } from '../../types';

import styles from './Badge.module.css';

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = 'neutral', children, className }: BadgeProps): ReactElement {
  return <span className={cn(styles.badge, styles[tone], className)}>{children}</span>;
}
