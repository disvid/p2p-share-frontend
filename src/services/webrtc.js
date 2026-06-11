/**
 * webrtc.js — v2
 * - DataChannel is now FULLY RELIABLE (no maxRetransmits) → fixes silent corruption
 * - Optional AES-GCM encryption per chunk (zero-knowledge)
 * - Receiver writes to OPFS (disk) instead of RAM → supports large files
 * - Hash verification skipped (gracefully) for files > MAX_HASH_VERIFY_SIZE
 */

import { ICE_SERVERS, DATA_CHANNEL_LABEL, CHUNK_SIZE, MSG_TYPE, MAX_HASH_VERIFY_SIZE } from '../utils/constants.js';
import { sha256 } from '../utils/hash.js';
import { encryptChunk, decryptChunk } from '../utils/crypto.js';
import { createFileWriter } from '../utils/fileWriter.js';

export function createWebRTCSession({
  onStatusChange,
  onProgress,
  onFileReceived,
  onLog,
  onChannelOpen,
  encryptionKey = null, // CryptoKey or null (unencrypted mode)
}) {
  let pc = null;
  let dataChannel = null;

  // Receiver state
  let fileWriter = null;
  let receivedBytes = 0;
  let expectedSize = 0;
  let pendingFilename = '';
  let transferStartTime = 0;
  let lastProgressTime = 0;
  let writeQueue = Promise.resolve(); // serialize OPFS writes

  function createPeerConnection(onIceCandidate) {
    if (pc) { try { pc.close(); } catch (_) {} }

    pc = new RTCPeerConnection({ iceServers: ICE_SERVERS, iceCandidatePoolSize: 10 });

    pc.onconnectionstatechange = () => {
      onLog(`Connection state → ${pc.connectionState}`);
      onStatusChange(pc.connectionState);
    };
    pc.oniceconnectionstatechange = () => onLog(`ICE → ${pc.iceConnectionState}`);
    pc.onicecandidate = ({ candidate }) => {
      if (candidate && onIceCandidate) onIceCandidate(candidate);
    };
    return pc;
  }

  async function handleIceCandidate(candidate) {
    try {
      if (pc && candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      onLog(`ICE candidate warning: ${err.message}`);
    }
  }

  function setupDataChannel(channel) {
    channel.binaryType = 'arraybuffer';
    channel.bufferedAmountLowThreshold = 512 * 1024;

    channel.onopen = () => {
      onLog('✅ DataChannel open (reliable, ordered)');
      onStatusChange('connected');
      onChannelOpen();
    };
    channel.onclose = () => {
      onLog('DataChannel closed');
      onStatusChange('disconnected');
    };
    channel.onerror = (e) => {
      onLog(`DataChannel error: ${e.error?.message || 'unknown'}`);
      onStatusChange('error');
    };
    channel.onmessage = ({ data }) => handleIncomingData(data);

    dataChannel = channel;
  }

  // ── SENDER: create offer ────────────────────────────────────────────────
  async function createOffer(onIceCandidate) {
    createPeerConnection(onIceCandidate);

    // CRITICAL FIX: no `maxRetransmits` → fully reliable, ordered delivery.
    // (Previous version used maxRetransmits:30 which silently dropped data
    //  after 30 failed retries, causing intermittent corrupted transfers.)
    const channel = pc.createDataChannel(DATA_CHANNEL_LABEL, { ordered: true });
    setupDataChannel(channel);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    onLog('📤 Offer created');
    return pc.localDescription;
  }

  // ── RECEIVER: handle offer ──────────────────────────────────────────────
  async function handleOffer(offer, onIceCandidate) {
    createPeerConnection(onIceCandidate);
    pc.ondatachannel = ({ channel }) => {
      onLog('📥 DataChannel received');
      setupDataChannel(channel);
    };
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    onLog('📤 Answer created');
    return pc.localDescription;
  }

  async function handleAnswer(answer) {
    if (!pc || pc.signalingState !== 'have-local-offer') {
      onLog(`⚠️ handleAnswer: bad state ${pc?.signalingState}`);
      return;
    }
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
    onLog('✅ Remote description set (answer)');
  }

  // ── RECEIVER: process incoming data ─────────────────────────────────────
  function handleIncomingData(data) {
    if (typeof data === 'string') {
      let packet;
      try { packet = JSON.parse(data); } catch { return; }

      if (packet.type === MSG_TYPE.METADATA) {
        receivedBytes = 0;
        expectedSize = packet.filesize;
        pendingFilename = packet.filename;
        transferStartTime = Date.now();
        lastProgressTime = Date.now();
        writeQueue = Promise.resolve();

        // Start async writer setup; queue chunks until ready
        writeQueue = createFileWriter(pendingFilename).then((w) => { fileWriter = w; });

        onLog(`📁 Incoming: "${packet.filename}" (${formatBytesShort(packet.filesize)})`);
        onStatusChange('transferring');
        return;
      }

      if (packet.type === MSG_TYPE.COMPLETE) {
        writeQueue = writeQueue.then(async () => {
          onLog('🔧 Finalizing file…');
          const file = await fileWriter.finalize();
          onLog(`✅ File written (${file.size} bytes, storage=${fileWriter.type})`);
          await verifyAndDownload(file, packet.hash || null);
        });
        return;
      }

      if (packet.type === MSG_TYPE.HASH) {
        // Hash arrives in a separate packet (sent after COMPLETE in older flow,
        // but new sender embeds hash in COMPLETE). Kept for compatibility.
        writeQueue = writeQueue.then(async () => {
          if (!fileWriter) return;
          const file = await fileWriter.finalize();
          await verifyAndDownload(file, packet.hash);
        });
        return;
      }
      return;
    }

    // Binary chunk
    if (data instanceof ArrayBuffer) {
      writeQueue = writeQueue.then(async () => {
        let plain = data;
        if (encryptionKey) {
          try {
            plain = await decryptChunk(encryptionKey, data);
          } catch (err) {
            onLog(`❌ Decryption failed: ${err.message}`);
            onStatusChange('error');
            return;
          }
        }

        await fileWriter.write(plain);
        receivedBytes += plain.byteLength;

        const now = Date.now();
        if (now - lastProgressTime >= 80 || receivedBytes >= expectedSize) {
          lastProgressTime = now;
          const elapsed = Math.max(0.001, (now - transferStartTime) / 1000);
          const speed = receivedBytes / elapsed;
          const remaining = expectedSize - receivedBytes;
          const eta = speed > 0 ? remaining / speed : Infinity;
          onProgress({
            percent: Math.min(100, Math.round((receivedBytes / expectedSize) * 100)),
            transferred: receivedBytes,
            total: expectedSize,
            speed,
            eta,
          });
        }
      });
    }
  }

  async function verifyAndDownload(file, senderHash) {
    let verified = null; // null = skipped
    let displayHash = senderHash;

    if (senderHash && file.size <= MAX_HASH_VERIFY_SIZE) {
      onLog('🔍 Verifying SHA-256…');
      const receivedHash = await sha256(file);
      verified = receivedHash === senderHash;
      onLog(verified ? '✅ Hash verified' : '❌ Hash mismatch!');
    } else if (senderHash) {
      onLog('ℹ️ File too large — skipping full hash verification');
      displayHash = senderHash + ' (verification skipped — large file)';
    }

    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = pendingFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 30000);

    onStatusChange('done');
    onProgress({ percent: 100, transferred: file.size, total: file.size, speed: 0, eta: 0 });
    onFileReceived({ blob: file, filename: pendingFilename, hash: displayHash, verified });

    if (fileWriter?.cleanup) {
      setTimeout(() => fileWriter.cleanup(), 5000); // free OPFS storage after download
    }
  }

  // ── SENDER: send file ───────────────────────────────────────────────────
  async function sendFile(file) {
    if (!dataChannel || dataChannel.readyState !== 'open') {
      throw new Error(`DataChannel not open (state: ${dataChannel?.readyState})`);
    }

    onStatusChange('transferring');

    dataChannel.send(JSON.stringify({
      type: MSG_TYPE.METADATA,
      filename: file.name,
      filesize: file.size,
    }));
    onLog(`📤 Sending "${file.name}" (${formatBytesShort(file.size)})${encryptionKey ? ' [encrypted]' : ''}`);

    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    let offset = 0;
    let sentBytes = 0;
    const startTime = Date.now();
    let lastProgressTime = Date.now();

    for (let i = 0; i < totalChunks; i++) {
      const end = Math.min(offset + CHUNK_SIZE, file.size);
      const slice = file.slice(offset, end);
      let buffer = await slice.arrayBuffer();
      const plainLen = buffer.byteLength;

      if (encryptionKey) buffer = await encryptChunk(encryptionKey, buffer);

      if (dataChannel.bufferedAmount > 8 * 1024 * 1024) {
        await new Promise((resolve) => {
          const onLow = () => { dataChannel.removeEventListener('bufferedamountlow', onLow); resolve(); };
          dataChannel.addEventListener('bufferedamountlow', onLow);
          setTimeout(resolve, 2000);
        });
      }
      if (dataChannel.readyState !== 'open') throw new Error('DataChannel closed during transfer');

      dataChannel.send(buffer);
      offset = end;
      sentBytes += plainLen;

      const now = Date.now();
      if (now - lastProgressTime >= 80 || sentBytes >= file.size) {
        lastProgressTime = now;
        const elapsed = Math.max(0.001, (now - startTime) / 1000);
        const speed = sentBytes / elapsed;
        const eta = speed > 0 ? (file.size - sentBytes) / speed : Infinity;
        onProgress({
          percent: Math.min(100, Math.round((sentBytes / file.size) * 100)),
          transferred: sentBytes,
          total: file.size,
          speed,
          eta,
        });
      }
    }

    // Hash (skip for very large files to avoid loading whole file twice into RAM)
    let hash = null;
    if (file.size <= MAX_HASH_VERIFY_SIZE) {
      onLog('🔐 Computing SHA-256…');
      hash = await sha256(file);
    } else {
      onLog('ℹ️ File > 300MB — skipping SHA-256 (would require loading whole file into RAM)');
    }

    dataChannel.send(JSON.stringify({ type: MSG_TYPE.COMPLETE, hash }));
    onLog('✅ Transfer complete');
    onStatusChange('done');
  }

  function close() {
    if (dataChannel) { try { dataChannel.close(); } catch (_) {} dataChannel = null; }
    if (pc) { try { pc.close(); } catch (_) {} pc = null; }
    onLog('WebRTC session closed');
  }

  return { createOffer, handleOffer, handleAnswer, handleIceCandidate, sendFile, close };
}

function formatBytesShort(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}