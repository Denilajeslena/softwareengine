import React from 'react';
import { cn } from '@/utils/cn';

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  error,
  helperText,
  required = false,
  children,
  className,
}) => {
  return (
    <div className={cn('flex flex-col gap-1.5 text-left', className)}>
      <label
        htmlFor={htmlFor}
        className="text-xs font-semibold text-charcoal tracking-wide flex items-center gap-1"
      >
        <span>{label}</span>
        {required && <span className="text-rose-600">*</span>}
      </label>

      {children}

      {error ? (
        <span className="text-xs text-rose-600 font-medium">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-charcoal-muted">{helperText}</span>
      ) : null}
    </div>
  );
};

