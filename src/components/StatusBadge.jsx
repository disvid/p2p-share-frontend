import React from 'react';
import { CONN_STATUS } from '../utils/constants.js';

const STATUS_CONFIG = {
  [CONN_STATUS.IDLE]:         { label: 'Connecting',   dot: 'bg-zinc-300',   pulse: true },
  [CONN_STATUS.CONNECTING]:   { label: 'Connecting',   dot: 'bg-amber-400',  pulse: true },
  [CONN_STATUS.CONNECTED]:    { label: 'Connected',    dot: 'bg-emerald-500', pulse: false },
  [CONN_STATUS.TRANSFERRING]: { label: 'Transferring', dot: 'bg-indigo-500', pulse: true },
  [CONN_STATUS.DONE]:         { label: 'Complete',     dot: 'bg-emerald-500', pulse: false },
  [CONN_STATUS.ERROR]:        { label: 'Error',        dot: 'bg-red-500',    pulse: false },
  [CONN_STATUS.DISCONNECTED]: { label: 'Disconnected', dot: 'bg-zinc-300',   pulse: false },
  [CONN_STATUS.PEER_LEFT]:    { label: 'Peer left',    dot: 'bg-amber-500',  pulse: false },
};

export default function StatusBadge({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG[CONN_STATUS.IDLE];
  return (
    <span className="inline-flex items-center gap-2 text-xs text-zinc-500">
      <span className="relative flex h-2 w-2">
        {c.pulse && (
          <span className={`absolute inline-flex h-full w-full rounded-full ${c.dot} animate-pulse-ring`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${c.dot}`} />
      </span>
      {c.label}
    </span>
  );
}