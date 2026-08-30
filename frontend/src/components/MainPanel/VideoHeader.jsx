import React, { useEffect, useRef, useState } from 'react';
import StatusDot from '../common/StatusDot';
import ConfirmDialog from '../common/ConfirmDialog';
import { useVideoLibrary } from '../../context/VideoLibraryContext';
import { useToast } from '../../context/ToastContext';
import { ApiError } from '../../api/client';
import { formatRelativeDate } from '../../utils/formatters';
import { VIDEO_STATUS } from '../../utils/constants';
import styles from './MainPanel.module.css';

export default function VideoHeader({ video }) {
  const { removeVideo, reprocessVideo } = useVideoLibrary();
  const toast = useToast();

  // Tracks WHICH video's menu is open (by id), not just an open/closed flag.
  // This component instance can stay mounted across a selection change
  // (e.g. deleting the active video auto-selects a neighboring one), so a
  // plain boolean would keep showing a "stale" menu against whatever video
  // is now current. Comparing ids ensures the menu only ever renders for
  // the exact video it was opened for.
  const [openMenuVideoId, setOpenMenuVideoId] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmReprocessOpen, setConfirmReprocessOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const menuRef = useRef(null);

  const isMenuOpen = !!video && openMenuVideoId === video.video_id;

  const closeMenu = () => setOpenMenuVideoId(null);

  // Close immediately whenever the underlying video identity changes —
  // covers both "selection changed to a different video" and the instant
  // before this component unmounts because no video is selected anymore.
  useEffect(() => {
    closeMenu();
  }, [video?.video_id]);

  useEffect(() => {
    if (!isMenuOpen) return undefined;
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) closeMenu();
    };
    window.addEventListener('mousedown', onClickOutside);
    return () => window.removeEventListener('mousedown', onClickOutside);
  }, [isMenuOpen]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await removeVideo(video.video_id);
      // Clear the menu's associated video id and close the dialog before
      // anything else — never leave a menu referencing a video that no
      // longer exists in the library.
      closeMenu();
      setConfirmDeleteOpen(false);
      toast.success(`"${video.title || 'Video'}" was deleted.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not delete this video.');
    } finally {
      setIsDeleting(false);
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

  // Belt-and-suspenders: the parent (MainPanel) only ever mounts this
  // component when a video is selected, but if that ever changes, this
  // guard means no menu will render without a video to anchor it to.
  if (!video) return null;

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
          onClick={() => setOpenMenuVideoId((current) => (current === video.video_id ? null : video.video_id))}
          aria-label="Video actions"
          aria-expanded={isMenuOpen}
        >
          ⋯
        </button>
        {isMenuOpen && (
          <div className={styles.headerMenu}>
            <button
              type="button"
              onClick={() => {
                closeMenu();
                setConfirmReprocessOpen(true);
              }}
            >
              Reprocess video
            </button>
            <button
              type="button"
              className={styles.headerMenuDanger}
              onClick={() => {
                closeMenu();
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
        title="Delete video?"
        description={`Are you sure you want to delete "${video.title || 'this video'}"? This action cannot be undone.`}
        confirmLabel="Delete video"
        busyLabel="Deleting…"
        tone="danger"
        isBusy={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </header>
  );
}