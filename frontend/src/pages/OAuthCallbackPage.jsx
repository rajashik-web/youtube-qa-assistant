import React, { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/common/Spinner';
import styles from './AuthPages.module.css';

// The backend redirects here as /oauth/callback?token=<jwt> once Google
// auth succeeds server-side (routers/auth.py: GET /auth/google/callback).
// This page's only job is to hand that token to AuthContext through the
// existing tokenStorage/apiClient architecture — no separate auth system.
export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { completeOAuthLogin } = useAuth();

  // 'processing' | 'success' | 'error'
  const [status, setStatus] = useState(token ? 'processing' : 'error');
  const [errorMessage, setErrorMessage] = useState(
    token ? null : 'This sign-in link is missing its token.'
  );

  // React.StrictMode double-invokes effects in dev; without this guard the
  // token would be exchanged for a session twice in quick succession.
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (!token || hasRunRef.current) return;
    hasRunRef.current = true;

    completeOAuthLogin(token)
      .then(() => setStatus('success'))
      .catch(() => {
        setErrorMessage('This sign-in link is invalid or has expired.');
        setStatus('error');
      });
  }, [token, completeOAuthLogin]);

  // Once authenticated, replace this URL (token and all) with "/" — it
  // never lingers in the address bar or in back-history.
  if (status === 'success') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.brandMark}>
          <img src="/logo.png" alt="" />
        </div>
        <h1 className={styles.title}>{status === 'error' ? 'Sign-in failed' : 'Signing you in…'}</h1>

        {status === 'processing' && (
          <div className={styles.status}>
            <Spinner size={18} />
            <span>Confirming your Google account…</span>
          </div>
        )}

        {status === 'error' && <p className={styles.errorNotice}>{errorMessage}</p>}

        {status === 'error' && (
          <Link to="/login" className={styles.link}>
            Back to login
          </Link>
        )}
      </div>
    </div>
  );
}
