import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'blue' | 'purple' | 'green' | 'orange' | 'gray';
}

const variantStyles = {
  blue: {
    border: 'border-l-4 border-blue-500',
    text: 'text-blue-600',
    iconBg: 'bg-blue-50 text-blue-600',
    trend: 'text-blue-600',
  },
  purple: {
    border: 'border-l-4 border-violet-500',
    text: 'text-violet-600',
    iconBg: 'bg-violet-50 text-violet-600',
    trend: 'text-violet-600',
  },
  green: {
    border: 'border-l-4 border-emerald-500',
    text: 'text-emerald-600',
    iconBg: 'bg-emerald-50 text-emerald-600',
    trend: 'text-emerald-600',
  },
  orange: {
    border: 'border-l-4 border-warning',
    text: 'text-warning-foreground',
    iconBg: 'bg-warning/15 text-warning-foreground',
    trend: 'text-warning-foreground',
  },
  gray: {
    border: 'border-l-4 border-gray-500',
    text: 'text-gray-600',
    iconBg: 'bg-gray-50 text-gray-600',
    trend: 'text-gray-600',
  },
};

export const StatCard = ({ title, value, icon: Icon, trend, variant = 'blue' }: StatCardProps) => {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 border border-border',
        styles.border
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground tracking-tight">{value}</span>
          </div>
          {trend && (
            <div className="mt-2 flex items-center gap-1.5">
              <span
                className={cn(
                  'flex items-center text-xs font-medium px-1.5 py-0.5 rounded-full bg-opacity-10',
                  trend.isPositive
                    ? 'text-emerald-600 bg-emerald-100'
                    : 'text-rose-600 bg-rose-100'
                )}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-muted-foreground">vs last month</span>
            </div>
          )}
        </div>
        <div className={cn('rounded-xl p-3 transition-colors group-hover:scale-110 duration-300', styles.iconBg)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};
