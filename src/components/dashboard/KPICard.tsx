'use client';

import { KPICardProps } from '@/types/dashboard';

export function KPICard({ title, value, unit, icon, iconColor }: KPICardProps) {
  return (
    <div className="dashboard-card p-5 flex items-center space-x-4 hover:shadow-lg transition-all">
      <div 
        className="p-3 rounded-full text-white"
        style={{ backgroundColor: iconColor }}
      >
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          {title}
        </p>
        <p className="text-2xl font-bold">
          {value} {unit && <span className="text-lg font-medium">{unit}</span>}
        </p>
      </div>
    </div>
  );
}
