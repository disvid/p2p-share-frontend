/**
 * Home.jsx
 * Landing page — select a file, generate a room, share the link.
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { nanoid } from 'nanoid';
import DropZone from '../components/DropZone.jsx';
import FileInfo from '../components/FileInfo.jsx';
import { useTransferContext } from '../context/TransferContext.jsx';

export default function Home() {
  const navigate = useNavigate();
  const { setSelectedFile, setRoomId } = useTransferContext();
  const [file, setFile] = useState(null);
  const [copied, setCopied] = useState(false);
  const [generatedRoom, setGeneratedRoom] = useState('');

  const handleFileSelect = useCallback((f) => {
    setFile(f);
    // Reset any previously generated room when a new file is chosen.
    setGeneratedRoom('');
    setCopied(false);
  }, []);

  const handleCreateRoom = () => {
    if (!file) return;
    const id = nanoid(10);
    setGeneratedRoom(id);
    setSelectedFile(file);
    setRoomId(id);
  };

  const roomLink = generatedRoom
    ? `${window.location.origin}/room/${generatedRoom}`
    : '';

  const handleCopyLink = async () => {
    if (!roomLink) return;
    try {
      await navigator.clipboard.writeText(roomLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = roomLink;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleGoToRoom = () => {
    if (generatedRoom) {
      navigate(`/room/${generatedRoom}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800/60 px-6 py-4">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📡</span>
            <span className="text-lg font-bold text-white">P2P Web Share</span>
          </div>
          <span className="rounded-full bg-brand-900/50 border border-brand-700/40 px-3 py-1 text-xs text-brand-300">
            No server storage · Direct transfer
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-4 py-10">
        <div className="mx-auto max-w-lg space-y-8 animate-slide-up">
          {/* Hero */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-extrabold text-white leading-tight">
              Share files directly,{' '}
              <span className="text-brand-400">browser to browser</span>
            </h1>
            <p className="text-gray-400 text-sm max-w-sm mx-auto">
              No uploads. No cloud. Just WebRTC — your file goes directly to the recipient.
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { n: '1', label: 'Drop your file' },
              { n: '2', label: 'Share the link' },
              { n: '3', label: 'Transfer starts' },
            ].map(({ n, label }) => (
              <div
                key={n}
                className="flex flex-col items-center gap-1.5 rounded-xl bg-gray-800/40 border border-gray-700/40 p-3 text-center"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                  {n}
                </span>
                <span className="text-xs text-gray-400">{label}</span>
              </div>
            ))}
          </div>

          {/* Drop zone card */}
          <div className="rounded-2xl bg-gray-900/60 border border-gray-700/50 p-6 space-y-4 shadow-xl">
            <DropZone onFileSelect={handleFileSelect} selectedFile={file} />

            {file && !generatedRoom && (
              <button
                onClick={handleCreateRoom}
                className="w-full rounded-xl bg-brand-600 hover:bg-brand-500 active:scale-95 px-4 py-3 text-sm font-semibold text-white transition-all duration-150 shadow-lg shadow-brand-900/30"
              >
                🔗 Create Room & Generate Link
              </button>
            )}

            {/* Generated room link */}
            {generatedRoom && (
              <div className="space-y-3 animate-fade-in">
                <FileInfo file={file} label="Ready to send" />

                <div className="rounded-xl border border-gray-700/60 bg-gray-800/60 p-3 space-y-2">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                    Share this link with the recipient
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs text-brand-300 bg-gray-900 rounded-lg px-3 py-2 break-all font-mono">
                      {roomLink}
                    </code>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleCopyLink}
                      className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-150 ${
                        copied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                      }`}
                    >
                      {copied ? '✓ Copied!' : '📋 Copy Link'}
                    </button>
                    <button
                      onClick={handleGoToRoom}
                      className="rounded-lg bg-brand-600 hover:bg-brand-500 active:scale-95 px-3 py-2.5 text-sm font-semibold text-white transition-all duration-150"
                    >
                      → Open Room
                    </button>
                  </div>
                </div>

                <p className="text-center text-xs text-gray-600">
                  Transfer begins automatically when the recipient opens the link.
                </p>
              </div>
            )}
          </div>

          {/* Feature bullets */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: '🔒', text: 'End-to-end encrypted via DTLS' },
              { icon: '⚡', text: 'Direct P2P — no relay' },
              { icon: '✅', text: 'SHA-256 integrity check' },
              { icon: '📱', text: 'Works on mobile browsers' },
            ].map(({ icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-2 rounded-lg bg-gray-800/30 border border-gray-700/30 px-3 py-2"
              >
                <span className="text-base">{icon}</span>
                <span className="text-xs text-gray-400">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-800/60 py-4 text-center text-xs text-gray-600">
        P2P Web Share · File data never touches the server · Built with WebRTC
      </footer>
    </div>
  );
}