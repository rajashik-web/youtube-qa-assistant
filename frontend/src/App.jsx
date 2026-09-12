import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import MainPanel from './components/MainPanel/MainPanel';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { VideoLibraryProvider } from './context/VideoLibraryContext';
import { ConversationProvider } from './context/ConversationContext';
import { ChatProvider } from './context/ChatContext';
import { UIProvider } from './context/UIContext';
import ProtectedRoute from './routes/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import styles from './App.module.css';

// The dashboard, scoped to the protected "/" route. Its providers are only
// needed once a user is actually authenticated and viewing it.
function Dashboard() {
  return (
    <UIProvider>
      <VideoLibraryProvider>
        <ConversationProvider>
          <ChatProvider>
            <div className={styles.app}>
              <Sidebar />
              <MainPanel />
            </div>
          </ChatProvider>
        </ConversationProvider>
      </VideoLibraryProvider>
    </UIProvider>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}