/**
 * Thin fetch wrapper shared by every API module.
 *
 * Responsibilities:
 *  - Resolve the backend base URL from environment configuration.
 *  - Attach consistent headers / JSON handling.
 *  - Normalize every failure into an ApiError so UI code never has to
 *    branch on fetch's quirks (network failure vs. HTTP error vs. bad JSON).
 */

const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!RAW_BASE_URL) {
  // Fail loudly in dev rather than silently calling window.location.origin.
  // eslint-disable-next-line no-console
  console.warn(
    'VITE_API_BASE_URL is not set. Copy .env.example to .env and point it at your backend.'
  );
}

export const API_BASE_URL = (RAW_BASE_URL || '').replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, { status = null, code = 'UNKNOWN', cause = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.cause = cause;
  }
}

/**
 * Turns backend error payloads into a single human-readable message.
 * FastAPI typically returns { detail: "..." } or { detail: [{ msg, loc }] }.
 */
function extractErrorMessage(payload, fallback) {
  if (!payload) return fallback;
  if (typeof payload.detail === 'string') return payload.detail;
  if (Array.isArray(payload.detail) && payload.detail.length > 0) {
    const first = payload.detail[0];
    if (typeof first?.msg === 'string') return first.msg;
  }
  if (typeof payload.message === 'string') return payload.message;
  return fallback;
}

/**
 * Maps status codes to friendly, non-technical copy. We never surface raw
 * backend exception text to the user.
 */
function friendlyMessageFor(status, backendMessage) {
  switch (status) {
    case 400:
      return backendMessage || "That request doesn't look right. Double-check the details and try again.";
    case 404:
      return "We couldn't find that. It may have been removed.";
    case 408:
    case 504:
      return 'The server took too long to respond. Please try again.';
    case 409:
      return backendMessage || 'That action conflicts with the current state of this video.';
    case 422:
      return backendMessage || 'Some of the information provided is invalid.';
    case 429:
      return "You're sending requests a little too fast. Wait a moment and try again.";
    case 500:
    case 502:
    case 503:
      return "Something went wrong on our end. Please try again in a moment.";
    default:
      return backendMessage || 'Something unexpected happened. Please try again.';
  }
}

async function request(path, { method = 'GET', body, signal, params } = {}) {
  if (!API_BASE_URL) {
    throw new ApiError('The backend address is not configured.', { code: 'NO_BASE_URL' });
  }

  let url = `${API_BASE_URL}${path}`;
  if (params && Object.keys(params).length > 0) {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    const queryString = query.toString();
    if (queryString) url += `?${queryString}`;
  }

  let response;
  try {
    response = await fetch(url, {
      method,
      signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new ApiError('Request cancelled.', { code: 'ABORTED', cause: err });
    }
    throw new ApiError(
      "Can't reach the server. Check your connection and try again.",
      { code: 'NETWORK_ERROR', cause: err }
    );
  }

  let payload = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const backendMessage = extractErrorMessage(payload, null);
    throw new ApiError(friendlyMessageFor(response.status, backendMessage), {
      status: response.status,
      code: `HTTP_${response.status}`,
    });
  }

  return payload;
}

export const apiClient = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  delete: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
};
