import React from 'react';

export default function HashResult({ verified, hash }) {
  if (hash === null || hash === undefined) return null;

  if (verified === null) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 animate-fade-in">
        <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
          <span className="text-base">✓</span> Transfer complete
        </div>
        <p className="text-xs text-amber-700 mt-1">Verification skipped for large file</p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border px-4 py-3 animate-scale-in ${
        verified
          ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50'
          : 'border-red-200 bg-gradient-to-br from-red-50 to-red-100/50'
      }`}
    >
      <div
        className={`flex items-center gap-2 text-sm font-semibold ${
          verified ? 'text-emerald-800' : 'text-red-800'
        }`}
      >
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center ${
            verified ? 'bg-emerald-500' : 'bg-red-500'
          } text-white shadow-md`}
        >
          {verified ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )}
        </div>
        {verified ? 'File verified · integrity confirmed' : 'Hash mismatch — file may be corrupted'}
      </div>
      {hash && (
        <p className="mt-2 mono text-[10px] text-zinc-500 break-all bg-white/60 px-2 py-1.5 rounded border border-zinc-200/60">
          {hash}
        </p>
      )}
    </div>
  );
}
