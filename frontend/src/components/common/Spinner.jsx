import React from "react";
import styles from "./Spinner.module.css";

/**
 * Simple CSS spinner. `size` controls width/height in pixels.
 */
export default function Spinner({ size = 20 }) {
  return (
    <span
      className={styles.spinner}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    />
  );
}
