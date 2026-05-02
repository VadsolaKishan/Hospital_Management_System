import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'blue' | 'purple' | 'green' | 'orange' | 'gray';
  onClick?: () => void;
  to?: string;
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
    border: 'border-l-4 border-orange-500',
    text: 'text-orange-700',
    iconBg: 'bg-orange-100 text-orange-600',
    trend: 'text-orange-700',
  },
  gray: {
    border: 'border-l-4 border-gray-500',
    text: 'text-gray-600',
    iconBg: 'bg-gray-50 text-gray-600',
    trend: 'text-gray-600',
  },
};

export const StatCard = ({ title, value, icon: Icon, trend, variant = 'blue', onClick, to }: StatCardProps) => {
  const styles = variantStyles[variant];
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-card p-6 shadow-sm transition-all duration-500 hover:shadow-lg hover:-translate-y-1.5 hover:shadow-primary/10 border border-border/60 hover:border-primary/30 z-10',
        (onClick || to) && 'cursor-pointer',
        styles.border
      )}
    >
      {/* Background Gradient Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/5 dark:to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />

      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground/80 transition-colors">{title}</p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground tracking-tight">{value}</span>
          </div>
          {trend && (
            <div className="mt-3 flex items-center gap-2">
              <span
                className={cn(
                  'flex items-center text-xs font-semibold px-2 py-1 rounded-full shadow-sm',
                  trend.isPositive
                    ? 'text-emerald-700 bg-emerald-100/80 border border-emerald-200'
                    : 'text-rose-700 bg-rose-100/80 border border-rose-200'
                )}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-muted-foreground font-medium">vs last month</span>
            </div>
          )}
        </div>
        <div className={cn('rounded-2xl p-3.5 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm', styles.iconBg)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};
