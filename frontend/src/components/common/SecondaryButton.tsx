import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { ButtonProps } from './PrimaryButton';

export const SecondaryButton: React.FC<ButtonProps> = ({
  children,
  className,
  isLoading = false,
  leftIcon,
  rightIcon,
  size = 'md',
  fullWidth = false,
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-md font-medium',
    md: 'px-4 py-2 text-sm rounded-lg font-medium',
    lg: 'px-6 py-2.5 text-base rounded-lg font-medium',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-all duration-150 active:translate-y-0.5',
        'bg-ivory-cream hover:bg-ivory text-charcoal border border-ivory-border',
        'focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-ivory',
        'disabled:opacity-55 disabled:cursor-not-allowed',
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-charcoal" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};

