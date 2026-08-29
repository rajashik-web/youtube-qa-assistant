import React from 'react';
import { VIDEO_STATUS } from '../../utils/constants';
import styles from './StatusDot.module.css';

const CONFIG = {
  [VIDEO_STATUS.PROCESSING]: { label: 'Processing', className: styles.processing },
  [VIDEO_STATUS.PROCESSED]: { label: 'Ready', className: styles.ready },
  [VIDEO_STATUS.ALREADY_PROCESSED]: { label: 'Ready', className: styles.ready },
  [VIDEO_STATUS.FAILED]: { label: 'Failed', className: styles.failed },
};

export default function StatusDot({ status, size = 'md' }) {
  const config = CONFIG[status] || { label: status || 'Unknown', className: styles.unknown };
  return (
    <span className={`${styles.wrap} ${size === 'sm' ? styles.sm : ''}`}>
      <span className={`${styles.dot} ${config.className}`} aria-hidden="true" />
      <span className={styles.label}>{config.label}</span>
    </span>
  );
}
