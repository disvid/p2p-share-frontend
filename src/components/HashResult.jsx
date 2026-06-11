import React from 'react';

export default function HashResult({ verified, hash }) {
  if (hash === null || hash === undefined) return null;

  if (verified === null) {
    return (
      <div className="rounded-xl border border-blue-600/50 bg-blue-900/20 px-4 py-3 animate-fade-in">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-lg">ℹ️</span>
          <span className="text-sm font-bold text-blue-300">Transfer Complete (verification skipped — large file)</span>
        </div>
        <p className="font-mono text-xs text-gray-500 break-all">{hash}</p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border px-4 py-3 animate-fade-in ${verified ? 'border-emerald-600/50 bg-emerald-900/20' : 'border-red-600/50 bg-red-900/20'}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-lg">{verified ? '✅' : '❌'}</span>
        <span className={`text-sm font-bold ${verified ? 'text-emerald-300' : 'text-red-300'}`}>
          {verified ? 'File Verified — Integrity Confirmed' : 'Hash Mismatch — File May Be Corrupted'}
        </span>
      </div>
      {hash && <p className="font-mono text-xs text-gray-500 break-all">SHA-256: {hash}</p>}
    </div>
  );
}