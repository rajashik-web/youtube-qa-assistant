import React from 'react';
import { ExternalLink } from 'lucide-react';
import { buildTimestampUrl, formatTimestamp } from '../../utils/formatters';
import styles from './MainPanel.module.css';

/**
 * Compact, unobtrusive timestamp source chip.
 * Displays `[00:04]` or `[00:04 - 00:18]` and opens the video at that timestamp.
 */
export default function SourceChip({ source, videoId }) {
  const start = source.start_time_formatted || formatTimestamp(source.start_time);
  const end = source.end_time_formatted || (source.end_time ? formatTimestamp(source.end_time) : null);
  
  // Use the URL returned by backend, or build YouTube URL from timestamp
  const href = source.url || buildTimestampUrl(videoId, source.start_time);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.sourceChip}
      title={`Jump to ${start} in YouTube video`}
      aria-label={`Jump to timestamp ${start} on YouTube`}
    >
      <span className={styles.sourceChipRange}>
        [{start}{end && end !== start ? ` – ${end}` : ''}]
      </span>
      <ExternalLink size={11} className={styles.sourceChipIcon} aria-hidden="true" />
    </a>
  );
}
