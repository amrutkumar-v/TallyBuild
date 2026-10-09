import type { ButtonHTMLAttributes, ReactElement, ReactNode } from 'react';

import { buttonClass } from './buttonStyles';
import type { ButtonSize, ButtonVariant } from './buttonStyles';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  iconStart,
  iconEnd,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps): ReactElement {
  return (
    <button type={type} className={buttonClass(variant, size, className)} {...rest}>
      {iconStart}
      {children}
      {iconEnd}
    </button>
  );
}
