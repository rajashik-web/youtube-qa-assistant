import React, { createContext, useCallback, useContext, useState } from "react";

const UIContext = createContext(null);

export function UIProvider({ children }) {
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const openComposer = useCallback(() => setIsComposerOpen(true), []);
  const closeComposer = useCallback(() => setIsComposerOpen(false), []);
  const toggleComposer = useCallback(() => setIsComposerOpen((v) => !v), []);

  const openMobileSidebar = useCallback(() => setIsMobileSidebarOpen(true), []);
  const closeMobileSidebar = useCallback(
    () => setIsMobileSidebarOpen(false),
    [],
  );

  const value = {
    isComposerOpen,
    openComposer,
    closeComposer,
    toggleComposer,
    isMobileSidebarOpen,
    openMobileSidebar,
    closeMobileSidebar,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within a UIProvider");
  return ctx;
}
