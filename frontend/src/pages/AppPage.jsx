import React from 'react';
import Sidebar from '../components/Sidebar/Sidebar';
import MainPanel from '../components/MainPanel/MainPanel';
import { UIProvider } from '../context/UIContext';
import { VideoLibraryProvider } from '../context/VideoLibraryContext';
import { ConversationProvider } from '../context/ConversationContext';
import { ChatProvider } from '../context/ChatContext';
import styles from '../App.module.css';

/**
 * Authenticated workspace page mounted at /app.
 * Hosts the active video workspace, persistent conversation thread,
 * and collapsible video library.
 */
export default function AppPage() {
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
