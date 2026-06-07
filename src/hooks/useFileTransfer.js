/**
 * useFileTransfer.js
 * Manages file transfer progress state.
 * Both sender and receiver use this hook for progress tracking.
 */

import { useState, useCallback } from 'react';

const INITIAL_PROGRESS = {
  percent: 0,
  transferred: 0,
  total: 0,
  speed: 0,
  eta: Infinity,
};

export function useFileTransfer() {
  const [progress, setProgress] = useState(INITIAL_PROGRESS);
  const [transferDone, setTransferDone] = useState(false);
  const [fileResult, setFileResult] = useState(null); // { filename, blob, hash, verified }

  const updateProgress = useCallback((update) => {
    setProgress((prev) => ({ ...prev, ...update }));
    if (update.percent >= 100) {
      setTransferDone(true);
    }
  }, []);

  const setResult = useCallback((result) => {
    setFileResult(result);
    setTransferDone(true);
    setProgress((prev) => ({ ...prev, percent: 100 }));
  }, []);

  const reset = useCallback(() => {
    setProgress(INITIAL_PROGRESS);
    setTransferDone(false);
    setFileResult(null);
  }, []);

  return { progress, transferDone, fileResult, updateProgress, setResult, reset };
}