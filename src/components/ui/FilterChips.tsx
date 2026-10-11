import { cn } from '../../utils/cn';
import styles from './FilterChips.module.css';

export interface ChipOption<T extends string> {
  value: T;
  label: string;
}

/**
 * Accessible single-select chip group. Renders real buttons with
 * `aria-pressed`, so keyboard and screen-reader users can operate it.
 */
export function FilterChips<T extends string>({
  label,
  options,
  value,
  onChange,
  allLabel,
  className,
}: {
  label: string;
  options: Array<ChipOption<T>>;
  value: T | null;
  onChange: (value: T | null) => void;
  /** When provided, renders an "all" chip that clears the filter. */
  allLabel?: string;
  className?: string;
}): React.JSX.Element {
  return (
    <div className={cn(styles.group, className)} role="group" aria-label={label}>
      {allLabel ? (
        <button
          type="button"
          className={cn(styles.chip, value === null && styles.active)}
          aria-pressed={value === null}
          onClick={() => onChange(null)}
        >
          {allLabel}
        </button>
      ) : null}
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            className={cn(styles.chip, selected && styles.active)}
            aria-pressed={selected}
            onClick={() => onChange(selected ? null : option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
