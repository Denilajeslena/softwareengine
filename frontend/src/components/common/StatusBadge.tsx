import React from 'react';
import { cn } from '@/utils/cn';

export type StatusType =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'gold'
  | 'Available'
  | 'Reserved'
  | 'Checked Out'
  | 'Reference Only';

interface StatusBadgeProps {
  status: StatusType | string;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'md',
  className,
}) => {
  const displayLabel = label || status;

  const getStyle = (s: string) => {
    switch (s.toLowerCase()) {
      case 'available':
      case 'active':
      case 'success':
      case 'optimal':
      case 'completed':
        return 'bg-forest/10 text-forest border-forest/20';
      case 'reserved':
      case 'pending':
      case 'warning':
      case 'renewed':
        return 'bg-gold-light/30 text-amber-900 border-gold/40';
      case 'checked out':
      case 'overdue':
      case 'danger':
      case 'suspended':
      case 'flagged':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'reference only':
      case 'info':
        return 'bg-sage-100 text-charcoal border-sage-200';
      case 'driver_missing':
      case 'unconfigured':
      case 'unavailable':
        return 'bg-amber-50 text-amber-900 border-amber-300';
      default:
        return 'bg-ivory-cream text-charcoal-light border-ivory-border';
    }
  };

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border shadow-2xs tracking-wide',
        getStyle(status),
        sizeClasses[size],
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      <span>{displayLabel}</span>
    </span>
  );
};

