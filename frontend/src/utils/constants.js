// Canonical status values returned by the backend.
export const VIDEO_STATUS = {
  PROCESSING: 'processing',
  PROCESSED: 'processed',
  FAILED: 'failed',
  ALREADY_PROCESSED: 'already_processed',
};

// Treat "already_processed" the same as "processed" everywhere in the UI —
// both mean "ready to ask questions".
export const READY_STATUSES = new Set([VIDEO_STATUS.PROCESSED, VIDEO_STATUS.ALREADY_PROCESSED]);

export const POLL_INTERVAL_MS = 4000;
export const MAX_POLL_ATTEMPTS = 150; // ~10 minutes ceiling, then we stop and ask the user to check back.
