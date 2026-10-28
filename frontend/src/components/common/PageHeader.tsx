import React from 'react';
import { cn } from '@/utils/cn';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  actions,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 pb-6 border-b border-ivory-border md:flex-row md:items-center md:justify-between',
        className
      )}
    >
      <div>
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-forest-dark">
            {title}
          </h1>
          {badge}
        </div>
        {subtitle && (
          <p className="mt-1 text-sm text-charcoal-muted leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {actions && <div className="flex items-center gap-2.5 shrink-0 flex-wrap">{actions}</div>}
    </div>
  );
};

