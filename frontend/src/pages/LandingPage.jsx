import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api/client';
import Spinner from '../components/common/Spinner';
import styles from './LandingPage.module.css';

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

// A minimal, ChatGPT-inspired public landing page.
// Google-only authentication — no email/password form anywhere.
export default function LandingPage() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // If already authenticated, go straight to the dashboard.
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [loading, isAuthenticated, navigate]);

  const handleContinueWithGoogle = () => {
    setIsRedirecting(true);
    // Full browser navigation — the backend itself redirects to Google.
    window.location.href = `${API_BASE_URL}/auth/google/login`;
  };

  if (loading) {
    return (
      <div className={styles.wrap}>
        <div className={styles.status}>
          <Spinner size={18} />
          <span>Loading…</span>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.inner}>
        <div className={styles.brandRow}>
          <div className={styles.brandMark} aria-hidden="true">
            <img src="/logo.png" alt="" />
          </div>
          <span className={styles.brandName}>Reel</span>
        </div>

        <h1 className={styles.headline}>Ask anything about a YouTube video.</h1>
        <p className={styles.subheadline}>Turn YouTube videos into an interactive conversation.</p>

        <button
          type="button"
          className={styles.googleButton}
          onClick={handleContinueWithGoogle}
          disabled={isRedirecting}
        >
          {isRedirecting ? <Spinner size={16} /> : <GoogleIcon />}
          {isRedirecting ? 'Redirecting…' : 'Continue with Google'}
        </button>

        <p className={styles.explainer}>
          Paste a YouTube video, let Reel process it, then ask questions and explore answers with
          timestamped sources.
        </p>

        <div className={styles.flow}>
          <div className={styles.flowStep}>
            <span className={styles.flowIcon}>▶</span>
            <span>YouTube video</span>
          </div>
          <span className={styles.flowArrow}>→</span>
          <div className={styles.flowStep}>
            <span className={styles.flowIcon}>⚙</span>
            <span>AI processing</span>
          </div>
          <span className={styles.flowArrow}>→</span>
          <div className={styles.flowStep}>
            <span className={styles.flowIcon}>?</span>
            <span>Ask questions</span>
          </div>
          <span className={styles.flowArrow}>→</span>
          <div className={styles.flowStep}>
            <span className={styles.flowIcon}>✓</span>
            <span>Grounded answers + timestamps</span>
          </div>
        </div>

        <Link to="/login" className={styles.loginLink}>
          Already have an account? Log in
        </Link>
      </div>
    </div>
  );
}