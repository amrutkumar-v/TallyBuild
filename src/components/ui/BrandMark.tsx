import { cn } from '../../utils/cn';
import styles from './BrandMark.module.css';

/** Wordmark + logo mark used in the sidebar and on the auth-free landing shell. */
export function BrandMark({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}): React.JSX.Element {
  return (
    <span className={cn(styles.brand, className)}>
      <span className={styles.mark} aria-hidden="true">
        <svg viewBox="0 0 32 32" focusable="false">
          <rect x="3" y="4" width="26" height="24" rx="7" fill="var(--color-accent)" />
          <path
            d="M9.5 11.5h13M9.5 16h8.5M9.5 20.5h10.5"
            stroke="var(--color-shell)"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {compact ? (
        <span className="visually-hidden">TallyBuild AI</span>
      ) : (
        <span className={styles.wordmark}>
          <span className={styles.name}>TallyBuild</span>
          <span className={styles.ai}>AI</span>
        </span>
      )}
    </span>
  );
}
