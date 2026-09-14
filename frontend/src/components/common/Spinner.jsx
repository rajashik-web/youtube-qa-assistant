import React from 'react';
import styles from './Spinner.module.css';

export default function Spinner({ size = 20, className = '' }) {
  return (
    <div
      className={`${styles.spinner} ${className}`}
      style={{ width: size, height: size }}
      aria-label="Loading"
      role="status"
    />
  );
}
