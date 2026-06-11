import React from 'react';
import { CONN_STATUS } from '../utils/constants.js';

const STATUS_CONFIG = {
  [CONN_STATUS.IDLE]:         { label: 'Connecting',   dot: 'bg-zinc-300',    ring: 'bg-zinc-300',    bg: 'bg-zinc-50',     text: 'text-zinc-600',    pulse: true },
  [CONN_STATUS.CONNECTING]:   { label: 'Connecting',   dot: 'bg-amber-400',   ring: 'bg-amber-400',   bg: 'bg-amber-50',    text: 'text-amber-700',   pulse: true },
  [CONN_STATUS.CONNECTED]:    { label: 'Connected',    dot: 'bg-emerald-500', ring: 'bg-emerald-500', bg: 'bg-emerald-50',  text: 'text-emerald-700', pulse: false },
  [CONN_STATUS.TRANSFERRING]: { label: 'Transferring', dot: 'bg-accent-500',  ring: 'bg-accent-500',  bg: 'bg-accent-50',   text: 'text-accent-700',  pulse: true },
  [CONN_STATUS.DONE]:         { label: 'Complete',     dot: 'bg-emerald-500', ring: 'bg-emerald-500', bg: 'bg-emerald-50',  text: 'text-emerald-700', pulse: false },
  [CONN_STATUS.ERROR]:        { label: 'Error',        dot: 'bg-red-500',     ring: 'bg-red-500',     bg: 'bg-red-50',      text: 'text-red-700',     pulse: false },
  [CONN_STATUS.DISCONNECTED]: { label: 'Disconnected', dot: 'bg-zinc-300',    ring: 'bg-zinc-300',    bg: 'bg-zinc-50',     text: 'text-zinc-600',    pulse: false },
  [CONN_STATUS.PEER_LEFT]:    { label: 'Peer left',    dot: 'bg-amber-500',   ring: 'bg-amber-500',   bg: 'bg-amber-50',    text: 'text-amber-700',   pulse: false },
};

export default function StatusBadge({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG[CONN_STATUS.IDLE];
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${c.bg} ${c.text} text-xs font-semibold transition-all animate-fade-in`}>
      <span className="relative inline-flex w-2 h-2">
        {c.pulse && (
          <span className={`absolute inset-0 rounded-full ${c.ring} animate-pulse-ring`} />
        )}
        <span className={`relative inline-flex w-2 h-2 rounded-full ${c.dot}`} />
      </span>
      {c.label}
    </div>
  );
}
