import React, { useEffect, useRef, useState } from 'react';
import ConfirmDialog from '../common/ConfirmDialog';
import { useConversations } from '../../context/ConversationContext';
import { useToast } from '../../context/ToastContext';
import { ApiError } from '../../api/client';
import { formatRelativeDate } from '../../utils/formatters';
import styles from './Sidebar.module.css';

export default function ConversationItem({ conversation, isActive, onSelect }) {
  const { renameConversation, deleteConversation } = useConversations();
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const menuRef = useRef(null);
  const renameInputRef = useRef(null);
  const renameCancelledRef = useRef(false);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    window.addEventListener('mousedown', onClickOutside);
    return () => window.removeEventListener('mousedown', onClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    if (isRenaming) renameInputRef.current?.focus();
  }, [isRenaming]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteConversation(conversation.id);
      setMenuOpen(false);
      setConfirmDeleteOpen(false);
      toast.success('Conversation deleted.');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not delete conversation.';
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const startRename = () => {
    setMenuOpen(false);
    setRenameValue(conversation.title || '');
    renameCancelledRef.current = false;
    setIsRenaming(true);
  };

  const submitRename = async () => {
    if (renameCancelledRef.current) return;
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed.length > 255) {
      toast.error('Title must be between 1 and 255 characters.');
      return;
    }
    try {
      await renameConversation(conversation.id, trimmed);
      setIsRenaming(false);
      toast.success('Conversation renamed.');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not rename conversation.';
      toast.error(message);
    }
  };

  const handleRenameKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitRename();
    } else if (e.key === 'Escape') {
      renameCancelledRef.current = true;
      setIsRenaming(false);
    }
  };

  return (
    <>
      <li>
        {isRenaming ? (
          <div className={styles.conversationRenameRow}>
            <input
              ref={renameInputRef}
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={handleRenameKeyDown}
              onBlur={submitRename}
              className={styles.conversationRenameInput}
              maxLength={255}
              aria-label="Rename conversation"
            />
          </div>
        ) : (
          <button
            type="button"
            className={`${styles.conversationItem} ${isActive ? styles.conversationItemActive : ''}`}
            onClick={onSelect}
            aria-current={isActive}
          >
            <span className={styles.conversationItemBody}>
              <span className={styles.conversationItemTitle} title={conversation.title || 'Untitled'}>
                {conversation.title || 'Untitled conversation'}
              </span>
              <span className={styles.conversationItemMeta}>
                {formatRelativeDate(conversation.updated_at)}
              </span>
            </span>

            <span
              role="button"
              tabIndex={0}
              className={styles.conversationItemMenuTrigger}
              aria-label="Conversation options"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  e.preventDefault();
                  setMenuOpen((v) => !v);
                }
              }}
            >
              ⋯
            </span>
          </button>
        )}

        {menuOpen && (
          <div className={styles.conversationItemMenu} ref={menuRef}>
            <button type="button" onClick={startRename}>
              Rename
            </button>
            <button
              type="button"
              className={styles.conversationItemMenuDanger}
              onClick={() => {
                setMenuOpen(false);
                setConfirmDeleteOpen(true);
              }}
            >
              Delete
            </button>
          </div>
        )}
      </li>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete conversation?"
        description={`Are you sure you want to delete "${conversation.title || 'this conversation'}"? This action cannot be undone.`}
        confirmLabel="Delete"
        busyLabel="Deleting…"
        tone="danger"
        isBusy={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </>
  );
}