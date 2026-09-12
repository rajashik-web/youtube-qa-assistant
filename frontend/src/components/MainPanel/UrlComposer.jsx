import React, { useState } from 'react';
import { isValidYouTubeUrl } from '../../utils/youtube';
import { useVideoLibrary } from '../../context/VideoLibraryContext';
import { useUI } from '../../context/UIContext';
import { useToast } from '../../context/ToastContext';
import { ApiError } from '../../api/client';
import Spinner from '../common/Spinner';
import composerStyles from './Composer.module.css';
import styles from './UrlComposer.module.css';

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
      <path d="M12 19V5M12 5L6 11M12 5L18 11" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * variant "welcome": full welcome screen shown when the library is empty.
 * variant "panel": same composer shown mid-app after clicking "New video",
 * with a way back to whatever was previously selected.
 */
export default function UrlComposer({ variant = 'welcome', onClose }) {
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const { addVideo } = useVideoLibrary();
  const { closeComposer } = useUI();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmed = url.trim();
    if (!trimmed) {
      setValidationError('Paste a YouTube link to get started.');
      return;
    }
    if (!isValidYouTubeUrl(trimmed)) {
      setValidationError("That doesn't look like a valid YouTube video link.");
      return;
    }

    setValidationError(null);
    setIsSubmitting(true);
    try {
      const result = await addVideo(trimmed);
      setUrl('');
      closeComposer();
      if (result?.status === 'already_processed') {
        toast.info(`"${result.title || 'This video'}" was already processed — ready to ask questions.`);
      } else {
        toast.info(`Processing "${result?.title || 'your video'}"… this can take a minute.`);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not process that video.';
      setValidationError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const composer = (
    <form onSubmit={handleSubmit} className={styles.composerForm}>
      <div className={`${composerStyles.bar} ${isSubmitting ? composerStyles.barDisabled : ''}`}>
        <textarea
          rows={1}
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (validationError) setValidationError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Paste a YouTube URL"
          disabled={isSubmitting}
          className={composerStyles.input}
          aria-label="Paste a YouTube URL"
          autoFocus={variant === 'panel'}
        />
        <button
          type="submit"
          className={composerStyles.submit}
          disabled={isSubmitting || !url.trim()}
          aria-label="Add video"
          style={{ minWidth: '92px', gap: '6px', fontSize: '13px', fontWeight: 600 }}
        >
          {isSubmitting ? (
            <Spinner size={15} />
          ) : (
            <>
              <SendIcon />
              <span>Add video</span>
            </>
          )}
        </button>
      </div>
      {validationError ? (
        <p className={composerStyles.errorHint}>{validationError}</p>
      ) : (
        <p className={composerStyles.hint}>Supports any public YouTube video</p>
      )}
    </form>
  );

  if (variant === 'panel') {
    return (
      <div className={styles.panelWrap}>
        {onClose && (
          <button type="button" className={styles.panelClose} onClick={onClose} aria-label="Cancel adding a video">
            × Cancel
          </button>
        )}
        <div className={styles.panelInner}>
          <h2 className={styles.panelHeadline}>Add a video</h2>
          <p className={styles.panelSubtext}>Paste a link and we&apos;ll process the transcript.</p>
          {composer}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.welcomeWrap}>
      <div className={styles.welcomeInner}>
        <h1 className={styles.welcomeHeadline}>
          Add a YouTube video to start asking questions.
        </h1>
        <p className={styles.welcomeSubtext}>Paste any public YouTube link to process its transcript and begin your conversation.</p>
        {composer}
      </div>
    </div>
  );
}
