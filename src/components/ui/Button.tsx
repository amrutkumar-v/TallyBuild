import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { LinkProps } from 'react-router-dom';

import { buttonClass } from './buttonStyles';
import type { ButtonSize, ButtonVariant } from './uiTypes';

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
}

type NativeButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'>;

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  children,
  ...rest
}: NativeButtonProps): React.JSX.Element {
  return (
    <button className={buttonClass(variant, size, className, fullWidth)} {...rest}>
      {children}
    </button>
  );
}

type NativeLinkProps = CommonProps &
  Omit<LinkProps, 'children' | 'className'> & { external?: false };

/** Router link styled exactly like a button (still a real link for a11y). */
export function LinkButton({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  children,
  ...rest
}: NativeLinkProps): React.JSX.Element {
  return (
    <Link className={buttonClass(variant, size, className, fullWidth)} {...rest}>
      {children}
    </Link>
  );
}
