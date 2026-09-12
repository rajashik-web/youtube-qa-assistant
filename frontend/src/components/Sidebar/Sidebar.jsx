import React, { useMemo, useState } from 'react';
import VideoLibraryItem from './VideoLibraryItem';
import ConversationItem from './ConversationItem';
import Spinner from '../common/Spinner';
import { useVideoLibrary } from '../../context/VideoLibraryContext';
import { useConversations } from '../../context/ConversationContext';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';
import { VIDEO_STATUS } from '../../utils/constants';
import styles from './Sidebar.module.css';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: VIDEO_STATUS.PROCESSED, label: 'Ready' },
  { key: VIDEO_STATUS.PROCESSING, label: 'Processing' },
  { key: VIDEO_STATUS.FAILED, label: 'Failed' },
];

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
      <path
        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none">
      <path
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Sidebar() {
  const { videos, libraryStatus, libraryError, fetchVideos, selectedVideoId } = useVideoLibrary();
  const {
    conversations,
    conversationsStatus,
    conversationsError,
    loadConversations,
    activeConversationId,
    selectConversation,
    clearActiveConversation,
  } = useConversations();
  const { openComposer, isMobileSidebarOpen, closeMobileSidebar } = useUI();
  const { user, logout } = useAuth();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const filteredVideos = useMemo(() => {
    return videos.filter((v) => {
      const matchesQuery = !query.trim() || (v.title || '').toLowerCase().includes(query.trim().toLowerCase());
      const matchesFilter =
        filter === 'all' ||
        v.status === filter ||
        (filter === VIDEO_STATUS.PROCESSED && v.status === VIDEO_STATUS.ALREADY_PROCESSED);
      return matchesQuery && matchesFilter;
    });
  }, [videos, query, filter]);

  const handleNewVideo = () => {
    openComposer();
    closeMobileSidebar();
  };

  const handleNewChat = () => {
    // Clear the active conversation and any conversation-synced threads.
    // The first /ask request will auto-create a new conversation.
    clearActiveConversation();
    closeMobileSidebar();
  };

  const handleSelectConversation = (conversationId) => {
    selectConversation(conversationId);
    closeMobileSidebar();
  };

  return (
    <>
      {isMobileSidebarOpen && (
        <div className={styles.backdrop} onClick={closeMobileSidebar} aria-hidden="true" />
      )}

      <aside className={`${styles.sidebar} ${isMobileSidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.brand}>
          <div className={styles.brandMark} aria-hidden="true">
            <img src="/logo.png" alt="" className={styles.brandMarkImg} />
          </div>
          <div>
            <h1 className={styles.brandName}>Reel</h1>
            <p className={styles.brandSubtitle}>Video Q&A</p>
          </div>
          <button
            type="button"
            className={styles.mobileCloseButton}
            onClick={closeMobileSidebar}
            aria-label="Close video library"
          >
            ×
          </button>
        </div>

        <div className={styles.newVideoRow}>
          <button type="button" className={styles.newVideoButton} onClick={handleNewVideo}>
            <PlusIcon />
            New video
          </button>
        </div>

        {/* ---- Conversations section ---- */}
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>Conversations</span>
          <button
            type="button"
            className={styles.newChatButton}
            onClick={handleNewChat}
            aria-label="Start a new chat"
            title="New chat"
          >
            <ChatIcon />
            New chat
          </button>
        </div>

        <div className={styles.conversationListWrap}>
          {conversationsStatus === 'loading' && (
            <div className={styles.stateBlock}>
              <Spinner size={16} />
              <p>Loading conversations…</p>
            </div>
          )}

          {conversationsStatus === 'error' && (
            <div className={styles.stateBlock}>
              <p className={styles.stateError}>{conversationsError}</p>
              <button type="button" className={styles.retryButton} onClick={loadConversations}>
                Try again
              </button>
            </div>
          )}

          {conversationsStatus === 'ready' && conversations.length === 0 && (
            <div className={styles.stateBlock}>
              <p className={styles.emptyBody}>No conversations yet. Ask a question to get started.</p>
            </div>
          )}

          {conversations.length > 0 && (
            <ul className={styles.conversationList}>
              {conversations.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  isActive={conversation.id === activeConversationId}
                  onSelect={() => handleSelectConversation(conversation.id)}
                />
              ))}
            </ul>
          )}
        </div>

        {/* ---- Video library section ---- */}
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>Videos</span>
        </div>

        {videos.length > 0 && (
          <>
            <div className={styles.searchRow}>
              <input
                type="search"
                placeholder="Search your library…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={styles.searchInput}
                aria-label="Search video library"
              />
            </div>
            <div className={styles.filterRow} role="tablist" aria-label="Filter by status">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  role="tab"
                  aria-selected={filter === f.key}
                  className={`${styles.filterChip} ${filter === f.key ? styles.filterChipActive : ''}`}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </>
        )}

        <div className={styles.listWrap}>
          {libraryStatus === 'loading' && (
            <div className={styles.stateBlock}>
              <Spinner size={18} />
              <p>Loading your library…</p>
            </div>
          )}

          {libraryStatus === 'error' && (
            <div className={styles.stateBlock}>
              <p className={styles.stateError}>{libraryError}</p>
              <button type="button" className={styles.retryButton} onClick={fetchVideos}>
                Try again
              </button>
            </div>
          )}

          {libraryStatus === 'ready' && videos.length === 0 && (
            <div className={styles.stateBlock}>
              <p className={styles.emptyTitle}>Your library is empty</p>
              <p className={styles.emptyBody}>Add your first video to start asking questions.</p>
            </div>
          )}

          {libraryStatus === 'ready' && videos.length > 0 && filteredVideos.length === 0 && (
            <div className={styles.stateBlock}>
              <p className={styles.emptyBody}>No videos match your search.</p>
            </div>
          )}

          {filteredVideos.length > 0 && (
            <ul className={styles.list}>
              {filteredVideos.map((video) => (
                <VideoLibraryItem key={video.video_id} video={video} isSelected={video.video_id === selectedVideoId} />
              ))}
            </ul>
          )}
        </div>

        <div className={styles.accountFooter}>
          <div className={styles.accountInfo}>
            <div className={styles.accountAvatar} aria-hidden="true">
              {(user?.username || user?.email || '?').charAt(0).toUpperCase()}
            </div>
            <div className={styles.accountText}>
              <p className={styles.accountName} title={user?.username}>
                {user?.username || 'Account'}
              </p>
              <p className={styles.accountEmail} title={user?.email}>
                {user?.email}
              </p>
            </div>
          </div>
          <button type="button" className={styles.logoutButton} onClick={logout} aria-label="Log out">
            <LogoutIcon />
          </button>
        </div>
      </aside>
    </>
  );
}