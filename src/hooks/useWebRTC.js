/**
 * useWebRTC.js — Fixed + Hardened
 *
 * Critical fixes in this version:
 *
 * 1. Socket listeners are registered ONCE on mount using stable refs.
 *    No more duplicate listener registrations on re-render.
 *
 * 2. join-room is emitted AFTER socket confirms connection.
 *    Previously it fired before socket.id was assigned, causing the
 *    server to receive the event from an unknown socket.
 *
 * 3. Offer is created by whoever is ALREADY in the room when the
 *    second peer arrives (peer-joined). This is always the sender.
 *
 * 4. ICE candidates buffered until remote description is set to
 *    prevent "cannot add ICE candidate" errors.
 *
 * 5. sendFile is called only once, guarded by a ref flag.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { socket, ensureConnected } from '../services/socket.js';
import { createWebRTCSession } from '../services/webrtc.js';
import { CONN_STATUS } from '../utils/constants.js';

export function useWebRTC({ roomId, file, onProgress, onFileReceived, onLog }) {
  const [status, setStatus]   = useState(CONN_STATUS.IDLE);
  const [role,   setRole]     = useState(null);

  // Stable refs — these are readable inside socket callbacks without stale closures
  const sessionRef        = useRef(null);
  const roleRef           = useRef(null);
  const peerIdRef         = useRef(null);
  const fileRef           = useRef(file);
  const fileSentRef       = useRef(false);   // guard: send only once
  const iceCandidateQueue = useRef([]);       // buffer early ICE candidates
  const remoteSetRef      = useRef(false);    // true once setRemoteDescription done
  const roomIdRef         = useRef(roomId);

  fileRef.current   = file;
  roomIdRef.current = roomId;

  const log = useCallback(
    (msg) => onLog(`[${new Date().toLocaleTimeString()}] ${msg}`),
    [onLog]
  );

  const updateStatus = useCallback((raw) => {
    const map = {
      new:           CONN_STATUS.CONNECTING,
      connecting:    CONN_STATUS.CONNECTING,
      connected:     CONN_STATUS.CONNECTED,
      disconnected:  CONN_STATUS.DISCONNECTED,
      failed:        CONN_STATUS.ERROR,
      closed:        CONN_STATUS.DISCONNECTED,
      transferring:  CONN_STATUS.TRANSFERRING,
      done:          CONN_STATUS.DONE,
      error:         CONN_STATUS.ERROR,
      idle:          CONN_STATUS.IDLE,
    };
    setStatus(map[raw] !== undefined ? map[raw] : raw);
  }, []);

  // Drain buffered ICE candidates once remote description is set
  const drainIceQueue = useCallback(async () => {
    if (!sessionRef.current || iceCandidateQueue.current.length === 0) return;
    log(`Draining ${iceCandidateQueue.current.length} buffered ICE candidates`);
    const queue = [...iceCandidateQueue.current];
    iceCandidateQueue.current = [];
    for (const candidate of queue) {
      await sessionRef.current.handleIceCandidate(candidate);
    }
  }, [log]);

  const getSession = useCallback(() => {
    if (!sessionRef.current) {
      sessionRef.current = createWebRTCSession({
        onStatusChange: updateStatus,
        onProgress,
        onFileReceived,
        onLog: log,
        onChannelOpen: () => {
          log('DataChannel open!');
          // Only sender sends file, and only once
          if (roleRef.current === 'sender' && fileRef.current && !fileSentRef.current) {
            fileSentRef.current = true;
            log(`Starting file transfer: "${fileRef.current.name}"`);
            sessionRef.current
              .sendFile(fileRef.current)
              .catch((err) => {
                log(`❌ sendFile error: ${err.message}`);
                updateStatus(CONN_STATUS.ERROR);
              });
          }
        },
      });
    }
    return sessionRef.current;
  }, [updateStatus, onProgress, onFileReceived, log]);

  // ── Join the room ──────────────────────────────────────────────────────────
  const joinRoom = useCallback(() => {
    const inferredRole = fileRef.current ? 'sender' : 'receiver';
    log(`Emitting join-room: room=${roomIdRef.current} role=${inferredRole} socketId=${socket.id}`);
    socket.emit('join-room', { roomId: roomIdRef.current, role: inferredRole });
  }, [log]);

  useEffect(() => {
    if (!roomId) return;

    ensureConnected();

    // ── room-joined ──────────────────────────────────────────────────────────
    const onRoomJoined = ({ role: r, peerCount }) => {
      roleRef.current = r;
      setRole(r);
      log(`✅ Joined room as "${r}" (${peerCount} peer(s) in room)`);
      updateStatus(CONN_STATUS.CONNECTING);
    };

    // ── room-full ────────────────────────────────────────────────────────────
    const onRoomFull = () => {
      log('⚠️ Room is full — only 2 peers allowed');
      updateStatus(CONN_STATUS.ERROR);
    };

    // ── peer-joined: I am the FIRST peer, new peer just arrived ─────────────
    // Create offer and send it to the new peer.
    const onPeerJoined = async ({ socketId }) => {
      peerIdRef.current = socketId;
      log(`Peer joined: ${socketId} — creating WebRTC offer…`);

      const session = getSession();
      try {
        const offer = await session.createOffer((candidate) => {
          socket.emit('ice-candidate', {
            roomId: roomIdRef.current,
            candidate,
            to: peerIdRef.current,
          });
        });
        socket.emit('offer', { roomId: roomIdRef.current, offer, to: socketId });
        log('📤 Offer sent');
      } catch (err) {
        log(`❌ createOffer failed: ${err.message}`);
        updateStatus(CONN_STATUS.ERROR);
      }
    };

    // ── offer: I am the SECOND peer (receiver), got offer from sender ────────
    const onOffer = async ({ offer, from }) => {
      peerIdRef.current = from;
      remoteSetRef.current = false;
      log(`📥 Offer received from ${from}`);

      const session = getSession();
      try {
        const answer = await session.handleOffer(offer, (candidate) => {
          socket.emit('ice-candidate', {
            roomId: roomIdRef.current,
            candidate,
            to: peerIdRef.current,
          });
        });
        remoteSetRef.current = true;
        await drainIceQueue();

        socket.emit('answer', { roomId: roomIdRef.current, answer, to: from });
        log('📤 Answer sent');
      } catch (err) {
        log(`❌ handleOffer failed: ${err.message}`);
        updateStatus(CONN_STATUS.ERROR);
      }
    };

    // ── answer: I am the FIRST peer (sender), got answer from receiver ───────
    const onAnswer = async ({ answer, from }) => {
      log(`📥 Answer received from ${from}`);
      const session = getSession();
      try {
        await session.handleAnswer(answer);
        remoteSetRef.current = true;
        await drainIceQueue();
      } catch (err) {
        log(`❌ handleAnswer failed: ${err.message}`);
        updateStatus(CONN_STATUS.ERROR);
      }
    };

    // ── ice-candidate ────────────────────────────────────────────────────────
    const onIceCandidate = async ({ candidate }) => {
      if (!candidate) return;
      if (!remoteSetRef.current) {
        // Remote description not set yet — buffer this candidate
        iceCandidateQueue.current.push(candidate);
        log(`Buffered ICE candidate (queue: ${iceCandidateQueue.current.length})`);
        return;
      }
      const session = getSession();
      await session.handleIceCandidate(candidate);
    };

    // ── peer-disconnected ────────────────────────────────────────────────────
    const onPeerDisconnected = () => {
      log('⚠️ Peer left the room');
      setStatus(CONN_STATUS.PEER_LEFT);
    };

    // ── socket-level events ──────────────────────────────────────────────────
    const onConnect = () => {
      log(`🔌 Socket connected (id: ${socket.id})`);
      joinRoom();
    };

    const onDisconnect = (reason) => {
      log(`Socket disconnected: ${reason}`);
    };

    const onConnectError = (err) => {
      log(`❌ Socket connection error: ${err.message}`);
      updateStatus(CONN_STATUS.ERROR);
    };

    // Register listeners
    socket.on('room-joined',        onRoomJoined);
    socket.on('room-full',          onRoomFull);
    socket.on('peer-joined',        onPeerJoined);
    socket.on('offer',              onOffer);
    socket.on('answer',             onAnswer);
    socket.on('ice-candidate',      onIceCandidate);
    socket.on('peer-disconnected',  onPeerDisconnected);
    socket.on('disconnect',         onDisconnect);
    socket.on('connect_error',      onConnectError);

    // If already connected, join immediately.
    // Otherwise the 'connect' event will call joinRoom.
    if (socket.connected) {
      log(`🔌 Socket already connected (id: ${socket.id})`);
      joinRoom();
    } else {
      socket.on('connect', onConnect);
    }

    // ── Cleanup ──────────────────────────────────────────────────────────────
    return () => {
      socket.off('room-joined',       onRoomJoined);
      socket.off('room-full',         onRoomFull);
      socket.off('peer-joined',       onPeerJoined);
      socket.off('offer',             onOffer);
      socket.off('answer',            onAnswer);
      socket.off('ice-candidate',     onIceCandidate);
      socket.off('peer-disconnected', onPeerDisconnected);
      socket.off('disconnect',        onDisconnect);
      socket.off('connect_error',     onConnectError);
      socket.off('connect',           onConnect);

      socket.emit('leave-room');

      sessionRef.current?.close();
      sessionRef.current = null;
      fileSentRef.current = false;
      remoteSetRef.current = false;
      iceCandidateQueue.current = [];
      peerIdRef.current = null;
      roleRef.current = null;
    };
  }, [roomId]); // eslint-disable-line react-hooks/exhaustive-deps

  return { status, role };
}