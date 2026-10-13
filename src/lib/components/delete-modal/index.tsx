import type React from 'react';
import { createConfirmModal, type ConfirmModalOptions } from '../confirm-modal';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- Preserve legacy declaration merging.
export interface DeleteModalOptions extends ConfirmModalOptions {}

// Preserve the legacy ref type for existing consumers.
const DeleteModal = createConfirmModal({
  title: 'common.title.delete.confirm',
  okText: 'common.button.delete',
  danger: true,
  showSuccess: true
}) as React.ForwardRefExoticComponent<React.RefAttributes<unknown>>;

export default DeleteModal;
