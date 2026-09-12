import { apiClient } from './client';

/**
 * Asks a question about a processed video.
 *
 * Backend contract: POST /ask
 * body: { video_id, question, conversation_id }
 *
 * - Pass `conversationId: null` for the first question in a conversation —
 *   the backend auto-creates the conversation and returns its id.
 * - Pass the returned `conversation_id` for follow-up questions so the
 *   backend maintains multi-turn context.
 *
 * Backend response includes: answer, sources[], conversation_id
 */
export function askQuestion({ videoId, question, conversationId = null }, opts) {
  return apiClient.post(
    '/ask',
    {
      video_id: videoId,
      question,
      conversation_id: conversationId,
    },
    opts
  );
}