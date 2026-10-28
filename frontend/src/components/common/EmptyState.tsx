import React from 'react';
import { BookOpen } from 'lucide-react';
import { cn } from '@/utils/cn';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-12 text-center rounded-xl bg-white border border-dashed border-ivory-darker max-w-lg mx-auto',
        className
      )}
    >
      <div className="p-4 rounded-full bg-ivory-cream border border-ivory-border text-forest-light mb-4">
        {icon || <BookOpen className="h-8 w-8 text-forest" />}
      </div>
      <h3 className="font-serif text-lg font-bold text-forest-dark">{title}</h3>
      <p className="mt-1 text-sm text-charcoal-muted max-w-sm leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};

