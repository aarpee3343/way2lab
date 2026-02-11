import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'default';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return <span className={`admin-badge admin-badge-${variant} ${className}`}>{children}</span>;
}