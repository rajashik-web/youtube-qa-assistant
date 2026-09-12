import React from 'react';
import UrlComposer from './UrlComposer';
import VideoHeader from './VideoHeader';
import QAThread from './QAThread';
import { useVideoLibrary } from '../../context/VideoLibraryContext';
import { useConversations } from '../../context/ConversationContext';
import { useUI } from '../../context/UIContext';
import styles from './MainPanel.module.css';

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function MainPanel() {
  const { selectedVideo, videos } = useVideoLibrary();
  const { activeConversation, conversationVideoMap } = useConversations();
  const { isComposerOpen, closeComposer, toggleMobileSidebar } = useUI();

  const hasVideos = videos.length > 0;
  const showComposer = isComposerOpen || !selectedVideo;
  const canReturnToVideo = showComposer && !!selectedVideo;

  // Determine which video the active conversation belongs to.
  // The backend Conversation/Message models have no video_id, so we use the
  // client-side mapping (conversationVideoMap) when available. If the map is
  // missing (e.g. after a page refresh), we pass null so QAThread falls back
  // to the `__conv_${id}` thread key — the conversation is still viewable,
  // but we don't pretend it belongs to the currently selected video.
  const activeConversationVideoId = activeConversation
    ? conversationVideoMap[activeConversation.id] || null
    : null;

  return (
    <main className={styles.main}>
      <div className={styles.mobileBar}>
        <button
          type="button"
          className={styles.mobileMenuButton}
          onClick={toggleMobileSidebar}
          aria-label="Open video library"
        >
          <MenuIcon />
        </button>
        <span className={styles.mobileBarTitle}>
          {selectedVideo && !showComposer ? selectedVideo.title : 'Reel'}
        </span>
      </div>

      {showComposer ? (
        <UrlComposer variant={hasVideos ? 'panel' : 'welcome'} onClose={canReturnToVideo ? closeComposer : undefined} />
      ) : (
        <div className={styles.workspace}>
          <VideoHeader video={selectedVideo} />
          <QAThread video={selectedVideo} activeConversationVideoId={activeConversationVideoId} />
        </div>
      )}
    </main>
  );
}