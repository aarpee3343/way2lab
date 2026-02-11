import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export default function Textarea({ label, className = '', ...props }: TextareaProps) {
  return (
    <div className="admin-form-group">
      {label && <label className="admin-form-label">{label}</label>}
      <textarea className={`admin-form-textarea ${className}`} {...props} />
    </div>
  );
}