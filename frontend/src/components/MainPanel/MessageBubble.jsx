import React from "react";
import ReactMarkdown from "react-markdown";
import SourceChip from "./SourceChip";
import Spinner from "../common/Spinner";
import { useChat } from "../../context/ChatContext";
import styles from "./MainPanel.module.css";

export default function MessageBubble({ message, videoId }) {
  const { retryMessage } = useChat();

  return (
    <div className={styles.message}>
      <div className={styles.messageQuestion}>
        <span className={styles.qaLabel}>Q</span>
        <p>{message.question}</p>
      </div>

      <div className={styles.messageAnswer}>
        <span className={`${styles.qaLabel} ${styles.qaLabelAnswer}`}>A</span>
        <div className={styles.messageAnswerBody}>
          {message.status === "loading" && (
            <div className={styles.messageLoading}>
              <Spinner size={15} />
              <span>Reading the transcript…</span>
            </div>
          )}

          {message.status === "error" && (
            <div className={styles.messageError}>
              <p>{message.errorMessage}</p>
              <button
                type="button"
                className={styles.retryLink}
                onClick={() =>
                  retryMessage(videoId, message.id, message.question)
                }
              >
                Try again
              </button>
            </div>
          )}

          {message.status === "done" && message.notFound && (
            <p className={styles.messageNotFound}>
              I couldn&apos;t find enough information in this video to answer
              that. Try rephrasing, or ask something else about the video.
            </p>
          )}

          {message.status === "done" && !message.notFound && (
            <>
              <div className={styles.messageAnswerText}>
                <ReactMarkdown>{message.answer}</ReactMarkdown>
              </div>
              {message.sources?.length > 0 && (
                <div className={styles.sourcesBlock}>
                  <p className={styles.sourcesLabel}>Sources</p>
                  <div className={styles.sourcesList}>
                    {message.sources.map((source, i) => (
                      <SourceChip
                        key={`${message.id}-${i}`}
                        source={source}
                        videoId={videoId}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
