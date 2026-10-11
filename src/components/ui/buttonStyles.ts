import { cn } from '../../utils/cn';
import styles from './Button.module.css';
import type { ButtonSize, ButtonVariant } from './uiTypes';

/** Shared class logic so buttons and link-buttons never drift apart. */
export function buttonClass(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  extra?: string,
  fullWidth = false,
): string {
  return cn(styles.button, styles[variant], styles[size], fullWidth && styles.fullWidth, extra);
}
