import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTransferContext } from '../context/TransferContext.jsx';
import { useWebRTC } from '../hooks/useWebRTC.js';
import { useFileTransfer } from '../hooks/useFileTransfer.js';
import { importKeyFromBase64 } from '../utils/crypto.js';
import StatusBadge from '../components/StatusBadge.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import ConnectionLog from '../components/ConnectionLog.jsx';
import HashResult from '../components/HashResult.jsx';
import { CONN_STATUS } from '../utils/constants.js';
import { formatBytes } from '../utils/format.js';

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { selectedFile, getSenderMeta, clearTransfer, encryptionKey: senderKey } = useTransferContext();

  const [logs, setLogs] = useState([]);
  const [copied, setCopied] = useState(false);
  const [resolvedKey, setResolvedKey] = useState(null);
  const [keyReady, setKeyReady] = useState(false);

  const { progress, fileResult, updateProgress, setResult } = useFileTransfer();

  const addLog = useCallback((msg) => {
    setLogs((prev) => [...prev.slice(-200), msg]);
  }, []);

  const handleFileReceived = useCallback((result) => setResult(result), [setResult]);

  useEffect(() => {
    if (selectedFile && senderKey) {
      setResolvedKey(senderKey);
      setKeyReady(true);
      return;
    }
    const hash = window.location.hash;
    const match = hash.match(/key=([^&]+)/);
    if (match) {
      importKeyFromBase64(match[1])
        .then((k) => { setResolvedKey(k); setKeyReady(true); })
        .catch(() => setKeyReady(true));
    } else {
      setKeyReady(true);
    }
  }, [selectedFile, senderKey]);

  const { status, role } = useWebRTC({
    roomId: keyReady ? roomId : null,
    file: selectedFile || null,
    onProgress: updateProgress,
    onFileReceived: handleFileReceived,
    onLog: addLog,
    encryptionKey: resolvedKey,
  });

  const senderMeta = selectedFile
    ? { name: selectedFile.name, size: selectedFile.size, type: selectedFile.type }
    : getSenderMeta();

  const isSender = !!selectedFile || (senderMeta && senderMeta.roomId === roomId);
  const roomLink = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  };

  const handleSendAnother = () => {
    clearTransfer();
    navigate('/');
  };

  const isIdle       = status === CONN_STATUS.IDLE;
  const isConnecting = status === CONN_STATUS.CONNECTING;
  const isConnected  = status === CONN_STATUS.CONNECTED;
  const isTransfer   = status === CONN_STATUS.TRANSFERRING;
  const isDone       = status === CONN_STATUS.DONE || !!fileResult;
  const isPeerLeft   = status === CONN_STATUS.PEER_LEFT;
  const isError      = status === CONN_STATUS.ERROR;
  const showProgress = (isTransfer || isDone) && progress.total > 0;

  const roleLabel = !role ? 'Joining' : role === 'sender' ? 'Sending' : 'Receiving';
  const roleColor = !role ? 'text-zinc-500' : role === 'sender' ? 'text-accent-600' : 'text-brand-pink';

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b border-zinc-200/60 backdrop-blur-md bg-white/50 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-brand shadow-glow flex items-center justify-center text-white font-bold text-sm group-hover:scale-110 transition-transform">
              D
            </div>
            <span className="font-bold text-lg text-gradient">DataBeam</span>
          </Link>
          <StatusBadge status={status} />
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl space-y-5 animate-fade-in-up">
          {/* File card */}
          <div className="glass rounded-2xl p-6 shadow-soft space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold uppercase tracking-wider ${roleColor} mb-1.5`}>
                  {roleLabel}
                </p>
                {senderMeta || fileResult ? (
                  <>
                    <p className="text-base font-semibold text-zinc-900 truncate">
                      {fileResult?.filename || senderMeta?.name}
                    </p>
                    <p className="text-xs text-zinc-500 mono mt-0.5">
                      {formatBytes(fileResult?.blob?.size ?? senderMeta?.size ?? 0)}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-zinc-500 italic">Waiting for file information…</p>
                )}
              </div>
              {resolvedKey && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-accent-100 to-purple-100 text-accent-700 text-[10px] font-bold uppercase tracking-wide border border-accent-200">
                  🔒 Encrypted
                </span>
              )}
            </div>

            {!isSender && (
              <div className="flex gap-2 pt-3 border-t border-zinc-200/60">
                <div className="flex-1 px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 mono text-[11px] text-zinc-600 truncate">
                  {roomLink}
                </div>
                <button
                  onClick={handleCopy}
                  className={`px-3 py-2 rounded-lg font-medium text-xs btn-press transition-all ${
                    copied ? 'bg-emerald-500 text-white' : 'bg-zinc-900 text-white hover:bg-zinc-700'
                  }`}
                >
                  {copied ? '✓' : 'Copy'}
                </button>
              </div>
            )}
          </div>

          {/* Status messages */}
          {!keyReady && <StatusLine text="Preparing secure channel…" />}

          {keyReady && isIdle && <StatusLine text="Setting up connection…" />}

          {keyReady && isSender && isConnecting && !isDone && (
            <StatusLine text="Waiting for the recipient to join…" />
          )}

          {keyReady && !isSender && isConnecting && !isDone && (
            <StatusLine text="Connecting to sender…" />
          )}

          {isConnected && !isTransfer && !isDone && (
            <StatusLine text="Connected — starting transfer…" tone="success" />
          )}

          {isPeerLeft && (
            <StatusLine text="The other peer disconnected." tone="warning" />
          )}

          {isError && (
            <StatusLine text="Something went wrong. Try refreshing." tone="error" />
          )}

          {/* Progress */}
          {showProgress && (
            <div className="glass rounded-2xl p-6 shadow-soft">
              <ProgressBar
                progress={progress}
                label={isSender ? 'Sending' : 'Receiving'}
              />
            </div>
          )}

          {isDone && isSender && (
            <StatusLine text="✓ File sent successfully" tone="success" />
          )}

          {fileResult && (
            <div className="space-y-3 animate-scale-in">
              <HashResult verified={fileResult.verified} hash={fileResult.hash} />
              {fileResult.url && (
                <a
                  href={fileResult.url}
                  download={fileResult.filename}
                  className="block w-full text-center py-3.5 rounded-xl bg-gradient-brand text-white font-semibold shadow-glow hover:shadow-glow-lg btn-press"
                >
                  ⬇ Download {fileResult.filename}
                </a>
              )}
            </div>
          )}

          <ConnectionLog logs={logs} />

          <button
            onClick={handleSendAnother}
            className="w-full py-3 rounded-xl bg-white/60 backdrop-blur-sm border border-zinc-200 text-zinc-700 font-medium hover:bg-white hover:border-accent-300 hover:text-accent-700 btn-press transition-all"
          >
            ↻ Send another file
          </button>
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

function StatusLine({ text, tone = 'default' }) {
  const styles = {
    default: 'text-zinc-600 bg-zinc-50 border-zinc-200',
    warning: 'text-amber-700 bg-amber-50 border-amber-200',
    error: 'text-red-700 bg-red-50 border-red-200',
    success: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  };
  return (
    <div className={`text-sm text-center px-4 py-3 rounded-xl border ${styles[tone]} animate-fade-in font-medium`}>
      {text}
    </div>
  );
}
