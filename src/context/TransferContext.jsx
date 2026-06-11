import React, { createContext, useContext, useState, useEffect } from 'react';

const TransferContext = createContext(null);
const SESSION_KEY = 'p2p_sender_meta';

export function TransferProvider({ children }) {
  const [selectedFile, setSelectedFileState] = useState(null);
  const [roomId, setRoomIdState] = useState(null);
  const [encryptionKey, setEncryptionKey] = useState(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      try {
        const meta = JSON.parse(raw);
        if (meta.roomId) setRoomIdState(meta.roomId);
      } catch (_) {}
    }
  }, []);

  const setSelectedFile = (file) => {
    setSelectedFileState(file);
    if (file) {
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ name: file.name, size: file.size, type: file.type })
      );
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  };

  const setRoomId = (id) => {
    setRoomIdState(id);
    const raw = sessionStorage.getItem(SESSION_KEY);
    const existing = raw ? JSON.parse(raw) : {};
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...existing, roomId: id }));
  };

  const clearTransfer = () => {
    setSelectedFileState(null);
    setRoomIdState(null);
    setEncryptionKey(null);
    sessionStorage.removeItem(SESSION_KEY);
  };

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
        setRoomId,
        encryptionKey,
        setEncryptionKey,
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