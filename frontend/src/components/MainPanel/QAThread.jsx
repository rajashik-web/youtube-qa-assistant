import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import QuestionInput from './QuestionInput';
import { useChat } from '../../context/ChatContext';
import { useConversations } from '../../context/ConversationContext';
import { READY_STATUSES } from '../../utils/constants';
import styles from './MainPanel.module.css';

const EXAMPLE_QUESTIONS = [
  'What is this video about?',
  'What are the main points discussed?',
  'Summarize this in three sentences.',
];

export default function QAThread({ video, activeConversationVideoId }) {
  const { getThread, askAboutVideo } = useChat();
  const { activeConversationId, hasMore, loadOlderMessages, messagesStatus } = useConversations();

  // Determine the thread key:
  // - If an active conversation exists and its video is known, use that videoId.
  // - If an active conversation exists but its video is unknown (e.g. after a
  //   page refresh), use `__conv_${conversationId}`.
  // - Otherwise use the currently selected video's id.
  const threadKey = activeConversationId
    ? activeConversationVideoId || `__conv_${activeConversationId}`
    : video.video_id;

  const messages = getThread(threadKey);
  const isReady = READY_STATUSES.has(video.status);
  const endRef = useRef(null);
  const isBusy = messages.some((m) => m.status === 'loading');
  const lastMessageStatus = messages.length > 0 ? messages[messages.length - 1].status : null;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, lastMessageStatus]);

  // When a conversation is active but belongs to a different video, show a
  // notice so the user understands the thread they're viewing is from a
  // different video. The backend has no video_id on conversations, so this
  // is a client-side heuristic.
  const isConversationForDifferentVideo =
    activeConversationId && activeConversationVideoId && activeConversationVideoId !== video.video_id;

  return (
    <div className={styles.threadWrap}>
      <div className={styles.threadScroll}>
        {isConversationForDifferentVideo && (
          <div className={styles.threadNotice}>
            This conversation is from a different video. Ask a question to start a new chat for this video.
          </div>
        )}

        {hasMore && (
          <div className={styles.loadOlderRow}>
            <button
              type="button"
              className={styles.loadOlderButton}
              onClick={loadOlderMessages}
              disabled={messagesStatus === 'loading'}
            >
              {messagesStatus === 'loading' ? 'Loading…' : 'Load older messages'}
            </button>
          </div>
        )}

        {messages.length === 0 && (
          <div className={styles.threadEmpty}>
            <p className={styles.threadEmptyTitle}>
              {isReady ? 'No questions asked yet' : 'Questions will unlock once this video is ready'}
            </p>
            {isReady && (
              <>
                <p className={styles.threadEmptyBody}>Try one of these, or ask your own below.</p>
                <div className={styles.exampleChips}>
                  {EXAMPLE_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      className={styles.exampleChip}
                      onClick={() => askAboutVideo(video.video_id, q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} videoId={video.video_id} />
        ))}
        <div ref={endRef} />
      </div>

      <QuestionInput video={video} isBusy={isBusy} />
    </div>
  );
}