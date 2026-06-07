/**
 * ConnectionLog.jsx
 * Scrollable terminal-style log of connection and transfer events.
 */

import React, { useEffect, useRef } from 'react';

export default function ConnectionLog({ logs }) {
  const bottomRef = useRef(null);

  // Auto-scroll to bottom on new log entries.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-900/80 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-gray-700/50 px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
        </div>
        <span className="text-xs font-medium text-gray-500 ml-1">Connection Log</span>
      </div>
      <div className="h-44 overflow-y-auto p-3 font-mono text-xs space-y-1">
        {logs.length === 0 ? (
          <p className="text-gray-600 italic">Waiting for events…</p>
        ) : (
          logs.map((log, i) => (
            <p key={i} className="text-gray-400 leading-relaxed">
              <span className="text-gray-600 select-none mr-2">›</span>
              {log}
            </p>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}