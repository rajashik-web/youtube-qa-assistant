import React from 'react';
import UrlComposer from './UrlComposer';
import VideoHeader from './VideoHeader';
import QAThread from './QAThread';
import { useVideoLibrary } from '../../context/VideoLibraryContext';
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
  const { isComposerOpen, closeComposer, toggleMobileSidebar } = useUI();

  const hasVideos = videos.length > 0;
  const showComposer = isComposerOpen || !selectedVideo;
  const canReturnToVideo = showComposer && !!selectedVideo;

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
        <span className={styles.mobileBarTitle}>{selectedVideo && !showComposer ? selectedVideo.title : 'Reel'}</span>
      </div>

      {showComposer ? (
        <UrlComposer variant={hasVideos ? 'panel' : 'welcome'} onClose={canReturnToVideo ? closeComposer : undefined} />
      ) : (
        <div className={styles.workspace}>
          <VideoHeader video={selectedVideo} />
          <QAThread video={selectedVideo} />
        </div>
      )}
    </main>
  );
}
