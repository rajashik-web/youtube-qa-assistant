import { apiClient, API_BASE_URL } from './client';

export function getGoogleLoginUrl() {
  return `${API_BASE_URL}/auth/google/login`;
}

/**
 * Returns the currently authenticated user, based on whatever token
 * api/client.js has already attached to the request. Throws ApiError with
 * status 401 if there is no token or it's invalid/expired.
 *
 * This app uses Google-only authentication (see AuthContext.jsx /
 * OAuthCallbackPage.jsx) — there is no local login/register/password-reset
 * flow, so no corresponding functions live here.
 */
export function getCurrentUser(opts) {
  return apiClient.get('/auth/me', opts);
}
