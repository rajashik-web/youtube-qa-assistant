import React, { createContext, useCallback, useContext, useState } from 'react';
import { askQuestion } from '../api/questions';
import { ApiError } from '../api/client';

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

export function ChatProvider({ children }) {
  // { [videoId]: Array<Message> }
  const [threads, setThreads] = useState({});

  const appendMessage = useCallback((videoId, message) => {
    setThreads((prev) => ({
      ...prev,
      [videoId]: [...(prev[videoId] || []), message],
    }));
  }, []);

  const patchMessage = useCallback((videoId, messageId, patch) => {
    setThreads((prev) => ({
      ...prev,
      [videoId]: (prev[videoId] || []).map((m) => (m.id === messageId ? { ...m, ...patch } : m)),
    }));
  }, []);

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
        const response = await askQuestion({ videoId, question });
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
    [appendMessage, patchMessage]
  );

  const retryMessage = useCallback(
    async (videoId, messageId, question) => {
      patchMessage(videoId, messageId, { status: 'loading', errorMessage: null });
      try {
        const response = await askQuestion({ videoId, question });
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
    [patchMessage]
  );

  const getThread = useCallback((videoId) => threads[videoId] || [], [threads]);

  const value = { askAboutVideo, retryMessage, getThread };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within a ChatProvider');
  return ctx;
}
