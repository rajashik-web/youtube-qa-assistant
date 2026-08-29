import React, { useEffect, useRef, useState } from 'react';
import StatusDot from '../common/StatusDot';
import ConfirmDialog from '../common/ConfirmDialog';
import { useVideoLibrary } from '../../context/VideoLibraryContext';
import { useToast } from '../../context/ToastContext';
import { ApiError } from '../../api/client';
import { formatCount, formatRelativeDate } from '../../utils/formatters';
import { VIDEO_STATUS } from '../../utils/constants';
import styles from './MainPanel.module.css';

export default function VideoHeader({ video }) {
  const { removeVideo, reprocessVideo } = useVideoLibrary();
  const toast = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmReprocessOpen, setConfirmReprocessOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);
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
      toast.success(`"${video.title || 'Video'}" was deleted.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not delete this video.');
    } finally {
      setIsDeleting(false);
      setConfirmDeleteOpen(false);
    }
  };

  const handleReprocess = async () => {
    setIsReprocessing(true);
    try {
      await reprocessVideo(video.video_id, `https://www.youtube.com/watch?v=${video.video_id}`);
      toast.info(`Reprocessing "${video.title || 'video'}"…`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not reprocess this video.');
    } finally {
      setIsReprocessing(false);
      setConfirmReprocessOpen(false);
    }
  };

  const isFailed = video.status === VIDEO_STATUS.FAILED;

  return (
    <header className={styles.header}>
      <div className={styles.headerThumb}>
        {video.thumbnail_url ? (
          <img src={video.thumbnail_url} alt="" />
        ) : (
          <div className={styles.headerThumbFallback} aria-hidden="true">
            ▶
          </div>
        )}
      </div>

      <div className={styles.headerBody}>
        <h2 className={styles.headerTitle}>{video.title || 'Untitled video'}</h2>
        <div className={styles.headerMetaRow}>
          <StatusDot status={video.status} />
          {(video.segments || video.chunks) && (
            <span className={styles.headerMeta}>
              {formatCount(video.segments)} segments · {formatCount(video.chunks)} chunks
            </span>
          )}
          <span className={styles.headerMeta}>Added {formatRelativeDate(video.created_at)}</span>
        </div>
        {isFailed && (
          <p className={styles.headerFailedNote}>
            Processing failed for this video. Try reprocessing it, or remove it and add the link again.
          </p>
        )}
      </div>

      <div className={styles.headerActions} ref={menuRef}>
        <button
          type="button"
          className={styles.headerMenuTrigger}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Video actions"
          aria-expanded={menuOpen}
        >
          ⋯
        </button>
        {menuOpen && (
          <div className={styles.headerMenu}>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setConfirmReprocessOpen(true);
              }}
            >
              Reprocess video
            </button>
            <button
              type="button"
              className={styles.headerMenuDanger}
              onClick={() => {
                setMenuOpen(false);
                setConfirmDeleteOpen(true);
              }}
            >
              Delete video
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmReprocessOpen}
        title="Reprocess this video?"
        description="This clears the existing transcript data and cached answers, then processes the video again from scratch."
        confirmLabel="Reprocess"
        tone="primary"
        isBusy={isReprocessing}
        onConfirm={handleReprocess}
        onCancel={() => setConfirmReprocessOpen(false)}
      />

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete this video?"
        description={`This removes "${video.title || 'this video'}" along with its transcript data and any cached answers. This can't be undone.`}
        confirmLabel="Delete video"
        tone="danger"
        isBusy={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </header>
  );
}
