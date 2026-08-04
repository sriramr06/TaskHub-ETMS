import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  isLoading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => (
  <Modal open={open} onClose={onCancel} title={title} size="sm">
    <p className="text-sm text-slate-600">{description}</p>
    <div className="mt-6 flex justify-end gap-2">
      <Button variant="outline" onClick={onCancel} disabled={isLoading}>
        Cancel
      </Button>
      <Button variant="danger" onClick={onConfirm} isLoading={isLoading}>
        {confirmLabel}
      </Button>
    </div>
  </Modal>
);
