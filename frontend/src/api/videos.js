import { apiClient } from "./client";

/**
 * Fetch the authenticated user's video library.
 */
export function getVideos(opts) {
  return apiClient.get("/videos", opts);
}

export const listVideos = getVideos;

/**
 * Submit a YouTube URL for processing (or re-processing).
 */
export function processVideo(arg, opts) {
  const { url, forceReprocess = false } =
    typeof arg === "string" ? { url: arg, forceReprocess: false } : arg || {};
  return apiClient.post(
    "/process-video",
    { url, force_reprocess: forceReprocess },
    opts,
  );
}

/**
 * Fetch the current processing status of a specific video.
 */
export function getVideoStatus(videoId, opts) {
  return apiClient.get(`/video/${videoId}/status`, opts);
}

/**
 * Delete a video from the library.
 */
export function deleteVideo(videoId, opts) {
  return apiClient.delete(`/video/${videoId}`, opts);
}
