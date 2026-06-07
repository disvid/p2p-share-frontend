/**
 * TransferContext.jsx
 *
 * Stores the selected File object in React context AND keeps file metadata
 * (name, size, type) in sessionStorage so the Room page can detect it is
 * the sender even after an in-tab navigation.
 *
 * NOTE: File objects cannot cross tabs or survive a hard reload.
 * That is intentional — only the tab that selected the file is the sender.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

const TransferContext = createContext(null);

const SESSION_KEY = 'p2p_sender_meta';

export function TransferProvider({ children }) {
  const [selectedFile, setSelectedFileState] = useState(null);
  const [roomId, setRoomId] = useState(null);

  // On mount, try to restore roomId from sessionStorage
  // (file itself cannot be restored — only metadata for display)
  useEffect(() => {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      try {
        const meta = JSON.parse(raw);
        if (meta.roomId) setRoomId(meta.roomId);
      } catch (_) {}
    }
  }, []);

  const setSelectedFile = (file) => {
    setSelectedFileState(file);
    if (file) {
      // Persist metadata so Room page can read it after navigate()
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ name: file.name, size: file.size, type: file.type })
      );
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  };

  const setSenderRoom = (id) => {
    setRoomId(id);
    // Merge roomId into existing session meta
    const raw = sessionStorage.getItem(SESSION_KEY);
    const existing = raw ? JSON.parse(raw) : {};
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...existing, roomId: id }));
  };

  const clearTransfer = () => {
    setSelectedFileState(null);
    setRoomId(null);
    sessionStorage.removeItem(SESSION_KEY);
  };

  /**
   * Read cached sender metadata (name/size/type) from sessionStorage.
   * Used by Room page when file object is not in context
   * (e.g. navigated via link but same tab).
   */
  const getSenderMeta = () => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  };

  return (
    <TransferContext.Provider
      value={{
        selectedFile,
        setSelectedFile,
        roomId,
        setRoomId: setSenderRoom,
        clearTransfer,
        getSenderMeta,
      }}
    >
      {children}
    </TransferContext.Provider>
  );
}

export function useTransferContext() {
  const ctx = useContext(TransferContext);
  if (!ctx) throw new Error('useTransferContext must be used within TransferProvider');
  return ctx;
}