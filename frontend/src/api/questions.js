import { apiClient } from './client';

export function askQuestion({ video_id, question, conversation_id }, opts) {
  return apiClient.post(
    '/ask',
    {
      video_id,
      question,
      conversation_id,
    },
    opts
  );
}
