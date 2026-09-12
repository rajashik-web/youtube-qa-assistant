import React, { createContext, useCallback, useContext, useEffect, useReducer, useRef } from 'react';
import { deleteVideo as apiDeleteVideo, getVideoStatus, getVideos, processVideo } from '../api/videos';
import { ApiError } from '../api/client';
import { VIDEO_STATUS, POLL_INTERVAL_MS, MAX_POLL_ATTEMPTS } from '../utils/constants';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';

const VideoLibraryContext = createContext(null);

const initialState = {
  videos: [],
  libraryStatus: 'idle', // idle | loading | ready | error
  libraryError: null,
  selectedVideoId: null,
};

function upsertVideo(videos, incoming) {
  const index = videos.findIndex((v) => v.video_id === incoming.video_id);
  if (index === -1) return [incoming, ...videos];
  const next = videos.slice();
  next[index] = { ...next[index], ...incoming };
  return next;
}

function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, libraryStatus: 'loading', libraryError: null };
    case 'FETCH_SUCCESS': {
      const selectedStillValid = action.videos.some((v) => v.video_id === state.selectedVideoId);
      return {
        ...state,
        libraryStatus: 'ready',
        videos: action.videos,
        selectedVideoId: selectedStillValid
          ? state.selectedVideoId
          : action.videos.length > 0
          ? action.videos[0].video_id
          : null,
      };
    }
    case 'FETCH_ERROR':
      return { ...state, libraryStatus: 'error', libraryError: action.error };
    case 'UPSERT_VIDEO':
      return { ...state, videos: upsertVideo(state.videos, action.video) };
    case 'REMOVE_VIDEO': {
      const removedIndex = state.videos.findIndex((v) => v.video_id === action.videoId);
      const videos = state.videos.filter((v) => v.video_id !== action.videoId);
      let selectedVideoId = state.selectedVideoId;
      if (state.selectedVideoId === action.videoId) {
        // Deleting the active video: fall back to a neighboring video if any
        // remain, so the user isn't dropped into an empty state unnecessarily.
        if (videos.length > 0) {
          const fallbackIndex = Math.min(removedIndex, videos.length - 1);
          selectedVideoId = videos[fallbackIndex].video_id;
        } else {
          selectedVideoId = null;
        }
      }
      return { ...state, videos, selectedVideoId };
    }
    case 'SELECT_VIDEO':
      return { ...state, selectedVideoId: action.videoId };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

export function VideoLibraryProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const toast = useToast();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const pollRegistry = useRef(new Map()); // video_id -> { intervalId, attempts }

  const stopPolling = useCallback((videoId) => {
    const entry = pollRegistry.current.get(videoId);
    if (entry) {
      clearInterval(entry.intervalId);
      pollRegistry.current.delete(videoId);
    }
  }, []);

  const stopAllPolling = useCallback(() => {
    pollRegistry.current.forEach((entry) => clearInterval(entry.intervalId));
    pollRegistry.current.clear();
  }, []);

  const startPolling = useCallback(
    (videoId) => {
      if (pollRegistry.current.has(videoId)) return;

      const intervalId = setInterval(async () => {
        const entry = pollRegistry.current.get(videoId);
        if (!entry) return;
        entry.attempts += 1;

        try {
          const updated = await getVideoStatus(videoId);
          dispatch({ type: 'UPSERT_VIDEO', video: updated });

          if (updated.status !== VIDEO_STATUS.PROCESSING) {
            stopPolling(videoId);
            if (updated.status === VIDEO_STATUS.FAILED) {
              toast.error(`"${updated.title || 'Video'}" failed to process. You can try reprocessing it.`);
            } else {
              toast.success(`"${updated.title || 'Video'}" is ready to answer questions.`);
            }
          } else if (entry.attempts >= MAX_POLL_ATTEMPTS) {
            stopPolling(videoId);
            toast.info('This video is taking longer than usual. Check back shortly — it may still finish.');
          }
        } catch {
          // Transient network errors while polling shouldn't spam the user;
          // we just try again on the next tick until MAX_POLL_ATTEMPTS.
          if (entry.attempts >= MAX_POLL_ATTEMPTS) {
            stopPolling(videoId);
          }
        }
      }, POLL_INTERVAL_MS);

      pollRegistry.current.set(videoId, { intervalId, attempts: 0 });
    },
    [stopPolling, toast]
  );

  // Watch the library for anything in "processing" state and ensure it's being polled.
  useEffect(() => {
    state.videos.forEach((v) => {
      if (v.status === VIDEO_STATUS.PROCESSING) {
        startPolling(v.video_id);
      } else {
        stopPolling(v.video_id);
      }
    });
  }, [state.videos, startPolling, stopPolling]);

  // Clean up all intervals on unmount.
  useEffect(() => {
    const registry = pollRegistry.current;
    return () => {
      registry.forEach((entry) => clearInterval(entry.intervalId));
      registry.clear();
    };
  }, []);

  const fetchVideos = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const response = await getVideos();
      const videos = Array.isArray(response) ? response : response?.videos || [];
      dispatch({ type: 'FETCH_SUCCESS', videos });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not load your video library.';
      dispatch({ type: 'FETCH_ERROR', error: message });
    }
  }, []);

  useEffect(() => {
    // Wait until auth initialization has resolved (avoids firing GET
    // /videos before we know whether there's a valid token at all).
    if (authLoading) return;

    if (isAuthenticated) {
      fetchVideos();
    } else {
      // Logged out (or never logged in): stop any in-flight status polling
      // and drop whatever video state we were holding — none of it is
      // valid for a different (or no) user.
      stopAllPolling();
      dispatch({ type: 'RESET' });
    }
  }, [isAuthenticated, authLoading, fetchVideos, stopAllPolling]);

  const addVideo = useCallback(
    async (url, { forceReprocess = false } = {}) => {
      const result = await processVideo({ url, forceReprocess });
      dispatch({ type: 'UPSERT_VIDEO', video: result });
      dispatch({ type: 'SELECT_VIDEO', videoId: result.video_id });
      return result;
    },
    []
  );

  const reprocessVideo = useCallback(
    async (videoId, url) => {
      const result = await processVideo({ url, forceReprocess: true });
      dispatch({ type: 'UPSERT_VIDEO', video: { ...result, video_id: videoId } });
      return result;
    },
    []
  );

  const removeVideo = useCallback(async (videoId) => {
    await apiDeleteVideo(videoId);
    stopPolling(videoId);
    dispatch({ type: 'REMOVE_VIDEO', videoId });
  }, [stopPolling]);

  const selectVideo = useCallback((videoId) => {
    dispatch({ type: 'SELECT_VIDEO', videoId });
  }, []);

  const selectedVideo = state.videos.find((v) => v.video_id === state.selectedVideoId) || null;

  const value = {
    videos: state.videos,
    libraryStatus: state.libraryStatus,
    libraryError: state.libraryError,
    selectedVideo,
    selectedVideoId: state.selectedVideoId,
    fetchVideos,
    addVideo,
    reprocessVideo,
    removeVideo,
    selectVideo,
  };

  return <VideoLibraryContext.Provider value={value}>{children}</VideoLibraryContext.Provider>;
}

export function useVideoLibrary() {
  const ctx = useContext(VideoLibraryContext);
  if (!ctx) throw new Error('useVideoLibrary must be used within a VideoLibraryProvider');
  return ctx;
}
