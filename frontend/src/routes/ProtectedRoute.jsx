import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/common/Spinner';
import styles from './ProtectedRoute.module.css';

/**
 * Gates the authenticated dashboard ("/").
 *  - While auth is still initializing (restoreSession() hasn't resolved),
 *    show a loading state rather than flashing the login redirect.
 *  - Once resolved: authenticated → render children; otherwise → redirect
 *    to /login.
 */
export default function ProtectedRoute({ children }) {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className={styles.wrap}>
        <Spinner size={22} />
        <p className={styles.label}>Loading your session…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
