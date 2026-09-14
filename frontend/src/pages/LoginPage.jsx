import React, { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { Play, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api/client';
import Spinner from '../components/common/Spinner';
import styles from './AuthPages.module.css';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.9v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.16.28-1.7V4.97H.9A9 9 0 0 0 0 9c0 1.45.35 2.83.9 4.03l3.05-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .9 4.97l3.05 2.33C4.66 5.17 6.65 3.58 9 3.58z"
      />
    </svg>
  );
}

export default function LoginPage({ initialMode = 'login' }) {
  const { isAuthenticated, loading, sessionMessage, clearSessionMessage, login, register } = useAuth();
  const [searchParams] = useSearchParams();
  const oauthError = searchParams.get('error');
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => () => clearSessionMessage(), [clearSessionMessage]);

  if (loading) {
    return (
      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.callbackStatus}>
            <Spinner size={24} />
            <span>Checking session…</span>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated user: redirect to /app
  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  const handleContinueWithGoogle = () => {
    setIsRedirecting(true);
    window.location.href = `${API_BASE_URL}/auth/google/login`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setFormError(null);
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (mode === 'register') {
        await register({ email: cleanEmail, password, username: username.trim() || undefined });
      } else {
        await login({ email: cleanEmail, password });
      }
    } catch (err) {
      setFormError(err?.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

        <h1 className={styles.title}>
          {mode === 'register' ? 'Create an account' : 'Welcome to Reel'}
        </h1>
        <p className={styles.body}>
          {mode === 'register'
            ? 'Sign up to start organizing and asking questions about YouTube videos.'
            : 'Ask questions about any YouTube video.'}
        </p>

        {sessionMessage && <p className={styles.notice}>{sessionMessage}</p>}
        {oauthError && <p className={styles.errorNotice}>{oauthError}</p>}
        {formError && <p className={styles.errorNotice}>{formError}</p>}

        <button
          type="button"
          className={styles.googleButton}
          onClick={handleContinueWithGoogle}
          disabled={isRedirecting || isSubmitting}
          aria-label="Continue with Google"
        >
          {isRedirecting ? (
            <>
              <Spinner size={16} />
              <span>Redirecting to Google…</span>
            </>
          ) : (
            <>
              <GoogleIcon />
              <span>Continue with Google</span>
            </>
          )}
        </button>

        <div className={styles.divider}>or with email</div>

        <form className={styles.authForm} onSubmit={handleSubmit} noValidate>
          {mode === 'register' && (
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="auth-username">
                Full Name (optional)
              </label>
              <input
                id="auth-username"
                type="text"
                className={styles.input}
                placeholder="Ashik Raj"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSubmitting || isRedirecting}
              />
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="auth-email">
              Email address
            </label>
            <input
              id="auth-email"
              type="email"
              className={styles.input}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (formError) setFormError(null);
              }}
              disabled={isSubmitting || isRedirecting}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="auth-password">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              className={styles.input}
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (formError) setFormError(null);
              }}
              disabled={isSubmitting || isRedirecting}
              required
            />
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting || isRedirecting}
          >
            {isSubmitting ? (
              <>
                <Spinner size={16} />
                <span>{mode === 'register' ? 'Creating account…' : 'Signing in…'}</span>
              </>
            ) : (
              <span>{mode === 'register' ? 'Create account' : 'Sign in'}</span>
            )}
          </button>
        </form>

        <div className={styles.modeToggle}>
          {mode === 'register' ? (
            <span>
              Already have an account?
              <button
                type="button"
                className={styles.toggleBtn}
                onClick={() => {
                  setMode('login');
                  setFormError(null);
                }}
              >
                Sign in
              </button>
            </span>
          ) : (
            <span>
              Don&apos;t have an account?
              <button
                type="button"
                className={styles.toggleBtn}
                onClick={() => {
                  setMode('register');
                  setFormError(null);
                }}
              >
                Create one
              </button>
            </span>
          )}
        </div>

        <div className={styles.authInfoNotice}>
          Single-sign on via Google or email. Reel accesses only your verified basic profile to identify your video library.
        </div>
      </div>

      <Link to="/" className={styles.backHomeLink}>
        <ArrowLeft size={14} /> Back to homepage
      </Link>
    </div>
  );
}
