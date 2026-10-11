import type { ReactNode } from 'react';
import { Info, TriangleAlert } from 'lucide-react';

import { cn } from '../../utils/cn';
import styles from './DemoNotice.module.css';

/**
 * Clearly flags illustrative/demo content. Used anywhere numbers are shown so
 * the UI never implies real market, supplier or AI-produced data.
 */
export function DemoNotice({
  children,
  tone = 'info',
  className,
}: {
  children?: ReactNode;
  tone?: 'info' | 'warning';
  className?: string;
}): React.JSX.Element {
  const Icon = tone === 'warning' ? TriangleAlert : Info;
  return (
    <div className={cn(styles.notice, styles[tone], className)} role="note">
      <Icon className={styles.icon} aria-hidden="true" />
      <div className={styles.body}>
        {children ?? (
          <p>
            Illustrative demo data — figures come from the local mock adapter, not an AI model or
            live pricing source.
          </p>
        )}
      </div>
    </div>
  );
}
