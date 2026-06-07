/**
 * Room.jsx — Fixed
 *
 * Determines role correctly:
 *   - SENDER: has selectedFile in context (same tab that dropped the file)
 *   - RECEIVER: no file in context (opened link from another browser/tab)
 *
 * Also shows a proper "waiting for receiver" message and handles all
 * status transitions cleanly.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTransferContext } from '../context/TransferContext.jsx';
import { useWebRTC } from '../hooks/useWebRTC.js';
import { useFileTransfer } from '../hooks/useFileTransfer.js';
import StatusBadge from '../components/StatusBadge.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import ConnectionLog from '../components/ConnectionLog.jsx';
import HashResult from '../components/HashResult.jsx';
import FileInfo from '../components/FileInfo.jsx';
import { CONN_STATUS } from '../utils/constants.js';
import { formatBytes } from '../utils/format.js';

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { selectedFile, getSenderMeta, clearTransfer } = useTransferContext();

  const [logs, setLogs] = useState([]);
  const [copied, setCopied] = useState(false);

  const { progress, fileResult, updateProgress, setResult } = useFileTransfer();

  const addLog = useCallback((msg) => {
    setLogs((prev) => [...prev.slice(-200), msg]); // cap at 200 entries
  }, []);

  const handleFileReceived = useCallback(
    (result) => {
      setResult(result);
    },
    [setResult]
  );

  const { status, role } = useWebRTC({
    roomId,
    file: selectedFile || null,
    onProgress: updateProgress,
    onFileReceived: handleFileReceived,
    onLog: addLog,
  });

  // Sender metadata — either from live File object or from sessionStorage cache
  const senderMeta = selectedFile
    ? { name: selectedFile.name, size: selectedFile.size, type: selectedFile.type }
    : getSenderMeta();

  // Is this tab the sender?
  // True if there's a file in context OR sessionStorage has meta for this room
  const isSender = !!selectedFile || (senderMeta && senderMeta.roomId === roomId);

  const roomLink = `${window.location.origin}/room/${roomId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (_) {}
  };

  const handleSendAnother = () => {
    clearTransfer();
    navigate('/');
  };

  // Derived booleans for UI
  const isIdle       = status === CONN_STATUS.IDLE;
  const isConnecting = status === CONN_STATUS.CONNECTING;
  const isConnected  = status === CONN_STATUS.CONNECTED;
  const isTransfer   = status === CONN_STATUS.TRANSFERRING;
  const isDone       = status === CONN_STATUS.DONE || !!fileResult;
  const isPeerLeft   = status === CONN_STATUS.PEER_LEFT;
  const isError      = status === CONN_STATUS.ERROR;

  const showProgress = (isTransfer || isDone) && progress.total > 0;

  // Role label with icon
  const roleLabel = !role
    ? '⏳ Joining…'
    : role === 'sender'
    ? '📤 Sender'
    : '📥 Receiver';

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* ── Header ── */}
      <header className="border-b border-gray-800/60 px-6 py-4">
        <div className="mx-auto max-w-3xl flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <span className="text-2xl">📡</span>
            <span className="text-lg font-bold text-white">P2P Web Share</span>
          </Link>
          <StatusBadge status={status} />
        </div>
      </header>

      <main className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-lg space-y-4 animate-slide-up">

          {/* ── Room info card ── */}
          <div className="rounded-2xl bg-gray-900/60 border border-gray-700/50 p-5 space-y-4 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">
                  Room ID
                </p>
                <p className="font-mono text-sm text-brand-300 font-semibold break-all">
                  {roomId}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-gray-800 border border-gray-700 px-3 py-1 text-xs font-semibold text-gray-300">
                {roleLabel}
              </span>
            </div>

            {/* Room link */}
            <div className="rounded-xl bg-gray-800/60 border border-gray-700/40 p-3 space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                Room Link
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate text-xs text-gray-300 font-mono">
                  {roomLink}
                </code>
                <button
                  onClick={handleCopy}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  {copied ? '✓ Copied' : '📋 Copy'}
                </button>
              </div>
            </div>
          </div>

          {/* ── File info ── */}
          {isSender && senderMeta && (
            <div className="flex items-center gap-3 rounded-xl bg-gray-800/60 border border-gray-700/50 px-4 py-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-700 text-xl">
                📁
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-0.5">
                  Sending
                </p>
                <p className="text-sm font-semibold text-white truncate">
                  {senderMeta.name}
                </p>
                <p className="text-xs text-gray-400">
                  {formatBytes(senderMeta.size)}
                  {senderMeta.type ? ` · ${senderMeta.type}` : ''}
                </p>
              </div>
            </div>
          )}

          {fileResult && !isSender && (
            <div className="flex items-center gap-3 rounded-xl bg-gray-800/60 border border-gray-700/50 px-4 py-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-700 text-xl">
                📥
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-0.5">
                  Received
                </p>
                <p className="text-sm font-semibold text-white truncate">
                  {fileResult.filename}
                </p>
                <p className="text-xs text-gray-400">
                  {formatBytes(fileResult.blob?.size || 0)}
                </p>
              </div>
            </div>
          )}

          {/* ── Status messages ── */}

          {/* Joining */}
          {isIdle && (
            <InfoCard icon="⏳" text="Connecting to signaling server…" />
          )}

          {/* Sender waiting */}
          {isSender && isConnecting && !isDone && (
            <InfoCard
              icon="🔗"
              text="Waiting for the receiver to open the link in another browser…"
            />
          )}

          {/* Receiver waiting */}
          {!isSender && isConnecting && !isDone && (
            <InfoCard
              icon="📡"
              text="Connected to room — waiting for sender to initiate…"
            />
          )}

          {/* Both connected, about to start */}
          {isConnected && !isTransfer && !isDone && (
            <InfoCard icon="✅" text="Peer connected — starting transfer…" />
          )}

          {/* Peer left */}
          {isPeerLeft && (
            <AlertCard
              icon="⚠️"
              title="Peer disconnected"
              message={
                isSender
                  ? 'The receiver left the room.'
                  : 'The sender disconnected. Transfer may be incomplete.'
              }
              type="warning"
            />
          )}

          {/* Error */}
          {isError && (
            <AlertCard
              icon="❌"
              title="Connection Failed"
              message="WebRTC could not establish a connection. Make sure both browsers are open simultaneously and try again."
              type="error"
            />
          )}

          {/* ── Progress bar ── */}
          {showProgress && (
            <div className="rounded-2xl bg-gray-900/60 border border-gray-700/50 p-5 shadow-xl animate-fade-in">
              <ProgressBar
                progress={progress}
                label={isSender ? 'Sending file…' : 'Receiving file…'}
              />
            </div>
          )}

          {/* ── Sender: done ── */}
          {isDone && isSender && (
            <div className="rounded-xl border border-emerald-600/50 bg-emerald-900/20 px-4 py-3 animate-fade-in">
              <p className="text-sm font-semibold text-emerald-300">
                ✅ File sent! The receiver's browser will download it automatically.
              </p>
            </div>
          )}

          {/* ── Receiver: hash result ── */}
          {fileResult && (
            <HashResult verified={fileResult.verified} hash={fileResult.hash} />
          )}

          {/* ── Instructions for receiver ── */}
          {!isSender && !role && (
            <div className="rounded-xl border border-blue-700/40 bg-blue-900/20 px-4 py-3">
              <p className="text-xs text-blue-300">
                ℹ️ You've opened a share room. The file will transfer automatically once the sender is ready.
              </p>
            </div>
          )}

          {/* ── Connection log ── */}
          <ConnectionLog logs={logs} />

          {/* ── Actions ── */}
          <button
            onClick={handleSendAnother}
            className="w-full rounded-xl border border-gray-700/50 bg-gray-800/40 hover:bg-gray-700/40 px-4 py-3 text-sm font-medium text-gray-300 transition-all"
          >
            ← Send Another File
          </button>
        </div>
      </main>

      <footer className="border-t border-gray-800/60 py-4 text-center text-xs text-gray-600">
        P2P Web Share · File data never touches the server
      </footer>
    </div>
  );
}

function InfoCard({ icon, text }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-gray-800/40 border border-gray-700/40 px-4 py-3 animate-fade-in">
      <span className="text-xl shrink-0">{icon}</span>
      <p className="text-sm text-gray-300">{text}</p>
    </div>
  );
}

function AlertCard({ icon, title, message, type }) {
  const colors =
    type === 'error'
      ? 'border-red-600/50 bg-red-900/20'
      : 'border-orange-600/50 bg-orange-900/20';
  const titleColor = type === 'error' ? 'text-red-300' : 'text-orange-300';
  return (
    <div className={`rounded-xl border px-4 py-3 animate-fade-in ${colors}`}>
      <div className="flex items-center gap-2 mb-1">
        <span>{icon}</span>
        <p className={`text-sm font-bold ${titleColor}`}>{title}</p>
      </div>
      <p className="text-xs text-gray-400">{message}</p>
    </div>
  );
}