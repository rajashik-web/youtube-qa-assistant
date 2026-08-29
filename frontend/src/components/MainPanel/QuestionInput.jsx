import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { READY_STATUSES, VIDEO_STATUS } from '../../utils/constants';
import Spinner from '../common/Spinner';
import composerStyles from './Composer.module.css';
import styles from './MainPanel.module.css';

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
      <path
        d="M12 19V5M12 5L6 11M12 5L18 11"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function QuestionInput({ video, isBusy }) {
  const [question, setQuestion] = useState('');
  const { askAboutVideo } = useChat();

  const isReady = READY_STATUSES.has(video.status);
  const isDisabled = !isReady || isBusy;

  const placeholder = isReady
    ? 'Ask anything about this video…'
    : video.status === VIDEO_STATUS.PROCESSING
      ? 'Hang tight — this video is still processing…'
      : 'Reprocess this video before asking questions.';

  const submit = () => {
    const trimmed = question.trim();
    if (!trimmed || isDisabled) return;
    askAboutVideo(video.video_id, trimmed);
    setQuestion('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submit();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <form className={styles.questionForm} onSubmit={handleSubmit}>
      <div className={`${composerStyles.bar} ${isDisabled ? composerStyles.barDisabled : ''}`}>
        <textarea
          rows={1}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isDisabled}
          className={composerStyles.input}
          aria-label="Ask a question about this video"
        />
        <button
          type="submit"
          className={composerStyles.submit}
          disabled={isDisabled || !question.trim()}
          aria-label="Send question"
        >
          {isBusy ? <Spinner size={15} /> : <SendIcon />}
        </button>
      </div>
    </form>
  );
}
