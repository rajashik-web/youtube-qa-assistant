import React from 'react';
import Sidebar from './components/Sidebar/Sidebar';
import MainPanel from './components/MainPanel/MainPanel';
import { ToastProvider } from './context/ToastContext';
import { VideoLibraryProvider } from './context/VideoLibraryContext';
import { ChatProvider } from './context/ChatContext';
import { UIProvider } from './context/UIContext';
import styles from './App.module.css';

export default function App() {
  return (
    <ToastProvider>
      <UIProvider>
        <VideoLibraryProvider>
          <ChatProvider>
            <div className={styles.app}>
              <Sidebar />
              <MainPanel />
            </div>
          </ChatProvider>
        </VideoLibraryProvider>
      </UIProvider>
    </ToastProvider>
  );
}
