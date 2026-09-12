import { apiClient } from './client';

/**
 * Creates a new conversation.
 * Backend contract: POST /conversations  body: { title: string | null }
 */
export function createConversation({ title = null } = {}, opts) {
  return apiClient.post('/conversations', { title }, opts);
}

/**
 * Returns the authenticated user's conversations, most recently updated first.
 * Backend contract: GET /conversations
 */
export function getConversations(opts) {
  return apiClient.get('/conversations', opts);
}

/**
 * Returns a single conversation with all its messages.
 * Backend contract: GET /conversations/{id}
 */
export function getConversation(conversationId, opts) {
  return apiClient.get(`/conversations/${encodeURIComponent(conversationId)}`, opts);
}

/**
 * Returns paginated messages for a conversation (oldest → newest).
 * Backend contract: GET /conversations/{id}/messages?limit=&before_id=
 */
export function getConversationMessages(conversationId, { limit = 20, beforeId = null } = {}, opts) {
  return apiClient.get(`/conversations/${encodeURIComponent(conversationId)}/messages`, {
    ...opts,
    params: { limit, before_id: beforeId },
  });
}

/**
 * Renames a conversation.
 * Backend contract: PATCH /conversations/{id}  body: { title: string }
 */
export function renameConversation(conversationId, title, opts) {
  return apiClient.patch(`/conversations/${encodeURIComponent(conversationId)}`, { title }, opts);
}

/**
 * Deletes a conversation.
 * Backend contract: DELETE /conversations/{id}
 */
export function deleteConversation(conversationId, opts) {
  return apiClient.delete(`/conversations/${encodeURIComponent(conversationId)}`, opts);
}