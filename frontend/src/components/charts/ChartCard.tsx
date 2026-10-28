import React from 'react';
import { cn } from '@/utils/cn';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  isDemo?: boolean;
  className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  action,
  children,
  isDemo = true,
  className,
}) => {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-ivory-border p-5 shadow-scholarly flex flex-col',
        className
      )}
    >
      <div className="flex items-start justify-between mb-4 pb-3 border-b border-ivory-cream">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-base font-bold text-forest-dark">{title}</h3>
            {isDemo && (
              <span className="text-[10px] font-medium text-sage-600 bg-sage-100/70 px-1.5 py-0.5 rounded border border-sage-200">
                Demo Trends
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-charcoal-muted mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>

      <div className="flex-1 w-full min-h-[260px]">{children}</div>
    </div>
  );
};

