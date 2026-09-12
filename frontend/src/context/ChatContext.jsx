import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { askQuestion } from '../api/questions';
import { ApiError } from '../api/client';
import { useConversations } from './ConversationContext';

const ChatContext = createContext(null);

let messageIdCounter = 0;

/**
 * Heuristic for "no relevant information found" responses so we can show a
 * dedicated, friendly empty state instead of treating it as a normal answer
 * or an error. Backends sometimes signal this via empty sources, sometimes
 * via a null/empty answer — we check both without assuming a specific shape.
 */
function isNoInformationFound(response) {
  const answer = (response?.answer || '').trim().toLowerCase();
  if (!answer) return true;
  const negativePatterns = [
    "don't have enough information",
    'do not have enough information',
    "couldn't find",
    'could not find',
    'no relevant information',
    'not mentioned in the video',
    "doesn't appear to be covered",
  ];
  return negativePatterns.some((p) => answer.includes(p));
}

/**
 * Converts backend Message records ({ id, role, content, created_at }) into
 * the display shape used by QAThread/MessageBubble.
 *
 * Backend messages are stored as separate user/assistant rows. We pair each
 * user message with the following assistant message into a single display
 * entry. Sources are NOT persisted by the backend, so reloaded conversations
 * show answers without source chips (a backend limitation).
 */
export function convertBackendMessages(messages) {
  const result = [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role !== 'user') continue;
    const next = messages[i + 1];
    if (next && next.role === 'assistant') {
      result.push({
        id: msg.id,
        question: msg.content,
        status: 'done',
        answer: next.content,
        sources: [],
        notFound: false,
        errorMessage: null,
      });
      i++; // skip the paired assistant message
    } else {
      result.push({
        id: msg.id,
        question: msg.content,
        status: 'done',
        answer: null,
        sources: [],
        notFound: false,
        errorMessage: null,
      });
    }
  }
  return result;
}

export function ChatProvider({ children }) {
  const {
    activeConversationId,
    messages: persistedMessages,
    messagesStatus,
    conversationVideoMap,
    registerConversation,
  } = useConversations();

  // { [key]: Array<Message> }
  // key is either a videoId (no active conversation, or conversation whose
  // video is known) or `__conv_${conversationId}` (conversation whose video
  // is unknown, e.g. after a page refresh).
  const [threads, setThreads] = useState({});

  // Determine the thread key for the active conversation, if any.
  // Mirrors the logic in QAThread so appends always target the displayed thread.
  const activeThreadKey = useMemo(() => {
    if (!activeConversationId) return null;
    const videoId = conversationVideoMap[activeConversationId];
    return videoId || `__conv_${activeConversationId}`;
  }, [activeConversationId, conversationVideoMap]);

  // Sync persisted messages into the thread when the active conversation's
  // messages finish loading. This makes conversation history survive a
  // page refresh — the backend is the source of truth.
  useEffect(() => {
    if (!activeConversationId || messagesStatus !== 'ready') return;
    const videoId = conversationVideoMap[activeConversationId];
    const key = videoId || `__conv_${activeConversationId}`;
    const converted = convertBackendMessages(persistedMessages);
    setThreads((prev) => ({ ...prev, [key]: converted }));
  }, [activeConversationId, persistedMessages, messagesStatus, conversationVideoMap]);

  // When the active conversation is cleared (New Chat, video switch, delete),
  // drop any conversation-synced threads so stale history doesn't linger.
  useEffect(() => {
    if (activeConversationId) return;
    setThreads((prev) => {
      const next = {};
      for (const [key, value] of Object.entries(prev)) {
        if (!key.startsWith('__conv_')) {
          next[key] = value;
        }
      }
      return next;
    });
  }, [activeConversationId]);

  const appendMessage = useCallback(
    (videoId, message) => {
      const key = activeThreadKey || videoId;
      setThreads((prev) => ({
        ...prev,
        [key]: [...(prev[key] || []), message],
      }));
    },
    [activeThreadKey]
  );

  const patchMessage = useCallback(
    (videoId, messageId, patch) => {
      const key = activeThreadKey || videoId;
      setThreads((prev) => ({
        ...prev,
        [key]: (prev[key] || []).map((m) => (m.id === messageId ? { ...m, ...patch } : m)),
      }));
    },
    [activeThreadKey]
  );

  const askAboutVideo = useCallback(
    async (videoId, question) => {
      const messageId = ++messageIdCounter;
      appendMessage(videoId, {
        id: messageId,
        question,
        status: 'loading',
        answer: null,
        sources: [],
        notFound: false,
        errorMessage: null,
      });

      try {
        // Pass the active conversation id (or null for the first question).
        // The backend auto-creates the conversation and returns its id.
        const response = await askQuestion({
          videoId,
          question,
          conversationId: activeConversationId,
        });

        if (response?.conversation_id) {
          registerConversation(response.conversation_id, videoId);
        }

        const notFound = isNoInformationFound(response);
        patchMessage(videoId, messageId, {
          status: 'done',
          answer: response?.answer || '',
          sources: Array.isArray(response?.sources) ? response.sources : [],
          notFound,
        });
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Something went wrong answering that question.';
        patchMessage(videoId, messageId, { status: 'error', errorMessage: message });
      }
    },
    [appendMessage, patchMessage, activeConversationId, registerConversation]
  );

  const retryMessage = useCallback(
    async (videoId, messageId, question) => {
      patchMessage(videoId, messageId, { status: 'loading', errorMessage: null });
      try {
        const response = await askQuestion({
          videoId,
          question,
          conversationId: activeConversationId,
        });

        if (response?.conversation_id) {
          registerConversation(response.conversation_id, videoId);
        }

        const notFound = isNoInformationFound(response);
        patchMessage(videoId, messageId, {
          status: 'done',
          answer: response?.answer || '',
          sources: Array.isArray(response?.sources) ? response.sources : [],
          notFound,
        });
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Something went wrong answering that question.';
        patchMessage(videoId, messageId, { status: 'error', errorMessage: message });
      }
    },
    [patchMessage, activeConversationId, registerConversation]
  );

  const getThread = useCallback((key) => threads[key] || [], [threads]);

  const clearThread = useCallback((key) => {
    setThreads((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const value = { askAboutVideo, retryMessage, getThread, clearThread };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within a ChatProvider');
  return ctx;
}