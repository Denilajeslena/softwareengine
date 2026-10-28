import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const PrimaryButton: React.FC<ButtonProps> = ({
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
    md: 'px-4 py-2.5 text-sm rounded-lg font-medium',
    lg: 'px-6 py-3 text-base rounded-lg font-semibold',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-all duration-150 shadow-sm active:translate-y-0.5',
        'bg-forest hover:bg-forest-light text-white font-sans',
        'border border-forest-light focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-ivory',
        'disabled:opacity-55 disabled:cursor-not-allowed disabled:hover:bg-forest',
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-white" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};

