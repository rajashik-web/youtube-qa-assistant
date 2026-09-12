import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { getCurrentUser } from "../api/auth";
import { setToken, clearToken, getToken } from "../utils/tokenStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionMessage, setSessionMessage] = useState(null);
  const initRef = useRef(false);

  const isAuthenticated = !!user;

  // Attempt to restore session from an existing token on mount.
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    getCurrentUser()
      .then((u) => setUser(u))
      .catch(() => {
        clearToken();
      })
      .finally(() => setLoading(false));
  }, []);

  // Listen for 401 events emitted by api/client.js so we can clear state
  // without coupling the API layer to the React context.
  useEffect(() => {
    const handler = () => {
      setUser(null);
      setSessionMessage("Your session expired. Please sign in again.");
    };
    window.addEventListener("auth:unauthorized", handler);
    return () => window.removeEventListener("auth:unauthorized", handler);
  }, []);

  /**
   * Called by OAuthCallbackPage after the backend redirects back with a token.
   * Stores the token, then fetches the current user to populate auth state.
   */
  const completeOAuthLogin = useCallback(async (token) => {
    setToken(token);
    const u = await getCurrentUser();
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setSessionMessage("You have been signed out.");
  }, []);

  const clearSessionMessage = useCallback(() => setSessionMessage(null), []);

  const value = {
    user,
    isAuthenticated,
    loading,
    sessionMessage,
    clearSessionMessage,
    completeOAuthLogin,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
