import React, { useEffect, useRef, useState } from 'react';

export default function ConnectionLog({ logs }) {
  const bottomRef = useRef(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, open]);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white/60 backdrop-blur-sm overflow-hidden transition-all">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-medium text-zinc-600 hover:bg-accent-50/50 transition-colors"
      >
        <span className="inline-flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse" />
          Connection details
          {logs.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-accent-100 text-accent-700 text-[10px] font-bold mono">
              {logs.length}
            </span>
          )}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-zinc-200 bg-zinc-900 max-h-48 overflow-y-auto animate-fade-in">
          {logs.length === 0 ? (
            <p className="text-xs text-zinc-400 px-4 py-3 mono">No events yet.</p>
          ) : (
            <div className="py-2">
              {logs.map((log, i) => (
                <div key={i} className="px-4 py-1 text-xs mono text-emerald-300 hover:bg-zinc-800/50 transition-colors">
                  <span className="text-zinc-500 mr-2">{String(i + 1).padStart(2, '0')}</span>
                  {log}
                </div>
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
