import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { apiClient } from "../api/client";
import { ApiError } from "../api/client";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";

const ConversationContext = createContext(null);

const initialState = {
  conversations: [],
  conversationsStatus: "idle", // idle | loading | ready | error
  conversationsError: null,
  activeConversationId: null,
  // messages for the active conversation
  messages: [],
  messagesStatus: "idle", // idle | loading | ready | error
  // maps conversation_id -> video_id (populated as conversations are loaded/created)
  conversationVideoMap: {},
};

function reducer(state, action) {
  switch (action.type) {
    case "CONVERSATIONS_LOADING":
      return {
        ...state,
        conversationsStatus: "loading",
        conversationsError: null,
      };
    case "CONVERSATIONS_SUCCESS":
      return {
        ...state,
        conversationsStatus: "ready",
        conversations: action.conversations,
        conversationVideoMap: action.conversations.reduce(
          (acc, c) => {
            if (c.video_id) acc[c.id] = c.video_id;
            return acc;
          },
          { ...state.conversationVideoMap },
        ),
      };
    case "CONVERSATIONS_ERROR":
      return {
        ...state,
        conversationsStatus: "error",
        conversationsError: action.error,
      };
    case "MESSAGES_LOADING":
      return { ...state, messagesStatus: "loading", messages: [] };
    case "MESSAGES_SUCCESS":
      return { ...state, messagesStatus: "ready", messages: action.messages };
    case "MESSAGES_ERROR":
      return { ...state, messagesStatus: "error", messages: [] };
    case "SET_ACTIVE_CONVERSATION":
      return { ...state, activeConversationId: action.conversationId };
    case "CLEAR_ACTIVE_CONVERSATION":
      return {
        ...state,
        activeConversationId: null,
        messages: [],
        messagesStatus: "idle",
      };
    case "REGISTER_CONVERSATION": {
      const exists = state.conversations.some(
        (c) => c.id === action.conversationId,
      );
      const next = exists
        ? state.conversations
        : [
            {
              id: action.conversationId,
              title: "New conversation",
              video_id: action.videoId,
              created_at: new Date().toISOString(),
            },
            ...state.conversations,
          ];
      return {
        ...state,
        activeConversationId: action.conversationId,
        conversations: next,
        conversationVideoMap: {
          ...state.conversationVideoMap,
          [action.conversationId]: action.videoId,
        },
      };
    }
    case "RENAME_CONVERSATION":
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.conversationId ? { ...c, title: action.title } : c,
        ),
      };
    case "DELETE_CONVERSATION": {
      const remaining = state.conversations.filter(
        (c) => c.id !== action.conversationId,
      );
      const map = { ...state.conversationVideoMap };
      delete map[action.conversationId];
      return {
        ...state,
        conversations: remaining,
        conversationVideoMap: map,
        activeConversationId:
          state.activeConversationId === action.conversationId
            ? null
            : state.activeConversationId,
        messages:
          state.activeConversationId === action.conversationId
            ? []
            : state.messages,
        messagesStatus:
          state.activeConversationId === action.conversationId
            ? "idle"
            : state.messagesStatus,
      };
    }
    case "RESET":
      return { ...initialState };
    default:
      return state;
  }
}

export function ConversationProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { isAuthenticated, loading: authLoading } = useAuth();
  const toast = useToast();
  const loadingMessagesForRef = useRef(null);

  const loadConversations = useCallback(async () => {
    dispatch({ type: "CONVERSATIONS_LOADING" });
    try {
      const data = await apiClient.get("/conversations");
      const conversations = Array.isArray(data)
        ? data
        : data?.conversations || [];
      dispatch({ type: "CONVERSATIONS_SUCCESS", conversations });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Could not load your conversations.";
      dispatch({ type: "CONVERSATIONS_ERROR", error: message });
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated) {
      loadConversations();
    } else {
      dispatch({ type: "RESET" });
    }
  }, [isAuthenticated, authLoading, loadConversations]);

  // Load messages when the active conversation changes.
  useEffect(() => {
    const convId = state.activeConversationId;
    if (!convId) return;
    if (loadingMessagesForRef.current === convId) return;
    loadingMessagesForRef.current = convId;

    dispatch({ type: "MESSAGES_LOADING" });
    apiClient
      .get(`/conversations/${convId}/messages`)
      .then((data) => {
        const messages = Array.isArray(data) ? data : data?.messages || [];
        dispatch({ type: "MESSAGES_SUCCESS", messages });
      })
      .catch(() => {
        dispatch({ type: "MESSAGES_ERROR" });
      })
      .finally(() => {
        if (loadingMessagesForRef.current === convId) {
          loadingMessagesForRef.current = null;
        }
      });
  }, [state.activeConversationId]);

  const selectConversation = useCallback((conversationId) => {
    dispatch({ type: "SET_ACTIVE_CONVERSATION", conversationId });
  }, []);

  const clearActiveConversation = useCallback(() => {
    dispatch({ type: "CLEAR_ACTIVE_CONVERSATION" });
  }, []);

  /**
   * Called by ChatContext once the backend confirms a new conversation was
   * auto-created so we can reflect it in the sidebar immediately.
   */
  const registerConversation = useCallback((conversationId, videoId) => {
    dispatch({ type: "REGISTER_CONVERSATION", conversationId, videoId });
    // Silently refresh to pick up any title the backend assigned.
    apiClient
      .get("/conversations")
      .then((data) => {
        const conversations = Array.isArray(data)
          ? data
          : data?.conversations || [];
        dispatch({ type: "CONVERSATIONS_SUCCESS", conversations });
      })
      .catch(() => {});
  }, []);

  const renameConversation = useCallback(
    async (conversationId, title) => {
      dispatch({ type: "RENAME_CONVERSATION", conversationId, title });
      try {
        await apiClient.patch(`/conversations/${conversationId}`, { title });
      } catch (err) {
        toast.error("Could not rename that conversation.");
      }
    },
    [toast],
  );

  const deleteConversation = useCallback(
    async (conversationId) => {
      dispatch({ type: "DELETE_CONVERSATION", conversationId });
      try {
        await apiClient.delete(`/conversations/${conversationId}`);
      } catch (err) {
        toast.error("Could not delete that conversation.");
      }
    },
    [toast],
  );

  const value = {
    conversations: state.conversations,
    conversationsStatus: state.conversationsStatus,
    conversationsError: state.conversationsError,
    activeConversationId: state.activeConversationId,
    messages: state.messages,
    messagesStatus: state.messagesStatus,
    conversationVideoMap: state.conversationVideoMap,
    loadConversations,
    selectConversation,
    clearActiveConversation,
    registerConversation,
    renameConversation,
    deleteConversation,
  };

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversations() {
  const ctx = useContext(ConversationContext);
  if (!ctx)
    throw new Error(
      "useConversations must be used within a ConversationProvider",
    );
  return ctx;
}
