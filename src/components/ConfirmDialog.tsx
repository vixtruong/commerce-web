import { messages } from '../lib/messages';
import * as Dialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';
import { ErrorState } from './Feedback';
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  onConfirm,
  pending = false,
  error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children?: ReactNode;
  onConfirm: () => void;
  pending?: boolean;
  error?: Error | null;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Description>{description}</Dialog.Description>
          {children}
          {error && <ErrorState error={error} />}
          <div className="actions">
            <Dialog.Close className="button secondary" disabled={pending}>
              {messages.cancel}
            </Dialog.Close>
            <button className="button" onClick={onConfirm} disabled={pending}>
              {pending ? messages.saving : messages.confirm}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
