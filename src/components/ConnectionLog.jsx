import React, { useEffect, useRef, useState } from 'react';

export default function ConnectionLog({ logs }) {
  const bottomRef = useRef(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, open]);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-zinc-500 hover:bg-zinc-50 transition-colors"
      >
        <span>Connection details</span>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="h-40 overflow-y-auto px-4 py-2 border-t border-zinc-100 mono text-xs space-y-1">
          {logs.length === 0 ? (
            <p className="text-zinc-300">No events yet.</p>
          ) : (
            logs.map((log, i) => (
              <p key={i} className="text-zinc-500 leading-relaxed">{log}</p>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}