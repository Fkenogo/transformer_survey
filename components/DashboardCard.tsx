
import React from 'react';

interface DashboardCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({ title, subtitle, children }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      <div className="w-full">
        {children}
      </div>
    </div>
  );
};
