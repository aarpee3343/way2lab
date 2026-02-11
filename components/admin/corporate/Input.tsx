import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div className="admin-form-group">
      {label && <label className="admin-form-label">{label}</label>}
      <input className={`admin-form-input ${className}`} {...props} />
    </div>
  );
}