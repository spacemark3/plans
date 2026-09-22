'use client'

import Modal from '@/app/components/Modal'

/** A thin skin over `Modal` — it adds copy and two buttons, nothing else. */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  pending = false,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  pending?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button
            type="button"
            className="btn-primary flex-1"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? 'One moment...' : confirmLabel}
          </button>
          <button
            type="button"
            className="btn-ghost flex-1"
            onClick={onCancel}
            disabled={pending}
          >
            {cancelLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-ink-muted">{message}</p>
    </Modal>
  )
}
