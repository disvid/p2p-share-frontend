import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { nanoid } from 'nanoid';
import DropZone from '../components/DropZone.jsx';
import { useTransferContext } from '../context/TransferContext.jsx';
import { generateEncryptionKey } from '../utils/crypto.js';
import { formatBytes } from '../utils/format.js';

export default function Home() {
  const navigate = useNavigate();
  const { setSelectedFile, setRoomId, setEncryptionKey } = useTransferContext();
  const [file, setFile] = useState(null);
  const [copied, setCopied] = useState(false);
  const [generatedRoom, setGeneratedRoom] = useState('');
  const [keyB64, setKeyB64] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = useCallback((f) => {
    setFile(f);
    setGeneratedRoom('');
    setKeyB64('');
    setCopied(false);
    setError('');
  }, []);

  const handleCreateRoom = async () => {
    if (!file) return;
    setError('');
    setCreating(true);
    try {
      const id = nanoid(10);
      const { key, base64 } = await generateEncryptionKey();
      setGeneratedRoom(id);
      setKeyB64(base64);
      setSelectedFile(file);
      setRoomId(id);
      setEncryptionKey(key);
    } catch (err) {
      setError(`Could not create room: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  const roomLink = generatedRoom
    ? `${window.location.origin}/room/${generatedRoom}#key=${keyB64}`
    : '';

  const handleCopyLink = async () => {
    if (!roomLink) return;
    try {
      await navigator.clipboard.writeText(roomLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = roomLink;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGoToRoom = () => {
    if (generatedRoom) navigate(`/room/${generatedRoom}#key=${keyB64}`);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      {/* Nav */}
      <header className="px-6 py-5 border-b border-zinc-200">
        <div className="mx-auto max-w-2xl flex items-center justify-between">
          <span className="text-base font-semibold tracking-tight text-zinc-900">
            Drop
          </span>
          <span className="text-xs text-zinc-400">
            Peer-to-peer · Encrypted
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center px-6 py-16">
        <div className="w-full max-w-md space-y-8">

          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Send a file, browser to browser
            </h1>
            <p className="text-sm text-zinc-500">
              No accounts. No uploads. The file goes directly to the other person.
            </p>
          </div>

          <DropZone onFileSelect={handleFileSelect} selectedFile={file} />

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          {file && !generatedRoom && (
            <button
              onClick={handleCreateRoom}
              disabled={creating}
              className="w-full rounded-lg bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-950 px-4 py-3 text-sm font-medium text-white transition-colors disabled:opacity-50"
            >
              {creating ? 'Generating link…' : 'Create link'}
            </button>
          )}

          {generatedRoom && (
            <div className="space-y-3 animate-fade-in">
              <div className="rounded-lg border border-zinc-200 bg-white p-4 space-y-3">
                <div>
                  <p className="text-xs text-zinc-400 mb-1">Share this link</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 mono text-xs text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-md px-3 py-2 truncate">
                      {roomLink}
                    </code>
                    <button
                      onClick={handleCopyLink}
                      className="shrink-0 text-xs font-medium px-3 py-2 rounded-md border border-zinc-200 hover:bg-zinc-50 transition-colors text-zinc-700"
                    >
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 border-t border-zinc-100">
                  <span className="truncate mr-2">{file.name}</span>
                  <span className="shrink-0">{formatBytes(file.size)}</span>
                </div>
              </div>

              <button
                onClick={handleGoToRoom}
                className="w-full rounded-lg bg-zinc-900 hover:bg-zinc-800 px-4 py-3 text-sm font-medium text-white transition-colors"
              >
                Open transfer room
              </button>

              <p className="text-xs text-center text-zinc-400">
                Waiting for the recipient to open the link starts the transfer automatically.
              </p>
            </div>
          )}

        </div>
      </main>

      <footer className="px-6 py-6 text-center">
        <p className="text-xs text-zinc-400">
          Files are end-to-end encrypted and never stored on a server.
        </p>
      </footer>
    </div>
  );
}