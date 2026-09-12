/**
 * Centralized JWT access-token storage.
 *
 * This is the ONLY module that reads or writes the token to persistent
 * storage. Nothing else in the app — components, contexts, or other API
 * modules — should touch localStorage directly for the token. The token
 * itself must never be rendered, logged, or otherwise surfaced in the UI.
 */

const TOKEN_KEY = 'reel_access_token';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    // localStorage can throw in some environments (private browsing with
    // storage disabled, etc.) — fail closed rather than crash the app.
    return null;
  }
}

export function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // If storage isn't available, auth still works for the current tab via
    // in-memory state; it just won't survive a page refresh.
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // no-op
  }
}
