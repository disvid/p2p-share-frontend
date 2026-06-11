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
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="border-b border-zinc-200/60 backdrop-blur-md bg-white/50 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-brand shadow-glow animate-float flex items-center justify-center text-white font-bold text-sm">
              D
            </div>
            <span className="font-bold text-lg text-gradient">DataBeam</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Peer-to-peer · Encrypted
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl space-y-8 animate-fade-in-up">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-50 border border-accent-200 text-xs font-medium text-accent-700">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse" />
              End-to-end encrypted
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 leading-tight">
              Send a file,{' '}
              <span className="text-gradient">browser to browser</span>
            </h1>
            <p className="text-zinc-500 text-lg max-w-md mx-auto">
              No accounts. No uploads. The file goes directly to the other person.
            </p>
          </div>

          <DropZone onFileSelect={handleFileSelect} selectedFile={file} />

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 animate-fade-in">
              {error}
            </div>
          )}

          {file && !generatedRoom && (
            <button
              onClick={handleCreateRoom}
              disabled={creating}
              className="w-full py-3.5 rounded-xl bg-gradient-brand text-white font-semibold shadow-glow hover:shadow-glow-lg btn-press disabled:opacity-60 disabled:cursor-not-allowed animate-scale-in"
            >
              {creating ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Generating secure link…
                </span>
              ) : (
                'Create secure link'
              )}
            </button>
          )}

          {generatedRoom && (
            <div className="space-y-4 animate-scale-in">
              <div className="glass rounded-2xl p-6 shadow-soft space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-600">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-zinc-900">Share this link</h3>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 px-3 py-2.5 rounded-lg bg-zinc-50 border border-zinc-200 mono text-xs text-zinc-700 truncate">
                      {roomLink}
                    </div>
                    <button
                      onClick={handleCopyLink}
                      className={`px-4 py-2.5 rounded-lg font-medium text-sm btn-press transition-all ${
                        copied
                          ? 'bg-emerald-500 text-white'
                          : 'bg-zinc-900 text-white hover:bg-zinc-700'
                      }`}
                    >
                      {copied ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm pt-3 border-t border-zinc-200/60">
                  <span className="font-medium text-zinc-800 truncate mr-2">{file.name}</span>
                  <span className="text-zinc-500 mono text-xs whitespace-nowrap">{formatBytes(file.size)}</span>
                </div>
              </div>

              <button
                onClick={handleGoToRoom}
                className="w-full py-3.5 rounded-xl bg-white border-2 border-accent-200 text-accent-700 font-semibold hover:border-accent-400 hover:bg-accent-50 btn-press transition-all"
              >
                Open transfer room →
              </button>

              <p className="text-center text-xs text-zinc-500">
                Waiting for the recipient to open the link starts the transfer automatically.
              </p>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-zinc-200/60 backdrop-blur-md bg-white/50">
        <div className="max-w-5xl mx-auto px-6 py-4 text-center">
          <p className="text-xs text-zinc-500">
            🔒 Files are end-to-end encrypted and never stored on a server.
          </p>
        </div>
      </footer>
    </div>
  );
}
