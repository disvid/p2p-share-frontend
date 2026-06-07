/**
 * webrtc.js - Fixed version
 * Key fixes:
 * - bufferedAmountLowThreshold on DataChannel for proper back-pressure
 * - Better state machine to avoid sending before channel is open
 * - Separate pendingBlob tracking is now properly scoped
 * - Robust error recovery
 */

import { ICE_SERVERS, DATA_CHANNEL_LABEL, CHUNK_SIZE, MSG_TYPE } from '../utils/constants.js';
import { sha256 } from '../utils/hash.js';

export function createWebRTCSession({
  onStatusChange,
  onProgress,
  onFileReceived,
  onLog,
  onChannelOpen,
}) {
  let pc = null;
  let dataChannel = null;

  // Receiver accumulation state
  let receivedChunks = [];
  let receivedBytes = 0;
  let expectedSize = 0;
  let pendingFilename = '';
  let pendingBlob = null;
  let transferStartTime = 0;
  let lastProgressTime = 0;

  // ── Create peer connection ──────────────────────────────────────────────
  function createPeerConnection(onIceCandidate) {
    if (pc) {
      try { pc.close(); } catch (_) {}
    }

    pc = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
      iceCandidatePoolSize: 10,
    });

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      onLog(`Connection state → ${state}`);
      onStatusChange(state);
    };

    pc.oniceconnectionstatechange = () => {
      onLog(`ICE → ${pc.iceConnectionState}`);
    };

    pc.onicegatheringstatechange = () => {
      onLog(`ICE gathering → ${pc.iceGatheringState}`);
    };

    pc.onicecandidate = ({ candidate }) => {
      if (candidate && onIceCandidate) {
        onIceCandidate(candidate);
      }
    };

    return pc;
  }

  // ── ICE candidate (called from socket event) ──────────────────────────
  async function handleIceCandidate(candidate) {
    try {
      if (pc && pc.remoteDescription && candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } else if (pc && candidate) {
        // Queue it — remote description not set yet
        // (Simple approach: just try, WebRTC buffers internally in modern browsers)
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (err) {
      // Non-fatal — Chrome sometimes rejects candidates after close
      onLog(`ICE candidate warning: ${err.message}`);
    }
  }

  // ── DataChannel setup (shared for both sides) ─────────────────────────
  function setupDataChannel(channel) {
    channel.binaryType = 'arraybuffer';
    // Trigger bufferedamountlow when buffer drains below 512KB
    channel.bufferedAmountLowThreshold = 512 * 1024;

    channel.onopen = () => {
      onLog('✅ DataChannel open');
      onStatusChange('connected');
      onChannelOpen();
    };

    channel.onclose = () => {
      onLog('DataChannel closed');
      onStatusChange('disconnected');
    };

    channel.onerror = (e) => {
      const msg = e.error ? e.error.message : 'unknown error';
      onLog(`DataChannel error: ${msg}`);
      onStatusChange('error');
    };

    channel.onmessage = ({ data }) => {
      handleIncomingData(data);
    };

    dataChannel = channel;
  }

  // ── SENDER: Create offer ──────────────────────────────────────────────
  async function createOffer(onIceCandidate) {
    createPeerConnection(onIceCandidate);

    const channel = pc.createDataChannel(DATA_CHANNEL_LABEL, {
      ordered: true,
    });
    setupDataChannel(channel);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    onLog('📤 Offer created and set as local description');
    return pc.localDescription;
  }

  // ── RECEIVER: Handle offer → create answer ────────────────────────────
  async function handleOffer(offer, onIceCandidate) {
    createPeerConnection(onIceCandidate);

    pc.ondatachannel = ({ channel }) => {
      onLog('📥 DataChannel received from sender');
      setupDataChannel(channel);
    };

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    onLog('📤 Answer created and set as local description');
    return pc.localDescription;
  }

  // ── SENDER: Handle answer ─────────────────────────────────────────────
  async function handleAnswer(answer) {
    if (!pc) {
      onLog('⚠️ handleAnswer called but no peer connection exists');
      return;
    }
    if (pc.signalingState !== 'have-local-offer') {
      onLog(`⚠️ handleAnswer: unexpected signaling state ${pc.signalingState}`);
      return;
    }
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
    onLog('✅ Remote description set (answer)');
  }

  // ── RECEIVER: Process incoming data ──────────────────────────────────
  function handleIncomingData(data) {
    if (typeof data === 'string') {
      let packet;
      try {
        packet = JSON.parse(data);
      } catch {
        onLog('⚠️ Received unparseable string message');
        return;
      }

      if (packet.type === MSG_TYPE.METADATA) {
        receivedChunks = [];
        receivedBytes = 0;
        expectedSize = packet.filesize;
        pendingFilename = packet.filename;
        pendingBlob = null;
        transferStartTime = Date.now();
        lastProgressTime = Date.now();
        onLog(`📁 Incoming: "${packet.filename}" (${packet.filesize} bytes)`);
        onStatusChange('transferring');
        return;
      }

      if (packet.type === MSG_TYPE.COMPLETE) {
        onLog('🔧 Reconstructing file from chunks…');
        pendingBlob = new Blob(receivedChunks);
        onLog(`✅ File reconstructed: ${pendingBlob.size} bytes`);
        return;
      }

      if (packet.type === MSG_TYPE.HASH) {
        if (!pendingBlob) {
          onLog('⚠️ Hash received before COMPLETE packet — ignoring');
          return;
        }
        verifyAndDownload(pendingBlob, packet.hash);
        return;
      }

      return;
    }

    // Binary chunk
    if (data instanceof ArrayBuffer) {
      receivedChunks.push(data);
      receivedBytes += data.byteLength;

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
    }
  }

  // ── RECEIVER: Verify hash and trigger download ────────────────────────
  async function verifyAndDownload(blob, senderHash) {
    onLog('🔍 Computing SHA-256 of received file…');
    const receivedHash = await sha256(blob);
    const verified = receivedHash === senderHash;
    onLog(
      verified
        ? `✅ Hash verified: ${senderHash.slice(0, 16)}…`
        : `❌ Hash mismatch!\n  Expected: ${senderHash.slice(0, 16)}\n  Got:      ${receivedHash.slice(0, 16)}`
    );

    // Trigger browser download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = pendingFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 15000);

    onStatusChange('done');
    onProgress({ percent: 100, transferred: blob.size, total: blob.size, speed: 0, eta: 0 });
    onFileReceived({ blob, filename: pendingFilename, hash: senderHash, verified });
  }

  // ── SENDER: Send file in chunks ───────────────────────────────────────
  async function sendFile(file) {
    if (!dataChannel) throw new Error('No DataChannel');
    if (dataChannel.readyState !== 'open') throw new Error(`DataChannel not open (state: ${dataChannel.readyState})`);

    onStatusChange('transferring');

    // Metadata
    dataChannel.send(JSON.stringify({
      type: MSG_TYPE.METADATA,
      filename: file.name,
      filesize: file.size,
    }));
    onLog(`📤 Sending "${file.name}" (${file.size} bytes)`);

    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    let offset = 0;
    let sentBytes = 0;
    const startTime = Date.now();
    let lastProgressTime = Date.now();

    onLog(`📦 ${totalChunks} chunks × ${CHUNK_SIZE / 1024}KB`);

    for (let i = 0; i < totalChunks; i++) {
      const end = Math.min(offset + CHUNK_SIZE, file.size);
      const slice = file.slice(offset, end);
      const buffer = await slice.arrayBuffer();

      // Back-pressure: wait if channel buffer is full
      if (dataChannel.bufferedAmount > 8 * 1024 * 1024) {
        await new Promise((resolve) => {
          const onLow = () => {
            dataChannel.removeEventListener('bufferedamountlow', onLow);
            resolve();
          };
          dataChannel.addEventListener('bufferedamountlow', onLow);
          // Safety timeout in case event never fires
          setTimeout(resolve, 2000);
        });
      }

      if (dataChannel.readyState !== 'open') {
        throw new Error('DataChannel closed during transfer');
      }

      dataChannel.send(buffer);
      offset = end;
      sentBytes += buffer.byteLength;

      const now = Date.now();
      if (now - lastProgressTime >= 80 || sentBytes >= file.size) {
        lastProgressTime = now;
        const elapsed = Math.max(0.001, (now - startTime) / 1000);
        const speed = sentBytes / elapsed;
        const remaining = file.size - sentBytes;
        const eta = speed > 0 ? remaining / speed : Infinity;
        onProgress({
          percent: Math.min(100, Math.round((sentBytes / file.size) * 100)),
          transferred: sentBytes,
          total: file.size,
          speed,
          eta,
        });
      }
    }

    dataChannel.send(JSON.stringify({ type: MSG_TYPE.COMPLETE }));
    onLog('✅ All chunks sent, computing hash…');

    const hash = await sha256(file);
    dataChannel.send(JSON.stringify({ type: MSG_TYPE.HASH, hash }));
    onLog(`🔐 Hash dispatched: ${hash.slice(0, 16)}…`);

    onStatusChange('done');
  }

  // ── Cleanup ───────────────────────────────────────────────────────────
  function close() {
    if (dataChannel) {
      try { dataChannel.close(); } catch (_) {}
      dataChannel = null;
    }
    if (pc) {
      try { pc.close(); } catch (_) {}
      pc = null;
    }
    onLog('WebRTC session closed');
  }

  return { createOffer, handleOffer, handleAnswer, handleIceCandidate, sendFile, close };
}