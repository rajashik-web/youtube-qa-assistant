import React, { useState } from "react";
import { useVideoLibrary } from "../../context/VideoLibraryContext";
import { useConversations } from "../../context/ConversationContext";
import { useUI } from "../../context/UIContext";
import { VIDEO_STATUS } from "../../utils/constants";
import styles from "./Sidebar.module.css";

function StatusDot({ status }) {
  const colors = {
    [VIDEO_STATUS.PROCESSED]: "#16a34a",
    [VIDEO_STATUS.ALREADY_PROCESSED]: "#16a34a",
    [VIDEO_STATUS.PROCESSING]: "#d97706",
    [VIDEO_STATUS.FAILED]: "#dc2626",
  };
  return (
    <span
      style={{
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: colors[status] || "#94a3b8",
        flexShrink: 0,
        display: "inline-block",
      }}
      aria-hidden="true"
    />
  );
}

export default function VideoLibraryItem({ video, isSelected }) {
  const { selectVideo, removeVideo, reprocessVideo } = useVideoLibrary();
  const { clearActiveConversation } = useConversations();
  const { closeComposer } = useUI();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSelect = () => {
    selectVideo(video.video_id);
    clearActiveConversation();
    closeComposer();
    setMenuOpen(false);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (
      !window.confirm(
        `Delete "${video.title || "this video"}"? This cannot be undone.`,
      )
    )
      return;
    setIsDeleting(true);
    try {
      await removeVideo(video.video_id);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReprocess = async (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (!video.url) return;
    await reprocessVideo(video.video_id, video.url);
  };

  const statusLabels = {
    [VIDEO_STATUS.PROCESSED]: "Ready",
    [VIDEO_STATUS.ALREADY_PROCESSED]: "Ready",
    [VIDEO_STATUS.PROCESSING]: "Processing…",
    [VIDEO_STATUS.FAILED]: "Failed",
  };

  return (
    <li
      className={`${styles.item} ${isSelected ? styles.itemSelected : ""} ${isDeleting ? styles.itemDeleting : ""}`}
      onClick={handleSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleSelect()}
      aria-pressed={isSelected}
    >
      {video.thumbnail_url && (
        <img src={video.thumbnail_url} alt="" className={styles.itemThumb} />
      )}
      <div className={styles.itemBody}>
        <p className={styles.itemTitle} title={video.title}>
          {video.title || "Untitled"}
        </p>
        <div className={styles.itemMeta}>
          <StatusDot status={video.status} />
          <span className={styles.itemStatus}>
            {statusLabels[video.status] || video.status}
          </span>
        </div>
      </div>

      <div className={styles.itemActions} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={styles.menuToggle}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Video options"
          aria-expanded={menuOpen}
        >
          ⋮
        </button>
        {menuOpen && (
          <div className={styles.dropdownMenu}>
            {video.status === VIDEO_STATUS.FAILED && video.url && (
              <button
                type="button"
                className={styles.dropdownItem}
                onClick={handleReprocess}
              >
                Reprocess
              </button>
            )}
            <button
              type="button"
              className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
              onClick={handleDelete}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
