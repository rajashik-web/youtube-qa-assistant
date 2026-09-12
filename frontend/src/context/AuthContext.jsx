import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getCurrentUser } from '../api/auth';
import { getToken, setToken as persistToken, clearToken } from '../utils/tokenStorage';

const AuthContext = createContext(null);

// 'initializing' — startup restoreSession() hasn't resolved yet.
// 'authenticated' — valid token + user loaded.
// 'unauthenticated' — no token, or the token was rejected/cleared.
//
// This app uses Google-only authentication. There is no local
// email/password login or registration — the only way to establish a
// session is completeOAuthLogin(), called by OAuthCallbackPage once the
// backend has redirected back with a JWT already issued.
export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => getToken());
  const [user, setUser] = useState(null);
  const [authStatus, setAuthStatus] = useState('initializing');
  // Set only when a session ends involuntarily (a 401 from an existing
  // session), never on a normal user-initiated logout — LoginPage shows
  // this once, then it's cleared.
  const [sessionMessage, setSessionMessage] = useState(null);

  const isAuthenticated = authStatus === 'authenticated' && !!user;
  const loading = authStatus === 'initializing';

  const restoreSession = useCallback(async () => {
    const storedToken = getToken();

    if (!storedToken) {
      setAuthStatus('unauthenticated');
      return;
    }

    setTokenState(storedToken);

    try {
      const me = await getCurrentUser();
      setUser(me);
      setAuthStatus('authenticated');
    } catch {
      // Token missing/invalid/expired (401) or unreachable backend — either
      // way we can't trust it. api/client.js already clears it from storage
      // on a 401; clear it here too in case this failed for another reason.
      clearToken();
      setTokenState(null);
      setUser(null);
      setAuthStatus('unauthenticated');
    }
  }, []);

  // Restore session once on startup.
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // A 401 from ANY request (dispatched centrally by api/client.js) means
  // the token is no longer valid. Storage is already cleared by client.js;
  // this keeps in-memory auth state in sync and surfaces a friendly
  // "session expired" message on the next /login render. ProtectedRoute
  // reacts to isAuthenticated becoming false and redirects there itself —
  // this handler does not navigate, avoiding any redirect-loop risk.
  useEffect(() => {
    const onUnauthorized = () => {
      setTokenState(null);
      setUser(null);
      setAuthStatus('unauthenticated');
      setSessionMessage('Your session has expired. Please sign in again.');
    };
    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, []);

  /**
   * Completes the Google OAuth flow. The backend has already verified the
   * user with Google and issued a JWT, redirecting the browser to
   * /oauth/callback?token=<jwt>. This stores that token through the same
   * centralized tokenStorage used everywhere else, then restores the user
   * via GET /auth/me — the same restoration path used on a normal reload.
   * Throws on failure so the callback page can show its own error state;
   * auth state is left cleared either way.
   */
  const completeOAuthLogin = useCallback(async (rawToken) => {
    persistToken(rawToken);
    setTokenState(rawToken);

    try {
      const me = await getCurrentUser();
      setUser(me);
      setAuthStatus('authenticated');
      setSessionMessage(null);
      return me;
    } catch (err) {
      clearToken();
      setTokenState(null);
      setUser(null);
      setAuthStatus('unauthenticated');
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    setUser(null);
    setAuthStatus('unauthenticated');
    setSessionMessage(null);
  }, []);

  const clearSessionMessage = useCallback(() => setSessionMessage(null), []);

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    authStatus,
    sessionMessage,
    clearSessionMessage,
    completeOAuthLogin,
    logout,
    restoreSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
