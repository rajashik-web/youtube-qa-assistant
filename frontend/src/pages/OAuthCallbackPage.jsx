import React, { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { Play, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/common/Spinner';
import styles from './AuthPages.module.css';

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const queryError = searchParams.get('error');
  const { completeOAuthLogin } = useAuth();

  const [status, setStatus] = useState(token ? 'processing' : 'error');
  const [errorMessage, setErrorMessage] = useState(
    queryError || (token ? null : 'Authentication token missing from callback parameters.')
  );

  const hasExecutedRef = useRef(false);

  useEffect(() => {
    if (!token || hasExecutedRef.current) return;
    hasExecutedRef.current = true;

    completeOAuthLogin(token)
      .then(() => {
        setStatus('success');
      })
      .catch((err) => {
        const message =
          err?.message || 'Authentication failed: unable to verify session credentials.';
        setErrorMessage(message);
        setStatus('error');
      });
  }, [token, completeOAuthLogin]);

  // After successful validation: redirect to /app
  if (status === 'success') {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <Link to="/" className={styles.brandLink}>
          <div className={styles.brandIcon} aria-hidden="true">
            <Play size={16} fill="currentColor" />
          </div>
          <span className={styles.brandName}>
            Reel<span className={styles.brandAccent}>.</span>
          </span>
        </Link>

        {status === 'processing' && (
          <div className={styles.callbackStatus}>
            <Spinner size={28} />
            <h2 className={styles.title} style={{ fontSize: '18px', margin: '4px 0' }}>
              Authenticating with Google…
            </h2>
            <p className={styles.body} style={{ marginBottom: 0 }}>
              Verifying your profile and restoring your video library.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'var(--danger-100)',
                color: 'var(--danger-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <AlertCircle size={24} />
            </div>

            <h2 className={styles.title}>Sign-in Failed</h2>
            <div className={styles.errorNotice}>{errorMessage}</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 16 }}>
              <Link to="/login" className={styles.googleButton} style={{ textDecoration: 'none' }}>
                <RefreshCw size={16} />
                <span>Retry with Google</span>
              </Link>

              <Link to="/" className={styles.backHomeLink} style={{ justifyContent: 'center' }}>
                <ArrowLeft size={14} /> Back to homepage
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
