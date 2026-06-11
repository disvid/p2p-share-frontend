import React from 'react';

export default function HashResult({ verified, hash }) {
  if (hash === null || hash === undefined) return null;

  if (verified === null) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
        <p className="text-sm text-zinc-700">Transfer complete</p>
        <p className="text-xs text-zinc-400 mt-0.5">Verification skipped for large file</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 animate-fade-in">
      <p className={`text-sm font-medium ${verified ? 'text-emerald-600' : 'text-red-500'}`}>
        {verified ? 'File verified' : 'Hash mismatch — file may be corrupted'}
      </p>
      {hash && (
        <p className="mono text-xs text-zinc-400 mt-1 break-all">{hash}</p>
      )}
    </div>
  );
}