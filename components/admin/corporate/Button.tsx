'use client';
import Link from 'next/link';
import { forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  href?: string;
  className?: string;
  children?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', href, className = '', children, ...props }, ref) => {
    const classes = `admin-btn admin-btn-${variant} ${size !== 'md' ? `admin-btn-${size}` : ''} ${className}`;

    if (href) {
      return <Link href={href} className={classes} {...(props as any)}>{children}</Link>;
    }

    return <button ref={ref} className={classes} {...props}>{children}</button>;
  }
);
Button.displayName = 'Button';
export default Button;