import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: React.ReactNode;
}

export default function Select({ label, className = '', children, ...props }: SelectProps) {
  return (
    <div className="admin-form-group">
      {label && <label className="admin-form-label">{label}</label>}
      <select className={`admin-form-select ${className}`} {...props}>
        {children}
      </select>
    </div>
  );
}