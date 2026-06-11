import React from 'react';
import { formatBytes, formatSpeed, formatETA } from '../utils/format.js';

export default function ProgressBar({ progress, label }) {
  const { percent = 0, transferred = 0, total = 0, speed = 0, eta = Infinity } = progress;
  const pct = Math.min(100, Math.max(0, percent));
  const done = pct >= 100;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-700">{label}</span>
        <span className="mono text-zinc-900 font-medium">{pct}%</span>
      </div>

      <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
        <div
          className={`h-full rounded-full progress-fill ${done ? 'bg-emerald-500' : 'bg-zinc-900'}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-zinc-400 mono">
        <span>{formatBytes(transferred)} / {formatBytes(total)}</span>
        <span>{done ? '—' : `${formatSpeed(speed)} · ${formatETA(eta)}`}</span>
      </div>
    </div>
  );
}