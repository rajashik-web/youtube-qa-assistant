import React from 'react';
import { buildTimestampUrl, formatTimestamp } from '../../utils/formatters';
import styles from './MainPanel.module.css';

export default function SourceChip({ source, videoId }) {
  const start = source.start_time_formatted || formatTimestamp(source.start_time);
  const end = source.end_time_formatted || formatTimestamp(source.end_time);
  // Backend field is `url` (see schemas/question.py SourceResponse). Fall
  // back to reconstructing it only if the backend ever omits it.
  const href = source.url || buildTimestampUrl(videoId, source.start_time);

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={styles.sourceChip}>
      <span className={styles.sourceChipTicks} aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span className={styles.sourceChipRange}>
        {start} <span className={styles.sourceChipArrow}>→</span> {end}
      </span>
      <span className={styles.sourceChipIcon} aria-hidden="true">
        ↗
      </span>
    </a>
  );
}
