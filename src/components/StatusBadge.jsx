/**
 * StatusBadge.jsx
 * Pill badge showing connection / transfer status with color coding.
 */

import React from 'react';
import { CONN_STATUS } from '../utils/constants.js';

const STATUS_CONFIG = {
  [CONN_STATUS.IDLE]: {
    label: 'Waiting',
    color: 'bg-gray-700 text-gray-300',
    dot: 'bg-gray-400',
    pulse: false,
  },
  [CONN_STATUS.CONNECTING]: {
    label: 'Connecting',
    color: 'bg-yellow-900/50 text-yellow-300 border border-yellow-700/50',
    dot: 'bg-yellow-400',
    pulse: true,
  },
  [CONN_STATUS.CONNECTED]: {
    label: 'Connected',
    color: 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50',
    dot: 'bg-emerald-400',
    pulse: false,
  },
  [CONN_STATUS.TRANSFERRING]: {
    label: 'Transferring',
    color: 'bg-brand-900/50 text-brand-300 border border-brand-700/50',
    dot: 'bg-brand-400',
    pulse: true,
  },
  [CONN_STATUS.DONE]: {
    label: 'Complete ✓',
    color: 'bg-emerald-900/60 text-emerald-300 border border-emerald-600/60',
    dot: 'bg-emerald-400',
    pulse: false,
  },
  [CONN_STATUS.ERROR]: {
    label: 'Error',
    color: 'bg-red-900/50 text-red-300 border border-red-700/50',
    dot: 'bg-red-400',
    pulse: false,
  },
  [CONN_STATUS.DISCONNECTED]: {
    label: 'Disconnected',
    color: 'bg-gray-800 text-gray-400 border border-gray-700',
    dot: 'bg-gray-500',
    pulse: false,
  },
  [CONN_STATUS.PEER_LEFT]: {
    label: 'Peer Disconnected',
    color: 'bg-orange-900/50 text-orange-300 border border-orange-700/50',
    dot: 'bg-orange-400',
    pulse: false,
  },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG[CONN_STATUS.IDLE];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${config.color}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${config.dot} ${config.pulse ? 'animate-pulse' : ''}`}
      />
      {config.label}
    </span>
  );
}