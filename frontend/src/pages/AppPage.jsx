import React from 'react';
import { VideoLibraryProvider } from '../context/VideoLibraryContext';
import { ConversationProvider } from '../context/ConversationContext';
import { ChatProvider } from '../context/ChatContext';
import { UIProvider } from '../context/UIContext';
import Sidebar from '../components/Sidebar/Sidebar';
import MainPanel from '../components/MainPanel/MainPanel';
import styles from '../App.module.css';

export default function AppPage() {
  return (
    <VideoLibraryProvider>
      <ConversationProvider>
        <ChatProvider>
          <UIProvider>
            <div className={styles.app}>
              <Sidebar />
              <MainPanel />
            </div>
          </UIProvider>
        </ChatProvider>
      </ConversationProvider>
    </VideoLibraryProvider>
  );
}
