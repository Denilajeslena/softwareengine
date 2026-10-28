import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { PrimaryButton } from './PrimaryButton';
import { cn } from '@/utils/cn';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to Load Records',
  message = 'A connection or data retrieval issue occurred. Please check connectivity and try again.',
  onRetry,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-10 text-center rounded-xl bg-rose-50/50 border border-rose-200 max-w-md mx-auto',
        className
      )}
    >
      <div className="p-3 rounded-full bg-rose-100 text-rose-700 mb-3">
        <AlertCircle className="h-7 w-7" />
      </div>
      <h3 className="font-serif text-lg font-bold text-rose-900">{title}</h3>
      <p className="mt-1 text-xs text-rose-800/80 leading-relaxed mb-4">
        {message}
      </p>
      {onRetry && (
        <PrimaryButton
          size="sm"
          onClick={onRetry}
          leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
        >
          Try Again
        </PrimaryButton>
      )}
    </div>
  );
};

