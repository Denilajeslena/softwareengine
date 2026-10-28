import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface ToastProps {
  id?: string;
  type?: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message?: string;
  onClose?: () => void;
  className?: string;
}

export const ToastNotification: React.FC<ToastProps> = ({
  type = 'info',
  title,
  message,
  onClose,
  className,
}) => {
  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-forest" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-600" />,
    error: <AlertCircle className="h-5 w-5 text-rose-600" />,
    info: <Info className="h-5 w-5 text-sage-600" />,
  };

  const borders = {
    success: 'border-forest/30 bg-white',
    warning: 'border-amber-300 bg-amber-50/40',
    error: 'border-rose-300 bg-rose-50/40',
    info: 'border-ivory-border bg-white',
  };

  return (
    <div
      role="status"
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl border shadow-scholarly-lg max-w-sm w-full transition-all animate-in slide-in-from-top-2',
        borders[type],
        className
      )}
    >
      <div className="shrink-0 mt-0.5">{icons[type]}</div>
      <div className="flex-1 text-left">
        <h4 className="text-sm font-semibold text-charcoal">{title}</h4>
        {message && <p className="text-xs text-charcoal-muted mt-0.5">{message}</p>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Dismiss notification"
          className="text-charcoal-muted hover:text-charcoal p-1 rounded hover:bg-ivory-cream focus:outline-none focus:ring-1 focus:ring-gold"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

