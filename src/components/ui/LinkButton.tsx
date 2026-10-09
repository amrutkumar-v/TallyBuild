import type { ReactElement, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { LinkProps } from 'react-router-dom';

import { buttonClass } from './buttonStyles';
import type { ButtonSize, ButtonVariant } from './buttonStyles';

interface LinkButtonProps extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
}

export function LinkButton({
  variant = 'primary',
  size = 'md',
  iconStart,
  iconEnd,
  className,
  children,
  ...rest
}: LinkButtonProps): ReactElement {
  return (
    <Link className={buttonClass(variant, size, className)} {...rest}>
      {iconStart}
      {children}
      {iconEnd}
    </Link>
  );
}
