/**
 * Thin wrapper around sessionStorage for the JWT bearer token.
 * Using sessionStorage means the token is scoped to the browser tab —
 * it is cleared automatically when the tab is closed, which avoids
 * tokens lingering in localStorage across sessions.
 */

const TOKEN_KEY = "reel_auth_token";

export function getToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore — private/incognito contexts may throw QuotaExceededError
  }
}

export function clearToken() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}
