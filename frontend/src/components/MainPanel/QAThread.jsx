import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import QuestionInput from './QuestionInput';
import { useChat } from '../../context/ChatContext';
import { READY_STATUSES } from '../../utils/constants';
import styles from './MainPanel.module.css';

const EXAMPLE_QUESTIONS = [
  'What is this video about?',
  'What are the main points discussed?',
  'Summarize this in three sentences.',
];

export default function QAThread({ video }) {
  const { getThread, askAboutVideo } = useChat();
  const messages = getThread(video.video_id);
  const isReady = READY_STATUSES.has(video.status);
  const endRef = useRef(null);
  const isBusy = messages.some((m) => m.status === 'loading');
  const lastMessageStatus = messages.length > 0 ? messages[messages.length - 1].status : null;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, lastMessageStatus]);

  return (
    <div className={styles.threadWrap}>
      <div className={styles.threadScroll}>
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
