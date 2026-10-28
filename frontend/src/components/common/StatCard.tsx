import React from 'react';
import { cn } from '@/utils/cn';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  isDemo?: boolean;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  description,
  trend,
  isDemo = true,
  className,
}) => {
  return (
    <div
      className={cn(
        'relative bg-white border border-ivory-border rounded-xl p-5 shadow-scholarly transition-all hover:shadow-scholarly-lg flex flex-col justify-between',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">
              {title}
            </span>
            {isDemo && (
              <span className="inline-block text-[10px] font-medium text-sage-600 bg-sage-100/70 px-1.5 py-0.5 rounded border border-sage-200">
                Demo
              </span>
            )}
          </div>
          <div className="mt-2 text-2xl md:text-3xl font-bold font-serif text-forest-dark">
            {value}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-ivory-cream border border-ivory-border text-forest shrink-0">
          {icon}
        </div>
      </div>

      {(description || trend) && (
        <div className="mt-4 pt-3 border-t border-ivory-cream flex items-center justify-between text-xs text-charcoal-muted">
          {description && <span>{description}</span>}
          {trend && (
            <span
              className={cn(
                'font-medium ml-auto',
                trend.isPositive ? 'text-forest' : 'text-amber-700'
              )}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

