/**
 * Application-wide constants.
 */

export const VIDEO_STATUS = {
  PROCESSING: "processing",
  PROCESSED: "processed",
  ALREADY_PROCESSED: "already_processed",
  FAILED: "failed",
};

/** How often to poll a processing video's status (ms). */
export const POLL_INTERVAL_MS = 5_000;

/** Stop polling after this many attempts (~5 minutes at 5 s intervals). */
export const MAX_POLL_ATTEMPTS = 60;
