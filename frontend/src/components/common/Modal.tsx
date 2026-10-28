import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-dark/50 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop click area */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Dialog Card */}
      <div
        className={cn(
          'relative w-full bg-white rounded-xl shadow-scholarly-elevated border border-ivory-border overflow-hidden z-10 flex flex-col max-h-[90vh]',
          maxWidthClasses[maxWidth]
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-ivory-border bg-ivory/40">
          <div>
            <h2 id="modal-title" className="font-serif text-lg font-bold text-forest-dark">
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-xs text-charcoal-muted">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-charcoal-muted hover:text-charcoal p-1 rounded-md hover:bg-ivory-cream transition-colors focus:outline-none focus:ring-2 focus:ring-gold"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-charcoal">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-4 border-t border-ivory-border bg-ivory/30 flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

