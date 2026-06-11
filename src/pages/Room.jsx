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

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      <header className="px-6 py-5 border-b border-zinc-200">
        <div className="mx-auto max-w-2xl flex items-center justify-between">
          <Link to="/" className="text-base font-semibold tracking-tight text-zinc-900">
            Drop
          </Link>
          <StatusBadge status={status} />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 py-16">
        <div className="w-full max-w-md space-y-4">

          {/* File card */}
          <div className="rounded-lg border border-zinc-200 bg-white p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-zinc-400 mb-1">{roleLabel}</p>
                {senderMeta || fileResult ? (
                  <>
                    <p className="text-sm font-medium text-zinc-900 truncate">
                      {fileResult?.filename || senderMeta?.name}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {formatBytes(fileResult?.blob?.size ?? senderMeta?.size ?? 0)}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-zinc-400">Waiting for file information…</p>
                )}
              </div>
              {resolvedKey && (
                <span className="shrink-0 text-xs text-zinc-400 mt-0.5">Encrypted</span>
              )}
            </div>

            {!isSender && (
              <div className="flex items-center gap-2 pt-1 border-t border-zinc-100">
                <code className="flex-1 mono text-xs text-zinc-500 truncate">{roomLink}</code>
                <button
                  onClick={handleCopy}
                  className="shrink-0 text-xs font-medium px-2.5 py-1.5 rounded-md border border-zinc-200 hover:bg-zinc-50 transition-colors text-zinc-600"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            )}
          </div>

          {/* Status messages */}
          {!keyReady && <StatusLine text="Resolving encryption key…" />}

          {keyReady && isIdle && <StatusLine text="Connecting…" />}

          {keyReady && isSender && isConnecting && !isDone && (
            <StatusLine text="Waiting for the recipient to open the link" />
          )}

          {keyReady && !isSender && isConnecting && !isDone && (
            <StatusLine text="Connected — waiting for sender" />
          )}

          {isConnected && !isTransfer && !isDone && (
            <StatusLine text="Starting transfer…" />
          )}

          {isPeerLeft && (
            <StatusLine
              text={isSender ? 'The recipient left the room' : 'The sender disconnected'}
              tone="warning"
            />
          )}

          {isError && (
            <StatusLine
              text="Connection failed. Refresh and try again."
              tone="error"
            />
          )}

          {/* Progress */}
          {showProgress && (
            <div className="rounded-lg border border-zinc-200 bg-white p-4">
              <ProgressBar
                progress={progress}
                label={isSender ? 'Sending' : 'Receiving'}
              />
            </div>
          )}

          {isDone && isSender && (
            <StatusLine text="File sent successfully" tone="success" />
          )}

          {fileResult && (
            <HashResult verified={fileResult.verified} hash={fileResult.hash} />
          )}

          <ConnectionLog logs={logs} />

          <button
            onClick={handleSendAnother}
            className="w-full rounded-lg border border-zinc-200 hover:bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-700 transition-colors"
          >
            Send another file
          </button>
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

function StatusLine({ text, tone = 'default' }) {
  const colors = {
    default: 'text-zinc-500',
    warning: 'text-amber-600',
    error: 'text-red-500',
    success: 'text-emerald-600',
  };
  return (
    <p className={`text-sm text-center py-1 ${colors[tone]}`}>{text}</p>
  );
}