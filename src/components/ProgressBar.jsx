import React from 'react';
import { formatBytes, formatSpeed, formatETA } from '../utils/format.js';

export default function ProgressBar({ progress, label }) {
  const { percent = 0, transferred = 0, total = 0, speed = 0, eta = Infinity } = progress;
  const pct = Math.min(100, Math.max(0, percent));
  const done = pct >= 100;

  return (
    <div className="space-y-2 animate-fade-in">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-zinc-800">{label}</span>
        <span className={`mono font-bold tabular-nums transition-colors ${done ? 'text-emerald-600' : 'text-accent-600'}`}>
          {pct}%
        </span>
      </div>

      <div className="relative h-2.5 w-full rounded-full bg-zinc-100 overflow-hidden shadow-inner">
        <div
          className={`progress-fill h-full rounded-full ${done ? '!bg-emerald-500 !animate-none' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-zinc-500 mono">
        <span className="tabular-nums">
          {formatBytes(transferred)} <span className="text-zinc-400">/</span> {formatBytes(total)}
        </span>
        <span className="tabular-nums">
          {done ? (
            <span className="text-emerald-600 font-semibold">✓ Done</span>
          ) : (
            <>
              <span className="text-accent-600">{formatSpeed(speed)}</span>
              <span className="text-zinc-400 mx-1.5">·</span>
              <span>{formatETA(eta)}</span>
            </>
          )}
        </span>
      </div>
    </div>
  );
}
