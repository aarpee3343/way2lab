'use client';

import type {
  ReactNode,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes
} from 'react';

export const TEST_CATEGORIES = [
  'Allergy and Immunology',
  'Cancer Markers',
  'Cardiac and Diabetes',
  'Genetic and Wellness',
  'Hormonal and Endocrine',
  'Infectious Dieseas',
  'Routine Tests',
  'Specialised Tests',
  'Others'
];

export const TEST_SPECIALTIES = [
  'Pathology',
  'Radiology',
  'Cardiology',
  'Nuclear Imaging',
  'Others'
];

export function Section({
  title,
  icon,
  children
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="admin-form-section">
      <h3 className="admin-form-title">
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}

export function InputField({
  label,
  icon,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; icon?: ReactNode }) {
  return (
    <div>
      <label className="admin-form-label">{label}</label>
      <div className="relative">
        {icon && <span className="absolute left-3 top-3">{icon}</span>}
        <input {...props} className="admin-form-input" />
      </div>
    </div>
  );
}

export function TextareaField({
  label,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <div>
      <label className="admin-form-label">{label}</label>
      <textarea {...props} className="admin-form-textarea" />
    </div>
  );
}

export function SelectField({
  label,
  options,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: string[] }) {
  return (
    <div>
      <label className="admin-form-label">{label}</label>
      <select {...props} className="admin-form-select">
        <option value="">Select</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

export function CheckboxField({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="admin-form-checkbox">
      <input type="checkbox" {...props} />
      <span>{label}</span>
    </label>
  );
}
