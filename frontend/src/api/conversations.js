import { apiClient } from './client';

export function listConversations(opts) {
  return apiClient.get('/conversations', opts);
}

export function getConversations(opts) {
  return apiClient.get('/conversations', opts);
}

export function getConversation(id, opts) {
  return apiClient.get(`/conversations/${id}`, opts);
}

export function getConversationMessages(id, opts) {
  return apiClient.get(`/conversations/${id}`, opts);
}

export function createConversation({ title = 'New Chat' } = {}, opts) {
  return apiClient.post('/conversations', { title }, opts);
}

export function renameConversation(id, title, opts) {
  return apiClient.patch(`/conversations/${id}`, { title }, opts);
}

export function deleteConversation(id, opts) {
  return apiClient.delete(`/conversations/${id}`, opts);
}
