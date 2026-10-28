import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Retrieving catalogue records...',
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-12 text-center rounded-xl bg-white/60 border border-ivory-border',
        className
      )}
    >
      <div className="relative">
        <Loader2 className="h-8 w-8 text-forest animate-spin" />
        <div className="absolute inset-0 rounded-full border border-gold/30 animate-ping opacity-25" />
      </div>
      <p className="mt-4 text-sm font-medium text-forest font-serif">{message}</p>
      <p className="mt-1 text-xs text-charcoal-muted">Connecting to library catalog indexes...</p>
    </div>
  );
};

