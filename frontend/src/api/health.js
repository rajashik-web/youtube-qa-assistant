import { apiClient } from './client';

export function getHealth(opts) {
  return apiClient.get('/health', opts);
}
