import { apiClient } from "./client";

/**
 * Submit a question about a video. Optionally pass a conversationId to
 * continue an existing conversation; the backend will create one if omitted.
 */
export function askQuestion({ videoId, question, conversationId }, opts) {
  return apiClient.post(
    "/ask",
    {
      video_id: videoId,
      question,
      ...(conversationId ? { conversation_id: conversationId } : {}),
    },
    opts,
  );
}
