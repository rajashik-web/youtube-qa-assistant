import React, { useState } from 'react';
import { ArrowRight, Link as LinkIcon } from 'lucide-react';
import Spinner from '../common/Spinner';
import styles from './UrlComposer.module.css';

export default function UrlComposer({ onSubmit, isProcessing, error, onClearError }) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = url.trim();
    if (!clean || isProcessing) return;
    onSubmit(clean);
  };

  return (
    <form className={styles.composer} onSubmit={handleSubmit}>
      <div className={styles.inputWrap}>
        <LinkIcon size={18} className={styles.icon} />
        <input
          type="text"
          className={styles.input}
          placeholder="Paste YouTube video URL (e.g. https://www.youtube.com/watch?v=...)"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (error && onClearError) onClearError();
          }}
          disabled={isProcessing}
        />
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={!url.trim() || isProcessing}
          aria-label="Add video"
        >
          {isProcessing ? <Spinner size={16} /> : <ArrowRight size={16} />}
        </button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </form>
  );
}
