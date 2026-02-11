import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
}

export default function Card({ children, className = '', header }: CardProps) {
  return (
    <div className={`admin-card ${className}`}>
      {header && <div className="admin-card-header">{header}</div>}
      <div className="admin-card-body">{children}</div>
    </div>
  );
}