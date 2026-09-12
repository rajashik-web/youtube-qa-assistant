import React, { useEffect, useRef, useState } from 'react';
import StatusDot from '../common/StatusDot';
import ConfirmDialog from '../common/ConfirmDialog';
import { useVideoLibrary } from '../../context/VideoLibraryContext';
import { useConversations } from '../../context/ConversationContext';
import { useUI } from '../../context/UIContext';
import { useToast } from '../../context/ToastContext';
import { ApiError } from '../../api/client';
import { formatRelativeDate } from '../../utils/formatters';
import { READY_STATUSES, VIDEO_STATUS } from '../../utils/constants';
import styles from './Sidebar.module.css';

export default function VideoLibraryItem({ video, isSelected }) {
  const { selectVideo, removeVideo, reprocessVideo } = useVideoLibrary();
  const { clearActiveConversation } = useConversations();
  const { closeComposer, closeMobileSidebar } = useUI();
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    window.addEventListener('mousedown', onClickOutside);
    return () => window.removeEventListener('mousedown', onClickOutside);
  }, [menuOpen]);

    const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await removeVideo(video.video_id);
      // Explicitly clear the menu/dialog state before anything else so no
      // stale menu can reference a video that's just been removed.
      setMenuOpen(false);
      setConfirmDeleteOpen(false);
      toast.success(`"${video.title || 'Video'}" was deleted.`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not delete this video.';
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReprocess = async () => {
    setMenuOpen(false);
    try {
      await reprocessVideo(video.video_id, `https://www.youtube.com/watch?v=${video.video_id}`);
      toast.info(`Reprocessing "${video.title || 'video'}"…`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not reprocess this video.';
      toast.error(message);
    }
  };

  const isReady = READY_STATUSES.has(video.status);
  const isFailed = video.status === VIDEO_STATUS.FAILED;

  return (
    <>
      <li>
        <button
          type="button"
          className={`${styles.item} ${isSelected ? styles.itemSelected : ''}`}
          onClick={() => {
            selectVideo(video.video_id);
            // Switching videos clears the active conversation so questions
            // are never sent into an unrelated conversation. The backend
            // Conversation model has no video_id, so this client-side rule
            // keeps the UI predictable: each video starts a fresh chat.
            clearActiveConversation();
            closeComposer();
            closeMobileSidebar();
          }}
          aria-current={isSelected}
        >
          <div className={styles.itemThumb}>
            {video.thumbnail_url ? (
              <img src={video.thumbnail_url} alt="" loading="lazy" />
            ) : (
              <div className={styles.itemThumbFallback} aria-hidden="true">
                ▶
              </div>
            )}
          </div>

          <div className={styles.itemBody}>
            <p className={styles.itemTitle} title={video.title}>
              {video.title || 'Untitled video'}
            </p>
            <div className={styles.itemMetaRow}>
              <StatusDot status={video.status} size="sm" />
              {isReady && (
                <span className={styles.itemMeta}>{formatRelativeDate(video.updated_at || video.created_at)}</span>
              )}
              {isFailed && <span className={styles.itemMetaFailed}>Tap ⋯ to retry</span>}
            </div>
          </div>

          <span
            role="button"
            tabIndex={0}
            className={styles.itemMenuTrigger}
            aria-label="Video options"
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

        {menuOpen && (
          <div className={styles.itemMenu} ref={menuRef}>
            <button type="button" onClick={handleReprocess}>
              Reprocess video
            </button>
            <button
              type="button"
              className={styles.itemMenuDanger}
              onClick={() => {
                setMenuOpen(false);
                setConfirmDeleteOpen(true);
              }}
            >
              Delete video
            </button>
          </div>
        )}
      </li>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete video?"
        description={`Are you sure you want to delete "${video.title || 'this video'}"? This action cannot be undone.`}
        confirmLabel="Delete video"
        busyLabel="Deleting…"
        tone="danger"
        isBusy={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </>
  );
}
