import React from 'react';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  gradient?: 'blue' | 'green' | 'gray';
  iconBgWhite?: boolean;
}

export default function StatCard({ icon, label, value, gradient, iconBgWhite }: StatCardProps) {
  const cardClass = gradient ? `admin-stat-card gradient-${gradient}` : 'admin-stat-card';
  const iconClass = `admin-stat-icon-container ${iconBgWhite ? 'bg-white' : ''}`;
  return (
    <div className={cardClass}>
      <div className={iconClass}>{icon}</div>
      <div>
        <p className="admin-stat-label">{label}</p>
        <h3 className="admin-stat-value">{value}</h3>
      </div>
    </div>
  );
}