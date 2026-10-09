import { Info } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';

import styles from './DemoNotice.module.css';

const DEFAULT_MESSAGE =
  'Illustrative demo data — sample values for the hackathon build, not real customer, market or supplier data.';

interface DemoNoticeProps {
  children?: ReactNode;
  action?: ReactNode;
}

export function DemoNotice({ children, action }: DemoNoticeProps): ReactElement {
  return (
    <div className={styles.notice} role="note">
      <span className={styles.icon} aria-hidden="true">
        <Info size={16} />
      </span>
      <p className={styles.text}>{children ?? DEFAULT_MESSAGE}</p>
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}
