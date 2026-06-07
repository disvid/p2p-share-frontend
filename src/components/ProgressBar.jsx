/**
 * ProgressBar.jsx
 * Animated progress bar with percentage, speed, bytes, and ETA.
 */

import React from 'react';
import { formatBytes, formatSpeed, formatETA } from '../utils/format.js';

export default function ProgressBar({ progress, label = 'Transfer Progress' }) {
  const { percent = 0, transferred = 0, total = 0, speed = 0, eta = Infinity } = progress;
  const displayPercent = Math.min(100, Math.max(0, percent));
  const isComplete = displayPercent >= 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-300">{label}</p>
        <span
          className={`text-sm font-bold tabular-nums ${
            isComplete ? 'text-emerald-400' : 'text-brand-400'
          }`}
        >
          {displayPercent}%
        </span>
      </div>

      {/* Track */}
      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-700/80">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${
            isComplete ? 'bg-emerald-500' : 'progress-shimmer'
          }`}
          style={{ width: `${displayPercent}%` }}
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <StatCell label="Transferred" value={`${formatBytes(transferred)} / ${formatBytes(total)}`} />
        <StatCell label="Speed" value={formatSpeed(speed)} highlight={!isComplete} />
        <StatCell label="ETA" value={isComplete ? 'Done ✓' : formatETA(eta)} />
      </div>
    </div>
  );
}

function StatCell({ label, value, highlight }) {
  return (
    <div className="rounded-lg bg-gray-800/60 border border-gray-700/40 px-2 py-2">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`text-xs font-semibold tabular-nums ${highlight ? 'text-brand-300' : 'text-gray-200'}`}>
        {value}
      </p>
    </div>
  );
}