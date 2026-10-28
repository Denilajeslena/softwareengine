import React from 'react';
import { Modal } from './Modal';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  isDestructive = false,
  isLoading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="sm"
      footer={
        <>
          <SecondaryButton size="sm" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </SecondaryButton>
          <PrimaryButton
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
            className={isDestructive ? 'bg-rose-700 hover:bg-rose-800 border-rose-800' : ''}
          >
            {confirmLabel}
          </PrimaryButton>
        </>
      }
    >
      <div className="flex items-start gap-3">
        {isDestructive && (
          <div className="p-2 rounded-full bg-rose-100 text-rose-700 shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
        )}
        <p className="text-sm text-charcoal leading-relaxed">{message}</p>
      </div>
    </Modal>
  );
};

