import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  isDestructive = false,
  isLoading = false,
}) {
  const cardRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className={styles.card} ref={cardRef} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 id="modal-title" className={styles.title}>
            {title}
          </h3>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close dialog"
            disabled={isLoading}
          >
            <X size={18} />
          </button>
        </div>

        <div className={styles.body}>{children}</div>

        {(onConfirm || onClose) && (
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelLabel}
            </button>
            {onConfirm && (
              <button
                type="button"
                className={`${styles.confirmBtn} ${isDestructive ? styles.dangerBtn : ''}`}
                onClick={onConfirm}
                disabled={isLoading}
                autoFocus
              >
                {isLoading ? 'Please wait…' : confirmLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
