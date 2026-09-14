import React from 'react';
import SourceChip from './SourceChip';
import styles from './MainPanel.module.css';

export default function MessageBubble({ message, onSeek }) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <div
      className={`${styles.messageRow} ${
        isUser ? styles.messageRowUser : styles.messageRowAssistant
      }`}
    >
      <div
        className={`${styles.bubble} ${
          isUser ? styles.bubbleUser : styles.bubbleAssistant
        }`}
      >
        <div className={styles.bubbleText}>{message.content}</div>

        {isAssistant && message.sources && message.sources.length > 0 && (
          <div className={styles.sourcesWrap}>
            <span className={styles.sourcesLabel}>Sources:</span>
            <div className={styles.chipsRow}>
              {message.sources.map((src, idx) => (
                <SourceChip
                  key={idx}
                  source={src}
                  onSeek={onSeek}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
