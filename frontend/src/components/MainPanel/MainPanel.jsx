import React, { useRef, useEffect } from "react";
import { useVideoLibrary } from "../../context/VideoLibraryContext";
import { useConversations } from "../../context/ConversationContext";
import { useUI } from "../../context/UIContext";
import { useChat } from "../../context/ChatContext";
import { VIDEO_STATUS } from "../../utils/constants";
import MessageBubble from "./MessageBubble";
import UrlComposer from "./UrlComposer";
import Spinner from "../common/Spinner";
import styles from "./MainPanel.module.css";

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
      <path
        d="M3 12h18M3 6h18M3 18h18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function QAComposer({ videoId }) {
  const [question, setQuestion] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { askAboutVideo } = useChat();
  const textareaRef = useRef(null);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || isSubmitting) return;
    setQuestion("");
    setIsSubmitting(true);
    try {
      await askAboutVideo(videoId, trimmed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={styles.composerWrap}>
      <div
        className={`${styles.composerBar} ${isSubmitting ? styles.composerBarDisabled : ""}`}
      >
        <textarea
          ref={textareaRef}
          rows={1}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about this video…"
          disabled={isSubmitting}
          className={styles.composerInput}
          aria-label="Ask a question about this video"
        />
        <button
          type="button"
          className={styles.composerSubmit}
          disabled={isSubmitting || !question.trim()}
          onClick={handleSubmit}
          aria-label="Send question"
        >
          {isSubmitting ? (
            <Spinner size={15} />
          ) : (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
              <path
                d="M12 19V5M12 5L6 11M12 5L18 11"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

function VideoHeader({ video, onAddVideo }) {
  const statusColors = {
    [VIDEO_STATUS.PROCESSED]: "var(--success-600, #16a34a)",
    [VIDEO_STATUS.ALREADY_PROCESSED]: "var(--success-600, #16a34a)",
    [VIDEO_STATUS.PROCESSING]: "var(--warning-600, #d97706)",
    [VIDEO_STATUS.FAILED]: "var(--danger-600, #dc2626)",
  };
  const statusLabels = {
    [VIDEO_STATUS.PROCESSED]: "Ready",
    [VIDEO_STATUS.ALREADY_PROCESSED]: "Ready",
    [VIDEO_STATUS.PROCESSING]: "Processing…",
    [VIDEO_STATUS.FAILED]: "Failed",
  };

  return (
    <div className={styles.videoHeader}>
      {video.thumbnail_url && (
        <img src={video.thumbnail_url} alt="" className={styles.videoThumb} />
      )}
      <div className={styles.videoHeaderText}>
        <p className={styles.videoTitle} title={video.title}>
          {video.title || "Untitled video"}
        </p>
        <p
          className={styles.videoStatus}
          style={{ color: statusColors[video.status] || "var(--text-500)" }}
        >
          {statusLabels[video.status] || video.status}
        </p>
      </div>
      <button
        type="button"
        className={styles.addVideoBtn}
        onClick={onAddVideo}
        aria-label="Add another video"
        title="Add video"
      >
        +
      </button>
    </div>
  );
}

export default function MainPanel() {
  const { selectedVideo, libraryStatus } = useVideoLibrary();
  const { activeConversationId } = useConversations();
  const { isComposerOpen, openComposer, closeComposer } = useUI();
  const { getThread } = useChat();
  const { openMobileSidebar } = useUI();
  const threadEndRef = useRef(null);

  const threadKey = selectedVideo
    ? activeConversationId
      ? null // use conversation key computed in ChatContext
      : selectedVideo.video_id
    : null;

  // Derive thread using the same key logic as ChatContext
  const activeConvKey = activeConversationId
    ? selectedVideo?.video_id || `__conv_${activeConversationId}`
    : selectedVideo?.video_id;

  const thread = activeConvKey ? getThread(activeConvKey) : [];

  // Auto-scroll to bottom when new messages arrive.
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread.length]);

  const isReady =
    selectedVideo &&
    (selectedVideo.status === VIDEO_STATUS.PROCESSED ||
      selectedVideo.status === VIDEO_STATUS.ALREADY_PROCESSED);

  const isProcessing = selectedVideo?.status === VIDEO_STATUS.PROCESSING;
  const isFailed = selectedVideo?.status === VIDEO_STATUS.FAILED;

  return (
    <main className={styles.main}>
      {/* Mobile header bar */}
      <div className={styles.mobileBar}>
        <button
          type="button"
          className={styles.mobileMenuBtn}
          onClick={openMobileSidebar}
          aria-label="Open sidebar"
        >
          <MenuIcon />
        </button>
        <span className={styles.mobileBrand}>Reel</span>
      </div>

      {/* Loading state */}
      {libraryStatus === "loading" && (
        <div className={styles.centerState}>
          <Spinner size={28} />
          <p>Loading your workspace…</p>
        </div>
      )}

      {/* No video selected — show URL composer welcome screen */}
      {libraryStatus !== "loading" && !selectedVideo && !isComposerOpen && (
        <UrlComposer variant="welcome" />
      )}

      {/* Composer panel (Add video) */}
      {isComposerOpen && (
        <UrlComposer variant="panel" onClose={closeComposer} />
      )}

      {/* Video workspace */}
      {selectedVideo && !isComposerOpen && (
        <div className={styles.workspace}>
          <VideoHeader video={selectedVideo} onAddVideo={openComposer} />

          <div className={styles.threadWrap}>
            {isProcessing && (
              <div className={styles.centerState}>
                <Spinner size={24} />
                <p>
                  Processing this video… it'll be ready to chat with shortly.
                </p>
              </div>
            )}

            {isFailed && (
              <div className={styles.centerState}>
                <p className={styles.errorText}>
                  This video failed to process. You can try again by adding it
                  again.
                </p>
              </div>
            )}

            {isReady && thread.length === 0 && (
              <div className={styles.emptyThread}>
                <p className={styles.emptyThreadTitle}>
                  Ready to answer questions
                </p>
                <p className={styles.emptyThreadBody}>
                  Ask anything about{" "}
                  <strong>{selectedVideo.title || "this video"}</strong> below.
                </p>
              </div>
            )}

            {thread.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                videoId={selectedVideo.video_id}
              />
            ))}
            <div ref={threadEndRef} />
          </div>

          {isReady && <QAComposer videoId={selectedVideo.video_id} />}
        </div>
      )}
    </main>
  );
}
